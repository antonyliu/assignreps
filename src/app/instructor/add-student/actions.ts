"use server";

import { createClient } from "@/lib/supabase-server";

export type AddPlayerResult =
  | { ok: true }
  | { ok: false; error: string };

export async function addPlayer(
  name: string,
  phone: string,
  parentPhone: string | null,
  sendToParent: boolean
): Promise<AddPlayerResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  // Profile-completion gate at the mutation layer: an authed user with no
  // coaches row hasn't finished signup and must not create players (matching
  // the requireCoach() gate on the pages; also avoids a raw foreign-key error
  // from players.coach_id -> coaches.id).
  const { data: coach } = await supabase
    .from("coaches")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!coach) return { ok: false, error: "Finish signing up before adding players." };

  const token = crypto.randomUUID();

  const { error: insertError } = await supabase.from("players").insert({
    coach_id: user.id,
    name,
    phone,
    parent_phone: parentPhone,
    send_to_parent: sendToParent,
    token,
  });

  if (insertError) return { ok: false, error: insertError.message };

  // No SMS on add — the student gets their link with the first assignment of
  // the day (see notifyAssignmentOnce).
  return { ok: true };
}
