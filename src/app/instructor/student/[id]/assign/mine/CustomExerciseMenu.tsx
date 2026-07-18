"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { deleteCustomExercise } from "./actions";

type Props = {
  exerciseId: string;
  exerciseName: string;
};

// Per-row overflow menu for a saved custom exercise: a vertical three-dot
// trigger with a single "Delete exercise" action, gated behind a centered
// confirmation modal (same pattern as the assignment-remove modal).
export default function CustomExerciseMenu({ exerciseId, exerciseName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCustomExercise(exerciseId);
      if (result.ok) {
        setConfirmOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center self-stretch">
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center py-[14px] px-3 text-[#52576a] hover:text-reps-ink transition-colors"
          aria-label="Exercise options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <MoreVertical size={18} strokeWidth={2} />
        </button>

        {menuOpen && (
          <>
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
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmOpen(true);
                }}
                className="flex items-center w-full h-9 px-3 rounded-[7px] text-left text-[14px] text-red-400 whitespace-nowrap hover:bg-reps-raised transition-colors"
              >
                Delete exercise
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
            aria-labelledby="delete-exercise-title"
            className="w-full max-w-[320px] bg-reps-card border border-reps-line rounded-[16px] px-7 pt-7 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-exercise-title" className="text-[16px] font-semibold text-reps-ink mb-2">
              Delete {exerciseName}?
            </h2>
            <p className="text-[13px] text-reps-sub mb-7">
              This removes it from your saved exercises. Existing assignments aren&apos;t affected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 min-h-[44px] rounded-[10px] border border-reps-line text-reps-ink font-medium text-[15px] hover:bg-reps-raised transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 min-h-[44px] rounded-[10px] bg-red-500 text-white font-semibold text-[15px] hover:bg-red-400 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
