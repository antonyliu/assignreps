import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireCoach } from "@/lib/require-coach";
import CustomExerciseMenu from "./CustomExerciseMenu";

export const metadata: Metadata = { title: "My Exercises — Reps" };

export default async function MyExercisesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireCoach();

  const [{ data: player }, { data: exercises }] = await Promise.all([
    supabase.from("players").select("name, deactivated_at").eq("id", id).eq("coach_id", user.id).single(),
    supabase
      .from("custom_exercises")
      .select("id, name")
      .eq("coach_id", user.id)
      .order("created_at"),
  ]);

  if (!player) notFound();

  // ⚠️ CONVENIENCE, not protection. A paused student cannot be given new work,
  // and the three assign ACTIONS each enforce that themselves — this only stops
  // a coach walking a whole picker flow that would refuse at the end. Sent back
  // to the student's own screen, which is where the Activate control lives.
  if (player.deactivated_at) redirect(`/instructor/student/${id}`);

  const list: { id: string; name: string }[] = exercises ?? [];

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      {/* The whole row is one back control — arrow AND label inside the Link,
          44px tall. These labels are nominally screen titles ("Shooting",
          "My exercises"), which is why they were left un-tappable at first, but
          in daily use they read as "go back" and get tapped as such. Matching
          the player detail header rather than keeping a second pattern.

          -ml-4/pl-4 puts the glyph optically on the content edge while the
          target reaches toward the screen edge; the arrow keeps its muted tone
          and the label its ink, so nothing changes visually. */}
      <div className="flex items-center mb-6">
        <Link
          href={`/instructor/student/${id}/assign`}
          aria-label="Back"
          className="group -ml-4 flex h-11 shrink-0 items-center gap-2 rounded-full pl-4 pr-3 transition-colors"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <span className="text-lg leading-none text-reps-sub group-hover:text-reps-ink transition-colors">←</span>
          <span className="text-[14px] font-medium text-reps-ink">My exercises</span>
        </Link>
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
                // Scale, not a background flash — see the note on the category
                // rows. Only the link half animates; the menu half beside it
                // must stay put or the two would visibly come apart on tap.
                className="flex-1 min-w-0 flex items-center px-4 py-[14px] rounded-l-[10px] transition-transform active:scale-[0.99]"
                style={{ WebkitTapHighlightColor: "transparent" }}
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
