import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/require-coach";
import { CATEGORIES } from "@/lib/exercises";

export default async function AssignExerciseListPage({
  params,
}: {
  params: Promise<{ id: string; category: string }>;
}) {
  const { id, category } = await params;
  const { supabase, user } = await requireCoach();

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

      {/* 44px back target, matching the student log screen. The label beside it
          is this screen's TITLE, not the back destination, so it stays a
          separate element — only the arrow is a control. -ml-4 lets the target
          reach toward the screen edge while the glyph stays optically on the
          content edge; the span's -ml-2 reclaims the dead half of that box so
          arrow and title still read as one unit. */}
      <div className="flex items-center mb-6">
        <Link
          href={`/instructor/student/${id}/assign`}
          aria-label="Back"
          className="-ml-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-reps-sub hover:text-reps-ink transition-colors"
        >
          ←
        </Link>
        <span className="-ml-2 text-[14px] font-medium text-reps-ink">{cat.title}</span>
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
