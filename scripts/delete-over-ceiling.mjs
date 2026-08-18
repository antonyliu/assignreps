/**
 * ONE-OFF: delete the players seeded by scripts/seed-over-ceiling.mjs.
 *
 *   node scripts/delete-over-ceiling.mjs
 *
 * ⚠️ DELETES BY PRIMARY KEY, from the id list in
 * scripts/_seeded-over-ceiling.json. It never matches on name or phone as its
 * primary rule, so a coach's real students cannot be reached — their ids are
 * not in the file. Refuses if any row is no longer a "Ceiling Test N" on the
 * expected coach, and refuses if any has since picked up assignments or logs,
 * which players cascades to and would destroy.
 *
 * If the id file is missing it aborts and prints a fallback SQL query rather
 * than guessing.
 */
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { db, die } from "./_env.mjs";
const F = "scripts/_seeded-over-ceiling.json";
if (!existsSync(F)) die(`${F} missing. Fallback SQL:\n  delete from public.players\n   where coach_id = (select id from public.coaches where email='tonyliu34@gmail.com')\n     and name ~ '^Ceiling Test [0-9]+$' and phone like '+1213555%';`);
const s = JSON.parse(readFileSync(F, "utf8"));
const { data: rows } = await db.from("players").select("id,name,coach_id").in("id", s.ids);
const wrong = rows.filter(r => r.coach_id !== s.coach_id || !/^Ceiling Test \d+$/.test(r.name));
if (wrong.length) die(`${wrong.length} rows are not seeded placeholders. Nothing deleted.`);
const [{ count: a }, { count: l }] = await Promise.all([
  db.from("assignments").select("id",{count:"exact",head:true}).in("player_id", s.ids),
  db.from("logs").select("id",{count:"exact",head:true}).in("player_id", s.ids),
]);
if (a || l) die(`these carry ${a} assignments and ${l} logs — CASCADE would destroy them.`);
const { error } = await db.from("players").delete().in("id", s.ids);
if (error) die(error.message);
const { count: now } = await db.from("players").select("id",{count:"exact",head:true}).eq("coach_id", s.coach_id).is("deactivated_at", null);
unlinkSync(F);
console.log(`deleted ${rows.length}. Coach Tony now ${now} active. Removed ${F}.`);
