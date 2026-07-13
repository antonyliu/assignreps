import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { LogoMini } from "@/components/Logo";

export const metadata: Metadata = { title: "This Week — Reps" };

export default async function PlayerHomePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // Look up player by token — no auth required
  const { data: player } = await supabase
    .from("players")
    .select("id, name, coach_id")
    .eq("token", token)
    .single();

  if (!player) notFound();

  // Fetch coach name + this week's assignments + logs in parallel
  const weekStart = getWeekStart();

  const [{ data: coach }, { data: assignments }, { data: logs }] = await Promise.all([
    supabase.from("coaches").select("name").eq("id", player.coach_id).single(),
    supabase
      .from("assignments")
      .select("id, exercise_name, target, unit")
      .eq("player_id", player.id)
      .eq("week_start", weekStart)
      .order("created_at"),
    supabase
      .from("logs")
      .select("assignment_id, amount")
      .eq("player_id", player.id),
  ]);

  const coachName = coach?.name ?? "Coach";
  const coachInitial = coachName.trim()[0]?.toUpperCase() ?? "?";
  const assignmentList = assignments ?? [];

  // Sum logged reps per assignment
  const loggedByAssignment: Record<string, number> = {};
  for (const log of logs ?? []) {
    loggedByAssignment[log.assignment_id] =
      (loggedByAssignment[log.assignment_id] ?? 0) + log.amount;
  }

  const count = assignmentList.length;

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <LogoMini />
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#8a8a8e]">{coachName}</span>
          <div className="w-[30px] h-[30px] rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center text-[12px] font-semibold text-[#8a8a8e]">
            {coachInitial}
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-medium tracking-[-0.3px] mb-1">This week</h1>
      <p className="text-[13px] text-[#8a8a8e] mb-6">
        {count === 0
          ? "No assignments yet."
          : `${count} assignment${count === 1 ? "" : "s"}`}
      </p>

      {count === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center pb-8">
          <p className="text-[14px] text-[#8a8a8e]">
            Your coach hasn&apos;t assigned anything yet.
          </p>
          <p className="text-[12px] text-[#5a5a5e] mt-2">Check back soon.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {assignmentList.map((a) => {
            const logged = Math.min(loggedByAssignment[a.id] ?? 0, a.target);
            const pct = a.target > 0 ? Math.round((logged / a.target) * 100) : 0;
            const done = logged >= a.target;

            return (
              <Link
                key={a.id}
                href={`/player/${token}/log/${a.id}`}
                className="bg-[#1a1a1c] border border-[#2a2a2c] rounded-[10px] px-4 py-[14px] hover:border-[#3a3a3c] transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[15px] font-medium text-[#e8e8ea]">
                    {a.exercise_name}
                  </span>
                  <span className={`text-[12px] ${done ? "text-[#4ade80]" : "text-[#5a5a5e]"}`}>
                    {done ? "Done ✓" : `${logged} / ${a.target} ${a.unit}`}
                  </span>
                </div>
                <div className="h-1 bg-[#2a2a2c] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${done ? "bg-[#4ade80]" : "bg-[#ff7a3d]"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
}
