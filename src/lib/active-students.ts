import { redirect } from "next/navigation";
import { activeStudentLimit, isEntitled } from "@/lib/entitlement";
import type { createClient } from "@/lib/supabase-server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * How many ACTIVE students this coach has.
 *
 * ⚠️ Returns null for "couldn't read it", which is NOT the same as 0 and must
 * never be flattened into one with `?? 0`. Every caller here is a seat gate, and
 * reading "we don't know" as "zero students" waves a coach straight past the
 * paywall on a transient hiccup — the failure nobody would ever notice. The
 * callers FAIL CLOSED on null, matching isEntitled() and the original
 * addPlayer() count this replaces.
 *
 * ⚠️ `.is("deactivated_at", null)` is what makes this an ACTIVE count rather
 * than a total. It is the single line that closes the downgrade loophole: a Pro
 * coach with 30 students who cancels is over the free limit, and deactivating
 * back down to 3 is how they get legal again. Drop the filter and a paused
 * student silently consumes a seat, which contradicts every screen that calls
 * them inactive.
 *
 * head: true asks Postgres for the count without shipping any rows back.
 */
export async function countActiveStudents(
  supabase: ServerClient,
  coachId: string
): Promise<number | null> {
  const { count, error } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("coach_id", coachId)
    .is("deactivated_at", null);

  if (error || count === null) return null;
  return count;
}

export type ActivePlayerCheck = { ok: true } | { ok: false; error: string };

/**
 * Is this coach's student active enough to receive new work?
 *
 * ⚠️ An ENFORCEMENT read, not a convenience one. The assign screens hide their
 * controls for a paused student, but a stale tab, a second device or a direct
 * invocation of the action all arrive with no page gate in front of them — the
 * same lesson addPlayer(), createCheckoutSession() and fileFinishedAssignments()
 * each learned separately. Every write path that creates work for a student
 * calls this itself.
 *
 * Ownership-scoped by coach_id in the same round trip, so a missing row means
 * "not yours or not there" and is refused either way.
 *
 * ⚠️ FAILS CLOSED. A read that returns nothing blocks rather than proceeding:
 * assigning work to a paused student is the exact thing this exists to stop, and
 * a retry costs a coach one tap.
 */
export async function requireActivePlayer(
  supabase: ServerClient,
  coachId: string,
  playerId: string
): Promise<ActivePlayerCheck> {
  const { data: player } = await supabase
    .from("players")
    .select("name, deactivated_at")
    .eq("id", playerId)
    .eq("coach_id", coachId)
    .single();

  if (!player) return { ok: false, error: "Student not found." };

  if (player.deactivated_at) {
    const firstName = player.name?.trim().split(/\s+/)[0] || "That student";
    return {
      ok: false,
      error: `${firstName} is deactivated. Activate them to assign new work.`,
    };
  }

  return { ok: true };
}

/**
 * Is this coach OVER their plan's active-student limit right now?
 *
 * ⚠️ THE OPERATOR IS `>`, NOT `>=`, and that is the one thing here most likely
 * to be "corrected" into a bug. addPlayer() blocks on `count >= limit` because
 * adding needs room for ONE MORE. Assigning only needs the roster to be WITHIN
 * the limit, so a Free coach sitting at exactly 3 active can still assign to all
 * three — they simply cannot add a fourth. Same helper, deliberately different
 * comparison.
 *
 * ⚠️ FAILS OPEN on an unreadable count, which is the opposite of addPlayer().
 * That asymmetry is deliberate: this gate freezes work for a coach who has
 * already paid up to this point, and wrongly freezing a compliant coach on a
 * transient hiccup is worse than briefly letting an over-limit one assign. The
 * add gate guards new capacity and fails closed; this one guards existing
 * capacity and fails open.
 */
export async function accountOverLimit(
  supabase: ServerClient,
  coachId: string
): Promise<{ over: boolean; count: number; limit: number; entitled: boolean }> {
  const [{ data: coach }, count] = await Promise.all([
    supabase.from("coaches").select("subscription_status").eq("id", coachId).single(),
    countActiveStudents(supabase, coachId),
  ]);

  const status = coach?.subscription_status ?? null;
  const limit = activeStudentLimit(status);
  const entitled = isEntitled(status);

  if (count === null) return { over: false, count: 0, limit, entitled };
  return { over: count > limit, count, limit, entitled };
}

export type CanAssignCheck =
  | { ok: true }
  | { ok: false; error: string; code: "student_paused" | "over_limit" | "over_ceiling" };

/**
 * May this coach create new work for this student, right now?
 *
 * Two independent reasons it can be no, and they are NOT the same thing:
 *
 *   1. `student_paused`  — THIS student is deactivated. Blocks assigning AND
 *                          logging, for them alone.
 *   2. `over_limit`      — the ACCOUNT has more active students than the plan
 *                          allows. Blocks assigning for EVERY student, and
 *                          blocks logging for nobody. saveLog never reads plan
 *                          state at all, which is what keeps that true.
 *
 * ⚠️ The student check WINS when both apply. It is the more specific fact about
 * the student the coach is looking at, and it stays true after the limit is
 * fixed — so leading with the account message would send them to solve the
 * wrong problem first.
 *
 * ⚠️ `over_ceiling` is a Pro coach past PRO_STUDENT_LIMIT. Split from
 * `over_limit` for the same reason AddPlayerResult splits them: there is no
 * higher plan to sell, so offering an upgrade would be a lie dressed as a fix.
 *
 * The two reads run in PARALLEL and are mutually independent, so this costs no
 * more latency than the single per-student check it replaces.
 */
export async function requireCanAssign(
  supabase: ServerClient,
  coachId: string,
  playerId: string
): Promise<CanAssignCheck> {
  const [player, account] = await Promise.all([
    requireActivePlayer(supabase, coachId, playerId),
    accountOverLimit(supabase, coachId),
  ]);

  if (!player.ok) return { ok: false, error: player.error, code: "student_paused" };

  if (account.over) {
    const tail = account.entitled ? "" : ", or upgrade to Pro";
    return {
      ok: false,
      code: account.entitled ? "over_ceiling" : "over_limit",
      error: `You're over your plan — ${account.count} active students on a limit of ${account.limit}. Deactivate someone to start assigning again${tail}.`,
    };
  }

  return { ok: true };
}

/**
 * The CONVENIENCE gate for the six /assign/* route pages: bounce a coach back to
 * the student's own screen rather than letting them walk a whole picker flow
 * that the action would refuse at the end.
 *
 * ⚠️ NOT protection. requireCanAssign() in each of the three assign actions is
 * what actually enforces this; a stale tab, a second device or a direct
 * invocation all arrive there with no page in front of them.
 *
 * Takes `deactivatedAt` from the player row the caller has ALREADY read, so the
 * per-student half costs no second query. Only the account half hits the
 * database, and only after the cheaper check has passed.
 */
export async function redirectUnlessCanAssign(
  supabase: ServerClient,
  coachId: string,
  playerId: string,
  deactivatedAt: string | null
): Promise<void> {
  if (deactivatedAt) redirect(`/instructor/student/${playerId}`);
  const account = await accountOverLimit(supabase, coachId);
  if (account.over) redirect(`/instructor/student/${playerId}`);
}
