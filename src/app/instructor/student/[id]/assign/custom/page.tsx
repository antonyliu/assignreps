import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/require-coach";
import { redirectUnlessCanAssign } from "@/lib/active-students";
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

  // ⚠️ CONVENIENCE, not protection — one shared helper across all six assign
  // routes so they cannot drift. Bounces back to the student's own screen for
  // either reason a coach cannot create work right now: THIS student is
  // deactivated, or the ACCOUNT is over its plan's active-student limit. The
  // three assign ACTIONS each enforce both themselves.
  //
  // The per-student half reuses the row already read above rather than querying
  // again; only the account half costs a round trip.
  await redirectUnlessCanAssign(supabase, user.id, id, player.deactivated_at ?? null);

  return <CustomExerciseScreen playerId={id} playerName={player.name} />;
}
