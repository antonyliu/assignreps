import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { LogoMini } from "@/components/Logo";

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
      .select("id, exercise_name, target, unit, track_makes")
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
    count > 0 && assignmentList.every((a) => (loggedByAssignment[a.id] ?? 0) >= a.target);

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
            background: "rgba(61,214,140,0.06)",
            border: "0.5px solid rgba(61,214,140,0.15)",
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
          <div className="text-[11px] text-reps-dim uppercase tracking-[1.5px] mb-3">Assignments</div>

          <div className="flex flex-col gap-2.5">
            {assignmentList.map((a) => {
              const logged = Math.min(loggedByAssignment[a.id] ?? 0, a.target);
              const pct = a.target > 0 ? Math.round((logged / a.target) * 100) : 0;
              const done = logged >= a.target;

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
              const twoTone = (a.track_makes ?? false) && showMakes;
              const barMakesPct =
                m && a.target > 0 ? Math.min(100, Math.round((m.makes / a.target) * 100)) : 0;

              return (
                <Link
                  key={a.id}
                  href={`/student/${token}/log/${a.id}`}
                  className="bg-[#161a20] border border-reps-line rounded-[10px] px-4 py-[14px] hover:border-reps-line-hi transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[15px] font-medium text-reps-ink">
                      {a.exercise_name}
                    </span>
                    {done ? (
                      <span className="text-[12px] font-medium text-reps-green">✓ Done</span>
                    ) : (
                      <span className="text-[12px] text-reps-dim">{logged}/{a.target} {a.unit}</span>
                    )}
                  </div>
                  {/* Same palette as the log screen: grey track, muted attempts
                      fill, bright makes overlay. */}
                  {twoTone ? (
                    <div
                      className="relative h-1.5 rounded-full overflow-hidden"
                      style={{ background: "#2a2d36" }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: "#2d5a1b" }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all"
                        style={{ width: `${barMakesPct}%`, background: "#6bd63d" }}
                      />
                    </div>
                  ) : (
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "#2a2d36" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: done ? "#6bd63d" : "#2d5a1b" }}
                      />
                    </div>
                  )}
                  {showMakes && (
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
