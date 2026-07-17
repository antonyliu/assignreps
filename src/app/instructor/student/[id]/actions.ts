"use server";

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export async function deletePlayer(playerId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/instructor");

  // Verify ownership before deleting
  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("id", playerId)
    .eq("coach_id", user.id)
    .single();

  if (!player) return;

  await supabase.from("players").delete().eq("id", playerId);
  redirect("/instructor/students");
}

export type UpdatePlayerResult = { ok: true } | { ok: false; error: string };

export async function updatePlayerPhone(
  playerId: string,
  phone: string,
  sendToParent: boolean
): Promise<UpdatePlayerResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("players")
    .update({ phone, send_to_parent: sendToParent })
    .eq("id", playerId)
    .eq("coach_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export type ClearAssignmentsResult = { ok: true } | { ok: false; error: string };

export async function clearCompletedAssignments(playerId: string): Promise<ClearAssignmentsResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  // Clears the player's entire assignment list, scoped to this coach's own
  // player. logs.assignment_id is ON DELETE SET NULL, so the logs (progress)
  // are preserved — only the assignment rows are removed.
  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("player_id", playerId)
    .eq("coach_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export type DeleteAssignmentResult = { ok: true } | { ok: false; error: string };

export async function deleteAssignment(assignmentId: string): Promise<DeleteAssignmentResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  // Scoped to this coach's own assignment. logs.assignment_id is ON DELETE
  // SET NULL, so the student's logged progress is preserved, not deleted.
  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", assignmentId)
    .eq("coach_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export type ResendLinkResult = { ok: true } | { ok: false; error: string };

export async function resendPlayerLink(playerId: string): Promise<ResendLinkResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const [{ data: player }, { data: coach }] = await Promise.all([
    supabase
      .from("players")
      .select("name, phone, token")
      .eq("id", playerId)
      .eq("coach_id", user.id)
      .single(),
    supabase.from("coaches").select("name").eq("id", user.id).single(),
  ]);

  if (!player) return { ok: false, error: "Student not found." };

  const coachName = coach?.name ?? "Coach";
  const smsBody = `Hey ${player.name} — ${coachName} assigned you work. Tap here: https://assignreps.com/student/${player.token}`;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (accountSid && authToken && messagingServiceSid) {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const res = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        MessagingServiceSid: messagingServiceSid,
        To: player.phone,
        Body: smsBody,
      }),
    });

    if (!res.ok) {
      // Log the failure without the recipient number or message body.
      console.error("Resend SMS failed to send", { status: res.status });
      return { ok: false, error: "SMS failed to send." };
    }
  } else {
    // Twilio not configured (local dev). Don't log the phone or message body.
    console.warn("Twilio not configured — SMS skipped");
  }

  return { ok: true };
}
