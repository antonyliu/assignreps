"use server";

import { createClient } from "@/lib/supabase-server";
import { isComplete } from "@/lib/exercises";
import type { GoalType } from "@/lib/exercises";

export type SaveLogResult = { ok: true; allDone: boolean } | { ok: false; error: string };

// ⚠️ Mirrors `logs_note_length_check` (char_length(note) <= 100), and mirrors
// NOTE_MAX in LogScreen. The DB constraint is the source of truth; these two are
// its guards. Change one, change all three.
const NOTE_MAX = 100;

export async function saveLog(
  playerId: string,
  assignmentId: string,
  amount: number,
  makes: number | null = null,
  note: string | null = null,
): Promise<SaveLogResult> {
  if (amount < 1) return { ok: false, error: "Nothing to save." };

  // Null stays null — "didn't say" is a real answer and must not collapse to 0.
  // Negatives are clamped rather than rejected: the DB check would fail the whole
  // insert and lose the reps the student actually did.
  const safeMakes = makes === null || Number.isNaN(makes) ? null : Math.max(0, Math.round(makes));

  // Trimmed and capped HERE, not just on the client. This page is public and
  // token-addressed, so the textarea's cap is a convenience for the student and
  // proves nothing about what arrives.
  //
  // ⚠️ Capped rather than rejected, for the same reason makes are clamped above:
  // `note` rides the same INSERT as `amount` and `makes`, so letting an
  // over-length note hit logs_note_length_check would fail the whole row and
  // lose reps the student actually did. The constraint is the backstop; it must
  // never be the thing that stops a note.
  //
  // Sliced by code point to match char_length, and "" collapses to null — an
  // empty string would be a second spelling of "no note" that every reader
  // keying on `note IS NOT NULL` would mistake for a real one.
  const trimmedNote = typeof note === "string" ? note.trim() : "";
  const safeNote = trimmedNote === "" ? null : [...trimmedNote].slice(0, NOTE_MAX).join("");

  const supabase = await createClient();

  // The player's assignments, read BEFORE the insert so this one query serves
  // two purposes: the snapshot copied onto the new log row, and the completion
  // check further down. It used to run after the insert alongside the logs read;
  // moving it up costs no extra round trip, it just changes when it happens.
  //
  // Widened beyond what the completion check needs (id, target, goal_type) to
  // carry the snapshot fields too.
  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, exercise_name, unit, goal_type, target, side")
    .eq("player_id", playerId);

  const list = assignments ?? [];

  // ⚠️ The snapshot MUST come from this server-side read, never from arguments.
  // This page is public and token-addressed, so a crafted request that supplied
  // its own exercise_name/target/goal_type could write anything it liked into
  // permanent history. saveLog therefore takes no snapshot parameters at all —
  // the only way in is the row the DB just handed us.
  //
  // Scoped to the player, so this also establishes that the assignment really
  // belongs to them. Previously the insert leaned on the foreign key alone,
  // which proves the assignment EXISTS but not whose it is.
  const assignment = list.find((a) => a.id === assignmentId);
  if (!assignment) return { ok: false, error: "Assignment not found." };

  const { error } = await supabase.from("logs").insert({
    player_id: playerId,
    assignment_id: assignmentId,
    amount,
    makes: safeMakes,
    // The student's own words about this session. Unlike the snapshot fields
    // below, this genuinely does come from the client — it is what they typed,
    // and there is nowhere else it could come from. It is sanitised above rather
    // than trusted.
    note: safeNote,
    // Written once, at the moment the work was logged, and never updated after.
    // That is the whole point: if the assignment is later edited or deleted,
    // this row still says what the student actually did.
    exercise_name: assignment.exercise_name,
    unit: assignment.unit,
    goal_type: assignment.goal_type ?? "reps",
    target: assignment.target,
    side: assignment.side ?? null,
  });

  if (error) return { ok: false, error: error.message };

  // Is every assignment for this player now complete? (Drives the celebrate
  // confetti — signals the whole list is finished, not just this one.)
  // goal_type and makes are both needed: a makes goal is scored on makes, so
  // summing amount alone would call it done as soon as the attempts landed.
  //
  // Logs are read AFTER the insert, and have to be: the check is only correct
  // if it can see the row just written. That is why this read stayed put while
  // the assignments read moved above.
  const { data: allLogs } = await supabase
    .from("logs")
    .select("assignment_id, amount, makes")
    .eq("player_id", playerId);
  const loggedByAssignment: Record<string, number> = {};
  const makesByAssignment: Record<string, number> = {};
  for (const l of allLogs ?? []) {
    if (!l.assignment_id) continue;
    loggedByAssignment[l.assignment_id] = (loggedByAssignment[l.assignment_id] ?? 0) + l.amount;
    if (l.makes == null) continue;
    makesByAssignment[l.assignment_id] = (makesByAssignment[l.assignment_id] ?? 0) + l.makes;
  }
  // `list` is the same read used for the snapshot above — it is the player's
  // full assignment list, which is exactly what this check needs.
  const allDone =
    list.length > 0 &&
    list.every((a) =>
      isComplete(
        (a.goal_type ?? "reps") as GoalType,
        a.target,
        loggedByAssignment[a.id] ?? 0,
        makesByAssignment[a.id] ?? 0,
      ),
    );

  return { ok: true, allDone };
}
