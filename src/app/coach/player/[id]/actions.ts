"use server";

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export async function deletePlayer(playerId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/coach");

  // Verify ownership before deleting
  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("id", playerId)
    .eq("coach_id", user.id)
    .single();

  if (!player) return;

  await supabase.from("players").delete().eq("id", playerId);
  redirect("/coach/roster");
}

export type UpdatePlayerResult = { ok: true } | { ok: false; error: string };

export async function updatePlayerPhone(
  playerId: string,
  phone: string
): Promise<UpdatePlayerResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("players")
    .update({ phone })
    .eq("id", playerId)
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

  if (!player) return { ok: false, error: "Player not found." };

  const coachName = coach?.name ?? "Coach";
  const smsBody = `Hey ${player.name} — ${coachName} assigned you work. Tap here: https://assignreps.com/player/${player.token}`;

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
      const err = await res.json();
      console.error("Twilio error:", err);
      return { ok: false, error: "SMS failed to send." };
    }
  } else {
    console.log(`[dev] SMS would send to ${player.phone}: ${smsBody}`);
  }

  return { ok: true };
}
