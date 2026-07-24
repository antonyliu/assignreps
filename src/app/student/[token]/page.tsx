import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { LogoMini } from "@/components/Logo";
import { isComplete, progressTarget, progressValue } from "@/lib/exercises";
import type { GoalType } from "@/lib/exercises";

export const metadata: Metadata = { title: "Your homework — Reps" };

export default async function PlayerHomePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("id, name")
    .eq("token", token)
    .single();

  if (!player) notFound();

  const [coachNameRes, { data: assignments }, { data: logs }] = await Promise.all([
    // The `coaches` table isn't readable by the anon role, so the coach name
    // comes from a SECURITY DEFINER RPC keyed on the student's link token.
    supabase.rpc("coach_name_for_token", { p_token: token }),
    supabase
      .from("assignments")
      .select("id, exercise_name, target, unit, track_makes, goal_type, side")
      .eq("player_id", player.id)
      .order("created_at"),
    supabase
      .from("logs")
      .select("assignment_id, amount, makes")
      .eq("player_id", player.id),
  ]);

  const coachName = (coachNameRes.data as string | null)?.trim() || "Coach";
  const firstName = player.name?.trim().split(/\s+/)[0] || "there";
  const assignmentList = assignments ?? [];

  const loggedByAssignment: Record<string, number> = {};
  // Same shape and rule as the coach detail card: makes and their attempts
  // accumulate only from logs that recorded makes (null = "didn't say"), so the
  // "made X/Y · Z%" denominator matches the coach's exactly.
  const makesByAssignment: Record<string, { makes: number; attempts: number }> = {};
  for (const log of logs ?? []) {
    loggedByAssignment[log.assignment_id] =
      (loggedByAssignment[log.assignment_id] ?? 0) + log.amount;
    if (log.makes == null) continue;
    const entry = (makesByAssignment[log.assignment_id] ??= { makes: 0, attempts: 0 });
    entry.makes += log.makes;
    entry.attempts += log.amount;
  }

  const count = assignmentList.length;
  const allDone =
    count > 0 &&
    assignmentList.every((a) =>
      isComplete(
        (a.goal_type ?? "reps") as GoalType,
        a.target,
        loggedByAssignment[a.id] ?? 0,
        makesByAssignment[a.id]?.makes ?? 0,
      ),
    );

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      <div className="flex items-center mb-8">
        <LogoMini />
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.5px] text-reps-ink">{firstName}</h1>
        <p className="text-[12px] text-reps-sub mt-0.5">{coachName}&apos;s assignments</p>
      </div>

      {allDone && (
        <div
          className="text-center rounded-[10px] mb-6"
          style={{
            background: "rgba(107,214,61,0.06)",
            border: "0.5px solid rgba(107,214,61,0.15)",
            padding: "12px 14px",
          }}
        >
          <div className="text-[22px] leading-none mb-1.5">🎉</div>
          <div className="text-[14px] font-medium text-reps-ink">You finished everything.</div>
          <div className="text-[13px] mt-0.5" style={{ color: "rgba(255, 255, 255, 0.55)" }}>
            {coachName} can see your progress.
          </div>
        </div>
      )}

      {count === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center pb-8">
          <p className="text-[21px] font-semibold text-reps-ink">You&apos;re all caught up. 🙌</p>
          <p className="text-[14px] text-reps-sub mt-3 max-w-[240px]">
            {`${coachName} will assign new work when it's time.`}
          </p>
        </div>
      ) : (
        <>
          {/* Sticky section label — the cards scroll underneath it, so a student
              partway down a long list still knows what they are looking at. Only
              this label sticks; the logo and name block above scroll away.
              -mx/px cancels the page gutter so the background and the fade span
              the full width rather than stopping at the content edge. The fade
              hangs below the label (translate-y-full) so rows dissolve into it
              instead of meeting a hard edge — same treatment as the pinned
              buttons elsewhere, mirrored top-to-bottom. */}
          <div className="sticky top-0 z-10 -mx-[1.25rem] px-[1.25rem] pt-2 bg-reps-bg">
            <div className="text-[11px] text-reps-dim uppercase tracking-[1.5px] pb-3">
              Assignments
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 translate-y-full bg-gradient-to-b from-[#111318] to-transparent" />
          </div>

          <div className="flex flex-col gap-2.5">
            {assignmentList.map((a) => {
              const goalType = (a.goal_type ?? "reps") as GoalType;
              const rawLogged = loggedByAssignment[a.id] ?? 0;
              const rawMakes = makesByAssignment[a.id]?.makes ?? 0;
              const done = isComplete(goalType, a.target, rawLogged, rawMakes);
              // The bar measures whatever the goal is scored on, capped for
              // display so an overshoot doesn't render past the end.
              const cardTarget = progressTarget(goalType, a.target);
              const logged = Math.min(progressValue(goalType, rawLogged, rawMakes), cardTarget);
              const pct = cardTarget > 0 ? Math.round((logged / cardTarget) * 100) : 0;

              // Makes summary — identical shape/logic/markup to the coach detail
              // card. attempts is the makes-recorded subset, not the target.
              const m = makesByAssignment[a.id];
              const showMakes = m !== undefined && m.attempts > 0;
              const makesPct =
                showMakes && m.makes <= m.attempts
                  ? Math.round((m.makes / m.attempts) * 100)
                  : null;

              // Two-tone bar when makes exist: muted-green attempts with a
              // bright-green makes overlay (makes/target), mirroring the log
              // screen. Otherwise the single bar below.
              //
              // Only a reps goal stacks the two: under a makes goal the single
              // bar is ALREADY measuring makes, so overlaying them again would
              // draw the same figure twice.
              const twoTone = goalType === "reps" && (a.track_makes ?? false) && showMakes;
              const barMakesPct =
                m && a.target > 0 ? Math.min(100, Math.round((m.makes / a.target) * 100)) : 0;
              // The count reads in whatever the goal is scored on — "12/50 reps"
              // is wrong on an assignment measured in makes or sets.
              // Matches the coach detail card exactly. A streak carries its
              // length too — "0/1 set" alone doesn't say what the set was.
              const countLabel =
                goalType === "consecutive"
                  ? `${logged}/1 set · ${a.target} in a row`
                  : goalType === "makes"
                    ? `${logged}/${a.target} makes`
                    : `${logged}/${a.target} ${a.unit}`;
              // "made 21/21 · 100%" restates what "21/25 makes" already says on a
              // makes goal, and the percentage is over attempts rather than the
              // target, so the two numbers read as contradicting each other.
              // Same rule as the coach detail card.
              const showMakesLine = showMakes && goalType !== "makes";

              return (
                <Link
                  key={a.id}
                  href={`/student/${token}/log/${a.id}`}
                  className="bg-[#161a20] border border-reps-line rounded-[10px] px-4 py-[14px] hover:border-reps-line-hi transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    {/* Same structure as the coach detail card: the side sits in
                        its own shrink-0 span beside the truncating name, so a long
                        exercise name gives up characters rather than hiding which
                        hand was asked for. ml-1 because a flex item's leading
                        whitespace is trimmed. */}
                    <span className="flex-1 min-w-0 flex items-baseline">
                      <span className="truncate text-[15px] font-medium text-reps-ink">
                        {a.exercise_name}
                      </span>
                      {a.side && (
                        <span className="ml-1 shrink-0 text-[15px] font-medium text-reps-sub">
                          · {a.side === "left" ? "Left" : "Right"}
                        </span>
                      )}
                    </span>
                    {done ? (
                      <span className="shrink-0 text-[12px] font-medium text-reps-green whitespace-nowrap">✓ Done</span>
                    ) : (
                      <span className="shrink-0 text-[12px] text-reps-dim whitespace-nowrap">{countLabel}</span>
                    )}
                  </div>
                  {/* Same palette as the log screen: grey track, muted attempts
                      fill, bright makes overlay. */}
                  {twoTone ? (
                    <div
                      className="relative h-[3px] rounded-full overflow-hidden"
                      style={{ background: "#2a2d36" }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: "#3d7a24" }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all"
                        style={{ width: `${barMakesPct}%`, background: "#6bd63d" }}
                      />
                    </div>
                  ) : (
                    <div
                      className="h-[3px] rounded-full overflow-hidden"
                      style={{ background: "#2a2d36" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: done ? "#6bd63d" : "#3d7a24" }}
                      />
                    </div>
                  )}
                  {showMakesLine && (
                    <div className="mt-2 text-[11px] text-reps-dim">
                      made {m.makes}/{m.attempts}
                      {makesPct !== null && (
                        <span className="text-[var(--reps-label)]"> · {makesPct}%</span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
