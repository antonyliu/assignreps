"use server";

import { createClient } from "@/lib/supabase-server";

export type AddPlayerResult =
  | { ok: true }
  | { ok: false; error: string };

export async function addPlayer(
  name: string,
  phone: string,
  parentPhone: string | null,
  sendToParent: boolean
): Promise<AddPlayerResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  // Fetch coach name + activity type for the SMS
  const { data: coach } = await supabase
    .from("coaches")
    .select("name, instructor_type")
    .eq("id", user.id)
    .single();

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

  // Send SMS to player via Twilio REST API. When the coach's activity type is
  // available, make the message specific ("…assigned you basketball homework");
  // if it couldn't be fetched, fall back to the generic wording.
  const coachName = coach?.name ?? "Coach";
  const activityType = coach?.instructor_type?.trim().replace(/_/g, " ");
  const smsBody = activityType
    ? `Hey ${name} — ${coachName} assigned you ${activityType} homework. Tap here: https://assignreps.com/student/${token}`
    : `Hey ${name} — ${coachName} assigned you work. Tap here: https://assignreps.com/student/${token}`;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (accountSid && authToken && messagingServiceSid) {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const smsRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        MessagingServiceSid: messagingServiceSid,
        To: phone,
        Body: smsBody,
      }),
    });

    if (!smsRes.ok) {
      // Student was saved — record that the SMS failed without logging the
      // recipient number or message body.
      console.error("Invite SMS failed to send", { status: smsRes.status });
    }
  } else {
    // Twilio not configured (local dev). Don't log the phone or message body.
    console.warn("Twilio not configured — invite SMS skipped");
  }

  return { ok: true };
}
