"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fileFinishedAssignments } from "./actions";

type Props = {
  playerId: string;
};

// The bulk control under the all-done banner: move every finished, still-unfiled
// assignment into the Archive tab.
//
// ⚠️ This used to be "Clear finished", which DELETED those rows — and took the
// meaning of every log pointing at them with it, since logs.assignment_id is
// ON DELETE SET NULL. Filing replaces deleting outright: nothing is destroyed,
// the cards simply move, and any of them can be moved back one tap at a time.
//
// Because it is non-destructive it is a single tap with no bottom sheet. The
// sheet existed to make a coach pause before an irreversible delete; there is
// nothing left here to pause over, and keeping it would be ceremony implying a
// risk that no longer exists.
export default function AllDoneActions({ playerId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState("");

  function handleFile() {
    if (isPending) return;
    startTransition(async () => {
      const result = await fileFinishedAssignments(playerId);
      if (!result.ok) {
        setToast(result.error);
        setTimeout(() => setToast(""), 3000);
        return;
      }
      // The count is worth saying: the cards leave the tab the coach is looking
      // at, so without it a successful move looks much like nothing happening.
      setToast(result.moved === 1 ? "Archived 1" : `Archived ${result.moved}`);
      setTimeout(() => setToast(""), 2500);
      router.refresh();
    });
  }

  return (
    <>
      {/* No positioning of its own — it renders inside AllDonePanel, which owns
          the spacing and already centres its contents.

          Plain muted text, not a bordered button: this is the same treatment the
          original "Clear finished" link had, and --reps-label is a clear step up
          from the background while staying obviously secondary to the
          "+ Assign new work" CTA pinned at the bottom of the screen. A bordered
          button here was a pattern the app uses nowhere else, and it competed
          with that CTA. */}
      <button
        type="button"
        onClick={handleFile}
        disabled={isPending}
        className="text-[13px] text-[var(--reps-label)] hover:text-reps-ink transition-colors py-1 disabled:opacity-50 disabled:pointer-events-none"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* "Archive it", not "Archive everything" — the headline directly above
            already says "everything", and repeating it read as a stutter. */}
        {isPending ? "Archiving…" : "Archive it"}
      </button>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-reps-raised border border-reps-line rounded-[10px] px-5 py-3 text-[14px] text-reps-sub shadow-xl">
          {toast}
        </div>
      )}
    </>
  );
}
