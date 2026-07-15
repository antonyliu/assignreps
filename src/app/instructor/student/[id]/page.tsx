import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { getActivityLabels } from "@/config/activityTypes";
import type { Assignment } from "@/types/database";
import PlayerManage from "./PlayerManage";

// Static title — deliberately does not include the student's name, which would
// otherwise leak into the browser tab / history.
export const metadata: Metadata = { title: "Student — Reps" };

export default async function CoachPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/instructor");

  const [{ data: player }, { data: coach }] = await Promise.all([
    supabase.from("players").select("*").eq("id", id).eq("coach_id", user.id).single(),
    supabase.from("coaches").select("instructor_type").eq("id", user.id).single(),
  ]);

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
  const labels = getActivityLabels(coach?.instructor_type ?? null);
  // Activity-specific CTA, e.g. "Assign reps" / "Assign practice" / "Assign drills".
  const assignLabel = labels.verb.charAt(0).toUpperCase() + labels.verb.slice(1);

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/instructor/students"
            className="text-reps-sub text-lg -ml-1 px-1 hover:text-reps-ink transition-colors"
          >
            ←
          </Link>
          <span className="text-[14px] font-medium text-reps-sub" style={{ textTransform: "capitalize" }}>{labels.studentsLabel}</span>
        </div>
        <PlayerManage
          playerId={player.id}
          playerName={player.name}
          playerPhone={player.phone}
          playerToken={player.token}
          studentLabel={labels.studentLabel}
        />
      </div>

      <div className="flex items-center gap-[14px] mb-6">
        <div className="w-[52px] h-[52px] rounded-full bg-reps-orange/10 flex items-center justify-center text-[18px] font-semibold text-reps-orange shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-semibold tracking-[-0.5px] text-reps-ink">{player.name}</div>
          <div className="text-[12px] text-reps-sub mt-0.5">{joinedLabel}</div>
        </div>
      </div>

      <div className="text-[11px] text-reps-dim uppercase tracking-[1.5px] mb-3">This week</div>

      {assignmentList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center pb-8">
          <p className="text-[14px] text-reps-sub mb-5">Nothing assigned yet.</p>
          <Link
            href={`/instructor/student/${id}/assign`}
            className="bg-reps-orange text-white font-semibold text-[15px] px-6 py-[14px] rounded-[10px] hover:bg-reps-orange-hi transition-colors"
          >
            + {assignLabel}
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2.5 mb-6">
            {assignmentList.map((a) => (
              <div
                key={a.id}
                className="bg-reps-card border border-reps-line rounded-[10px] px-4 py-[14px]"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[15px] font-medium text-reps-ink">{a.exercise_name}</span>
                  <span className="text-[12px] text-reps-dim">{a.target} {a.unit}</span>
                </div>
                <div className="h-1 bg-reps-line rounded-full overflow-hidden">
                  <div className="h-full bg-reps-orange rounded-full w-0" />
                </div>
              </div>
            ))}
          </div>

          <div
            className="sticky bottom-0 mt-auto -mx-[1.25rem] px-[1.25rem] pt-3 bg-reps-bg"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
          >
            <Link
              href={`/instructor/student/${id}/assign`}
              className="block text-center border border-reps-line text-reps-ink font-medium text-[15px] py-[14px] rounded-[10px] hover:border-reps-line-hi hover:bg-reps-card transition-all"
            >
              + Assign more
            </Link>
          </div>
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
