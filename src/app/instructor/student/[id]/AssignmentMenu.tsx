"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, MoreVertical, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { GOAL_PRESETS } from "@/lib/exercises";
import type { GoalType } from "@/lib/exercises";
import { updateAssignmentTarget } from "./actions";

type Props = {
  assignmentId: string;
  exerciseName: string;
  target: number;
  /** The exercise's own category presets — the row for a 'reps' goal. The other
   *  goals count something else and bring their own scale, see GOAL_PRESETS. */
  presets: number[];
  goalType: GoalType;
  hasProgress: boolean;
  /** Computed by the page via isComplete() — the one completion rule the whole
   *  app shares, so this menu can't disagree with the card it sits on about
   *  whether the work is finished.
   *
   *  Decides WHICH set of actions this card gets, not which tab it is in. A
   *  finished card offers "Assign again" and a move; an unfinished one offers
   *  "Edit amount" and the destructive delete. */
  isDone: boolean;
  /** Whether `filed_at` is set — i.e. which tab the card is actually sitting in.
   *  Independent of isDone: a finished card stays in New until someone moves it.
   *  Only decides the DIRECTION of the move action. */
  isFiled: boolean;
  /** True while this card is an unconfirmed optimistic placeholder. Its id is
   *  local-only, so acting on it would target a row the server has never seen. */
  disabled?: boolean;
  /** ⚠️ These four no longer call the server here. CoachAssignmentList owns the
   *  row list, so it owns the optimistic edit, the mutation, the rollback and
   *  the error toast — all four have to happen together or the card and the
   *  list would disagree about where it is. This component just says "the coach
   *  tapped this"; Edit amount stays local because it mutates nothing about
   *  which list a card belongs to. */
  onArchive: () => void;
  onMoveToNew: () => void;
  onDelete: () => void;
  onAssignAgain: () => void;
};

// What the target means, per goal. "Edit amount" is only honest for attempts —
// on a makes or streak assignment it left the coach guessing which number the
// row was asking for.
// Dropdown styling lifted from PlayerManage's overflow menu — the app's other
// per-row "..." menu — so the two read as the same control. That means a raised
// surface with the items running flush to its edges (the container clips them
// via overflow-hidden), a hairline rule between rows rather than gaps, and no
// inner padding on the container itself.
const MENU_PANEL =
  "absolute right-0 top-full mt-1 z-50 min-w-[190px] bg-reps-raised border border-reps-line rounded-[10px] shadow-xl overflow-hidden";
const MENU_ITEM_BASE =
  "flex items-center gap-2.5 w-full px-4 py-3 text-left text-[14px] whitespace-nowrap hover:bg-reps-line transition-colors";
const MENU_ITEM = `${MENU_ITEM_BASE} text-reps-ink disabled:opacity-50 disabled:pointer-events-none`;
// Rule sits on the row BELOW the gap, so the first item in a menu never carries
// one — which is why each branch decides for itself where this goes.
const MENU_DIVIDER = "border-t border-reps-line";
// 16px at strokeWidth 2, matching the inline User icon in ProfileMenu. shrink-0
// so a long label can never squash the glyph.
//
// Dimmed so the glyph supports the label instead of competing with it. The
// precedent is that same ProfileMenu icon, which is pinned to #8a8fa8 rather
// than inheriting full-strength ink — the app already treats a supporting icon
// as muted.
//
// Opacity rather than that literal hex, though: these icons inherit their row's
// colour, and hard-coding grey would leave a grey bin beside a red "Delete
// assignment", splitting the one row that most needs to read as a single red
// unit. At 60% over --reps-raised, white lands near #a7a8ab — squarely in the
// app's muted range — while red-400 softens without ceasing to look red.
const ICON = { size: 16, strokeWidth: 2, className: "shrink-0 opacity-60" } as const;

const EDIT_SUBTITLE: Record<GoalType, string> = {
  reps: "Edit amount",
  makes: "Edit target makes",
  consecutive: "Edit streak goal",
};

