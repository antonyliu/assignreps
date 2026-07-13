import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CATEGORIES } from "@/lib/exercises";
import CountScreen from "./CountScreen";

export default async function AssignCountPage({
  params,
}: {
  params: Promise<{ id: string; category: string; exercise: string }>;
}) {
  const { id, category, exercise } = await params;
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
      unit={cat.unit}
      quickCounts={cat.quick}
    />
  );
}
