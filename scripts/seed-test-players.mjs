/**
 * ONE-OFF: seed 24 throwaway players onto Coach Tony's roster.
 *
 * Purpose: hand-test the PRO_STUDENT_LIMIT = 30 boundary without tapping
 * "Add player" 24 times. Tony has 6 active; 6 + 24 = 30 = the ceiling.
 *
 * ⚠️ NOT app code and never imported by it. Run with `node scripts/seed-test-players.mjs`.
 *
 * ⚠️ THIS WRITES TO THE SHARED SUPABASE PROJECT. Local, staging and prod all
 * point at the one hosted database, so these rows are visible everywhere until
 * they are cleaned up. See scripts/delete-test-players.mjs.
 *
 * Safety rails, all of which ABORT rather than proceed:
 *   1. resolves the coach by EMAIL, never by a hardcoded id
 *   2. refuses unless that coach is entitled (active/trialing) — this test is
 *      about the PRO ceiling, and on Free the add gate blocks at 3 instead
 *   3. refuses if seeding would push the active count past 30
 *   4. refuses to run twice (any existing "Test Player" row stops it)
 *   5. writes ONLY inserts, scoped to that coach_id — no update, no delete
 *
 * It records every inserted id to scripts/_seeded-test-players.json so the
 * cleanup deletes by primary key and cannot possibly reach the original 6.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const COACH_EMAIL = "tonyliu34@gmail.com";
const COUNT = 24;
const CEILING = 30;
const ID_FILE = "scripts/_seeded-test-players.json";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n").filter(l => l.trim() && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const die = (msg) => { console.error(`\nABORTED: ${msg}`); process.exit(1); };

// --- 1. resolve the coach by email ---
const { data: coach, error: cErr } = await db
  .from("coaches").select("id, name, email, subscription_status")
  .eq("email", COACH_EMAIL).single();
if (cErr || !coach) die(`no coach row for ${COACH_EMAIL} (${cErr?.message ?? "not found"})`);

// --- 2. must be on Pro ---
// Same allowlist as isEntitled() in src/lib/entitlement.ts. Kept literal here
// rather than imported: this is a plain .mjs script outside the TS build.
if (!["active", "trialing"].includes(coach.subscription_status ?? "")) {
  die(`${coach.name} is not on Pro (subscription_status = ${coach.subscription_status ?? "NULL"}).\n` +
      `        The 30-ceiling test needs an entitled coach; on Free the gate blocks at 3.`);
}

// --- 3. read the current roster ---
const { data: existing, error: pErr } = await db
  .from("players").select("id, name, deactivated_at").eq("coach_id", coach.id);
if (pErr) die(`could not read players: ${pErr.message}`);

const active = existing.filter(p => !p.deactivated_at);
console.log(`Coach:   ${coach.name} <${coach.email}>  (Pro — ${coach.subscription_status})`);
console.log(`Roster:  ${existing.length} total, ${active.length} active`);

// --- 4. refuse to run twice ---
const alreadySeeded = existing.filter(p => /^Test Player \d+$/.test(p.name));
if (alreadySeeded.length > 0) {
  die(`${alreadySeeded.length} "Test Player N" rows already exist. Run the cleanup first.`);
}

// --- 5. refuse to overshoot the ceiling ---
if (active.length + COUNT > CEILING) {
  die(`${active.length} active + ${COUNT} would be ${active.length + COUNT}, past the ${CEILING} ceiling.`);
}

// Reserved fictional numbers (NPA-555-01XX), distinct per row so nothing here
// can collide with a real student's number.
const phoneFor = (n) => `+1213555${String(100 + n).padStart(4, "0")}`;

const rows = Array.from({ length: COUNT }, (_, i) => ({
  coach_id: coach.id,
  name: `Test Player ${i + 1}`,
  phone: phoneFor(i + 1),
  parent_phone: null,
  send_to_parent: false,
  token: crypto.randomUUID(),
  // Explicitly active. The column default is null, but stating it is the point
  // of the exercise — these have to count against the ceiling.
  deactivated_at: null,
}));

const { data: inserted, error: iErr } = await db.from("players").insert(rows).select("id, name");
if (iErr) die(`insert failed: ${iErr.message}`);

writeFileSync(ID_FILE, JSON.stringify({
  coach_id: coach.id,
  coach_email: coach.email,
  seeded_at: new Date().toISOString(),
  ids: inserted.map(r => r.id),
}, null, 2));

const { count: nowActive } = await db
  .from("players").select("id", { count: "exact", head: true })
  .eq("coach_id", coach.id).is("deactivated_at", null);

console.log(`\nInserted ${inserted.length} players. Ids recorded in ${ID_FILE}`);
console.log(`Active now: ${nowActive} / ${CEILING}`);
console.log(`\nThe original ${active.length} were not read for update, renamed or reordered — inserts only.`);
