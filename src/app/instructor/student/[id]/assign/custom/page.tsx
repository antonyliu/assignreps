import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/require-coach";
import CustomExerciseScreen from "./CustomExerciseScreen";

export const metadata: Metadata = { title: "Custom Exercise — Reps" };

export default async function AssignCustomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireCoach();

  const { data: player } = await supabase
    .from("players")
    .select("name")
    .eq("id", id)
    .eq("coach_id", user.id)
    .single();

  if (!player) notFound();

  return <CustomExerciseScreen playerId={id} playerName={player.name} />;
}
