"use server";

import { createClient } from "@/lib/supabase-server";

export type LookupResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

export async function lookupPlayerByPhone(phone: string): Promise<LookupResult> {
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("token")
    .eq("phone", phone)
    .single();

  if (!player) return { ok: false, error: "No player found for that number. Check with your coach." };
  return { ok: true, token: player.token };
}