// Per-card overflow menu: a vertical three-dot trigger sitting in its own
// column. The menu splits cleanly on completion:
//
//   unfinished — "Edit amount" (only with no progress yet, silent, no SMS) and
//                the red "Delete assignment", behind a confirm dialog.
//   finished   — "Assign again" and a single-tap move between the two tabs.
//
// ⚠️ The two sets are mutually exclusive, which means "Delete assignment" is
// deliberately unreachable on a finished card. Deleting finished work is what
// the old "Clear finished" did, and it orphaned the logs pointing at it. Filing
// replaced that: a finished assignment is moved, never destroyed.
//
// "Delete", not "Remove": the menu also carries "Archive" and "Move back to
// New", and remove/move read as neighbours. Delete says outright that the row is
// gone — and matches "Delete exercise" in CustomExerciseMenu.
export default function AssignmentMenu({
  assignmentId, exerciseName, target, presets, goalType, hasProgress, isDone, isFiled,
  disabled = false, onArchive, onMoveToNew, onDelete, onAssignAgain,
}: Props) {
  const router = useRouter();
  // Only "Edit amount" still calls the server from this component, so this is
  // the only spinner left. The other four hand off to CoachAssignmentList and
  // return immediately — a pending label on them could never render.
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(target);
  const [editCustom, setEditCustom] = useState(false);

  // Same rule as the count screen, so assigning and editing offer the identical
  // row: a makes goal counts in makes and a streak in consecutive hits, neither
  // of which is scaled like the exercise's attempt presets (25/50/100/200).
  const goalPresets = goalType === "reps" ? presets : GOAL_PRESETS[goalType];

  function openEdit() {
    setMenuOpen(false);
    setEditTarget(target);
    // If the current target isn't a preset, reveal the input pre-filled;
    // otherwise show the presets with the current one selected.
    setEditCustom(!goalPresets.includes(target));
    setEditOpen(true);
  }

  // Closes the dialog and hands off immediately — the card is already gone from
  // the list by the time this returns, so there is nothing here to wait for.
  function handleRemove() {
    setConfirmOpen(false);
    onDelete();
  }

  // Both of these close the menu and return. The optimistic update in the
  // parent lands on the next frame; the server call runs behind it.
  //
  // Tapping twice is still only an accidental-repeat concern, and closing the
  // menu first is what prevents it. A coach who deliberately reopens and taps
  // again gets a second assignment, which is legitimate.
  function handleRepeat() {
    if (disabled) return;
    setMenuOpen(false);
    onAssignAgain();
  }

  // Single tap, no confirm dialog — filing is reversible in one tap the other
  // way, so a modal would be ceremony over a decision that costs nothing to
  // undo. Contrast handleRemove, which is a real delete and keeps its dialog.
  function handleMove() {
    if (disabled) return;
    setMenuOpen(false);
    if (isFiled) onMoveToNew();
    else onArchive();
  }

  function handleSaveAmount() {
    if (!editTarget || editTarget < 1) return;
    startTransition(async () => {
      const result = await updateAssignmentTarget(assignmentId, editTarget);
      if (result.ok) {
        setEditOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center self-stretch">
      {/* relative wraps just the button so the dropdown anchors to the icon
          (top-full = directly below it), matching the header dropdown — not
          the full-height card column. */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center py-2 pl-0 pr-2.5 text-[#52576a] hover:text-reps-ink transition-colors"
          aria-label="Assignment options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <MoreVertical size={18} strokeWidth={2} />
        </button>

        {menuOpen && (
          <>
            {/* Click-away layer closes the menu on any outside tap. */}
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setMenuOpen(false)}
            />
            <div role="menu" className={MENU_PANEL}>
              {isDone ? (
                // Finished: reassign, or move between tabs. No delete — see the
                // note on the component.
                <>
                  <button
                    role="menuitem"
                    onClick={handleRepeat}
                    disabled={isPending}
                    className={MENU_ITEM}
                  >
                    <RotateCcw {...ICON} />
                    {isPending ? "Assigning…" : "Assign again"}
                  </button>
                  {/* Left/right arrows rather than an archive or file glyph: the
                      two tabs sit side by side with New on the left, so the
                      direction of travel is the thing worth drawing. */}
                  <button
                    role="menuitem"
                    onClick={handleMove}
                    disabled={isPending}
                    className={`${MENU_ITEM} ${MENU_DIVIDER}`}
                  >
                    {isFiled ? <ArrowLeft {...ICON} /> : <ArrowRight {...ICON} />}
                    {isFiled ? "Move back to New" : "Archive"}
                  </button>
                </>
              ) : (
                // Unfinished: correct it, or delete it outright. Delete keeps its
                // confirm dialog — it is the one genuinely destructive action
                // left on this menu.
                <>
                  {!hasProgress && (
                    <button role="menuitem" onClick={openEdit} className={MENU_ITEM}>
                      <Pencil {...ICON} />
                      Edit amount
                    </button>
                  )}
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmOpen(true);
                    }}
                    // Divider only when "Edit amount" rendered above it —
                    // otherwise this is the first row and needs no rule.
                    className={`${MENU_ITEM_BASE} text-red-400 ${!hasProgress ? MENU_DIVIDER : ""}`}
                  >
                    <Trash2 {...ICON} />
                    Delete assignment
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-assignment-title"
            className="w-full max-w-[320px] bg-reps-card border border-reps-line rounded-[16px] px-7 pt-7 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-assignment-title" className="text-[16px] font-semibold text-reps-ink mb-2">
              Delete {exerciseName}?
            </h2>
            <p className="text-[13px] text-reps-sub mb-7">
              This deletes the assignment. Their progress is kept.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 min-h-[44px] rounded-[10px] border border-reps-line text-reps-ink font-medium text-[15px] hover:bg-reps-raised transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={disabled}
                className="flex-1 min-h-[44px] rounded-[10px] bg-red-500 text-white font-semibold text-[15px] hover:bg-red-400 disabled:opacity-50 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70"
          onClick={() => setEditOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-amount-title"
            className="w-full max-w-[320px] bg-reps-card border border-reps-line rounded-[16px] px-7 pt-7 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-amount-title" className="text-[16px] font-semibold text-reps-ink mb-1">
              {exerciseName}
            </h2>
            <p className="text-[13px] text-reps-sub mb-5">{EDIT_SUBTITLE[goalType]}</p>

            {goalPresets.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {goalPresets.map((n) => {
                  const active = !editCustom && editTarget === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => { setEditTarget(n); setEditCustom(false); }}
                      className={`flex-1 py-3 rounded-[10px] text-[14px] font-medium border transition-all ${
                        active
                          ? "bg-reps-orange/10 border-reps-orange/30 text-reps-orange"
                          : "bg-reps-bg border-reps-line text-reps-ink hover:border-reps-line-hi"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            )}

            {editCustom ? (
              <input
                type="number"
                min={1}
                value={editTarget}
                onChange={(e) => setEditTarget(parseInt(e.target.value) || 0)}
                autoFocus
                className="w-full bg-reps-bg border border-reps-line rounded-[10px] px-[14px] py-3 text-lg text-center text-reps-ink outline-none focus:border-[#378add] transition-colors"
              />
            ) : (
              goalPresets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setEditCustom(true)}
                  className="text-[13px] text-reps-sub hover:text-reps-ink transition-colors"
                >
                  + enter your own
                </button>
              )
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditOpen(false)}
                className="flex-1 min-h-[44px] rounded-[10px] border border-reps-line text-reps-ink font-medium text-[15px] hover:bg-reps-raised transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAmount}
                disabled={isPending}
                className="flex-1 min-h-[44px] rounded-[10px] bg-[#378add] text-white font-semibold text-[15px] hover:bg-[#4a9ae8] disabled:opacity-50 transition-colors"
              >
                {isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
