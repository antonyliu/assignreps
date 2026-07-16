import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { LogoMini } from "@/components/Logo";
import ProfileMenu from "@/components/ProfileMenu";
import { getActivityLabels } from "@/config/activityTypes";
import type { Metadata } from "next";
import type { Player } from "@/types/database";

function initials(name: string) {
  return name.trim()[0]?.toUpperCase() ?? "?";
}

function firstName(name: string) {
  const trimmed = name.trim();
  return trimmed.split(/\s+/)[0] || trimmed;
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
}

function weekEnd(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d.toISOString().split("T")[0];
}

// Completion-based roster groups, in display order.
type Group = "done" | "progress" | "notstarted" | "unassigned";

const GROUP_ORDER: Group[] = ["done", "progress", "notstarted", "unassigned"];
const GROUP_TITLES: Record<Group, string> = {
  done: "Done",
  progress: "In progress",
  notstarted: "Not started",
  unassigned: "Nothing assigned",
};

export const metadata: Metadata = { title: "Students — Reps" };

export default async function RosterPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/instructor");

  const weekStart = getWeekStart();
  const weekEndDate = weekEnd(weekStart);

  const [{ data: coach }, { data: players }, { data: logs }, { data: assignments }] = await Promise.all([
    supabase.from("coaches").select("name, instructor_type").eq("id", user.id).single(),
    supabase.from("players").select("*").eq("coach_id", user.id).order("created_at"),
    supabase
      .from("logs")
      .select("player_id, assignment_id, amount, logged_at")
      .gte("logged_at", weekStart)
      .lte("logged_at", weekEndDate + "T23:59:59"),
    supabase
      .from("assignments")
      .select("id, player_id, target")
      .eq("coach_id", user.id)
      .eq("week_start", weekStart),
  ]);

  const coachName = coach?.name?.trim() || "Coach";
  const labels = getActivityLabels(coach?.instructor_type ?? null);
  const playerList: Player[] = players ?? [];

  // Sum logged reps per assignment (same sum >= target logic used elsewhere).
  const loggedByAssignment: Record<string, number> = {};
  for (const log of logs ?? []) {
    if (!log.assignment_id) continue;
    loggedByAssignment[log.assignment_id] = (loggedByAssignment[log.assignment_id] ?? 0) + log.amount;
  }

  const assignmentsByPlayer: Record<string, { id: string; target: number }[]> = {};
  for (const a of assignments ?? []) {
    (assignmentsByPlayer[a.player_id] ??= []).push({ id: a.id, target: a.target });
  }

  // Group by completion: all assignments complete → Done; some logged but not
  // all complete → In progress; assignments but no logs → Not started; no
  // assignments at all → Nothing assigned.
  function playerGroup(playerId: string): Group {
    const list = assignmentsByPlayer[playerId] ?? [];
    if (list.length === 0) return "unassigned";
    if (list.every((a) => (loggedByAssignment[a.id] ?? 0) >= a.target)) return "done";
    if (list.some((a) => (loggedByAssignment[a.id] ?? 0) > 0)) return "progress";
    return "notstarted";
  }

  const grouped: Record<Group, Player[]> = { done: [], progress: [], notstarted: [], unassigned: [] };
  for (const p of playerList) grouped[playerGroup(p.id)].push(p);

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      {/* items-center keeps the left lockup and right name/icon group on the
          same centerline across Chrome and Safari iOS. */}
      <div className="flex items-center justify-between mb-8">
        <LogoMini />
        <div className="flex items-center gap-1">
          {/* One step dimmer than before, still ~4.7:1 on #111318 → WCAG AA. */}
          <span className="text-[14px] font-medium text-[#8a8fa8] text-right">{coachName}</span>
          <ProfileMenu />
        </div>
      </div>

      <h1 className="text-2xl font-semibold tracking-[-0.5px] mb-1">Your {labels.studentsLabel}</h1>

      {playerList.length === 0 ? (
        <>
          {/* Ghost roster — faded skeleton rows mirroring a real student row
              (avatar, name bar, status bar, chevron) hint at what fills this
              screen, in place of an empty-state illustration. Opacity steps
              down per row and a mask fades the bottom so the rows dissolve
              rather than hard-stop. */}
          <div
            className="flex flex-col gap-1 mt-6 mb-8"
            aria-hidden="true"
            style={{
              WebkitMaskImage:
                "linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)",
            }}
          >
            {[0.25, 0.18, 0.12].map((op, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-[14px] py-3 border border-reps-line rounded-[10px] pointer-events-none select-none"
                style={{ opacity: op }}
              >
                <div className="w-8 h-8 rounded-full bg-reps-ink shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="h-3 w-24 rounded-full bg-reps-ink" />
                  <div className="h-2.5 w-16 rounded-full bg-reps-ink" />
                </div>
                <span className="text-[18px] text-reps-ink">›</span>
              </div>
            ))}
          </div>
          <Link
            href="/instructor/add-student"
            className="block text-center bg-reps-orange text-white font-semibold text-[15px] px-6 py-[14px] rounded-[10px] hover:bg-reps-orange-hi transition-colors"
          >
            + Add your first {labels.studentLabel}
          </Link>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-6 mt-6 mb-6">
            {GROUP_ORDER.map((g) => {
              const group = grouped[g];
              if (group.length === 0) return null;
              // Reuse the existing avatar color variants: green (done),
              // orange (in progress), dim (not started / nothing assigned).
              const avatarClass =
                g === "done"
                  ? "bg-reps-green/15 text-reps-green"
                  : g === "progress"
                  ? "bg-reps-orange/10 text-reps-orange"
                  : "bg-reps-dim/15 text-reps-dim";
              return (
                <div key={g}>
                  <div className="mb-2">
                    <span className="text-[13px] font-semibold text-reps-ink">{GROUP_TITLES[g]}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {group.map((player) => (
                      <Link
                        key={player.id}
                        href={`/instructor/student/${player.id}`}
                        className="flex items-center gap-3 px-[14px] py-3 border border-reps-line rounded-[10px] hover:bg-reps-card hover:border-reps-line-hi active:scale-[0.99] transition-all"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0 ${avatarClass}`}>
                          {initials(player.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-medium text-reps-ink truncate">
                            {firstName(player.name)}
                          </div>
                        </div>
                        <span className="text-[18px] text-reps-dim">›</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="sticky bottom-0 mt-auto -mx-[1.25rem] px-[1.25rem] pt-3 bg-reps-bg"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
          >
            <Link
              href="/instructor/add-student"
              className="block text-center border border-reps-line text-reps-ink font-medium text-[15px] py-[14px] rounded-[10px] hover:border-reps-line-hi hover:bg-reps-card transition-all"
            >
              + Add {labels.studentLabel}
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
