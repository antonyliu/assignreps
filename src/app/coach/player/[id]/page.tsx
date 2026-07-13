import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import type { Assignment } from "@/types/database";
import PlayerManage from "./PlayerManage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: player } = await supabase
    .from("players")
    .select("name")
    .eq("id", id)
    .single();
  return { title: player ? `${player.name} — Reps` : "Player — Reps" };
}

export default async function CoachPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/coach");

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .eq("coach_id", user.id)
    .single();

  if (!player) notFound();

  const weekStart = getWeekStart();
  const { data: assignments } = await supabase
    .from("assignments")
    .select("*")
    .eq("player_id", id)
    .eq("week_start", weekStart)
    .order("created_at");

  const initial = player.name.trim()[0]?.toUpperCase() ?? "?";
  const assignmentList: Assignment[] = assignments ?? [];
  const joinedLabel = formatJoined(player.created_at);

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      {/* Back header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/coach/roster"
            className="text-[#8a8a8e] text-lg px-2 hover:text-[#e8e8ea] transition-colors"
          >
            ←
          </Link>
          <span className="text-[14px] font-medium text-[#8a8a8e]">Players</span>
        </div>
        <PlayerManage
          playerId={player.id}
          playerName={player.name}
          playerPhone={player.phone}
          playerToken={player.token}
        />
      </div>

      {/* Player hero */}
      <div className="flex items-center gap-[14px] mb-6">
        <div className="w-[52px] h-[52px] rounded-full bg-[rgba(255,122,61,0.12)] flex items-center justify-center text-[18px] font-semibold text-[#ff7a3d] shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-medium tracking-[-0.3px] text-[#e8e8ea]">{player.name}</div>
          <div className="text-[12px] text-[#8a8a8e] mt-0.5">{joinedLabel}</div>
        </div>
      </div>

      {/* This week section */}
      <div className="text-[11px] text-[#5a5a5e] uppercase tracking-[1.5px] mb-3">This week</div>

      {assignmentList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center pb-8">
          <p className="text-[14px] text-[#8a8a8e] mb-5">No reps assigned yet.</p>
          <Link
            href={`/coach/player/${id}/assign`}
            className="bg-[#ff7a3d] text-[#0f0f10] font-semibold text-[15px] px-6 py-[14px] rounded-[10px] hover:bg-[#ff8a52] transition-colors"
          >
            + Assign reps
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2.5 mb-6">
            {assignmentList.map((a) => (
              <div
                key={a.id}
                className="bg-[#1a1a1c] border border-[#2a2a2c] rounded-[10px] px-4 py-[14px]"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[15px] font-medium text-[#e8e8ea]">{a.exercise_name}</span>
                  <span className="text-[12px] text-[#5a5a5e]">{a.target} {a.unit}</span>
                </div>
                <div className="h-1 bg-[#2a2a2c] rounded-full overflow-hidden">
                  <div className="h-full bg-[#ff7a3d] rounded-full w-0" />
                </div>
              </div>
            ))}
          </div>

          <Link
            href={`/coach/player/${id}/assign`}
            className="mt-auto block text-center border border-[#2a2a2c] text-[#e8e8ea] font-medium text-[15px] py-[14px] rounded-[10px] hover:border-[#3a3a3c] hover:bg-[#1a1a1c] transition-all"
          >
            + Assign more
          </Link>
        </>
      )}
    </main>
  );
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

function formatJoined(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - created.getTime()) / 86400000);
  if (diffDays === 0) return "Joined today";
  if (diffDays === 1) return "Joined yesterday";
  if (diffDays < 7) return `Joined ${diffDays} days ago`;
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `Joined ${created.toLocaleDateString("en-US", opts)}`;
}
