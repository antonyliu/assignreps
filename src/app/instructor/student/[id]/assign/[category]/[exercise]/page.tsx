import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/require-coach";
import { redirectUnlessCanAssign } from "@/lib/active-students";
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

  // ⚠️ CONVENIENCE, not protection — one shared helper across all six assign
  // routes so they cannot drift. Bounces back to the student's own screen for
  // either reason a coach cannot create work right now: THIS student is
  // deactivated, or the ACCOUNT is over its plan's active-student limit. The
  // three assign ACTIONS each enforce both themselves.
  //
  // The per-student half reuses the row already read above rather than querying
  // again; only the account half costs a round trip.
  await redirectUnlessCanAssign(supabase, user.id, id, player.deactivated_at ?? null);

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
