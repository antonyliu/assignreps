"use server";

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { isComplete } from "@/lib/exercises";
import type { GoalType } from "@/lib/exercises";

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

  // Clears only the assignments this player has actually FINISHED. This used to
  // delete the whole list unfiltered, which was invisible in the normal flow —
  // the "Clear finished" control only renders when every assignment is already
  // complete, so the two sets matched. It diverged on a stale page (assign new
  // work elsewhere, then click the still-rendered button) and under direct
  // invocation of this action, where no such gate applies.
  //
  // Completeness is computed, not stored: `target` means different things per
  // goal_type and consecutive ignores it entirely, so there is no WHERE clause
  // that expresses this. It has to come back into TypeScript and through
  // isComplete() — the same rule the other six call sites use.
  //
  // logs.assignment_id is ON DELETE SET NULL, so the logs (progress) survive
  // here exactly as before; only the assignment rows go.
  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, target, goal_type")
    .eq("player_id", playerId)
    .eq("coach_id", user.id);

  const list = assignments ?? [];
  if (list.length === 0) return { ok: true };

  const { data: logs } = await supabase
    .from("logs")
    .select("assignment_id, amount, makes")
    .in("assignment_id", list.map((a) => a.id));

  // Same aggregation as the roster and saveLog: a null assignment_id is an
  // orphaned log from an already-cleared assignment and belongs to nothing, and
  // a null `makes` is "didn't say" — counting it as 0 would hold a makes goal
  // permanently incomplete.
  const loggedByAssignment: Record<string, number> = {};
  const makesByAssignment: Record<string, number> = {};
  for (const l of logs ?? []) {
    if (!l.assignment_id) continue;
    loggedByAssignment[l.assignment_id] = (loggedByAssignment[l.assignment_id] ?? 0) + l.amount;
    if (l.makes == null) continue;
    makesByAssignment[l.assignment_id] = (makesByAssignment[l.assignment_id] ?? 0) + l.makes;
  }

  const completeIds = list
    .filter((a) =>
      isComplete(
        (a.goal_type ?? "reps") as GoalType,
        a.target,
        loggedByAssignment[a.id] ?? 0,
        makesByAssignment[a.id] ?? 0,
      ),
    )
    .map((a) => a.id);

  // Nothing finished — issue no delete at all. `.in("id", [])` would be a
  // no-op round trip, but an empty list is a real state worth naming.
  if (completeIds.length === 0) return { ok: true };

  const { error } = await supabase
    .from("assignments")
    .delete()
    .in("id", completeIds)
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

export type UpdateAssignmentResult = { ok: true } | { ok: false; error: string };

export async function updateAssignmentTarget(
  assignmentId: string,
  target: number
): Promise<UpdateAssignmentResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };
  if (!Number.isFinite(target) || target < 1) return { ok: false, error: "Enter an amount greater than 0." };

  // Silent correction — updates the target only, no SMS. Ownership-scoped.
  // The UI only offers this when the assignment has no logged progress.
  const { error } = await supabase
    .from("assignments")
    .update({ target })
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
