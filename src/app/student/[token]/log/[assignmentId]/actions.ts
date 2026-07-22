"use server";

import { createClient } from "@/lib/supabase-server";

export type SaveLogResult = { ok: true; allDone: boolean } | { ok: false; error: string };

export async function saveLog(
  playerId: string,
  assignmentId: string,
  amount: number,
  makes: number | null = null,
): Promise<SaveLogResult> {
  if (amount < 1) return { ok: false, error: "Nothing to save." };

  // Null stays null — "didn't say" is a real answer and must not collapse to 0.
  // Negatives are clamped rather than rejected: the DB check would fail the whole
  // insert and lose the reps the student actually did.
  const safeMakes = makes === null || Number.isNaN(makes) ? null : Math.max(0, Math.round(makes));

  const supabase = await createClient();
  const { error } = await supabase.from("logs").insert({
    player_id: playerId,
    assignment_id: assignmentId,
    amount,
    makes: safeMakes,
  });

  if (error) return { ok: false, error: error.message };

  // Is every assignment for this player now complete? (Drives the celebrate
  // confetti — signals the whole list is finished, not just this one.)
  const [{ data: assignments }, { data: allLogs }] = await Promise.all([
    supabase.from("assignments").select("id, target").eq("player_id", playerId),
    supabase.from("logs").select("assignment_id, amount").eq("player_id", playerId),
  ]);
  const loggedByAssignment: Record<string, number> = {};
  for (const l of allLogs ?? []) {
    if (!l.assignment_id) continue;
    loggedByAssignment[l.assignment_id] = (loggedByAssignment[l.assignment_id] ?? 0) + l.amount;
  }
  const list = assignments ?? [];
  const allDone = list.length > 0 && list.every((a) => (loggedByAssignment[a.id] ?? 0) >= a.target);

  return { ok: true, allDone };
}
