"use server";

import { createClient } from "@/lib/supabase-server";
import { getActivityLabels } from "@/config/activityTypes";
import { activeStudentLimit, isEntitled, PRO_STUDENT_LIMIT } from "@/lib/entitlement";
import { countActiveStudents } from "@/lib/active-students";

export type AddPlayerResult =
  | { ok: true }
  // `code` lets the caller tell a seat limit apart from "that didn't save".
  // They are different situations and deserve different UI: a red validation
  // box reads as "you typed something wrong", which is exactly what a coach at
  // their limit did NOT do.
  //
  // ⚠️ TWO limit codes, not one, because they are two different dead ends.
  // `limit_reached` is the free-tier paywall and has an upgrade to offer.
  // `ceiling_reached` is a Pro coach at PRO_STUDENT_LIMIT, who has already paid
  // and has no higher plan to buy — showing them an upgrade button would be a
  // lie dressed as a solution. The move that works for them is deactivating
  // someone, so the UI has to be able to tell the two apart.
  | { ok: false; error: string; code?: "limit_reached" | "ceiling_reached" };

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
  //
  // subscription_status and instructor_type ride along on a query that already
  // runs, so the paywall below costs no extra round trip.
  const { data: coach } = await supabase
    .from("coaches")
    .select("id, instructor_type, subscription_status")
    .eq("id", user.id)
    .single();

  if (!coach) return { ok: false, error: "Finish signing up before adding players." };

  // ⚠️ THE PAYWALL, and it lives here rather than only on the page for the same
  // reason createCheckoutSession() carries its own already-subscribed guard and
  // fileFinishedAssignments() computes its own set: an action establishes its
  // own preconditions instead of borrowing them from whatever rendered its
  // button. The page-level check below this file is convenience — it stops a
  // blocked coach filling in a form they cannot submit. It is not protection.
  // A stale tab, a direct invocation, or a second device all arrive here with
  // no page gate in front of them.
  //
  // activeStudentLimit() rather than a status-string comparison, so this, the
  // "Upgrade to Pro" menu item and the reactivate gate can never disagree about
  // who is paying or about what their plan allows.
  //
  // ⚠️ The count now runs for EVERY coach, not just unentitled ones. Pro used to
  // have no ceiling in code at all, so a Pro coach never paid for this query;
  // "up to 30" was copy on three surfaces with nothing behind it. Pro now has a
  // real limit, so the question "do you have room?" has to be asked of everyone.
  const limit = activeStudentLimit(coach.subscription_status);

  // Counted server-side, never accepted from the client — the same rule as
  // Assign again taking only an id.
  //
  // ⚠️ ACTIVE students, not all students. A deactivated student is a full pause
  // and consumes no seat, so a coach at their ceiling can deactivate someone to
  // free up a spot rather than deleting them and destroying their history.
  const count = await countActiveStudents(supabase, user.id);

  // ⚠️ FAILS CLOSED, matching isEntitled(). A null count is "couldn't read it",
  // never "zero students": `count ?? 0` would wave the coach straight through
  // the paywall on a transient hiccup. Blocking costs a retry; the other way
  // round gives away paid capacity silently, which is the failure nobody would
  // notice.
  if (count === null) {
    return { ok: false, error: "Couldn't check your plan just now. Try again." };
  }

  if (count >= limit) {
    const labels = getActivityLabels(coach.instructor_type ?? null);

    // ⚠️ Two different dead ends, and they must not read alike. An unentitled
    // coach has somewhere to go — upgrading raises the ceiling — so they get the
    // paywall via `limit_reached`. A Pro coach at 30 has no upgrade to sell;
    // pointing them at one would be a lie, so they get a plain error naming the
    // move that actually works: deactivate someone.
    if (!isEntitled(coach.subscription_status)) {
      return {
        ok: false,
        code: "limit_reached",
        error: `Your free plan covers ${limit} active ${labels.studentsLabel}. Upgrade to Pro to add more.`,
      };
    }

    return {
      ok: false,
      code: "ceiling_reached",
      error: `Pro covers ${PRO_STUDENT_LIMIT} active ${labels.studentsLabel}. Deactivate someone to free up a spot.`,
    };
  }

  // ⚠️ Known and accepted: the count above and the insert below are not one
  // atomic operation, so two submits racing each other could both pass and land
  // a 4th and 5th player. Closing it properly means a database trigger, and a
  // migration here hits local, staging and prod at once (one shared Supabase
  // project). The cost of the gap is one extra free player for one coach — not
  // a security hole and not meaningful revenue at this scale. Deliberately left
  // as-is; revisit if the free tier ever guards something expensive.

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
