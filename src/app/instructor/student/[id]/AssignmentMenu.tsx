"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { GOAL_PRESETS } from "@/lib/exercises";
import type { GoalType } from "@/lib/exercises";
import { deleteAssignment, updateAssignmentTarget } from "./actions";

type Props = {
  assignmentId: string;
  exerciseName: string;
  target: number;
  /** The exercise's own category presets — the row for a 'reps' goal. The other
   *  goals count something else and bring their own scale, see GOAL_PRESETS. */
  presets: number[];
  goalType: GoalType;
  hasProgress: boolean;
};

// What the target means, per goal. "Edit amount" is only honest for attempts —
// on a makes or streak assignment it left the coach guessing which number the
// row was asking for.
const EDIT_SUBTITLE: Record<GoalType, string> = {
  reps: "Edit amount",
  makes: "Edit target makes",
  consecutive: "Edit streak goal",
};

// Per-card overflow menu: a vertical three-dot trigger sitting in its own
// column. "Remove assignment" is always available (gated behind a confirm
// dialog). "Edit amount" appears only when the assignment has no logged
// progress yet, and updates the target silently (no SMS).
export default function AssignmentMenu({ assignmentId, exerciseName, target, presets, goalType, hasProgress }: Props) {
  const router = useRouter();
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

  function handleRemove() {
    startTransition(async () => {
      const result = await deleteAssignment(assignmentId);
      if (result.ok) {
        setConfirmOpen(false);
        router.refresh();
      }
    });
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
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 z-50 w-max bg-reps-card border border-reps-line rounded-[10px] p-1 shadow-lg shadow-black/40"
            >
              {!hasProgress && (
                <button
                  role="menuitem"
                  onClick={openEdit}
                  className="flex items-center w-full h-9 px-3 rounded-[7px] text-left text-[14px] text-reps-ink whitespace-nowrap hover:bg-reps-raised transition-colors"
                >
                  Edit amount
                </button>
              )}
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmOpen(true);
                }}
                className="flex items-center w-full h-9 px-3 rounded-[7px] text-left text-[14px] text-red-400 whitespace-nowrap hover:bg-reps-raised transition-colors"
              >
                Remove assignment
              </button>
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
            aria-labelledby="remove-assignment-title"
            className="w-full max-w-[320px] bg-reps-card border border-reps-line rounded-[16px] px-7 pt-7 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="remove-assignment-title" className="text-[16px] font-semibold text-reps-ink mb-2">
              Remove {exerciseName}?
            </h2>
            <p className="text-[13px] text-reps-sub mb-7">
              This deletes the assignment. Logged progress is kept.
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
                disabled={isPending}
                className="flex-1 min-h-[44px] rounded-[10px] bg-red-500 text-white font-semibold text-[15px] hover:bg-red-400 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Removing…" : "Remove"}
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
