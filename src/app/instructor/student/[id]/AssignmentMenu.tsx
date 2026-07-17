"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { deleteAssignment } from "./actions";

type Props = {
  assignmentId: string;
  exerciseName: string;
};

// Per-card overflow menu: a vertical three-dot trigger sitting in its own
// column (the card gives it a left border) with a single "Remove assignment"
// action. Removal is gated behind a confirmation dialog that mirrors the
// sign-out confirmation pattern.
export default function AssignmentMenu({ assignmentId, exerciseName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleRemove() {
    startTransition(async () => {
      const result = await deleteAssignment(assignmentId);
      if (result.ok) {
        setConfirmOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="relative flex items-center self-stretch border-l border-reps-line">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex h-full items-center px-2.5 text-reps-sub hover:text-reps-ink transition-colors"
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
    </div>
  );
}
