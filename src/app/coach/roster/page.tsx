import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { LogoMini } from "@/components/Logo";
import SignOutButton from "@/components/SignOutButton";
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
  if (g === "showing") return { label: "Showing up", sub: "1–3 days this week" };
  return { label: "Quiet", sub: "0 days this week" };
}

export const metadata: Metadata = { title: "Roster — Reps" };

export default async function RosterPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/coach");

  const weekStart = getWeekStart();
  const weekEndDate = weekEnd(weekStart);

  const [{ data: coach }, { data: players }, { data: logs }] = await Promise.all([
    supabase.from("coaches").select("name").eq("id", user.id).single(),
    supabase.from("players").select("*").eq("coach_id", user.id).order("created_at"),
    supabase
      .from("logs")
      .select("player_id, logged_at")
      .gte("logged_at", weekStart)
      .lte("logged_at", weekEndDate + "T23:59:59"),
  ]);

  const coachInitials = coach?.name ? initials(coach.name) : "?";
  const playerList: Player[] = players ?? [];

  // Count unique practice days per player
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

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <LogoMini />
        <SignOutButton initials={coachInitials} />
      </div>

      <h1 className="text-2xl font-medium tracking-[-0.3px] mb-1">Your players</h1>

      {playerList.length === 0 ? (
        <>
          <p className="text-[13px] text-[#8a8a8e] mb-8">No players yet.</p>
          <div className="flex-1 flex flex-col items-center justify-center text-center pb-8">
            <div className="w-14 h-14 rounded-[14px] border border-dashed border-[#3a3a3c] flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <path d="M10 4v12M4 10h12" stroke="#5a5a5e" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[14px] text-[#8a8a8e] mb-5">Add your first player to start.</p>
            <Link
              href="/coach/add-player"
              className="bg-[#ff7a3d] text-[#0f0f10] font-semibold text-[15px] px-6 py-[14px] rounded-[10px] hover:bg-[#ff8a52] transition-colors"
            >
              + Add player
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="text-[13px] text-[#8a8a8e] mb-6">
            {playerList.length} {playerList.length === 1 ? "player" : "players"}
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
                    <span className="text-[13px] font-semibold text-[#e8e8ea]">{label}</span>
                    <span className="text-[11px] text-[#5a5a5e]">{sub}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {group.map((player) => {
                      const days = daysLogged(player.id);
                      const isQuiet = g === "quiet";
                      return (
                        <Link
                          key={player.id}
                          href={`/coach/player/${player.id}`}
                          className="flex items-center gap-3 px-[14px] py-3 border border-[#2a2a2c] rounded-[10px] hover:bg-[#1a1a1c] hover:border-[#3a3a3c] active:scale-[0.99] transition-all"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0 ${
                              isQuiet
                                ? "bg-[rgba(90,90,94,0.15)] text-[#5a5a5e]"
                                : "bg-[rgba(255,122,61,0.12)] text-[#ff7a3d]"
                            }`}
                          >
                            {initials(player.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-[15px] font-medium ${isQuiet ? "text-[#8a8a8e]" : "text-[#e8e8ea]"}`}>
                              {player.name}
                            </div>
                            <div className="text-[12px] text-[#5a5a5e]">
                              {isQuiet ? "No activity yet" : `${days} day${days === 1 ? "" : "s"} logged`}
                            </div>
                          </div>
                          <span className="text-[18px] text-[#5a5a5e]">›</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href="/coach/add-player"
            className="mt-auto block text-center border border-[#2a2a2c] text-[#e8e8ea] font-medium text-[15px] py-[14px] rounded-[10px] hover:border-[#3a3a3c] hover:bg-[#1a1a1c] transition-all"
          >
            + Add player
          </Link>
        </>
      )}
    </main>
  );
}
