import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireCoach } from "@/lib/require-coach";
import { getActivityLabels } from "@/config/activityTypes";
import type { Assignment } from "@/types/database";
import PlayerManage from "./PlayerManage";
import CoachAssignmentList from "./CoachAssignmentList";
import type { CardRow } from "./CoachAssignmentList";
import { accountOverLimit } from "@/lib/active-students";
import { isComplete } from "@/lib/exercises";
import type { GoalType } from "@/lib/exercises";

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
  // The student's most recent note per assignment. ⚠️ Most recent log that HAS a
  // note — not the most recent log. Most sessions carry no note, so keying on
  // the newest row would blank an earlier note the moment the student logged
  // again without writing one.
  const noteByAssignment: Record<string, { note: string; logged_at: string }> = {};
  if (assignmentIds.length > 0) {
    const { data: logs } = await supabase
      .from("logs")
      // Widened for the note — no extra round trip, the same read the makes
      // fold already needed. logged_at comes with it because the note fold
      // has to compare recency; the makes fold, being a sum, never did.
      .select("assignment_id, amount, makes, note, logged_at")
      .in("assignment_id", assignmentIds);
    for (const l of logs ?? []) {
      loggedByAssignment[l.assignment_id] = (loggedByAssignment[l.assignment_id] ?? 0) + l.amount;
      // ⚠️ Before the `continue` below — a log can carry a note without makes,
      // and skipping it there would lose exactly those notes.
      //
      // Neither query orders its rows, so this compares rather than assuming
      // last-wins. Date.parse rather than string comparison: both are UTC and
      // would usually sort lexicographically, but that quietly depends on
      // every row carrying identical fractional-second precision.
      if (l.note != null) {
        const prev = noteByAssignment[l.assignment_id];
        if (!prev || Date.parse(l.logged_at) > Date.parse(prev.logged_at)) {
          noteByAssignment[l.assignment_id] = { note: l.note, logged_at: l.logged_at };
        }
      }
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

  // Same truthiness-safe read the rows above use: select("*") on a client whose
  // schema cache predates the migration omits the column entirely.
  const isActive = !player.deactivated_at;

  // ⚠️ Two independent reasons this screen offers no path to new work, and they
  // must not be conflated. `!isActive` is about THIS student and also freezes
  // their logging. `overLimit` is about the ACCOUNT, freezes assigning for every
  // student, and freezes logging for none. Only read when the student is active,
  // since the per-student banner already covers the other case and would win.
  const account = isActive ? await accountOverLimit(supabase, user.id) : null;
  const overLimit = account?.over ?? false;
  const canAssign = isActive && !overLimit;
  // ⚠️ `entitled` rides the SAME read — no second query for the CTA. False for a
  // Pro coach past the ceiling, who has no higher plan to buy, so the button is
  // omitted rather than offered as a dead end. Same split the roster banner and
  // CeilingBlock make.
  const canUpgrade = overLimit && !(account?.entitled ?? true);

  // Unfinished work still in the New tab — what deactivating would actually
  // pause. Finished cards are excluded because pausing them means nothing, and
  // archived ones because the coach has already put them away.
  //
  // Computed with isComplete(), the same rule the cards and the roster use, so
  // the number in the modal can never disagree with the badges on screen.
  const openAssignmentCount = rows.filter(
    (a) =>
      !a.filed_at &&
      !isComplete(
        (a.goal_type ?? "reps") as GoalType,
        a.target,
        loggedByAssignment[a.id] ?? 0,
        makesByAssignment[a.id]?.makes ?? 0,
      ),
  ).length;

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
          deactivatedAt={player.deactivated_at ?? null}
          openAssignmentCount={openAssignmentCount}
        />
      </div>

      {/* The paused state, stated once at the top rather than by greying the
          whole screen. Everything below stays fully readable — the coach can
          still review history, which is the main reason to open an inactive
          student's page at all. What changes is that no path to NEW work is
          offered from here.

          Quiet, not alarming: this is a state the coach chose, so it reads as a
          label rather than a warning. */}
      {!isActive && (
        <div
          className="rounded-[10px] px-[14px] py-3 mb-4"
          style={{ background: "#161a20", border: "1px solid #2a2d36" }}
        >
          <div className="text-[13px] font-medium text-reps-ink">Inactive</div>
          <div className="text-[12px] text-reps-sub mt-0.5 leading-relaxed">
            {firstName} is paused — no new work, and they can&apos;t log. Nothing
            is lost. Activate them from the menu above.
          </div>
        </div>
      )}

      {assignmentList.length === 0 ? (
        /* ⚠️ THREE STATES, and they no longer share a wrapper.
           A paused student and an over-limit account are problems the coach has
           to resolve, not empty states — and over-limit is a PLAN CAPACITY
           state. Both keep their own copy AND their own vertical centring,
           unchanged. Only the ready-to-assign state moved up. */
        !isActive ? (
          <div className="flex-1 flex flex-col justify-center pb-8">
            <p className="text-[15px] text-reps-sub text-center">
              Nothing assigned.<br />Activate {firstName} to give them work.
            </p>
          </div>
        ) : overLimit ? (
          <div className="flex-1 flex flex-col justify-center pb-8">
            <p className="text-[15px] text-reps-sub text-center">
              Nothing assigned yet.<br />Assigning is on hold while you&apos;re over your plan limit.
            </p>
          </div>
        ) : (
          /* ⚠️ NOT centred in the remaining space any more, and that is the
              point. `flex-1 justify-center` pushed this to the middle of an
              otherwise empty screen, which read as detached from the student it
              belongs to. mt-2 against the header's own mb-4 gives 24px — the
              same gap the sticky tab bar leaves when there ARE assignments, so
              the screen keeps one rhythm whether it is empty or full.

              ⚠️ One line, no box. The headline IS the instruction; the old
              "Ready when you are." sat above it saying nothing the sentence
              below did not already say. */
          <div className="mt-2">
            <h2 className="text-[17px] font-semibold tracking-[-0.2px] text-reps-ink text-center mb-5">
              Give {firstName} their first assignment.
            </h2>
            <Link
              href={`/instructor/student/${id}/assign`}
              className="block text-center bg-reps-orange text-white font-semibold text-[15px] px-6 py-[14px] rounded-[10px] hover:bg-reps-orange-hi transition-colors"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              + Assign homework
            </Link>
          </div>
        )
      ) : (
        <>
          {/* Replaces the old "Assignments" section label — the tabs name the
              content themselves, so keeping both would stack two headings. */}
          <CoachAssignmentList
            playerId={id}
            firstName={firstName}
            rows={rows}
            isActive={isActive}
            overLimit={overLimit}
            canUpgrade={canUpgrade}
            loggedByAssignment={loggedByAssignment}
            makesByAssignment={makesByAssignment}
            // ⚠️ Deliberately unconsumed this step. The data layer lands first
            // and is verified on its own; rendering is the next step.
            noteByAssignment={noteByAssignment}
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
