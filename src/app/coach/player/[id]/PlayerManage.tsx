"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePlayer, updatePlayerPhone, resendPlayerLink } from "./actions";

type Props = {
  playerId: string;
  playerName: string;
  playerPhone: string;
  playerToken: string;
};

export default function PlayerManage({ playerId, playerName, playerPhone, playerToken }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Menu visibility
  const [menuOpen, setMenuOpen] = useState(false);

  // Edit phone
  const [editingPhone, setEditingPhone] = useState(false);
  const [phone, setPhone] = useState(playerPhone);
  const [phoneError, setPhoneError] = useState("");

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Resend feedback
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

  function handleEditPhone() {
    setMenuOpen(false);
    setEditingPhone(true);
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
    startTransition(async () => {
      await deletePlayer(playerId);
    });
  }

  const playerLink = `https://assignreps.com/player/${playerToken}`;

  return (
    <>
      {/* Menu button */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="text-[#8a8a8e] text-[22px] leading-none px-2 hover:text-[#e8e8ea] transition-colors"
          aria-label="Player options"
        >
          ···
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-8 z-20 bg-[#1e1e20] border border-[#2a2a2c] rounded-[10px] shadow-xl min-w-[180px] overflow-hidden">
              {/* Copy link */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(playerLink);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-[14px] text-[#e8e8ea] hover:bg-[#2a2a2c] transition-colors"
              >
                Copy player link
              </button>
              {/* Resend SMS */}
              <button
                onClick={handleResend}
                className="w-full text-left px-4 py-3 text-[14px] text-[#e8e8ea] hover:bg-[#2a2a2c] transition-colors border-t border-[#2a2a2c]"
              >
                Resend link via SMS
              </button>
              {/* Edit phone */}
              <button
                onClick={handleEditPhone}
                className="w-full text-left px-4 py-3 text-[14px] text-[#e8e8ea] hover:bg-[#2a2a2c] transition-colors border-t border-[#2a2a2c]"
              >
                Edit phone number
              </button>
              {/* Delete */}
              <button
                onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                className="w-full text-left px-4 py-3 text-[14px] text-red-400 hover:bg-[#2a2a2c] transition-colors border-t border-[#2a2a2c]"
              >
                Remove player
              </button>
            </div>
          </>
        )}
      </div>

      {/* Resend toast */}
      {resendState !== "idle" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1e1e20] border border-[#2a2a2c] rounded-[10px] px-5 py-3 text-[14px] shadow-xl">
          {resendState === "sending" && <span className="text-[#8a8a8e]">Sending…</span>}
          {resendState === "done" && <span className="text-[#4ade80]">Link sent ✓</span>}
          {resendState === "error" && <span className="text-red-400">Failed to send.</span>}
        </div>
      )}

      {/* Edit phone modal */}
      {editingPhone && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
          <div className="bg-[#1e1e20] border border-[#2a2a2c] rounded-t-[16px] w-full max-w-[390px] p-6 pb-10">
            <h2 className="text-[17px] font-semibold text-[#e8e8ea] mb-4">Edit phone number</h2>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#2a2a2c] border border-[#3a3a3c] rounded-[10px] px-4 py-3 text-[15px] text-[#e8e8ea] placeholder:text-[#5a5a5e] outline-none focus:border-[#ff7a3d] transition-colors mb-1"
              placeholder="+1 555 000 0000"
            />
            {phoneError && <p className="text-[12px] text-red-400 mb-3">{phoneError}</p>}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setEditingPhone(false); setPhone(playerPhone); setPhoneError(""); }}
                className="flex-1 py-3 text-[15px] text-[#8a8a8e] border border-[#2a2a2c] rounded-[10px] hover:bg-[#2a2a2c] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePhone}
                disabled={isPending}
                className="flex-1 py-3 text-[15px] font-semibold text-[#0f0f10] bg-[#ff7a3d] rounded-[10px] hover:bg-[#ff8a52] disabled:opacity-50 transition-colors"
              >
                {isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
          <div className="bg-[#1e1e20] border border-[#2a2a2c] rounded-t-[16px] w-full max-w-[390px] p-6 pb-10">
            <h2 className="text-[17px] font-semibold text-[#e8e8ea] mb-2">Remove {playerName}?</h2>
            <p className="text-[14px] text-[#8a8a8e] mb-6">
              This will delete all their assignments and logs. This can&apos;t be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-3 text-[15px] text-[#8a8a8e] border border-[#2a2a2c] rounded-[10px] hover:bg-[#2a2a2c] transition-colors"
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
