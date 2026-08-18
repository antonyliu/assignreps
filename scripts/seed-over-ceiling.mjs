/**
 * ONE-OFF: push a PRO coach past the 30 ceiling so the over_ceiling variants
 * render. Unreachable through the UI — the add gate stops a coach exactly AT 30
 * — so these rows go in by direct insert, bypassing addPlayer() entirely.
 *
 *   node scripts/seed-over-ceiling.mjs tonyliu34@gmail.com
 *
 * Ids recorded to scripts/_seeded-over-ceiling.json for exact cleanup.
 */
import { writeFileSync } from "node:fs";
import { db, die, isEntitled, activeStudentLimit } from "./_env.mjs";

const TARGET_ACTIVE = 31;
const ID_FILE = "scripts/_seeded-over-ceiling.json";
const email = process.argv[2];
if (!email) die("usage: node scripts/seed-over-ceiling.mjs <coach-email>");

const { data: coach } = await db.from("coaches")
  .select("id,name,email,subscription_status").eq("email", email).single();
if (!coach) die(`no coach for ${email}`);

if (!isEntitled(coach.subscription_status)) {
  die(`${coach.name} is "${coach.subscription_status}" — not Pro. over_ceiling needs an ENTITLED coach;\n        an unentitled one produces over_limit instead, which is the variant already tested.`);
}

const { data: players } = await db.from("players").select("id,name,deactivated_at").eq("coach_id", coach.id);
const active = players.filter(p => !p.deactivated_at).length;
const inactive = players.filter(p => p.deactivated_at);
const limit = activeStudentLimit(coach.subscription_status);

console.log(`${coach.name} <${coach.email}>  status=${coach.subscription_status}  limit=${limit}`);
console.log(`before: ${active} active, ${inactive.length} inactive (${players.length} total)`);

if (inactive.length === 0) die("no inactive player to reactivate — the gate test needs one.");

const need = TARGET_ACTIVE - active;
if (need <= 0) die(`already at ${active} active; nothing to seed.`);

const rows = Array.from({ length: need }, (_, i) => ({
  coach_id: coach.id,
  name: `Ceiling Test ${i + 1}`,
  phone: `+1213555${String(200 + i + 1).padStart(4, "0")}`,   // reserved fictional range
  parent_phone: null,
  send_to_parent: false,
  token: crypto.randomUUID(),
  deactivated_at: null,
}));

const { data: inserted, error } = await db.from("players").insert(rows).select("id");
if (error) die(`insert failed: ${error.message}`);

writeFileSync(ID_FILE, JSON.stringify({
  coach_id: coach.id, coach_email: coach.email,
  ids: inserted.map(r => r.id),
}, null, 2));

const { count: now } = await db.from("players")
  .select("id", { count: "exact", head: true }).eq("coach_id", coach.id).is("deactivated_at", null);

console.log(`inserted ${inserted.length} -> ${now} active vs limit ${limit}  OVER BY ${now - limit}`);
console.log(`ids -> ${ID_FILE}`);
console.log(`inactive player for the reactivate test: ${inactive[0].name}`);
