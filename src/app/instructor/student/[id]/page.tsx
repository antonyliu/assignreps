import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireCoach } from "@/lib/require-coach";
import { getActivityLabels } from "@/config/activityTypes";
import { presetsForExercise, isComplete, progressTarget, progressValue } from "@/lib/exercises";
import type { GoalType } from "@/lib/exercises";
import type { Assignment } from "@/types/database";
import PlayerManage from "./PlayerManage";
import AssignmentMenu from "./AssignmentMenu";
import AllDoneActions from "./AllDoneActions";
import AssignmentTabs from "./AssignmentTabs";

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
  // ⚠️ The tab split is `filed_at` and nothing else — completion has no say in
  // it. A finished card stays in New until the coach moves it, and a filed one
  // can be moved back. isComplete() still runs per card, but only to draw the ✓
  // badge and to choose which menu actions that card offers.
  //
  // Both lists keep the query's `order("created_at")`, so New reads in the order
  // work was assigned, exactly as the single list did before tabs existed.
  const newList = assignmentList.filter((a) => !a.filed_at);
  const loggedList = assignmentList.filter((a) => a.filed_at);

  // Unchanged meaning: every assignment this player has is finished. Drives the
  // banner. Deliberately spans BOTH tabs — filing work away doesn't make the
  // student less finished, so a coach who files everything still sees it.
  const allDone =
    assignmentList.length > 0 &&
    assignmentList.every((a) => assignmentDone(a, loggedByAssignment, makesByAssignment));

  // The bulk control is offered only when it would actually do something: there
  // has to be at least one finished card still sitting in New. Without this the
  // link keeps rendering after everything is filed, promising a move with
  // nothing left to move.
  const fileableCount = newList.filter((a) =>
    assignmentDone(a, loggedByAssignment, makesByAssignment),
  ).length;

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      {/* Header block runs tighter than the app's default mb-6 rhythm: the space
          it gives up is spent below the tab bar, where a real gap is doing work.
          Back row 24 -> 20. */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/instructor/students"
          className="text-reps-sub text-lg -ml-1 px-1 hover:text-reps-ink transition-colors"
        >
          ←
        </Link>
        <span className="text-[14px] font-medium text-reps-sub" style={{ textTransform: "capitalize" }}>{labels.studentsLabel}</span>
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
          <AssignmentTabs
            firstName={firstName}
            newCount={newList.length}
            loggedCount={loggedList.length}
            newList={newList.map((a) =>
              renderAssignmentCard(a, loggedByAssignment, makesByAssignment),
            )}
            loggedList={loggedList.map((a) =>
              renderAssignmentCard(a, loggedByAssignment, makesByAssignment),
            )}
          />

          {allDone && (
            <div
              className="text-center rounded-[10px] mb-6"
              style={{
                background: "rgba(107,214,61,0.06)",
                border: "0.5px solid rgba(107,214,61,0.15)",
                padding: "12px 14px",
              }}
            >
              <div className="text-[22px] leading-none mb-1.5">🎉</div>
              <div className="text-[14px] font-medium text-reps-ink">{firstName} finished everything.</div>
            </div>
          )}

          {allDone && fileableCount > 0 && <AllDoneActions playerId={id} />}

          <div
            className="sticky bottom-0 mt-auto -mx-[1.25rem] px-[1.25rem] pt-3 bg-reps-bg relative"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 -translate-y-full h-8 bg-gradient-to-b from-transparent to-[#080b0f]" />
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

/** SUM(amount) per assignment. */
type LoggedMap = Record<string, number>;
/** SUM(makes) and the attempts those makes were recorded against, per
 *  assignment — only from logs that actually reported makes. */
type MakesMap = Record<string, { makes: number; attempts: number }>;

// The completion question, asked once and reused by the tab split, the tab
// counts and the all-done banner. Routes through isComplete() like the other
// call sites, so this screen can't invent its own notion of finished.
function assignmentDone(
  a: Assignment,
  loggedByAssignment: LoggedMap,
  makesByAssignment: MakesMap,
): boolean {
  return isComplete(
    (a.goal_type ?? "reps") as GoalType,
    a.target,
    loggedByAssignment[a.id] ?? 0,
    makesByAssignment[a.id]?.makes ?? 0,
  );
}

// One assignment card. Lifted out of the page body unchanged when the list was
// split into New / Logged tabs — both tabs render the identical card, so the
// markup has to live in exactly one place or the two will drift.
function renderAssignmentCard(
  a: Assignment,
  loggedByAssignment: LoggedMap,
  makesByAssignment: MakesMap,
) {
  const goalType = (a.goal_type ?? "reps") as GoalType;
  const logged = loggedByAssignment[a.id] ?? 0;
  const rawMakes = makesByAssignment[a.id]?.makes ?? 0;
  const done = isComplete(goalType, a.target, logged, rawMakes);
  // Bar and count read in whatever the goal is scored on.
  const cardTarget = progressTarget(goalType, a.target);
  const shown = Math.min(progressValue(goalType, logged, rawMakes), cardTarget);
  const pct = cardTarget > 0 ? Math.min(100, Math.round((shown / cardTarget) * 100)) : 0;
  // Bad data (more makes than attempts) still shows the raw numbers —
  // only the percentage, which would read over 100%, is suppressed.
  const m = makesByAssignment[a.id];
  const showMakes = m !== undefined && m.attempts > 0;
  const makesPct =
    showMakes && m.makes <= m.attempts ? Math.round((m.makes / m.attempts) * 100) : null;
  // Two-tone bar, same rule as the student list: muted attempts fill
  // with a bright makes overlay, but only once makes were recorded.
  // Reps goal only — under a makes goal the single bar is already
  // drawing makes, so stacking would render the same figure twice.
  const twoTone = goalType === "reps" && (a.track_makes ?? false) && showMakes;
  const barMakesPct =
    m && a.target > 0 ? Math.min(100, Math.round((m.makes / a.target) * 100)) : 0;
  // Counts read in the goal's own measure. A streak carries its
  // length too — "0/1 set" alone doesn't say what the set was.
  const countLabel =
    goalType === "consecutive"
      ? `${shown}/1 set · ${a.target} in a row`
      : goalType === "makes"
        ? `${shown}/${a.target} makes`
        : `${logged}/${a.target} ${unitLabel(a.unit)}`;
  // "made 21/21 · 100%" restates what "21/25 makes" already says on a
  // makes goal, and the percentage is over attempts rather than the
  // target, so the two numbers read as contradicting each other.
  const showMakesLine = showMakes && goalType !== "makes";
  return (
    <div key={a.id} className="rounded-[10px] bg-[#161a20] flex items-stretch">
      <div className="flex-1 min-w-0 px-4 py-[14px]">
        <div className="flex items-baseline gap-2 mb-2">
          {/* The side sits in its own shrink-0 span rather than inside
              the truncating name, so "Short corner jumpers · Left"
              drops characters from the name and still shows which
              hand was asked for — the part the coach can't infer. */}
          <span className="flex-1 min-w-0 flex items-baseline">
            <span className="truncate text-[15px] font-medium text-reps-ink">{a.exercise_name}</span>
            {/* ml-1 rather than a leading space in the text: these are
                flex items, and a flex item's leading whitespace is
                trimmed, running the name into the dot. */}
            {a.side && (
              <span className="ml-1 shrink-0 text-[15px] font-medium text-reps-sub">
                · {a.side === "left" ? "Left" : "Right"}
              </span>
            )}
          </span>
          {done ? (
            <span className="shrink-0 text-[12px] font-medium text-reps-green whitespace-nowrap">
              ✓ {goalType === "reps" ? `${Math.min(logged, a.target)}/${a.target} ${unitLabel(a.unit)}` : countLabel}
            </span>
          ) : (
            <span className="shrink-0 text-[12px] text-reps-dim whitespace-nowrap">{countLabel}</span>
          )}
        </div>
        {twoTone ? (
          <div
            className="relative h-[3px] rounded-full overflow-hidden"
            style={{ background: "#2a2d36" }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${pct}%`, background: "#3d7a24" }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${barMakesPct}%`, background: "#6bd63d" }}
            />
          </div>
        ) : (
          <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "#2a2d36" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: done ? "#6bd63d" : "#3d7a24" }}
            />
          </div>
        )}
        {showMakesLine && (
          <div className="mt-2 text-[11px] text-reps-dim">
            made {m.makes}/{m.attempts}
            {makesPct !== null && <span className="text-[var(--reps-label)]"> · {makesPct}%</span>}
          </div>
        )}
      </div>
      <AssignmentMenu
        assignmentId={a.id}
        exerciseName={a.exercise_name}
        target={a.target}
        // The exercise's attempt presets. AssignmentMenu swaps in the
        // goal's own row when this isn't a 'reps' assignment.
        presets={presetsForExercise(a.exercise_name)}
        goalType={goalType}
        hasProgress={logged > 0}
        // Same `done` the card above renders its ✓ from, so the
        // menu and the card can never disagree about completion.
        isDone={done}
        // Which tab this card is actually in — decides the direction of
        // the move, and is independent of `done`.
        //
        // Truthiness, not `!== null`: until the migration is applied the
        // column doesn't exist, so select("*") omits it and the value is
        // undefined rather than null. `undefined !== null` is true, which
        // would flag every card as filed and offer "Move back to New" on
        // work that had never been moved anywhere.
        isFiled={Boolean(a.filed_at)}
      />
    </div>
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
