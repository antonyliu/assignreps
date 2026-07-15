"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePlayer, updatePlayerPhone, resendPlayerLink } from "./actions";

type Props = {
  playerId: string;
  playerName: string;
  playerPhone: string;
  playerToken: string;
  studentLabel: string;
};

export default function PlayerManage({ playerId, playerName, playerPhone, playerToken, studentLabel }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [menuOpen, setMenuOpen]       = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phone, setPhone]             = useState(playerPhone);
  const [phoneError, setPhoneError]   = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "done" | "error">("idle");

  function handleResend() {
    setMenuOpen(false);
    setResendState("sending");
    startTransition(async () => {
      const result = await resendPlayerLink(playerId);
      setResendState(result.ok ? "done" : "error");
      setTimeout(() => setResendState("idle"), 3000);
    });
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

  const playerLink = `https://assignreps.com/student/${playerToken}`;

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="text-reps-sub text-[22px] leading-none px-2 hover:text-reps-ink transition-colors"
          aria-label="Student options"
        >
          ···
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-8 z-20 bg-reps-raised border border-reps-line rounded-[10px] shadow-xl min-w-[180px] overflow-hidden">
              <button
                onClick={() => { navigator.clipboard.writeText(playerLink); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 text-[14px] text-reps-ink hover:bg-reps-line transition-colors"
              >
                Copy {studentLabel} link
              </button>
              <button
                onClick={handleResend}
                className="w-full text-left px-4 py-3 text-[14px] text-reps-ink hover:bg-reps-line transition-colors border-t border-reps-line"
              >
                Resend link via SMS
              </button>
              <button
                onClick={() => { setMenuOpen(false); setEditingPhone(true); }}
                className="w-full text-left px-4 py-3 text-[14px] text-reps-ink hover:bg-reps-line transition-colors border-t border-reps-line"
              >
                Edit phone number
              </button>
              <button
                onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                className="w-full text-left px-4 py-3 text-[14px] text-red-400 hover:bg-reps-line transition-colors border-t border-reps-line"
              >
                Remove {studentLabel}
              </button>
            </div>
          </>
        )}
      </div>

      {resendState !== "idle" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-reps-raised border border-reps-line rounded-[10px] px-5 py-3 text-[14px] shadow-xl">
          {resendState === "sending" && <span className="text-reps-sub">Sending…</span>}
          {resendState === "done"    && <span className="text-reps-green">Link sent ✓</span>}
          {resendState === "error"   && <span className="text-red-400">Failed to send.</span>}
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
                className="flex-1 py-3 text-[15px] font-semibold text-reps-bg bg-reps-orange rounded-[10px] hover:bg-reps-orange-hi disabled:opacity-50 transition-colors"
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
