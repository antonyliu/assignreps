"use server";

import { createClient } from "@/lib/supabase-server";
import { notifyAssignmentOnce } from "@/lib/notify-assignment";
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

  // Save this as a reusable custom exercise for the coach's "My exercises"
  // list, deduped by name. Best-effort: never block the assignment on it.
  const { data: existing } = await supabase
    .from("custom_exercises")
    .select("id")
    .eq("coach_id", user.id)
    .eq("name", exerciseName)
    .maybeSingle();
  if (!existing) {
    await supabase.from("custom_exercises").insert({
      coach_id: user.id,
      name: exerciseName,
      unit,
      default_amount: target,
    });
  }

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
    // Create-your-own has no category to infer from, so makes stay off. A coach
    // who wants them can enable it next time from "My exercises", which runs
    // through the count screen and its toggle.
    track_makes: false,
  });

  if (error) return { ok: false, error: error.message };

  // Best-effort: tell the student new work landed, at most once per LA day.
  // Runs only after the insert succeeded, and never fails the save.
  await notifyAssignmentOnce(supabase, user.id, playerId);

  return { ok: true };
}
