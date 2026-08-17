"use server";

import { headers } from "next/headers";
import { requireCoach } from "@/lib/require-coach";
import { createServiceClient } from "@/lib/supabase-service";
import { getStripe } from "@/lib/stripe";
import { isEntitled } from "@/lib/entitlement";

export type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

// Where the coach ends up. Derived from the request rather than an env var so
// local, staging and prod each send the coach back to themselves without a
// fourth thing to configure — and without a misconfigured value silently
// bouncing a paying coach onto the wrong host.
async function originFromRequest(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  // Vercel sets x-forwarded-proto; local dev usually does not.
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Starts a Stripe Checkout session for the $10/mo subscription and hands back
// the URL for the client to redirect to.
//
// ⚠️ Takes NO parameters, deliberately. Every value that decides what is being
// sold or who is buying comes from the server: the coach from the session, the
// price from env. An action that accepted a price id would let a crafted
// request buy something the coach never chose — the same reasoning that keeps
// saveLog's snapshot fields and Assign again's copied values server-side.
export async function createCheckoutSession(): Promise<CheckoutResult> {
  // Redirects unauthenticated or half-signed-up visitors; nothing below runs
  // for anyone without a real coaches row.
  const { supabase, user } = await requireCoach();

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) return { ok: false, error: "Billing isn't configured yet." };

  // requireCoach() selects only id/name/instructor_type, so read the fields
  // billing needs. Read through the USER's client, not the service client —
  // this is their own row and RLS should be the thing proving that.
  const { data: coach, error: readError } = await supabase
    .from("coaches")
    .select("id, email, stripe_customer_id, subscription_status")
    .eq("id", user.id)
    .single();

  if (readError || !coach) return { ok: false, error: "Couldn't load your account." };

  // ⚠️ ALREADY-SUBSCRIBED GUARD. Without it every completed checkout mints
  // ANOTHER subscription on the same customer, and the coach is billed once per
  // trip through Checkout. This is not hypothetical: testing on 2026-08-03 left
  // three active subscriptions on one customer — $20/mo of real double-billing
  // had it been live mode.
  //
  // ⚠️ Hiding the "Upgrade to Pro" menu item is NOT protection, which is the
  // whole reason this lives here. `isPro` only becomes true once the webhook
  // lands, so between the Stripe redirect and that write the button is still
  // showing and a second tap subscribes again — a window observed in practice,
  // not imagined. A server action can also be invoked directly, where no UI
  // gate reaches at all. Same lesson as fileFinishedAssignments: an action
  // establishes its own preconditions rather than borrowing them from whatever
  // rendered its button.
  //
  // Reads the coach's CURRENT status rather than trusting the isPro prop the
  // client rendered with, which may be a page-load old.
  //
  // isEntitled() rather than a status string comparison, so this and the
  // add-student gate can never disagree about what counts as subscribed.
  if (isEntitled(coach.subscription_status)) {
    return { ok: false, error: "You're already on Pro." };
  }

  const stripe = getStripe();

  // Create-or-reuse, rather than letting Checkout mint a customer implicitly.
  // ⚠️ Implicit creation makes a NEW customer every time a coach opens Checkout,
  // so abandoning it twice leaves three customers for one coach and the webhook
  // has no unambiguous row to match. Reusing a stored id keeps one coach to one
  // customer, which is also what makes the Billing Portal work later.
  let customerId = coach.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create(
      {
        email: coach.email ?? undefined,
        // Lets a human answer "who is this?" in the Stripe dashboard, and gives
        // webhooks a second way home if client_reference_id is ever absent.
        metadata: { coach_id: coach.id },
      },
      // Two rapid taps on Upgrade would otherwise create two customers before
      // either write lands. Keyed on the coach, so the second call returns the
      // first call's customer instead of making another.
      { idempotencyKey: `coach-customer-${coach.id}` },
    );

    customerId = customer.id;

    // ⚠️ SERVICE ROLE, and this is the one line that needs it. A server action
    // runs as `authenticated`, and coaches_block_client_billing_writes()
    // rejects any change to the billing columns from that role — deliberately,
    // so a coach cannot set their own subscription_status. Writing the customer
    // id is a legitimate server-side write of the same protected group.
    const admin = createServiceClient();
    const { error: writeError } = await admin
      .from("coaches")
      .update({ stripe_customer_id: customerId })
      .eq("id", coach.id);

    // Not fatal. The customer exists at Stripe and the session below will still
    // work; the webhook writes this column again on completion, so a failure
    // here self-heals rather than blocking a coach mid-purchase.
    if (writeError) {
      console.error("[billing] failed to persist stripe_customer_id", writeError);
    }
  }

  const origin = await originFromRequest();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    // COACHRJ is entered here. Without this the promo field never renders and a
    // 100%-off-forever coupon has no way in.
    allow_promotion_codes: true,
    // Ties the completed session back to a coach in the webhook without
    // trusting anything the browser sends back.
    client_reference_id: coach.id,
    // Carried onto the Subscription itself, so a customer.subscription.* event
    // — which does not carry client_reference_id — can still identify the coach.
    subscription_data: { metadata: { coach_id: coach.id } },
    // ⚠️ The success page must NOT assert "you're Pro" from our database. Stripe
    // redirects immediately while the webhook arrives independently and may be
    // seconds behind, so a DB read here is racing. Same failure the celebrate
    // screen's three-state loading exists to prevent — defaults doubling as a
    // loading state and asserting an outcome nothing has confirmed.
    success_url: `${origin}/instructor/students?upgraded=1`,
    // Backing out is not an error and gets no message.
    cancel_url: `${origin}/instructor/students`,
  });

  if (!session.url) return { ok: false, error: "Couldn't start checkout." };

  return { ok: true, url: session.url };
}

