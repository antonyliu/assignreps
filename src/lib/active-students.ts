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
