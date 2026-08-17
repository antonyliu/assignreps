import { notFound, redirect } from "next/navigation";
import { requireCoach } from "@/lib/require-coach";
import { CATEGORIES, defaultTrackMakes } from "@/lib/exercises";
import CountScreen from "./CountScreen";

export default async function AssignCountPage({
  params,
}: {
  params: Promise<{ id: string; category: string; exercise: string }>;
}) {
  const { id, category, exercise } = await params;
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

  const cat = CATEGORIES[category];
  if (!cat) notFound();

  const ex = cat.exercises.find((e) => e.slug === exercise);
  if (!ex) notFound();

  return (
    <CountScreen
      playerId={id}
      playerName={player.name}
      categorySlug={category}
      exerciseName={ex.name}
      defaultTarget={ex.default}
      unit={ex.unit ?? cat.unit}
      quickCounts={ex.quick ?? cat.quick}
      defaultTrackMakes={defaultTrackMakes(category)}
    />
  );
}
