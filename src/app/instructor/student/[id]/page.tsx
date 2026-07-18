import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { getActivityLabels } from "@/config/activityTypes";
import { presetsForExercise } from "@/lib/exercises";
import type { Assignment } from "@/types/database";
import PlayerManage from "./PlayerManage";
import AssignmentMenu from "./AssignmentMenu";
import AllDoneActions from "./AllDoneActions";

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

  const { data: assignments } = await supabase
    .from("assignments")
    .select("*")
    .eq("player_id", id)
    .order("created_at");

  const initial = player.name.trim()[0]?.toUpperCase() ?? "?";
  const assignmentList: Assignment[] = assignments ?? [];

  // Sum every log per assignment so each card can show real progress and a
  // completed (sum >= target) state.
  const assignmentIds = assignmentList.map((a) => a.id);
  const loggedByAssignment: Record<string, number> = {};
  if (assignmentIds.length > 0) {
    const { data: logs } = await supabase
      .from("logs")
      .select("assignment_id, amount")
      .in("assignment_id", assignmentIds);
    for (const l of logs ?? []) {
      loggedByAssignment[l.assignment_id] = (loggedByAssignment[l.assignment_id] ?? 0) + l.amount;
    }
  }

  const joinedLabel = formatJoined(player.created_at);
  const labels = getActivityLabels(coach?.instructor_type ?? null);
  const firstName = player.name.trim().split(/\s+/)[0] || player.name.trim();
  const allDone =
    assignmentList.length > 0 &&
    assignmentList.every((a) => (loggedByAssignment[a.id] ?? 0) >= a.target);

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/instructor/students"
          className="text-reps-sub text-lg -ml-1 px-1 hover:text-reps-ink transition-colors"
        >
          ←
        </Link>
        <span className="text-[14px] font-medium text-reps-sub" style={{ textTransform: "capitalize" }}>{labels.studentsLabel}</span>
      </div>

      <div className="flex items-center gap-[14px] mb-6">
        <div
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-[18px] font-semibold shrink-0"
          style={{ background: "#252830", border: "0.5px solid #2a2d36", color: "#8a8fa8" }}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-semibold tracking-[-0.5px] text-reps-ink">{player.name}</div>
          <div className="text-[12px] text-reps-sub mt-0.5">{joinedLabel}</div>
        </div>
        <PlayerManage
          playerId={player.id}
          playerName={player.name}
          playerPhone={player.phone}
          playerToken={player.token}
          sendToParent={player.send_to_parent ?? false}
          studentLabel={labels.studentLabel}
        />
      </div>

      {assignmentList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center pb-8">
          <p className="text-[15px] text-reps-sub mb-5">
            Nothing assigned yet.<br />Give {firstName} some homework.
          </p>
          <Link
            href={`/instructor/student/${id}/assign`}
            className="bg-reps-orange text-white font-semibold text-[15px] px-6 py-[14px] rounded-[10px] hover:bg-reps-orange-hi transition-colors"
          >
            + Assign homework
          </Link>
        </div>
      ) : (
        <>
          <div className="text-[11px] text-reps-dim uppercase tracking-[1.5px] mb-3">Assignments</div>

          <div className="flex flex-col gap-2.5 mb-6">
            {assignmentList.map((a) => {
              const logged = loggedByAssignment[a.id] ?? 0;
              const done = logged >= a.target;
              const pct = a.target > 0 ? Math.min(100, Math.round((logged / a.target) * 100)) : 0;
              return (
                <div
                  key={a.id}
                  className="rounded-[10px] bg-[#161a20] flex items-stretch"
                >
                  <div className="flex-1 min-w-0 px-4 py-[14px]">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="flex-1 min-w-0 truncate text-[15px] font-medium text-reps-ink">{a.exercise_name}</span>
                      {done ? (
                        <span className="shrink-0 text-[12px] font-medium text-reps-green whitespace-nowrap">
                          ✓ {Math.min(logged, a.target)}/{a.target} {unitLabel(a.unit)}
                        </span>
                      ) : (
                        <span className="shrink-0 text-[12px] text-reps-dim whitespace-nowrap">{logged}/{a.target} {unitLabel(a.unit)}</span>
                      )}
                    </div>
                    <div className="h-1 bg-reps-line rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${done ? "bg-reps-green" : "bg-[#f0b429]"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <AssignmentMenu
                    assignmentId={a.id}
                    exerciseName={a.exercise_name}
                    target={a.target}
                    presets={presetsForExercise(a.exercise_name)}
                    hasProgress={logged > 0}
                  />
                </div>
              );
            })}
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
              <div className="text-[14px] font-medium text-reps-ink">{firstName} finished everything.</div>
              <div className="text-[13px] mt-0.5" style={{ color: "#5a5f72" }}>Ready for next week?</div>
            </div>
          )}

          {allDone && <AllDoneActions playerId={id} firstName={firstName} />}

          <div
            className="sticky bottom-0 mt-auto -mx-[1.25rem] px-[1.25rem] pt-3 bg-reps-bg relative"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 -translate-y-full h-8 bg-gradient-to-b from-transparent to-[#111318]" />
            <Link
              href={`/instructor/student/${id}/assign`}
              className={
                allDone
                  ? "block text-center bg-[#378add] text-white font-semibold text-[15px] py-[14px] rounded-[10px] hover:bg-[#4a9ae8] transition-colors"
                  : "block text-center bg-[#1c1f26] text-reps-ink font-medium text-[15px] py-[14px] rounded-[10px] border border-reps-line-hi hover:bg-[#22252e] hover:border-[#4a4d57] transition-colors"
              }
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {allDone ? "+ Assign new work" : "+ Assign more"}
            </Link>
          </div>
        </>
      )}
    </main>
  );
}

// Card unit label — "minutes" is abbreviated to "min" to keep the label short
// next to the assignment name; other units ("reps", "target") are shown as-is.
function unitLabel(unit: string): string {
  return unit === "minutes" ? "min" : unit;
}

function formatJoined(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - created.getTime()) / 86400000);
  if (diffDays === 0) return "Joined today";
  if (diffDays === 1) return "Joined yesterday";
  if (diffDays < 7) return `Joined ${diffDays} days ago`;
  if (diffDays < 14) return "Joined 1 week ago";
  if (diffDays < 30) return `Joined ${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "Joined 1 month ago";
  if (diffDays < 365) return `Joined ${Math.floor(diffDays / 30)} months ago`;
  if (diffDays < 730) return "Joined 1 year ago";
  return `Joined ${Math.floor(diffDays / 365)} years ago`;
}
