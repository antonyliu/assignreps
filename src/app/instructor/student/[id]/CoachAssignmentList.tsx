"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AssignmentTabs, { EmptyState } from "@/components/AssignmentTabs";
import AllDonePanel from "@/components/AllDonePanel";
import AssignmentMenu from "./AssignmentMenu";
import AllDoneActions from "./AllDoneActions";
import { presetsForExercise, isComplete, progressTarget, progressValue } from "@/lib/exercises";
import type { GoalType } from "@/lib/exercises";
import {
  deleteAssignment,
  moveAssignmentToLogged,
  moveAssignmentToNew,
  repeatAssignment,
} from "./actions";

/** The serialisable slice of an assignment a card needs. Deliberately not the
 *  full `Assignment` row — this crosses the server/client boundary, so it
 *  carries only what renders. */
export type CardRow = {
  id: string;
  exercise_name: string;
  target: number;
  unit: string;
  track_makes: boolean | null;
  goal_type: string | null;
  side: string | null;
  filed_at: string | null;
  /** True only for a locally-inserted "Assign again" placeholder that the
   *  server hasn't confirmed yet. Never set on a row that came from the DB. */
  optimistic?: boolean;
};

/** SUM(amount) per assignment. */
type LoggedMap = Record<string, number>;
/** SUM(makes) and the attempts those makes were recorded against, per
 *  assignment — only from logs that actually reported makes. */
type MakesMap = Record<string, { makes: number; attempts: number }>;
/** The student's most recent note per assignment — most recent log that HAS a
 *  note, not the most recent log. Computed server-side in page.tsx. */
type NoteMap = Record<string, { note: string; logged_at: string }>;

type CardActions = {
  archive: (a: CardRow) => void;
  moveToNew: (a: CardRow) => void;
  remove: (a: CardRow) => void;
  repeat: (a: CardRow) => void;
};

// ⚠️ WHY THIS COMPONENT EXISTS
//
// The card list used to be built on the server and handed to AssignmentTabs as
// an opaque ReactNode array. That made optimistic updates impossible: a menu
// sitting *inside* a pre-rendered card cannot remove that card, and the tab
// wrapper cannot tell one node from another, so it cannot move a card between
// lists or recount the tabs. Every action therefore had to wait for a full
// server round trip before anything on screen moved — the "tap, then pause".
//
// So the list moved to the client. The server still does all the DATA work —
// the queries and the per-assignment log aggregation — and passes plain rows
// down; only the rendering and the ownership of "which card is where" live
// here. The pure helpers the card needs (isComplete, progressValue,
// progressTarget, presetsForExercise) have no server dependency.
type Props = {
  playerId: string;
  firstName: string;
  rows: CardRow[];
  loggedByAssignment: LoggedMap;
  makesByAssignment: MakesMap;
  noteByAssignment: NoteMap;
  /** False when the student is deactivated: no new work can be created from this
   *  screen. Hides the bottom "+ Assign more" CTA and each card's "Assign
   *  again". ⚠️ Cosmetic — the assign routes redirect and the assign actions
   *  refuse on their own. */
  isActive: boolean;
};

/** The four mutations, as optimistic edits to the row list. Each mirrors
 *  exactly what the corresponding server action does to the database. */
type Edit =
  | { kind: "archive"; id: string }
  | { kind: "moveToNew"; id: string }
  | { kind: "remove"; id: string }
  | { kind: "repeat"; from: CardRow };

function applyEdit(rows: CardRow[], e: Edit): CardRow[] {
  switch (e.kind) {
    case "archive":
      // A real timestamp isn't needed — only null vs non-null decides the tab.
      return rows.map((r) => (r.id === e.id ? { ...r, filed_at: "optimistic" } : r));
    case "moveToNew":
      return rows.map((r) => (r.id === e.id ? { ...r, filed_at: null } : r));
    case "remove":
      return rows.filter((r) => r.id !== e.id);
    case "repeat":
      // Mirrors repeatAssignment: a NEW row copying the exercise, unfiled, with
      // no logs of its own — so it renders as not-started, which is what the
      // server will send back. The original is left untouched, as there.
      return [
        ...rows,
        { ...e.from, id: `optimistic:${e.from.id}:${rows.length}`, filed_at: null, optimistic: true },
      ];
  }
}

