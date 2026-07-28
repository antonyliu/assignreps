"use server";

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { isComplete } from "@/lib/exercises";
import type { GoalType } from "@/lib/exercises";
import { notifyRepeatAssignment } from "@/lib/notify-assignment";

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

export type FileAssignmentResult = { ok: true } | { ok: false; error: string };

// Move one card between the two tabs. `filed_at` alone decides tab membership:
// null = New, set = Logged. Completion is not consulted here at all.
//
// Both directions are the same one-line update in opposite directions, and both
// are fully reversible — which is why neither carries a confirm dialog, and why
// neither re-derives completion server-side the way repeatAssignment does. A
// mis-tap from a stale page files (or unfiles) one card and is undone by the
// opposite tap; nothing is deleted and no history moves. Ownership scoping is
// the part that does matter, and it is present on both.
async function setFiledAt(
  assignmentId: string,
  value: string | null,
): Promise<FileAssignmentResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("assignments")
    .update({ filed_at: value })
    .eq("id", assignmentId)
    .eq("coach_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** New → Logged. Stamps when the coach filed it. */
export async function moveAssignmentToLogged(assignmentId: string): Promise<FileAssignmentResult> {
  return setFiledAt(assignmentId, new Date().toISOString());
}

/** Logged → New. Clears the stamp; the card returns to the working list. */
export async function moveAssignmentToNew(assignmentId: string): Promise<FileAssignmentResult> {
  return setFiledAt(assignmentId, null);
}

export type FileFinishedResult = { ok: true; moved: number } | { ok: false; error: string };

// The bulk action under the all-done banner. Replaces clearCompletedAssignments,
// which DELETED the finished rows outright — this moves them instead, so the
// assignments (and the meaning of every log pointing at them) survive.
//
// ⚠️ The set is still computed here rather than inherited from whatever rendered
// the button. That was the whole lesson of the delete version: the control only
// appears when everything is complete, so "all" and "all complete" looked
// identical until a stale page or a direct call pulled them apart. Filing is far
// gentler than deleting, but an action still has to establish its own
// preconditions — so this touches only rows that are genuinely finished AND
// genuinely still in New.
//
// Completion can't be a WHERE clause: `target` means something different per
// goal_type and consecutive ignores it entirely, so the rows come back into
// TypeScript and through isComplete(), the same rule every other call site uses.
export async function fileFinishedAssignments(playerId: string): Promise<FileFinishedResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  // Only unfiled rows are candidates — anything already in Logged is where it
  // belongs and must not have its original filing timestamp overwritten.
  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, target, goal_type")
    .eq("player_id", playerId)
    .eq("coach_id", user.id)
    .is("filed_at", null);

  const list = assignments ?? [];
  if (list.length === 0) return { ok: true, moved: 0 };

  const { data: logs } = await supabase
    .from("logs")
    .select("assignment_id, amount, makes")
    .in("assignment_id", list.map((a) => a.id));

  // Same aggregation as every other completion site: a null assignment_id is an
  // orphaned log belonging to nothing, and a null `makes` is "didn't say" —
  // counting it as 0 would hold a makes goal permanently incomplete.
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

  // Nothing finished and unfiled — no write at all. `.in("id", [])` would be a
  // no-op round trip, but an empty set is a real state worth naming.
  if (completeIds.length === 0) return { ok: true, moved: 0 };

  // One timestamp for the batch, so a bulk file reads as a single act rather
  // than as N cards filed milliseconds apart.
  const { error } = await supabase
    .from("assignments")
    .update({ filed_at: new Date().toISOString() })
    .in("id", completeIds)
    .eq("player_id", playerId)
    .eq("coach_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, moved: completeIds.length };
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

export type RepeatAssignmentResult = { ok: true } | { ok: false; error: string };

// Re-assign a finished piece of work: insert a NEW assignment row carrying the
// same exercise, and leave the original completely alone.
//
// Deliberately an insert, never an edit or a "reset". The finished assignment is
// the record that the work was done — its logs point at it, and (since July 27)
// carry their own snapshot of it. Reopening the original by clearing its logs
// would destroy that history to save a row.
export async function repeatAssignment(assignmentId: string): Promise<RepeatAssignmentResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  // Every copied field comes from the stored row. The client sends an id and
  // nothing else, so a crafted request cannot mint an assignment with values the
  // coach never chose — same rule saveLog follows for the log snapshot. The
  // coach_id filter makes this ownership-scoped in the same round trip.
  const { data: original } = await supabase
    .from("assignments")
    .select("id, player_id, exercise_name, target, unit, goal_type, side, video_url, track_makes")
    .eq("id", assignmentId)
    .eq("coach_id", user.id)
    .single();

  if (!original) return { ok: false, error: "Assignment not found." };

  // ⚠️ Completion is re-established HERE, not inherited from the fact that the
  // menu only draws "Assign again" on a finished card. A render-time gate is not a
  // precondition: the coach can be holding a stale page (loaded when the work
  // was done, since cleared or added to), and the action is reachable directly
  // regardless of what any UI drew. Same lesson as clearCompletedAssignments.
  const { data: logs } = await supabase
    .from("logs")
    .select("amount, makes")
    .eq("assignment_id", assignmentId);

  const logged = (logs ?? []).reduce((sum, l) => sum + l.amount, 0);
  // Null makes are "didn't say", not zero — same aggregation every other
  // completion site uses, so this can't disagree with them.
  const makes = (logs ?? []).reduce((sum, l) => sum + (l.makes ?? 0), 0);
  const goalType = (original.goal_type ?? "reps") as GoalType;

  if (!isComplete(goalType, original.target, logged, makes)) {
    return { ok: false, error: "That assignment isn't finished yet." };
  }

  // Week start = Monday of current week (ISO date). Same derivation as both
  // assign actions — the repeat lands in the CURRENT week, not the original's.
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  const weekStart = monday.toISOString().split("T")[0];

  // created_at is left to the column default, so the new row is stamped now and
  // sorts to the bottom of the player's list like any freshly assigned work.
  const { error } = await supabase.from("assignments").insert({
    coach_id: user.id,
    player_id: original.player_id,
    exercise_name: original.exercise_name,
    target: original.target,
    unit: original.unit,
    goal_type: goalType,
    side: original.side ?? null,
    video_url: original.video_url ?? null,
    track_makes: original.track_makes ?? false,
    week_start: weekStart,
  });

  if (error) return { ok: false, error: error.message };

  // Always texts, unlike the two assign paths. A repeat is one deliberate
  // decision about one piece of work, not part of a setup batch, so the
  // once-per-LA-day gate must not swallow it. This send is also not recorded
  // against that gate — a separate assignment made later the same day still
  // notifies normally. See notifyRepeatAssignment.
  await notifyRepeatAssignment(supabase, user.id, original.player_id);

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
