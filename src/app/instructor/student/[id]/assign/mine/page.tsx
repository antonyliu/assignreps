import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import CustomExerciseMenu from "./CustomExerciseMenu";

export const metadata: Metadata = { title: "My Exercises — Reps" };

export default async function MyExercisesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/instructor");

  const [{ data: player }, { data: exercises }] = await Promise.all([
    supabase.from("players").select("name").eq("id", id).eq("coach_id", user.id).single(),
    supabase
      .from("custom_exercises")
      .select("id, name")
      .eq("coach_id", user.id)
      .order("created_at"),
  ]);

  if (!player) notFound();

  const list: { id: string; name: string }[] = exercises ?? [];

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/instructor/student/${id}/assign`}
          className="text-reps-sub text-lg -ml-1 px-1 hover:text-reps-ink transition-colors"
        >
          ←
        </Link>
        <span className="text-[14px] font-medium text-reps-ink">My exercises</span>
      </div>

      <h2 className="text-2xl font-semibold tracking-[-0.5px] mb-6">My exercises</h2>

      {list.length === 0 ? (
        <p className="text-[14px] text-reps-sub">No saved exercises yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((ex) => (
            <div
              key={ex.id}
              className="flex items-stretch border border-reps-line rounded-[10px] hover:border-reps-line-hi transition-all"
            >
              <Link
                href={`/instructor/student/${id}/assign/mine/${ex.id}`}
                className="flex-1 min-w-0 flex items-center px-4 py-[14px] hover:bg-reps-card rounded-l-[10px] transition-colors"
              >
                <span className="text-[15px] font-medium text-reps-ink truncate">{ex.name}</span>
              </Link>
              <CustomExerciseMenu exerciseId={ex.id} exerciseName={ex.name} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
