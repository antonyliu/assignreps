import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { LogoLarge } from "@/components/Logo";
import PlayerOtpFlow from "@/components/PlayerOtpFlow";

export const metadata: Metadata = { title: "Welcome — Reps" };

export default async function PlayerWelcomePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("name, phone, coach_id")
    .eq("token", token)
    .single();

  if (!player) notFound();

  const { data: coach } = await supabase
    .from("coaches")
    .select("name")
    .eq("id", player.coach_id)
    .single();

  const coachName = coach?.name ?? "Coach";

  return (
    <main className="flex flex-col flex-1 min-h-screen items-center justify-center text-center px-6">
      <LogoLarge />
      <h1 className="text-[36px] font-semibold tracking-[-0.5px] mb-2">Reps</h1>
      <p className="text-[14px] text-reps-sub italic mb-10">
        Assign practice homework, the easy way.
      </p>
      <p className="text-[18px] font-medium mb-2">Hey {player.name} 👋</p>
      <p className="text-[14px] text-reps-sub mb-8 max-w-[260px]">
        {`${coachName} assigned you work this week. Verify your number to continue.`}
      </p>
      <div className="w-full max-w-[300px]">
        <PlayerOtpFlow token={token} prefillPhone={player.phone} />
      </div>
    </main>
  );
}
