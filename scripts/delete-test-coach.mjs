/**
 * ONE-OFF: fully delete a TEST coach account and everything belonging to it.
 *
 *   node scripts/delete-test-coach.mjs someone@example.com            # dry run
 *   node scripts/delete-test-coach.mjs someone@example.com --execute  # for real
 *
 * ⚠️ DRY RUN BY DEFAULT. Nothing is deleted without --execute.
 *
 * ⚠️ IT DELETES BOTTOM-UP EXPLICITLY RATHER THAN LEANING ON CASCADE, and that is
 * a deliberate choice, not belt-and-braces for its own sake. Exactly ONE foreign
 * key in this project is defined in a migration file (logs.assignment_id, SET
 * NULL). Every other FK — including all four coach_id relationships — was
 * created in the Supabase dashboard and appears in NO file in the repo, so their
 * ON DELETE behaviour cannot be verified by reading the codebase. CLAUDE.md
 * documents four of them and is silent on assignments.coach_id and
 * custom_exercises.coach_id.
 *
 * What that means in practice:
 *   - if the cascades are as documented, the explicit deletes below simply find
 *     the rows already gone and delete nothing
 *   - if one of them is actually NO ACTION / RESTRICT, deleting the coach row
 *     would FAIL with a foreign-key violation, and going bottom-up avoids that
 * Either way the outcome is the same, which is the point.
 *
 * To see the real rules, run this in the Supabase SQL editor:
 *
 *   select tc.table_name, kcu.column_name, rc.delete_rule
 *     from information_schema.table_constraints tc
 *     join information_schema.key_column_usage kcu using (constraint_name)
 *     join information_schema.referential_constraints rc using (constraint_name)
 *    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
 *    order by tc.table_name, kcu.column_name;
 *
 * ⚠️ THE AUTH USER IS NOT A CASCADE. `coaches.id` is the auth user's id, but
 * deleting the coaches row leaves the row in auth.users behind — which is how
 * this project ended up with 8 auth users against 3 coaches (an open item in
 * CLAUDE.md). This script deletes it via the admin API, last.
 *
 * ⚠️ STRIPE IS NOT TOUCHED unless you pass --stripe. Deleting database rows does
 * nothing to a Stripe customer or an active subscription; in test mode that is
 * only untidy, but the same script run against live data would leave a customer
 * being billed for an account that no longer exists.
 */
import { db, die, stripe, requireTestMode } from "./_env.mjs";

requireTestMode();

const email = process.argv[2];
const EXECUTE = process.argv.includes("--execute");
const DO_STRIPE = process.argv.includes("--stripe");

if (!email || email.startsWith("--")) die("usage: node scripts/delete-test-coach.mjs <email> [--execute] [--stripe]");

// Hard denylist. RJ is the one real user; nothing about this script should ever
// be pointed at him, whatever is typed.
const PROTECTED = ["riselongbeach@gmail.com"];
if (PROTECTED.includes(email.toLowerCase())) die(`${email} is a protected real account. Refusing.`);

const { data: coach } = await db.from("coaches")
  .select("id, name, email, stripe_customer_id, stripe_subscription_id, subscription_status")
  .eq("email", email).single();
if (!coach) die(`no coach row for ${email}`);

const { data: players } = await db.from("players").select("id, name").eq("coach_id", coach.id);
const playerIds = players.map(p => p.id);

const counts = {
  players: players.length,
  assignments: (await db.from("assignments").select("id", { count: "exact", head: true }).eq("coach_id", coach.id)).count ?? 0,
  logs: playerIds.length
    ? (await db.from("logs").select("id", { count: "exact", head: true }).in("player_id", playerIds)).count ?? 0
    : 0,
  custom_exercises: (await db.from("custom_exercises").select("id", { count: "exact", head: true }).eq("coach_id", coach.id)).count ?? 0,
};

console.log(`${EXECUTE ? "DELETING" : "DRY RUN — nothing will be deleted"}\n`);
console.log(`Coach:    ${coach.name} <${coach.email}>`);
console.log(`  id      ${coach.id}`);
console.log(`  stripe  customer=${coach.stripe_customer_id ?? "-"} sub=${coach.stripe_subscription_id ?? "-"} status=${coach.subscription_status ?? "NULL"}`);
console.log(`\nWould delete:`);
console.log(`  ${String(counts.logs).padStart(4)}  logs`);
console.log(`  ${String(counts.assignments).padStart(4)}  assignments`);
console.log(`  ${String(counts.custom_exercises).padStart(4)}  custom_exercises`);
console.log(`  ${String(counts.players).padStart(4)}  players${players.length ? ` — ${players.map(p => p.name).join(", ")}` : ""}`);
console.log(`     1  coaches row`);
console.log(`     1  auth.users row (admin API, not a cascade)`);
if (DO_STRIPE) console.log(`        + cancel the Stripe subscription and delete the customer`);
else console.log(`        Stripe NOT touched (pass --stripe to cancel + delete there too)`);

if (!EXECUTE) {
  console.log(`\nRe-run with --execute to actually delete.`);
  process.exit(0);
}

console.log(`\nDeleting in 5s — ctrl-C to stop.`);
await new Promise(r => setTimeout(r, 5000));

// Bottom-up. Each step is a no-op if a cascade already took the rows.
const step = async (label, fn) => {
  const { error, count } = await fn();
  if (error) die(`${label} failed: ${error.message}`);
  console.log(`  deleted ${count ?? "?"} ${label}`);
};

if (playerIds.length) {
  await step("logs", () => db.from("logs").delete({ count: "exact" }).in("player_id", playerIds));
}
await step("assignments", () => db.from("assignments").delete({ count: "exact" }).eq("coach_id", coach.id));
await step("custom_exercises", () => db.from("custom_exercises").delete({ count: "exact" }).eq("coach_id", coach.id));
await step("players", () => db.from("players").delete({ count: "exact" }).eq("coach_id", coach.id));

if (DO_STRIPE && coach.stripe_subscription_id) {
  const sub = await stripe(`subscriptions/${coach.stripe_subscription_id}`);
  if (sub.status !== "canceled") await stripe(`subscriptions/${coach.stripe_subscription_id}`, { method: "DELETE" });
  console.log(`  cancelled subscription ${coach.stripe_subscription_id}`);
}
if (DO_STRIPE && coach.stripe_customer_id) {
  await stripe(`customers/${coach.stripe_customer_id}`, { method: "DELETE" });
  console.log(`  deleted customer ${coach.stripe_customer_id}`);
}

await step("coaches row", () => db.from("coaches").delete({ count: "exact" }).eq("id", coach.id));

// Last, and deliberately after the coaches row: if coaches.id turns out to
// reference auth.users with ON DELETE CASCADE, deleting the auth user first
// would take the coaches row with it mid-script.
const { error: authErr } = await db.auth.admin.deleteUser(coach.id);
console.log(authErr ? `  auth user NOT deleted: ${authErr.message}` : `  deleted auth user ${coach.id}`);

// Prove it is gone rather than assuming the deletes landed.
const { data: still } = await db.from("coaches").select("id").eq("id", coach.id).maybeSingle();
const { count: leftoverPlayers } = await db.from("players").select("id", { count: "exact", head: true }).eq("coach_id", coach.id);
console.log(`\nVerify: coaches row ${still ? "STILL PRESENT" : "gone"}, players remaining ${leftoverPlayers ?? 0}`);
