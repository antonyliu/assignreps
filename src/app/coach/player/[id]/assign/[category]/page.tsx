import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CATEGORIES } from "@/lib/exercises";

export default async function AssignExerciseListPage({
  params,
}: {
  params: Promise<{ id: string; category: string }>;
}) {
  const { id, category } = await params;
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

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      {/* Back header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/coach/player/${id}/assign`}
          className="text-[#8a8a8e] text-lg px-2 hover:text-[#e8e8ea] transition-colors"
        >
          ←
        </Link>
        <span className="text-[14px] font-medium text-[#e8e8ea]">{cat.title}</span>
      </div>

      <h2 className="text-2xl font-medium tracking-[-0.3px] mb-6">{cat.title}</h2>

      <div className="flex flex-col gap-2">
        {cat.exercises.map((ex) => (
          <Link
            key={ex.slug}
            href={`/coach/player/${id}/assign/${category}/${ex.slug}`}
            className="flex justify-between items-center px-[14px] py-3 border border-[#2a2a2c] rounded-[10px] hover:bg-[#1a1a1c] hover:border-[#3a3a3c] transition-all"
          >
            <div>
              <div className="text-[15px] font-medium text-[#e8e8ea]">{ex.name}</div>
              <div className="text-[11px] text-[#5a5a5e]">Default: {ex.default} {cat.unit}</div>
            </div>
            <span className="text-[18px] text-[#5a5a5e]">›</span>
          </Link>
        ))}
      </div>

      <div className="mt-auto pt-6 text-center">
        <Link
          href={`/coach/player/${id}/assign/custom`}
          className="text-[13px] text-[#5a5a5e] hover:text-[#8a8a8e] transition-colors"
        >
          + Create your own
        </Link>
      </div>
    </main>
  );
}
