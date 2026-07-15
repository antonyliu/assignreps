"use server";

import { createClient } from "@/lib/supabase-server";

export type SaveLogResult = { ok: true } | { ok: false; error: string };

export async function saveLog(
  playerId: string,
  assignmentId: string,
  amount: number,
): Promise<SaveLogResult> {
  if (amount < 1) return { ok: false, error: "Nothing to save." };

  const supabase = await createClient();
  const { error } = await supabase.from("logs").insert({
    player_id: playerId,
    assignment_id: assignmentId,
    amount,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
