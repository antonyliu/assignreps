import type { createClient } from "@/lib/supabase-server";
import { sendSms } from "@/lib/sms";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

// "Today" as a calendar date in the coach's operating timezone.
//
// We compare LA calendar dates rather than elapsed hours so a 5pm and an 8pm
// assignment count as the same day — plain UTC would roll over mid-evening in
// California and split them. en-CA formats as YYYY-MM-DD, so string equality is
// a safe date comparison, and Intl resolves PST/PDT itself (no offset math).
const LA_DATE = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" });

function laDate(value: Date): string {
  return LA_DATE.format(value);
}

type NotifiablePlayer = {
  name: string;
  phone: string | null;
  token: string;
  last_texted_at: string | null;
};

// The student's row, ownership-scoped. Split out so both notify paths resolve
// the recipient identically — and so the gated path can still decide whether to
// send BEFORE paying for the coach lookup below.
async function loadPlayer(
  supabase: ServerClient,
  coachId: string,
  playerId: string
): Promise<NotifiablePlayer | null> {
  const { data } = await supabase
    .from("players")
    .select("name, phone, token, last_texted_at")
    .eq("id", playerId)
    .eq("coach_id", coachId)
    .single();

  return data ?? null;
}

// One wording for every assignment notification, whichever path sends it. A
// repeat is still "new work landed", so it reads identically to a first
// assignment — kept in one place so the two can't drift apart.
//
// The message has to work as a first touch as well as a follow-up, since nothing
// is sent when a student is added. Falls back to generic wording when
// instructor_type is null/empty.
async function composeBody(
  supabase: ServerClient,
  coachId: string,
  player: NotifiablePlayer
): Promise<string> {
  const { data: coach } = await supabase
    .from("coaches")
    .select("name, instructor_type")
    .eq("id", coachId)
    .single();

  const coachName = coach?.name ?? "Coach";
  const activityType = coach?.instructor_type?.trim().replace(/_/g, " ");
  const link = `https://assignreps.com/student/${player.token}`;
  return activityType
    ? `Hey ${player.name} — ${coachName} assigned you ${activityType} homework. Tap here: ${link}`
    : `Hey ${player.name} — ${coachName} assigned you homework. Tap here: ${link}`;
}

// Text the student that new work was assigned — at most once per student per
// Los Angeles day. Used by the two assign flows, where a coach setting up a
// session may add several drills in a row and should not fire a text each time.
//
// Best-effort and deliberately silent: every failure (lookup, Twilio, or the
// bookkeeping write) is swallowed so a notification problem can never fail the
// assignment that was just saved successfully.
//
// Always sends to players.phone. send_to_parent is intentionally NOT consulted
// yet — the recipient toggle governs whose number was typed into that field.
export async function notifyAssignmentOnce(
  supabase: ServerClient,
  coachId: string,
  playerId: string
): Promise<void> {
  try {
    const player = await loadPlayer(supabase, coachId, playerId);
    if (!player?.phone) return;

    // Already texted today (LA) → nothing to do. Checked before composeBody so
    // the blocked path still costs exactly one query, as it always has.
    if (
      player.last_texted_at &&
      laDate(new Date(player.last_texted_at)) === laDate(new Date())
    ) {
      return;
    }

    const body = await composeBody(supabase, coachId, player);
    const sent = await sendSms(player.phone, body);

    // Record the send only on success, so a Twilio outage doesn't silently burn
    // the student's one text for the day — the next assignment retries instead.
    if (sent) {
      await supabase
        .from("players")
        .update({ last_texted_at: new Date().toISOString() })
        .eq("id", playerId)
        .eq("coach_id", coachId);
    }
  } catch {
    // Never surface notification problems to the assign flow.
  }
}

// Text the student that a finished assignment was set again — ALWAYS, with no
// daily gate.
//
// The gate on notifyAssignmentOnce exists to stop one setup session from firing
// five texts while a coach adds five drills. A repeat is the opposite shape: a
// single deliberate decision, taken about one specific piece of work, usually
// days after the original. Swallowing it because something else was assigned
// that morning would mean the student is never told the work came back.
//
// ⚠️ Deliberately does NOT write last_texted_at. Recording this send would let a
// repeat consume the day's allowance and silence a genuinely separate assignment
// made later the same day. The two are meant to be independent, so this path
// reads no gate and moves no gate.
//
// The cost of that independence: last_texted_at now means "last GATED assignment
// notification", not "last time we texted this student at all" — a repeat leaves
// no trace on the row. Nothing reads the column for anything else today, but
// anything that later wants a true last-contact timestamp needs its own field
// rather than this one.
//
// Best-effort and silent on failure, same as the gated path — a repeat that was
// already written to the database must not fail because Twilio was down.
export async function notifyRepeatAssignment(
  supabase: ServerClient,
  coachId: string,
  playerId: string
): Promise<void> {
  try {
    const player = await loadPlayer(supabase, coachId, playerId);
    if (!player?.phone) return;

    const body = await composeBody(supabase, coachId, player);
    await sendSms(player.phone, body);
  } catch {
    // Never surface notification problems to the repeat flow.
  }
}
