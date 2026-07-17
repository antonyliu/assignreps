"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { deletePlayer, updatePlayerPhone } from "./actions";

type Props = {
  playerId: string;
  playerName: string;
  playerPhone: string;
  playerToken: string;
};

export default function PlayerManage({ playerId, playerName, playerPhone, playerToken }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [menuOpen, setMenuOpen]           = useState(false);
  const [editingPhone, setEditingPhone]   = useState(false);
  const [phone, setPhone]                 = useState(playerPhone);
  const [phoneError, setPhoneError]       = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast]                 = useState("");

  const firstName = playerName.trim().split(/\s+/)[0] || playerName.trim();
  const playerLink = `https://assignreps.com/student/${playerToken}`;

  async function handleShare() {
    setMenuOpen(false);
    // iOS/Android native share sheet when available.
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        // Only pass url — a `text` field gets concatenated onto the URL by
        // many share targets, producing a malformed link.
        await navigator.share({ title: "Reps", url: playerLink });
        return;
      }
    } catch {
      // Share sheet dismissed/cancelled — nothing more to do.
      return;
    }
    // No native share (e.g. desktop) — fall back to copying the link.
    try {
      await navigator.clipboard.writeText(playerLink);
      setToast("Link copied");
    } catch {
      setToast("Couldn't copy link");
    }
    setTimeout(() => setToast(""), 2500);
  }

  function handleSavePhone() {
    const trimmed = phone.trim();
    if (!trimmed) { setPhoneError("Phone number required."); return; }
    setPhoneError("");
    startTransition(async () => {
      const result = await updatePlayerPhone(playerId, trimmed);
      if (result.ok) {
        setEditingPhone(false);
        router.refresh();
      } else {
        setPhoneError(result.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => { await deletePlayer(playerId); });
  }

  return (
    <>
      <div className="relative shrink-0">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center justify-center w-9 h-9 rounded-[8px] border border-[rgba(42,45,54,0.4)] bg-[rgba(28,31,38,0.3)] text-reps-sub hover:text-reps-ink hover:bg-[rgba(28,31,38,0.6)] transition-colors"
          aria-label="Student options"
        >
          <MoreHorizontal size={20} strokeWidth={2} />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-8 z-20 bg-reps-raised border border-reps-line rounded-[10px] shadow-xl min-w-[180px] overflow-hidden">
              <button
                onClick={handleShare}
                className="w-full text-left px-4 py-3 text-[14px] text-reps-ink hover:bg-reps-line transition-colors"
              >
                Share homework link
              </button>
              <button
                onClick={() => { setMenuOpen(false); setEditingPhone(true); }}
                className="w-full text-left px-4 py-3 text-[14px] text-reps-ink hover:bg-reps-line transition-colors"
              >
                Edit phone number
              </button>
              <button
                onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                className="w-full text-left px-4 py-3 text-[14px] text-red-400 hover:bg-reps-line transition-colors"
              >
                Remove {firstName}
              </button>
            </div>
          </>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-reps-raised border border-reps-line rounded-[10px] px-5 py-3 text-[14px] text-reps-sub shadow-xl">
          {toast}
        </div>
      )}

      {editingPhone && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
          <div className="bg-reps-raised border border-reps-line rounded-t-[16px] w-full max-w-[390px] p-6 pb-10">
            <h2 className="text-[17px] font-semibold text-reps-ink mb-4">Edit phone number</h2>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-reps-card border border-reps-line rounded-[10px] px-4 py-3 text-[15px] text-reps-ink placeholder:text-reps-dim outline-none focus:border-reps-orange transition-colors mb-1"
              placeholder="+1 555 000 0000"
            />
            {phoneError && <p className="text-[12px] text-red-400 mb-3">{phoneError}</p>}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setEditingPhone(false); setPhone(playerPhone); setPhoneError(""); }}
                className="flex-1 py-3 text-[15px] text-reps-sub border border-reps-line rounded-[10px] hover:bg-reps-line transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePhone}
                disabled={isPending}
                className="flex-1 py-3 text-[15px] font-semibold text-white bg-reps-orange rounded-[10px] hover:bg-reps-orange-hi disabled:opacity-50 transition-colors"
              >
                {isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
          <div className="bg-reps-raised border border-reps-line rounded-t-[16px] w-full max-w-[390px] p-6 pb-10">
            <h2 className="text-[17px] font-semibold text-reps-ink mb-2">Remove {playerName}?</h2>

            <p className="text-[14px] text-reps-sub mb-6">
              This will delete all their assignments and logs. This can&apos;t be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-3 text-[15px] text-reps-sub border border-reps-line rounded-[10px] hover:bg-reps-line transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-3 text-[15px] font-semibold text-white bg-red-500 rounded-[10px] hover:bg-red-400 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
