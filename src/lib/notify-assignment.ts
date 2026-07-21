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

// Text the student that new work was assigned — at most once per student per
// Los Angeles day.
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
    const { data: player } = await supabase
      .from("players")
      .select("name, phone, token, last_texted_at")
      .eq("id", playerId)
      .eq("coach_id", coachId)
      .single();

    if (!player?.phone) return;

    // Already texted today (LA) → nothing to do.
    if (
      player.last_texted_at &&
      laDate(new Date(player.last_texted_at)) === laDate(new Date())
    ) {
      return;
    }

    const { data: coach } = await supabase
      .from("coaches")
      .select("name, instructor_type")
      .eq("id", coachId)
      .single();

    // This is the student's only text — nothing is sent when they're added — so
    // the wording has to work as a first touch as well as a repeat. Falls back
    // to generic wording when instructor_type is null/empty.
    const coachName = coach?.name ?? "Coach";
    const activityType = coach?.instructor_type?.trim().replace(/_/g, " ");
    const link = `https://assignreps.com/student/${player.token}`;
    const body = activityType
      ? `Hey ${player.name} — ${coachName} assigned you ${activityType} homework. Tap here: ${link}`
      : `Hey ${player.name} — ${coachName} assigned you homework. Tap here: ${link}`;

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
