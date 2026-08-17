"use server";

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { isComplete } from "@/lib/exercises";
import type { GoalType } from "@/lib/exercises";
import { notifyRepeatAssignment } from "@/lib/notify-assignment";
import { getActivityLabels } from "@/config/activityTypes";
import { activeStudentLimit, isEntitled, PRO_STUDENT_LIMIT } from "@/lib/entitlement";
import { countActiveStudents, requireActivePlayer } from "@/lib/active-students";

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

export type SetPlayerActiveResult =
  | { ok: true }
  // Same two-code shape as AddPlayerResult, for the same reason: reactivating
  // and adding are the same question asked from two directions — "does this
  // coach have room for one more active student?" — so they must fail in the
  // same vocabulary. `limit_reached` has an upgrade to offer; `ceiling_reached`
  // is a Pro coach at PRO_STUDENT_LIMIT, who does not.
  | { ok: false; error: string; code?: "limit_reached" | "ceiling_reached" };

/**
 * Pause a student. Sets players.deactivated_at, and nothing else.
 *
 * ⚠️ TOUCHES NO DATA. No assignment is deleted, moved or filed; no log is
 * touched. Everything the student has ever done is still there and comes back
 * untouched on activation. This is the safe path that permanent delete never
 * had, which is the whole reason it exists.
 *
 * ⚠️ Deactivating is NEVER gated. It only ever frees a seat, so there is no
 * limit it could violate and nothing to check — the asymmetry with
 * activatePlayer() below is deliberate, not an oversight. It is also a coach's
 * escape hatch when they are over their ceiling after a downgrade, and gating
 * the escape hatch would trap them.
 *
 * No confirm is enforced here; the modal does that. This is fully reversible in
 * one tap the other way — the same reasoning that leaves setFiledAt() undialogued.
 */
export async function deactivatePlayer(playerId: string): Promise<SetPlayerActiveResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("players")
    .update({ deactivated_at: new Date().toISOString() })
    .eq("id", playerId)
    .eq("coach_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Bring a paused student back — and RE-CHECK THE SEAT GATE on the way.
 *
 * ⚠️ This is the half that makes deactivation safe for billing. Without it, a
 * Pro coach could add 30 students, cancel, and keep all 30 running on Free
 * forever: nothing else in the app re-examines the active count after a
 * downgrade. Activation is the only moment a student re-enters the count, so it
 * is the only place that gate can be applied.
 *
 * ⚠️ Asks activeStudentLimit(), the same helper addPlayer() asks, so the two can
 * never disagree about what a plan allows. A coach blocked from reactivating
 * someone they could have added fresh is one bug seen from two ends.
 *
 * ⚠️ FAILS CLOSED on an unreadable count, matching addPlayer(). Letting an
 * activation through on a transient hiccup is exactly the silent give-away of
 * paid capacity the add gate refuses to make.
 */
export async function activatePlayer(playerId: string): Promise<SetPlayerActiveResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { data: coach } = await supabase
    .from("coaches")
    .select("id, instructor_type, subscription_status")
    .eq("id", user.id)
    .single();

  if (!coach) return { ok: false, error: "Finish signing up first." };

  const limit = activeStudentLimit(coach.subscription_status);
  const count = await countActiveStudents(supabase, user.id);

  if (count === null) {
    return { ok: false, error: "Couldn't check your plan just now. Try again." };
  }

  // ⚠️ `>=`, not `>`. The student being activated is currently INACTIVE, so they
  // are not in this count — a coach already at the limit would land one over it.
  if (count >= limit) {
    const labels = getActivityLabels(coach.instructor_type ?? null);

    if (!isEntitled(coach.subscription_status)) {
      return {
        ok: false,
        code: "limit_reached",
        error: `Your free plan covers ${limit} active ${labels.studentsLabel}. Upgrade to Pro, or deactivate someone else first.`,
      };
    }

    return {
      ok: false,
      code: "ceiling_reached",
      error: `Pro covers ${PRO_STUDENT_LIMIT} active ${labels.studentsLabel}. Deactivate someone else to make room.`,
    };
  }

  const { error } = await supabase
    .from("players")
    .update({ deactivated_at: null })
    .eq("id", playerId)
    .eq("coach_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
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
// null = New, set = Archive. Completion is not consulted here at all.
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

/** New → Archive. Stamps when the coach filed it. */
export async function moveAssignmentToLogged(assignmentId: string): Promise<FileAssignmentResult> {
  return setFiledAt(assignmentId, new Date().toISOString());
}

/** Archive → New. Clears the stamp; the card returns to the working list. */
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

  // Only unfiled rows are candidates — anything already in Archive is where it
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

  // ⚠️ A repeat CREATES NEW WORK, so it is an assign path and carries the same
  // pause check the two assign actions do. The card's menu is hidden for an
  // inactive student, but a stale tab or a direct call arrives with no page gate
  // in front of it — the same lesson this file already learned twice, at
  // fileFinishedAssignments() and at the completion re-check just below.
  //
  // Above the completion check on purpose: being paused is the cheaper and more
  // fundamental refusal, and it also stops the SMS at the end of this function
  // firing at a student the coach has explicitly paused.
  const active = await requireActivePlayer(supabase, user.id, original.player_id);
  if (!active.ok) return { ok: false, error: active.error };

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
      .select("name, phone, token, deactivated_at")
      .eq("id", playerId)
      .eq("coach_id", user.id)
      .single(),
    supabase.from("coaches").select("name").eq("id", user.id).single(),
  ]);

  if (!player) return { ok: false, error: "Student not found." };

  // A paused student should not be texted their link — the link still opens, but
  // it shows "ask your coach to activate you", so sending it would be an
  // invitation to a dead end.
  if (player.deactivated_at) {
    const first = player.name?.trim().split(/\s+/)[0] || "That student";
    return { ok: false, error: `${first} is deactivated. Activate them first.` };
  }

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
