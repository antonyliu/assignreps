import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/require-coach";
import { redirectUnlessCanAssign } from "@/lib/active-students";
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

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      {/* Two controls, opposite corners.

          LEFT names its DESTINATION — the previous screen's title — rather than
          saying a generic "Back". It steps back exactly one screen, as always.

          ⚠️ THIS IS A DIFFERENT RULE FROM THE ONE THE OTHER ASSIGN ROUTES USE,
          and the two must not be "reconciled" by guesswork. `assign/custom` and
          `assign/mine` label their back link with the CURRENT screen's title
          ("My exercises" on the My-exercises screen) — a habit CLAUDE.md records
          as deliberate. These three name where the link GOES. Both read fine in
          place; what would be wrong is assuming one file tells you the rule.

          RIGHT, Cancel, abandons the WHOLE flow and lands on the ROSTER, not on
          this student's detail screen — deliberate, not an oversight. A coach
          cancelling out of assigning is done with the task, and the arrow
          already covers backing up one step.


          ⚠️ THE TWO HOVER RULES ARE GUARDED BY @media (hover: hover), AND THAT
          GUARD IS THE WHOLE POINT. Tailwind 3.4 compiles a bare `hover:` to a
          plain `:hover` with no media query (verified: zero `@media (hover` in
          the built CSS, 15 bare `:hover` rules). On iOS Safari `:hover` is
          applied on TAP and LINGERS until you tap something else — so the arrow
          and Cancel would stay lit white at rest after being touched. This is
          the same defect CLAUDE.md records for the assign-flow list rows, which
          were fixed by dropping `hover:bg-` entirely.

          ⚠️ Desktop behaviour is deliberately UNCHANGED — a real pointer still
          matches (hover: hover) and still gets the lift to ink.

          ⚠️ The BACK LABEL is not part of this. It is unconditionally
          text-reps-ink with no hover rule at all, so white IS its resting state,
          matching assign/custom, assign/mine and add-student. It cannot linger,
          because there is nothing to linger from.
          ⚠️ Both keep the app's 44px floor. -ml-4/-mr-4 against matching padding
          puts each control optically on its content edge while its target
          reaches toward the screen edge. */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/instructor/student/${id}/assign`}
          aria-label="Back"
          className="group -ml-4 flex h-11 shrink-0 items-center gap-2 rounded-full pl-4 pr-3 transition-colors"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <span className="text-lg leading-none text-reps-sub [@media(hover:hover)]:group-hover:text-reps-ink transition-colors">←</span>
          <span className="text-[14px] font-medium text-reps-ink">Categories</span>
        </Link>
        <Link
          href="/instructor/students"
          className="-mr-4 flex h-11 shrink-0 items-center rounded-full px-4 text-[14px] font-medium text-reps-sub [@media(hover:hover)]:hover:text-reps-ink transition-colors"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          Cancel
        </Link>
      </div>

      <h2 className="text-2xl font-semibold tracking-[-0.5px]">{cat.title}</h2>
      <p className="text-[12px] text-reps-sub mt-0.5 mb-6">Assigning to {player.name}</p>

      <div className="flex flex-col gap-2">
        {cat.exercises.map((ex) => (
          <Link
            key={ex.slug}
            href={`/instructor/student/${id}/assign/${category}/${ex.slug}`}
            // Tap feedback is scale only — no background flash. `hover:bg-`
            // is what caused it: on iOS the :hover state STICKS after a tap, so
            // the row lit grey and stayed lit while the next screen loaded,
            // which read as a glitch rather than a response. Same treatment the
            // roster rows already use.
            className="flex justify-between items-center px-4 py-[14px] border border-reps-line rounded-[10px] hover:border-reps-line-hi transition-all active:scale-[0.99]"
            style={{ WebkitTapHighlightColor: "transparent" }}
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
