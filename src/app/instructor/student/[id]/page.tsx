import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireCoach } from "@/lib/require-coach";
import { getActivityLabels } from "@/config/activityTypes";
import type { Assignment } from "@/types/database";
import PlayerManage from "./PlayerManage";
import CoachAssignmentList from "./CoachAssignmentList";
import type { CardRow } from "./CoachAssignmentList";

// Static title — deliberately does not include the student's name, which would
// otherwise leak into the browser tab / history.
export const metadata: Metadata = { title: "Student — Reps" };

export default async function CoachPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user, coach } = await requireCoach();

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .eq("coach_id", user.id)
    .single();

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
  // Makes are accumulated separately, and only from logs that actually recorded
  // them: a log with makes null means "didn't say", so counting its amount as
  // attempts would silently depress the percentage.
  const assignmentIds = assignmentList.map((a) => a.id);
  const loggedByAssignment: Record<string, number> = {};
  const makesByAssignment: Record<string, { makes: number; attempts: number }> = {};
  if (assignmentIds.length > 0) {
    const { data: logs } = await supabase
      .from("logs")
      .select("assignment_id, amount, makes")
      .in("assignment_id", assignmentIds);
    for (const l of logs ?? []) {
      loggedByAssignment[l.assignment_id] = (loggedByAssignment[l.assignment_id] ?? 0) + l.amount;
      if (l.makes === null || l.makes === undefined) continue;
      const entry = (makesByAssignment[l.assignment_id] ??= { makes: 0, attempts: 0 });
      entry.makes += l.makes;
      entry.attempts += l.amount;
    }
  }

  const joinedLabel = formatJoined(player.created_at);
  const labels = getActivityLabels(coach?.instructor_type ?? null);
  const firstName = player.name.trim().split(/\s+/)[0] || player.name.trim();
  // ⚠️ The tab split, the counts, allDone and the all-done panel are all derived
  // CLIENT-side now, in CoachAssignmentList, from the same rows below. They have
  // to be: an optimistic archive has to move the card AND recount the tabs AND
  // re-evaluate the panel on the same frame, which is impossible if half of that
  // is computed here a round trip away.
  //
  // What stays on the server is the DATA — the queries above and the log
  // aggregation — plus the header. Only `filed_at` decides a tab; isComplete()
  // still only draws the ✓ and picks the menu.
  const rows: CardRow[] = assignmentList.map((a) => ({
    id: a.id,
    exercise_name: a.exercise_name,
    target: a.target,
    unit: a.unit,
    track_makes: a.track_makes,
    goal_type: a.goal_type,
    side: a.side,
    // Truthiness-safe: before the migration landed select("*") omitted the
    // column entirely, so this can be undefined rather than null.
    filed_at: a.filed_at ?? null,
  }));

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      {/* Header block runs tighter than the app's default mb-6 rhythm: the space
          it gives up is spent below the tab bar, where a real gap is doing work.
          Back row 24 -> 20. */}
      {/* ⚠️ The label lives INSIDE the link. It reads "Players" — the name of
          where you are going — so it looks like a back button, and until now it
          was a bare <span> beside the link: tapping the obvious target did
          nothing at all. That, not latency, is why this needed several taps.

          Sizing copied from the student log screen's back link, the one place
          that already got this right: a 44px-tall box with -ml-4/pl-4 so the
          arrow still sits optically on the content edge while the target
          extends toward the screen edge. The label extends it further right,
          so arrow and word are one control. */}
      <div className="flex items-center mb-5">
        <Link
          href="/instructor/students"
          aria-label={`Back to ${labels.studentsLabel}`}
          className="-ml-4 flex h-11 shrink-0 items-center gap-2 rounded-full pl-4 pr-3 text-reps-sub hover:text-reps-ink transition-colors"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <span className="text-lg leading-none">←</span>
          <span className="text-[14px] font-medium" style={{ textTransform: "capitalize" }}>
            {labels.studentsLabel}
          </span>
        </Link>
      </div>

      {/* Header row 24 -> 16. The sticky bar carries its own pt-2, so the space
          the eye reads between this block and the tab pills is 16 + 8 = 24,
          down from 32. */}
      <div className="flex items-center gap-[14px] mb-4">
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
          {/* Replaces the old "Assignments" section label — the tabs name the
              content themselves, so keeping both would stack two headings. */}
          <CoachAssignmentList
            playerId={id}
            firstName={firstName}
            rows={rows}
            loggedByAssignment={loggedByAssignment}
            makesByAssignment={makesByAssignment}
          />

        </>
      )}
    </main>
  );
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
