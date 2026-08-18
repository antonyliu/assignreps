/**
 * ONE-OFF: put a coach's subscription onto a Stripe TEST CLOCK, so the billing
 * period can be fast-forwarded past `current_period_end` on demand.
 *
 *   node scripts/testclock-setup.mjs mail@antonyliu.com
 *
 * ⚠️ WHY THIS SCRIPT HAS TO EXIST AT ALL: a Stripe test clock can only be
 * attached to a customer AT CREATION TIME. `customer.test_clock` is immutable —
 * there is no API to move an existing customer onto a clock. So an existing
 * subscription can never be retroactively fast-forwarded; the customer and the
 * subscription both have to be made fresh, on the clock, from the start. That is
 * exactly what this does.
 *
 * What it does, in order:
 *   1. cancels the coach's CURRENT subscription (it is off-clock and cannot be
 *      advanced, so leaving it active would just be a second live subscription
 *      confusing the dashboard)
 *   2. creates a test clock frozen at now
 *   3. creates a NEW customer on that clock, carrying metadata.coach_id so the
 *      webhook's route-home still works
 *   4. attaches a test card and makes it the default
 *   5. creates a subscription on STRIPE_PRICE_ID, then schedules it to cancel at
 *      period end — the downgrade shape being tested
 *   6. repoints the coach row at the new customer/subscription
 *
 * It writes the previous ids to scripts/_testclock-<coach>.json so the coach can
 * be put back afterwards.
 *
 * ⚠️ `stripe listen` MUST be running before you advance the clock, or the
 * webhook never fires and `subscription_status` simply never changes — which
 * looks identical to the feature being broken. See CLAUDE.md.
 */
import { writeFileSync } from "node:fs";
import { db, env, die, stripe, requireTestMode, isEntitled } from "./_env.mjs";

requireTestMode();

const email = process.argv[2];
if (!email) die("usage: node scripts/testclock-setup.mjs <coach-email>");
if (email === "riselongbeach@gmail.com") die("that is RJ's real account. Refusing.");

const { data: coach } = await db.from("coaches")
  .select("id, name, email, stripe_customer_id, stripe_subscription_id, subscription_status")
  .eq("email", email).single();
if (!coach) die(`no coach row for ${email}`);

console.log(`Coach:  ${coach.name} <${coach.email}>`);
console.log(`Before: customer=${coach.stripe_customer_id ?? "-"} sub=${coach.stripe_subscription_id ?? "-"} status=${coach.subscription_status ?? "NULL"}\n`);

// 1. Cancel the off-clock subscription. It can never be advanced, so it is only
//    noise from here on.
if (coach.stripe_subscription_id) {
  const old = await stripe(`subscriptions/${coach.stripe_subscription_id}`);
  if (old.status !== "canceled") {
    await stripe(`subscriptions/${coach.stripe_subscription_id}`, { method: "DELETE" });
    console.log(`Cancelled the off-clock subscription ${coach.stripe_subscription_id}`);
  }
}

// 2. Clock frozen at now. Everything below is created "inside" this clock's time.
const now = Math.floor(Date.now() / 1000);
const clock = await stripe("test_helpers/test_clocks", {
  method: "POST",
  form: { frozen_time: String(now), name: `downgrade test — ${coach.email}` },
});
console.log(`Test clock: ${clock.id}  frozen at ${new Date(clock.frozen_time * 1000).toISOString()}`);

// 3. New customer ON the clock. metadata.coach_id matches what
//    createCheckoutSession() sets, so webhook route 2 resolves identically.
const customer = await stripe("customers", {
  method: "POST",
  form: {
    email: coach.email ?? "",
    test_clock: clock.id,
    "metadata[coach_id]": coach.id,
  },
});
console.log(`Customer:   ${customer.id} (on clock)`);

// 4. A card, so the first invoice can actually be paid and the subscription
//    reaches `active` rather than sitting at `incomplete`.
const pm = await stripe("payment_methods/pm_card_visa/attach", {
  method: "POST", form: { customer: customer.id },
});
await stripe(`customers/${customer.id}`, {
  method: "POST", form: { "invoice_settings[default_payment_method]": pm.id },
});

// 5. Subscription, then schedule the cancellation. Two calls rather than one, so
//    the sub is genuinely `active` first — the state a real coach is in when
//    they hit "Cancel" in the Billing Portal.
let sub = await stripe("subscriptions", {
  method: "POST",
  form: {
    customer: customer.id,
    "items[0][price]": env.STRIPE_PRICE_ID,
    "metadata[coach_id]": coach.id,
  },
});
sub = await stripe(`subscriptions/${sub.id}`, {
  method: "POST", form: { cancel_at_period_end: "true" },
});

const periodEnd = sub.items?.data?.[0]?.current_period_end ?? sub.cancel_at;
console.log(`Subscription: ${sub.id}  status=${sub.status}`);
console.log(`Period ends:  ${new Date(periodEnd * 1000).toISOString()}  (cancel_at=${sub.cancel_at ?? "-"})`);

if (!isEntitled(sub.status)) {
  console.log(`\n⚠️  Subscription is "${sub.status}", not active — the card may need SCA. Check the dashboard before advancing.`);
}

// 6. Repoint the coach. SERVICE ROLE is required: coaches_block_client_billing_writes()
//    rejects these three columns from the anon/authenticated roles by design.
const { error } = await db.from("coaches").update({
  stripe_customer_id: customer.id,
  stripe_subscription_id: sub.id,
  subscription_status: sub.status,
}).eq("id", coach.id);
if (error) die(`could not repoint the coach row: ${error.message}`);

const backup = `scripts/_testclock-${coach.email.replace(/[^a-z0-9]/gi, "_")}.json`;
writeFileSync(backup, JSON.stringify({
  coach_id: coach.id, coach_email: coach.email,
  clock_id: clock.id, new_customer: customer.id, new_subscription: sub.id,
  period_end: periodEnd,
  previous: {
    stripe_customer_id: coach.stripe_customer_id,
    stripe_subscription_id: coach.stripe_subscription_id,
    subscription_status: coach.subscription_status,
  },
}, null, 2));

console.log(`\nCoach row repointed. Previous ids saved to ${backup}`);
console.log(`\nNEXT:`);
console.log(`  1. make sure this is running:  stripe listen --forward-to localhost:3000/api/stripe/webhook`);
console.log(`  2. advance the clock:          node scripts/testclock-advance.mjs ${coach.email}`);