export default function CoachAssignmentList({
  playerId,
  firstName,
  rows,
  loggedByAssignment,
  makesByAssignment,
  noteByAssignment,
  isActive,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [toast, setToast] = useState("");
  const [optimisticRows, addEdit] = useOptimistic(rows, applyEdit);

  function showToast(msg: string, ms = 3000) {
    setToast(msg);
    setTimeout(() => setToast(""), ms);
  }

  // One shape for all four. The optimistic edit is applied inside the
  // transition, so it paints on the very next frame; the server call then runs
  // in the background.
  //
  // ⚠️ Rollback is automatic and that is the point of useOptimistic: the
  // optimistic layer is discarded the moment the transition ends. On failure we
  // simply return — the card snaps back to where it was — and toast. On success
  // we call router.refresh() INSIDE the transition, which holds it open until
  // fresh server data lands, so the optimistic row is replaced rather than
  // reverted-then-re-applied (which would flash).
  function run(edit: Edit, action: () => Promise<{ ok: boolean; error?: string }>, okMsg?: string) {
    startTransition(async () => {
      addEdit(edit);
      const result = await action();
      if (!result.ok) {
        showToast(result.error || "Something went wrong.");
        return;
      }
      if (okMsg) showToast(okMsg, 2500);
      router.refresh();
    });
  }

  const actions: CardActions = {
    archive: (a) => run({ kind: "archive", id: a.id }, () => moveAssignmentToLogged(a.id), "Archived"),
    moveToNew: (a) => run({ kind: "moveToNew", id: a.id }, () => moveAssignmentToNew(a.id), "Moved to New"),
    remove: (a) => run({ kind: "remove", id: a.id }, () => deleteAssignment(a.id)),
    repeat: (a) => run({ kind: "repeat", from: a }, () => repeatAssignment(a.id), "Assigned again"),
  };

  // Everything below is derived from the OPTIMISTIC rows, so the tab counts,
  // the empty states and the all-done panel all move on the same frame as the
  // card — not one round trip later.
  const newList = optimisticRows.filter((a) => !a.filed_at);
  const archiveList = optimisticRows.filter((a) => a.filed_at);

  const done = (a: CardRow) =>
    isComplete(
      (a.goal_type ?? "reps") as GoalType,
      a.target,
      loggedByAssignment[a.id] ?? 0,
      makesByAssignment[a.id]?.makes ?? 0,
    );

  // An optimistic "Assign again" row has no logs, so it is not complete — which
  // correctly drops allDone the instant the card appears.
  const allDone = optimisticRows.length > 0 && optimisticRows.every(done);
  const fileableCount = newList.filter(done).length;

  return (
    <>
      <AssignmentTabs
        newCount={newList.length}
        archiveCount={archiveList.length}
        newList={newList.map((a) =>
          renderAssignmentCard(a, loggedByAssignment, makesByAssignment, noteByAssignment, actions, isActive),
        )}
        archiveList={archiveList.map((a) =>
          renderAssignmentCard(a, loggedByAssignment, makesByAssignment, noteByAssignment, actions, isActive),
        )}
        newTop={
          allDone && fileableCount > 0 ? (
            <AllDonePanel
              headline={`${firstName} finished everything.`}
              action={<AllDoneActions playerId={playerId} />}
            />
          ) : undefined
        }
        newEmpty={
          allDone ? (
            <AllDonePanel
              headline={`${firstName} finished everything.`}
              sub="It's all in Archive."
            />
          ) : (
            <EmptyState
              line={`Nothing open for ${firstName}.`}
              sub="Everything assigned has been archived."
            />
          )
        }
        archiveEmpty={<EmptyState line="Nothing archived yet." />}
      />

      {/* The CTA moved in here with the list. Its label and fill depend on
          allDone, which an optimistic edit can change — "Assign again" adds an
          unfinished row, so the button has to fall back from "+ Assign new
          work" to "+ Assign more" on the same frame the card appears. Left on
          the server it would have lagged a round trip behind the list above it.

          The fragment is transparent to flex layout, so mt-auto still resolves
          against <main> exactly as before. */}
      {/* ⚠️ HIDDEN, not disabled, while paused — and `mt-auto` goes with it.
          This block is the page's only grower; dropping it means the list is
          the last thing on screen, which is correct for a read-only history
          view. A greyed CTA would invite a tap that explains nothing, and the
          banner above the list has already said why there is none. */}
      {isActive && (
      <div
        className="sticky bottom-0 mt-auto -mx-[1.25rem] px-[1.25rem] pt-3 bg-reps-bg relative"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 -translate-y-full h-8 bg-gradient-to-b from-transparent to-[#080b0f]" />
        <Link
          href={`/instructor/student/${playerId}/assign`}
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
      )}

      {/* Same toast treatment as PlayerManage and AllDoneActions — one per
          list rather than one per card, since only one action runs at a time. */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-reps-raised border border-reps-line rounded-[10px] px-5 py-3 text-[14px] text-reps-sub shadow-xl">
          {toast}
        </div>
      )}
    </>
  );
}

// Card unit label — "minutes" is abbreviated to "min" to keep the label short
// next to the assignment name; other units ("reps", "target") are shown as-is.
function unitLabel(unit: string): string {
  return unit === "minutes" ? "min" : unit;
}

// The completion question, asked once and reused by the tab split, the tab
// counts and the all-done panel. Routes through isComplete() like the other
// call sites, so this screen can't invent its own notion of finished.
function assignmentDone(
  a: CardRow,
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
// split into New / Archive tabs — both tabs render the identical card, so the
// markup has to live in exactly one place or the two will drift.
function renderAssignmentCard(
  a: CardRow,
  loggedByAssignment: LoggedMap,
  makesByAssignment: MakesMap,
  noteByAssignment: NoteMap,
  actions: CardActions,
  /** Threaded through rather than read from a closure — this renderer sits at
   *  module scope so both tabs share exactly one card implementation. */
  canAssign: boolean,
) {
  const goalType = (a.goal_type ?? "reps") as GoalType;
  const logged = loggedByAssignment[a.id] ?? 0;
  const rawMakes = makesByAssignment[a.id]?.makes ?? 0;
  const done = isComplete(goalType, a.target, logged, rawMakes);
  // Bar and count read in whatever the goal is scored on.
  const cardTarget = progressTarget(goalType, a.target);
  const shown = Math.min(progressValue(goalType, logged, rawMakes), cardTarget);
  const pct = cardTarget > 0 ? Math.min(100, Math.round((shown / cardTarget) * 100)) : 0;
  const note = noteByAssignment[a.id]?.note;
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
    <div
      key={a.id}
      className="rounded-[10px] bg-[#161a20] flex items-stretch transition-opacity"
      // The optimistic copy sits at reduced opacity until the server row
      // replaces it — visible immediately, but honestly marked as in flight.
      style={a.optimistic ? { opacity: 0.55 } : undefined}
    >
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
            className="relative h-[2px] rounded-full overflow-hidden"
            style={{ background: "#2a2d36" }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${pct}%`, background: "var(--reps-green-muted)" }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${barMakesPct}%`, background: "var(--reps-green)" }}
            />
          </div>
        ) : (
          <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "#2a2d36" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: done ? "var(--reps-green)" : "var(--reps-green-muted)" }}
            />
          </div>
        )}
        {showMakesLine && (
          <div className="mt-2 text-[11px] text-reps-dim">
            made {m.makes}/{m.attempts}
            {makesPct !== null && <span className="text-[var(--reps-label)]"> · {makesPct}%</span>}
          </div>
        )}
        {/* The student's own words, in their own voice — hence italic and
            quoted, with no label or icon. A "NOTE:" prefix would make the
            coach's card read as a form; the quotes already say who is
            speaking.

            Renders only when a note exists, so a card without one is
            byte-identical to before. It sits last so it never pushes the
            bar or the makes line around.

            No truncation: the 100-char cap at write time is the limit, and
            wrapping handles the rest. */}
        {note && (
          <div className="mt-2 border-t border-reps-line pt-2 text-[11.5px] italic text-reps-dim">
            &ldquo;{note}&rdquo;
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
        // An optimistic row has no server id yet, so its menu would act on a
        // placeholder. Disabled until the real row arrives.
        disabled={Boolean(a.optimistic)}
        // Paused students can't be given new work, so the one item that
        // creates some is dropped. The rest of the menu stays usable.
        canAssign={canAssign}
        onArchive={() => actions.archive(a)}
        onMoveToNew={() => actions.moveToNew(a)}
        onDelete={() => actions.remove(a)}
        onAssignAgain={() => actions.repeat(a)}
      />
    </div>
  );
}
