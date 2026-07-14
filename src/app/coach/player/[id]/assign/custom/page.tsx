import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import CustomExerciseScreen from "./CustomExerciseScreen";

export const metadata: Metadata = { title: "Custom Exercise — Reps" };

export default async function AssignCustomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/coach");

  const { data: player } = await supabase
    .from("players")
    .select("name")
    .eq("id", id)
    .eq("coach_id", user.id)
    .single();

  if (!player) notFound();

  return <CustomExerciseScreen playerId={id} playerName={player.name} />;
}
