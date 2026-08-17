import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
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
    .select("name, deactivated_at")
    .eq("id", id)
    .eq("coach_id", user.id)
    .single();

  if (!player) notFound();

  // ⚠️ CONVENIENCE, not protection. A paused student cannot be given new work,
  // and the three assign ACTIONS each enforce that themselves — this only stops
  // a coach walking a whole picker flow that would refuse at the end. Sent back
  // to the student's own screen, which is where the Activate control lives.
  if (player.deactivated_at) redirect(`/instructor/student/${id}`);

  return <CustomExerciseScreen playerId={id} playerName={player.name} />;
}
