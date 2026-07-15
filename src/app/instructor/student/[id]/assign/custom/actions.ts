"use server";

import { createClient } from "@/lib/supabase-server";
import type { Unit } from "@/lib/exercises";

export type SaveCustomResult = { ok: true } | { ok: false; error: string };

export async function saveCustomAssignment(
  playerId: string,
  exerciseName: string,
  target: number,
  unit: Unit,
): Promise<SaveCustomResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  // Week start = Monday of current week (ISO date)
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  const weekStart = monday.toISOString().split("T")[0];

  const { error } = await supabase.from("assignments").insert({
    coach_id: user.id,
    player_id: playerId,
    exercise_name: exerciseName,
    target,
    unit,
    week_start: weekStart,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
