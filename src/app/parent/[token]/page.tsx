import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { LogoMini } from "@/components/Logo";

export const metadata: Metadata = { title: "Weekly Update — Reps" };

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
}

function weekLabel(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

function effortHeadline(dayCount: number, completedCount: number, totalCount: number): string {
  if (totalCount === 0) return "Nothing assigned yet this week.";
  if (dayCount === 0) return "Hasn't started yet this week.";
  if (completedCount === totalCount) return "All done. Great week.";
  if (dayCount >= 4) return "Putting in the work.";
  if (dayCount >= 2) return "Showing up.";
  return "Just getting started.";
}

function effortEmoji(dayCount: number, completedCount: number, totalCount: number): string {
  if (totalCount === 0 || dayCount === 0) return "–";
  if (completedCount === totalCount) return "🔥";
  if (dayCount >= 4) return "💪";
  if (dayCount >= 2) return "👍";
  return "🟡";
}

function lastActivityLabel(lastLoggedAt: string | null): string {
  if (!lastLoggedAt) return "No activity yet";
  const last = new Date(lastLoggedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - last.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return last.toLocaleDateString("en-US", opts);
}

export default async function ParentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("id, name, coach_id")
    .eq("token", token)
    .single();

  if (!player) notFound();

  const weekStart = getWeekStart();
  const weekEndDate = new Date(weekStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekEndStr = weekEndDate.toISOString().split("T")[0];

  const [{ data: coach }, { data: assignments }, { data: logs }] = await Promise.all([
    supabase.from("coaches").select("name").eq("id", player.coach_id).single(),
    supabase
      .from("assignments")
      .select("id")
      .eq("player_id", player.id)
      .eq("week_start", weekStart),
    supabase
      .from("logs")
      .select("assignment_id, logged_at")
      .eq("player_id", player.id)
      .gte("logged_at", weekStart)
      .lte("logged_at", weekEndStr + "T23:59:59")
      .order("logged_at", { ascending: false }),
  ]);

  const coachName       = coach?.name ?? "Coach";
  const totalAssignments = assignments?.length ?? 0;
  const logList         = logs ?? [];

  const practiceDays = new Set(logList.map((l) => l.logged_at.split("T")[0]));
  const dayCount     = practiceDays.size;

  const loggedAssignmentIds = new Set(logList.map((l) => l.assignment_id));
  const completedCount      = (assignments ?? []).filter((a) => loggedAssignmentIds.has(a.id)).length;

  const lastLoggedAt = logList[0]?.logged_at ?? null;
  const headline     = effortHeadline(dayCount, completedCount, totalAssignments);
  const emoji        = effortEmoji(dayCount, completedCount, totalAssignments);

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      <div className="flex justify-between items-center mb-8">
        <LogoMini />
        <span className="text-[12px] text-reps-dim">{weekLabel(weekStart)}</span>
      </div>

      <p className="text-[13px] text-reps-sub mb-1">Weekly update</p>
      <h1 className="text-[28px] font-semibold tracking-[-0.5px] text-reps-ink mb-1">{player.name}</h1>
      <p className="text-[13px] text-reps-dim mb-8">Assigned by {coachName}</p>

      <div className="bg-reps-card border border-reps-line rounded-[14px] px-5 py-6 mb-4 text-center">
        <div className="text-[48px] mb-3">{emoji}</div>
        <p className="text-[17px] font-semibold text-reps-ink mb-1">{headline}</p>
        {totalAssignments > 0 && dayCount > 0 && (
          <p className="text-[13px] text-reps-sub">
            Practiced {dayCount} day{dayCount === 1 ? "" : "s"} this week
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-reps-card border border-reps-line rounded-[12px] px-4 py-4">
          <p className="text-[11px] text-reps-dim uppercase tracking-[1px] mb-1">Practice days</p>
          <p className="text-[24px] font-semibold text-reps-ink">{dayCount}</p>
          <p className="text-[11px] text-reps-dim">this week</p>
        </div>
        <div className="bg-reps-card border border-reps-line rounded-[12px] px-4 py-4">
          <p className="text-[11px] text-reps-dim uppercase tracking-[1px] mb-1">Assignments</p>
          <p className="text-[24px] font-semibold text-reps-ink">
            {completedCount}
            {totalAssignments > 0 && (
              <span className="text-[14px] text-reps-dim font-normal"> / {totalAssignments}</span>
            )}
          </p>
          <p className="text-[11px] text-reps-dim">started</p>
        </div>
      </div>

      <div className="border-t border-reps-line pt-5">
        <div className="flex justify-between items-center">
          <span className="text-[13px] text-reps-dim">Last active</span>
          <span className="text-[13px] text-reps-sub">{lastActivityLabel(lastLoggedAt)}</span>
        </div>
      </div>

      <div className="mt-auto pt-8 text-center">
        <p className="text-[11px] text-reps-dim/50">Read-only view · Reps</p>
      </div>
    </main>
  );
}
