import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import LogScreen from "./LogScreen";

export const metadata: Metadata = { title: "Log Reps — Reps" };

export default async function LogPage({
  params,
}: {
  params: Promise<{ token: string; assignmentId: string }>;
}) {
  const { token, assignmentId } = await params;
  const supabase = await createClient();

  // Resolve player from token — no auth required
  const { data: player } = await supabase
    .from("players")
    .select("id, name, coach_id")
    .eq("token", token)
    .single();

  if (!player) notFound();

  // Fetch assignment (must belong to this player)
  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, exercise_name, target, unit")
    .eq("id", assignmentId)
    .eq("player_id", player.id)
    .single();

  if (!assignment) notFound();

  // Fetch coach name + already-logged reps in parallel
  const [{ data: coach }, { data: logs }] = await Promise.all([
    supabase.from("coaches").select("name").eq("id", player.coach_id).single(),
    supabase.from("logs").select("amount").eq("assignment_id", assignmentId).eq("player_id", player.id),
  ]);

  const alreadyLogged = (logs ?? []).reduce((sum, l) => sum + l.amount, 0);

  return (
    <LogScreen
      token={token}
      playerId={player.id}
      assignmentId={assignment.id}
      exerciseName={assignment.exercise_name}
      target={assignment.target}
      unit={assignment.unit}
      alreadyLogged={Math.min(alreadyLogged, assignment.target)}
      coachName={coach?.name ?? "Coach"}
    />
  );
}
