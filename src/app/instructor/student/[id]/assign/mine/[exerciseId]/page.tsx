import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/require-coach";
import { redirectUnlessCanAssign } from "@/lib/active-students";
import type { Unit } from "@/lib/exercises";
import CountScreen from "../../[category]/[exercise]/CountScreen";

export default async function AssignCustomCountPage({
  params,
}: {
  params: Promise<{ id: string; exerciseId: string }>;
}) {
  const { id, exerciseId } = await params;
  const { supabase, user } = await requireCoach();

  const [{ data: player }, { data: ex }] = await Promise.all([
    supabase.from("players").select("name, deactivated_at").eq("id", id).eq("coach_id", user.id).single(),
    supabase
      .from("custom_exercises")
      .select("name, unit, default_amount")
      .eq("id", exerciseId)
      .eq("coach_id", user.id)
      .single(),
  ]);

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
  if (!ex) notFound();

  const unit = ex.unit as Unit;

  return (
    <CountScreen
      playerId={id}
      playerName={player.name}
      categorySlug="mine"
      exerciseName={ex.name}
      defaultTarget={ex.default_amount}
      unit={unit}
      quickCounts={[]}
      // Saved customs have no category to infer from — off unless the coach
      // flips the toggle on this screen.
      defaultTrackMakes={false}
    />
  );
}
