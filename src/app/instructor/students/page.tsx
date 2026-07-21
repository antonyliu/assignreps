import Link from "next/link";
import { requireCoach } from "@/lib/require-coach";
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

// Completion-based roster groups, in display order.
type Group = "done" | "progress" | "notstarted" | "unassigned";

const GROUP_ORDER: Group[] = ["done", "progress", "notstarted", "unassigned"];

// Pill styling per group (Nothing assigned mirrors Not started).
const GROUP_STYLE: Record<Group, { title: string; bg: string; text: string; dot: string }> = {
  done:       { title: "Done",             bg: "rgba(61,214,140,0.12)", text: "#3dd68c", dot: "#3dd68c" },
  progress:   { title: "In progress",      bg: "rgba(240,180,41,0.1)",  text: "#f0b429", dot: "#f0b429" },
  notstarted: { title: "Not started",      bg: "rgba(90,95,114,0.1)",   text: "#8a8fa8", dot: "#5a5f72" },
  unassigned: { title: "Nothing assigned", bg: "rgba(90,95,114,0.1)",   text: "#8a8fa8", dot: "#5a5f72" },
};

export const metadata: Metadata = { title: "Students — Reps" };

export default async function RosterPage() {
  const { supabase, user, coach } = await requireCoach();

  const [{ data: players }, { data: assignments }] = await Promise.all([
    supabase.from("players").select("*").eq("coach_id", user.id).order("created_at"),
    // Assignments are not time-bounded — grouping reflects every assignment
    // that still exists (they persist until cleared), matching the student
    // detail view. The old `.eq("week_start", weekStart)` filter here dropped
    // every assignment whenever the stored week_start differed from the
    // roster's computed Monday, forcing all students into "Nothing assigned".
    supabase
      .from("assignments")
      .select("id, player_id, target")
      .eq("coach_id", user.id),
  ]);

  // Sum all logs for those assignments (no date filter), same as student detail.
  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const { data: logs } = assignmentIds.length
    ? await supabase.from("logs").select("assignment_id, amount").in("assignment_id", assignmentIds)
    : { data: [] };

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

  function doneCount(playerId: string): number {
    const list = assignmentsByPlayer[playerId] ?? [];
    return list.filter((a) => (loggedByAssignment[a.id] ?? 0) >= a.target).length;
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

  function subline(playerId: string, g: Group): string {
    const total = (assignmentsByPlayer[playerId] ?? []).length;
    if (g === "unassigned") return "No assignments yet";
    if (g === "notstarted") return `${total} assignment${total === 1 ? "" : "s"} waiting`;
    return `${doneCount(playerId)} of ${total} done`;
  }

  const grouped: Record<Group, Player[]> = { done: [], progress: [], notstarted: [], unassigned: [] };
  for (const p of playerList) grouped[playerGroup(p.id)].push(p);

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      {/* items-center keeps the left lockup and right name/icon group on the
          same centerline across Chrome and Safari iOS. */}
      <div className="flex items-center justify-between mb-6">
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
          {/* Tight but distinct spacing between completion groups. */}
          <div className="flex flex-col gap-5 mt-3 mb-8">
            {GROUP_ORDER.map((g) => {
              const group = grouped[g];
              if (group.length === 0) return null;
              const style = GROUP_STYLE[g];
              return (
                <div key={g}>
                  <div className="mb-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[20px] text-[11px] font-semibold"
                      style={{ padding: "3px 8px", background: style.bg, color: style.text }}
                    >
                      <span
                        className="rounded-full shrink-0"
                        style={{ width: 6, height: 6, background: style.dot }}
                      />
                      {style.title}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {group.map((player) => (
                      <Link
                        key={player.id}
                        href={`/instructor/student/${player.id}`}
                        className="flex items-center gap-3 px-[14px] py-2 rounded-[10px] bg-[#161a20] hover:bg-[#1c1f26] active:scale-[0.99] transition-colors"
                        style={{ WebkitTapHighlightColor: "transparent" }}
                      >
                        <div
                          className="flex items-center justify-center shrink-0 rounded-full text-[13px] font-semibold"
                          style={{
                            width: 34,
                            height: 34,
                            background: "#252830",
                            border: "0.5px solid #2a2d36",
                            color: "#8a8fa8",
                          }}
                        >
                          {initials(player.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-medium truncate" style={{ color: "#e8eaf0" }}>
                            {firstName(player.name)}
                          </div>
                          <div className="text-[12px] truncate" style={{ color: "#5a5f72" }}>
                            {subline(player.id, g)}
                          </div>
                        </div>
                        <span className="text-[18px]" style={{ color: "#5a5f72" }}>›</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pinned secondary add button. A gradient fade above it lets list
              rows dissolve into the page background as they scroll underneath. */}
          <div
            className="sticky bottom-0 mt-auto -mx-[1.25rem] px-[1.25rem] pt-3 bg-reps-bg relative"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 -translate-y-full h-8 bg-gradient-to-b from-transparent to-[#111318]" />
            <Link
              href="/instructor/add-student"
              className="block text-center bg-[#1c1f26] text-[#c8cdd8] font-medium text-[15px] py-[14px] rounded-[10px] hover:bg-[#22252e] transition-colors"
              style={{ WebkitTapHighlightColor: "transparent", borderTop: "0.5px solid #2a2d36" }}
            >
              + Add {labels.studentLabel}
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
