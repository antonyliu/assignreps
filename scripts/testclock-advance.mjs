/**
 * ONE-OFF: advance a coach's test clock past `current_period_end`, then report
 * whether the downgrade actually took effect end to end.
 *
 *   node scripts/testclock-advance.mjs mail@antonyliu.com
 *
 * Advances to period end + 1 hour by default. Pass a number of extra days to go
 * further: `node scripts/testclock-advance.mjs <email> 35`.
 *
 * ⚠️ REQUIRES `stripe listen --forward-to localhost:3000/api/stripe/webhook` TO
 * BE RUNNING, and the dev server with it. Advancing a clock fires real webhook
 * events; with no listener they are simply never delivered, `subscription_status`
 * never changes, and the result looks exactly like a broken feature. This script
 * reports Stripe's own view alongside the database's, so the two disagreeing is
 * the signature of a dead listener rather than a bug.
 *
 * ⚠️ A clock advance is IRREVERSIBLE. Clocks only move forward.
 */
import { readFileSync, existsSync } from "node:fs";
import { db, die, stripe, requireTestMode, isEntitled, activeStudentLimit } from "./_env.mjs";

requireTestMode();

const email = process.argv[2];
const extraDays = Number(process.argv[3] ?? 0);
if (!email) die("usage: node scripts/testclock-advance.mjs <coach-email> [extra-days]");

const backup = `scripts/_testclock-${email.replace(/[^a-z0-9]/gi, "_")}.json`;
if (!existsSync(backup)) die(`${backup} missing — run scripts/testclock-setup.mjs first.`);
const state = JSON.parse(readFileSync(backup, "utf8"));

const target = state.period_end + 3600 + extraDays * 86400;
const clockBefore = await stripe(`test_helpers/test_clocks/${state.clock_id}`);

console.log(`Clock ${state.clock_id}`);
console.log(`  now:    ${new Date(clockBefore.frozen_time * 1000).toISOString()}`);
console.log(`  target: ${new Date(target * 1000).toISOString()}  (period end + 1h${extraDays ? ` + ${extraDays}d` : ""})`);

if (target <= clockBefore.frozen_time) die("target is not in the future — clocks only move forward.");

await stripe(`test_helpers/test_clocks/${state.clock_id}/advance`, {
  method: "POST", form: { frozen_time: String(target) },
});

// Advancing is async: Stripe replays every scheduled billing event, which takes
// a few seconds and emits the webhooks along the way.
process.stdout.write("\nadvancing");
let clock;
for (let i = 0; i < 60; i++) {
  await new Promise(r => setTimeout(r, 2000));
  clock = await stripe(`test_helpers/test_clocks/${state.clock_id}`);
  process.stdout.write(".");
  if (clock.status === "ready") break;
  if (clock.status === "internal_failure") die("the clock advance failed inside Stripe.");
}
console.log(`\nclock status: ${clock.status}  at ${new Date(clock.frozen_time * 1000).toISOString()}`);

// Give the forwarded webhook a moment to land before reading the database.
await new Promise(r => setTimeout(r, 4000));

const sub = await stripe(`subscriptions/${state.new_subscription}`);
const { data: coach } = await db.from("coaches")
  .select("id, name, subscription_status").eq("id", state.coach_id).single();
const { count: activeCount } = await db.from("players")
  .select("id", { count: "exact", head: true })
  .eq("coach_id", state.coach_id).is("deactivated_at", null);

const limit = activeStudentLimit(coach.subscription_status);
const entitled = isEntitled(coach.subscription_status);
const blocked = activeCount >= limit;

console.log(`\n──────── RESULT ────────`);
console.log(`Stripe subscription status : ${sub.status}`);
console.log(`DB subscription_status     : ${coach.subscription_status ?? "NULL"}`);
console.log(`isEntitled()               : ${entitled}`);
console.log(`plan limit                 : ${limit}   (${entitled ? "Pro" : "Free"})`);
console.log(`active students            : ${activeCount}`);
console.log(`add-student gate           : ${blocked ? "BLOCKS" : "allows"} the next add`);
console.log(`over the limit by          : ${Math.max(0, activeCount - limit)}`);

console.log(`\n──────── CHECKS ────────`);
const check = (ok, label, detail) => console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
check(sub.status !== "active", "Stripe moved the subscription off active", `now "${sub.status}"`);
check(coach.subscription_status === sub.status, "the webhook wrote Stripe's status to the DB",
      coach.subscription_status === sub.status ? undefined : `DB says "${coach.subscription_status}", Stripe says "${sub.status}" — is stripe listen running?`);
check(!entitled, "isEntitled() returns false");
check(limit === 3, "the coach dropped to the Free limit");
check(blocked, "the add-student gate blocks", `${activeCount} active vs a limit of ${limit}`);
console.log(`\nExisting students are untouched by design — the rule is "count >= limit blocks the ADD".`);
console.log(`Confirm in the browser: /instructor/add-student should show the upgrade paywall.`);