// Opens the Stripe Billing Portal so a coach can manage or cancel their own
// subscription. Hands back a URL for the client to redirect to, matching
// createCheckoutSession above rather than redirecting from the server.
//
// ⚠️ Takes NO parameters, for the same reason checkout does not: the coach comes
// from the session and the customer id from their own row. An action that
// accepted a customer id would let a crafted request open somebody else's
// billing portal, which is about as bad as this app gets.
//
// ✅ VERIFIED END TO END on Aug 17 2026, in test mode, against Coach Tony's
// subscription: the portal opened from the ProfileMenu row, the cancellation
// registered, Stripe reported status `active` with cancel_at set to the exact
// current_period_end and canceled_at stamped, the webhook forwarded two
// customer.subscription.updated events and returned 200 to both, and no other
// coach's row was touched.
//
// ⚠️ WHAT THIS DOES NOT DO: it does not decide whether cancelling takes effect
// immediately or at period end. That is a PORTAL CONFIGURATION set in the
// Stripe dashboard (Settings -> Billing -> Customer portal -> Cancellation),
// not a parameter of the session created here, so it cannot be set or verified
// from this file. Confirmed set to "At end of billing period" on Aug 17.
//
// It matters because /faq promises "You'll keep everything you already paid for
// through the end of that period — it just won't renew after." That sentence is
// only true while the portal stays on at-period-end. If it is ever switched to
// Immediately, the FAQ answer becomes false and NOTHING IN THE CODE WILL CATCH
// IT — this comment is the trail back.
//
// ⚠️ On API version 2026-07-29.dahlia a scheduled cancellation shows up as
// `cancel_at`, and `cancel_at_period_end` reads FALSE even when the
// cancellation is correctly scheduled for period end. Compare cancel_at against
// current_period_end; do not trust the boolean.
//
// ✅ No entitlement or webhook changes were needed, which the verification
// confirmed rather than assumed: Stripe keeps the subscription `active` until
// the period actually ends, isEntitled() allows `active`, and the existing
// handler re-resolves at customer level on customer.subscription.updated. The
// coach keeps Pro until the date they paid through, then
// customer.subscription.deleted writes `canceled`.
export async function createPortalSession(): Promise<CheckoutResult> {
  const { supabase, user } = await requireCoach();

  const { data: coach, error: readError } = await supabase
    .from("coaches")
    .select("id, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (readError || !coach) return { ok: false, error: "Couldn't load your account." };

  // ⚠️ Gated on HAVING A CUSTOMER, not on isEntitled(). A coach whose
  // subscription lapsed or was cancelled still has invoices to read and a way
  // back in, so entitlement is the wrong question here — the right one is
  // whether Stripe knows who they are at all.
  //
  // Null means they never completed checkout, so there is no portal to open.
  // The UI only offers this row to a Pro coach, but this action can be invoked
  // directly, so it establishes its own precondition rather than borrowing one
  // from whatever rendered the button — the same rule createCheckoutSession's
  // already-subscribed guard follows.
  if (!coach.stripe_customer_id) {
    return { ok: false, error: "No billing set up on this account yet." };
  }

  const stripe = getStripe();
  const origin = await originFromRequest();

  const session = await stripe.billingPortal.sessions.create({
    customer: coach.stripe_customer_id,
    // Back to the roster, which is the only page ProfileMenu renders on.
    // ⚠️ No ?cancelled=1 or similar: whatever the coach did in the portal, the
    // truth arrives by webhook and may be seconds behind this redirect. Same
    // race the checkout success_url comment describes — do not have the landing
    // page assert an outcome it has not read.
    return_url: `${origin}/instructor/students`,
  });

  if (!session.url) return { ok: false, error: "Couldn't open billing." };

  return { ok: true, url: session.url };
}
