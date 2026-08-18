/**
 * ONE-OFF: delete the 24 players seeded by scripts/seed-test-players.mjs.
 *
 * Run with `node scripts/delete-test-players.mjs` (add --force to skip the
 * 5-second pause).
 *
 * ⚠️ DELETES BY PRIMARY KEY, from the id list the seed script wrote to
 * scripts/_seeded-test-players.json. It never matches on name or phone as its
 * primary rule, so it CANNOT reach Coach Tony's original 6 — those ids are not
 * in the file. If the file is missing it refuses and tells you the fallback
 * query rather than guessing.
 *
 * ⚠️ players cascades to assignments AND logs. These rows were seeded with
 * neither, and this script verifies that before deleting — if a test assignment
 * or log somehow attached itself to one, it stops and says so rather than
 * quietly destroying it.
 */
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ID_FILE = "scripts/_seeded-test-players.json";
const FORCE = process.argv.includes("--force");

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n").filter(l => l.trim() && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const die = (msg) => { console.error(`\nABORTED: ${msg}`); process.exit(1); };

if (!existsSync(ID_FILE)) {
  die(`${ID_FILE} is missing, so there is no exact id list to delete.\n` +
      `        Fallback, run in the Supabase SQL editor — read the SELECT first,\n` +
      `        confirm it returns 24 rows and none of your real students:\n\n` +
      `          select id, name, phone from public.players\n` +
      `           where coach_id = (select id from public.coaches where email = 'tonyliu34@gmail.com')\n` +
      `             and name ~ '^Test Player [0-9]+$'\n` +
      `             and phone like '+1213555%';\n\n` +
      `        Then swap 'select id, name, phone' for 'delete' once it looks right.`);
}

const seeded = JSON.parse(readFileSync(ID_FILE, "utf8"));
const ids = seeded.ids ?? [];
if (ids.length === 0) die("the id file lists no ids.");

// Read the rows back before touching them, so what gets deleted is shown first.
const { data: rows, error: rErr } = await db
  .from("players").select("id, name, phone, coach_id").in("id", ids);
if (rErr) die(`could not read the seeded rows: ${rErr.message}`);

// Every row must still look like a seeded placeholder on the expected coach.
// Anything else means the id file and the database have diverged.
const wrong = rows.filter(r =>
  r.coach_id !== seeded.coach_id || !/^Test Player \d+$/.test(r.name));
if (wrong.length > 0) {
  die(`${wrong.length} of these rows are not seeded placeholders on the expected coach:\n` +
      wrong.map(r => `          ${r.name} (${r.id})`).join("\n") +
      `\n        Nothing deleted. Investigate before rerunning.`);
}

// Cascade check — these were seeded bare and must still be bare.
const [{ count: aCount }, { count: lCount }] = await Promise.all([
  db.from("assignments").select("id", { count: "exact", head: true }).in("player_id", ids),
  db.from("logs").select("id", { count: "exact", head: true }).in("player_id", ids),
]);
if (aCount || lCount) {
  die(`these players now have ${aCount ?? 0} assignment(s) and ${lCount ?? 0} log(s), which\n` +
      `        deleting would destroy via CASCADE. Rerun with the check removed only if\n` +
      `        you are certain that test data is disposable.`);
}

console.log(`About to delete ${rows.length} seeded players from coach ${seeded.coach_email}:`);
for (const r of rows) console.log(`  ${r.name}  ${r.phone}`);
console.log(`\nNo assignments, no logs attached. The original 6 are not in this list.`);

if (!FORCE) {
  console.log("\nDeleting in 5s — ctrl-C to stop.");
  await new Promise(r => setTimeout(r, 5000));
}

const { error: dErr } = await db.from("players").delete().in("id", ids);
if (dErr) die(`delete failed: ${dErr.message}`);

const { count: remaining } = await db
  .from("players").select("id", { count: "exact", head: true })
  .eq("coach_id", seeded.coach_id);

unlinkSync(ID_FILE);
console.log(`\nDeleted ${rows.length}. Coach now has ${remaining} players. Removed ${ID_FILE}.`);
