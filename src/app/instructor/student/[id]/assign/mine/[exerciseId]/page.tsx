import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import type { Unit } from "@/lib/exercises";
import CountScreen from "../../[category]/[exercise]/CountScreen";

export default async function AssignCustomCountPage({
  params,
}: {
  params: Promise<{ id: string; exerciseId: string }>;
}) {
  const { id, exerciseId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/instructor");

  const [{ data: player }, { data: ex }] = await Promise.all([
    supabase.from("players").select("name").eq("id", id).eq("coach_id", user.id).single(),
    supabase
      .from("custom_exercises")
      .select("name, unit, default_amount")
      .eq("id", exerciseId)
      .eq("coach_id", user.id)
      .single(),
  ]);

  if (!player) notFound();
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
    />
  );
}
