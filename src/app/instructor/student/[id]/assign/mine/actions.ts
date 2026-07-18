"use server";

import { createClient } from "@/lib/supabase-server";

export type DeleteCustomExerciseResult = { ok: true } | { ok: false; error: string };

export async function deleteCustomExercise(id: string): Promise<DeleteCustomExerciseResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  // Ownership-scoped. Only removes the saved exercise — existing assignments
  // store the name/target as their own rows and are unaffected.
  const { error } = await supabase
    .from("custom_exercises")
    .delete()
    .eq("id", id)
    .eq("coach_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
