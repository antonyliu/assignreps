"use server";

import { createClient } from "@/lib/supabase-server";

export type AddPlayerResult =
  | { ok: true }
  | { ok: false; error: string };

export async function addPlayer(
  name: string,
  phone: string,
  parentPhone: string | null
): Promise<AddPlayerResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  // Fetch coach name for the SMS
  const { data: coach } = await supabase
    .from("coaches")
    .select("name")
    .eq("id", user.id)
    .single();

  const token = crypto.randomUUID();

  const { error: insertError } = await supabase.from("players").insert({
    coach_id: user.id,
    name,
    phone,
    parent_phone: parentPhone,
    token,
  });

  if (insertError) return { ok: false, error: insertError.message };

  // Send SMS to player via Twilio REST API
  const coachName = coach?.name ?? "Coach";
  const smsBody = `Hey ${name} — ${coachName} assigned you work. Tap here: https://assignreps.com/player/${token}`;

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
      const err = await smsRes.json();
      // Player was saved — log the SMS failure but don't block the flow
      console.error("Twilio error:", err);
    }
  } else {
    // Twilio not configured — log the link so it's usable during dev
    console.log(`[dev] SMS would send to ${phone}: ${smsBody}`);
  }

  return { ok: true };
}
