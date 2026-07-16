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

type ActivityGroup = "fire" | "showing" | "quiet";

function groupLabel(g: ActivityGroup) {
  if (g === "fire") return { label: "All in 🔥", sub: "4+ days this week" };
  if (g === "showing") return { label: "Some activity", sub: "1–3 days this week" };
  return { label: "No activity yet", sub: "0 days this week" };
}

export const metadata: Metadata = { title: "Students — Reps" };

export default async function RosterPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/instructor");

  const weekStart = getWeekStart();
  const weekEndDate = weekEnd(weekStart);

  const [{ data: coach }, { data: players }, { data: logs }] = await Promise.all([
    supabase.from("coaches").select("name, instructor_type").eq("id", user.id).single(),
    supabase.from("players").select("*").eq("coach_id", user.id).order("created_at"),
    supabase
      .from("logs")
      .select("player_id, logged_at")
      .gte("logged_at", weekStart)
      .lte("logged_at", weekEndDate + "T23:59:59"),
  ]);

  const coachName = coach?.name?.trim() || "Coach";
  const labels = getActivityLabels(coach?.instructor_type ?? null);
  const playerList: Player[] = players ?? [];

  const daysByPlayer: Record<string, Set<string>> = {};
  for (const log of logs ?? []) {
    const day = log.logged_at.split("T")[0];
    if (!daysByPlayer[log.player_id]) daysByPlayer[log.player_id] = new Set();
    daysByPlayer[log.player_id].add(day);
  }

  function daysLogged(playerId: string): number {
    return daysByPlayer[playerId]?.size ?? 0;
  }

  function activityGroup(playerId: string): ActivityGroup {
    const d = daysLogged(playerId);
    if (d >= 4) return "fire";
    if (d >= 1) return "showing";
    return "quiet";
  }

  const grouped: Record<ActivityGroup, Player[]> = { fire: [], showing: [], quiet: [] };
  for (const p of playerList) grouped[activityGroup(p.id)].push(p);

  const groupOrder: ActivityGroup[] = ["fire", "showing", "quiet"];
  const hasActivity = grouped.fire.length + grouped.showing.length > 0;

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
          <p className="text-[13px] text-reps-sub mb-6">
            {playerList.length} {playerList.length === 1 ? labels.studentLabel : labels.studentsLabel}
            {hasActivity && " · this week"}
          </p>

          <div className="flex flex-col gap-6 mb-6">
            {groupOrder.map((g) => {
              const group = grouped[g];
              if (group.length === 0) return null;
              const { label, sub } = groupLabel(g);
              return (
                <div key={g}>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-[13px] font-semibold text-reps-ink">{label}</span>
                    <span className="text-[11px] text-reps-dim">{sub}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {group.map((player) => {
                      const days = daysLogged(player.id);
                      const isQuiet = g === "quiet";
                      return (
                        <Link
                          key={player.id}
                          href={`/instructor/student/${player.id}`}
                          className="flex items-center gap-3 px-[14px] py-3 border border-reps-line rounded-[10px] hover:bg-reps-card hover:border-reps-line-hi active:scale-[0.99] transition-all"
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0 ${
                            isQuiet
                              ? "bg-reps-dim/15 text-reps-dim"
                              : "bg-reps-orange/10 text-reps-orange"
                          }`}>
                            {initials(player.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-[15px] font-medium ${isQuiet ? "text-reps-sub" : "text-reps-ink"}`}>
                              {player.name}
                            </div>
                            <div className="text-[12px] text-reps-dim">
                              {isQuiet ? "No activity yet" : `${days} day${days === 1 ? "" : "s"} logged`}
                            </div>
                          </div>
                          <span className="text-[18px] text-reps-dim">›</span>
                        </Link>
                      );
                    })}
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
