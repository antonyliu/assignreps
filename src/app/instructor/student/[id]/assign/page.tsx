import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/require-coach";
import { redirectUnlessCanAssign } from "@/lib/active-students";
import { CATEGORIES } from "@/lib/exercises";

export const metadata: Metadata = { title: "Assign — Reps" };

export default async function AssignCategoriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireCoach();

  const [{ data: player }, { count: customCount }] = await Promise.all([
    supabase.from("players").select("name, deactivated_at").eq("id", id).eq("coach_id", user.id).single(),
    supabase
      .from("custom_exercises")
      .select("*", { count: "exact", head: true })
      .eq("coach_id", user.id),
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
          href={`/instructor/student/${id}`}
          aria-label="Back"
          className="group -ml-4 flex h-11 shrink-0 items-center gap-2 rounded-full pl-4 pr-3 transition-colors"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <span className="text-lg leading-none text-reps-sub group-hover:text-reps-ink transition-colors">←</span>
          <span className="text-[14px] font-medium text-reps-ink">Assign to {player.name}</span>
        </Link>
      </div>

      <h2 className="text-2xl font-semibold tracking-[-0.5px] mb-1">Pick an exercise</h2>
      <p className="text-[13px] text-reps-sub mb-6">Choose a category</p>

      <div className="flex flex-col gap-2">
        {customCount ? (
          <Link
            href={`/instructor/student/${id}/assign/mine`}
            className="flex justify-between items-center px-4 py-[14px] border border-reps-line rounded-[10px] hover:border-reps-line-hi transition-all active:scale-[0.99]"
            style={{ background: "rgba(55, 138, 221, 0.06)", WebkitTapHighlightColor: "transparent" }}
          >
            <div>
              <div className="text-[15px] font-medium text-reps-ink">My exercises</div>
              <div className="text-[12px] text-reps-dim mt-0.5">
                {customCount} exercise{customCount === 1 ? "" : "s"}
              </div>
            </div>
            <span className="text-[18px] text-reps-dim">›</span>
          </Link>
        ) : null}
        {Object.entries(CATEGORIES).map(([slug, cat]) => (
          <Link
            key={slug}
            href={`/instructor/student/${id}/assign/${slug}`}
            // Tap feedback is scale only — no background flash. `hover:bg-`
            // is what caused it: on iOS the :hover state STICKS after a tap, so
            // the row lit grey and stayed lit while the next screen loaded,
            // which read as a glitch rather than a response. Same treatment the
            // roster rows already use.
            className="flex justify-between items-center px-4 py-[14px] border border-reps-line rounded-[10px] hover:border-reps-line-hi transition-all active:scale-[0.99]"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <div>
              <div className="text-[15px] font-medium text-reps-ink">{cat.title}</div>
              <div className="text-[12px] text-reps-dim mt-0.5">{cat.hint}</div>
            </div>
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
