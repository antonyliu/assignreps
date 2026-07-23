"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearCompletedAssignments } from "./actions";

type Props = {
  playerId: string;
  firstName: string;
};

export default function AllDoneActions({ playerId, firstName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetIn, setSheetIn] = useState(false);
  const [error, setError] = useState("");

  // Slide the sheet up once it has mounted.
  useEffect(() => {
    if (!modalOpen) return;
    const id = requestAnimationFrame(() => setSheetIn(true));
    return () => cancelAnimationFrame(id);
  }, [modalOpen]);

  function openModal() {
    setError("");
    setSheetIn(false);
    setModalOpen(true);
  }

  function closeModal() {
    setSheetIn(false);
    setModalOpen(false);
  }

  function handleClear() {
    setError("");
    startTransition(async () => {
      const result = await clearCompletedAssignments(playerId);
      if (!result.ok) { setError(result.error); return; }
      setSheetIn(false);
      setModalOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex justify-center mb-6">
        <button
          type="button"
          onClick={openModal}
          className="text-[13px] text-[#454a5b] hover:text-reps-sub transition-colors py-1"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          Clear completed
        </button>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={closeModal}
        >
          <div
            className={`bg-[#1c1f26] rounded-t-[16px] w-full max-w-[390px] p-6 transition-transform duration-200 ease-out ${sheetIn ? "translate-y-0" : "translate-y-full"}`}
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[17px] font-semibold text-reps-ink mb-2">
              Clear {firstName}&apos;s assignments?
            </h2>
            <p className="text-[14px] text-reps-sub mb-6">
              Their progress is saved. This just clears the current list so you can start fresh.
            </p>
            {error && <p className="text-[12px] text-red-400 mb-3">{error}</p>}
            <button
              type="button"
              onClick={handleClear}
              disabled={isPending}
              className="w-full text-center bg-[#6bd63d1a] border border-[#6bd63d] text-[#6bd63d] font-semibold text-[15px] py-[14px] rounded-[10px] disabled:opacity-50 transition-colors mb-2"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {isPending ? "Clearing…" : "Clear completed"}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="w-full text-center text-[#8a8fa8] font-medium text-[15px] py-3"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
