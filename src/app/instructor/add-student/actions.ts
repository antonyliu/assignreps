"use server";

import { createClient } from "@/lib/supabase-server";
import { getActivityLabels } from "@/config/activityTypes";
import { isEntitled, FREE_STUDENT_LIMIT } from "@/lib/entitlement";

export type AddPlayerResult =
  | { ok: true }
  // `code` lets the caller tell "you hit the paywall" apart from "that didn't
  // save". They are different situations and deserve different UI: a red
  // validation box reads as "you typed something wrong", which is exactly what
  // a coach at the free limit did NOT do.
  | { ok: false; error: string; code?: "limit_reached" };

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
  // isEntitled() rather than a status-string comparison, so this and the
  // "Upgrade to Pro" menu item can never disagree about who is paying.
  if (!isEntitled(coach.subscription_status)) {
    // Counted server-side, never accepted from the client — the same rule as
    // Assign again taking only an id. head: true asks Postgres for the count
    // without shipping any rows back.
    const { count, error: countError } = await supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", user.id);

    // ⚠️ FAILS CLOSED, matching isEntitled(). A null count with no error is
    // treated as a failure too: `count ?? 0` would read "we don't know" as
    // "zero students" and wave the coach straight through the paywall on a
    // transient hiccup. Blocking costs a retry; the other way round gives away
    // paid capacity silently, which is the failure nobody would notice.
    if (countError || count === null) {
      return { ok: false, error: "Couldn't check your plan just now. Try again." };
    }

    if (count >= FREE_STUDENT_LIMIT) {
      const labels = getActivityLabels(coach.instructor_type ?? null);
      return {
        ok: false,
        code: "limit_reached",
        error: `Your free plan covers ${FREE_STUDENT_LIMIT} ${labels.studentsLabel}. Upgrade to Pro to add more.`,
      };
    }
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
