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
  if (!user) redirect("/instructor");

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

      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/instructor/student/${id}/assign`}
          className="text-reps-sub text-lg -ml-1 px-1 hover:text-reps-ink transition-colors"
        >
          ←
        </Link>
        <span className="text-[14px] font-medium text-reps-ink">{cat.title}</span>
      </div>

      <h2 className="text-2xl font-semibold tracking-[-0.5px] mb-6">{cat.title}</h2>

      <div className="flex flex-col gap-2">
        {cat.exercises.map((ex) => (
          <Link
            key={ex.slug}
            href={`/instructor/student/${id}/assign/${category}/${ex.slug}`}
            className="flex justify-between items-center px-4 py-[14px] border border-reps-line rounded-[10px] hover:bg-reps-card hover:border-reps-line-hi transition-all"
          >
            <span className="text-[15px] font-medium text-reps-ink">{ex.name}</span>
            <span className="text-[18px] text-reps-dim">›</span>
          </Link>
        ))}
      </div>

      <div
        className="sticky bottom-0 mt-auto -mx-[1.25rem] px-[1.25rem] pt-6 text-center bg-reps-bg"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
      >
        <Link
          href={`/instructor/student/${id}/assign/custom`}
          className="inline-flex items-center text-[13px] font-medium text-[#c8cdd8] hover:text-reps-ink border border-reps-line hover:border-reps-line-hi rounded-[10px] px-5 py-3 transition-colors"
        >
          + Create your own
        </Link>
      </div>
    </main>
  );
}
