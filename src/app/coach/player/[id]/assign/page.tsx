import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CATEGORIES } from "@/lib/exercises";

export const metadata: Metadata = { title: "Assign Reps — Reps" };

export default async function AssignCategoriesPage({
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

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      {/* Back header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/coach/player/${id}`}
          className="text-[#8a8a8e] text-lg px-2 hover:text-[#e8e8ea] transition-colors"
        >
          ←
        </Link>
        <span className="text-[14px] font-medium text-[#e8e8ea]">Assign to {player.name}</span>
      </div>

      <h2 className="text-2xl font-medium tracking-[-0.3px] mb-1">Pick an exercise</h2>
      <p className="text-[13px] text-[#8a8a8e] mb-6">Choose a category</p>

      <div className="flex flex-col gap-2">
        {Object.entries(CATEGORIES).map(([slug, cat]) => (
          <Link
            key={slug}
            href={`/coach/player/${id}/assign/${slug}`}
            className="flex justify-between items-center px-4 py-[14px] border border-[#2a2a2c] rounded-[10px] hover:bg-[#1a1a1c] hover:border-[#3a3a3c] transition-all"
          >
            <div>
              <div className="text-[15px] font-medium text-[#e8e8ea]">{cat.title}</div>
              <div className="text-[12px] text-[#5a5a5e]">{cat.exercises.length} exercises</div>
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
