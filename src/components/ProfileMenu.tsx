"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { User } from "lucide-react";

// Profile control: a person silhouette icon on the right of the header (the
// coach's name is shown separately on the left, display-only). Tapping the
// icon opens a compact dropdown whose "Sign out" is gated behind a
// confirmation dialog so an accidental tap can't end the session.
export default function ProfileMenu() {
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center justify-center w-9 h-9 -mr-1 rounded-full hover:bg-reps-card active:scale-[0.95] transition-all"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Profile menu"
        >
          <User size={20} color="#378add" strokeWidth={2} />
        </button>

        {menuOpen && (
          <>
            {/* Full-screen click-away layer so a tap anywhere closes the menu. */}
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setMenuOpen(false)}
            />
            {/* Sizes to its widest item (no fixed width) with equal p-1 padding
                on all sides — the pattern future menu items should follow. */}
            <div
              role="menu"
              className="absolute right-0 top-full mt-1.5 z-50 w-max bg-reps-card border border-reps-line rounded-[10px] p-1 shadow-lg shadow-black/40"
            >
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmOpen(true);
                }}
                className="flex items-center w-full h-9 px-3 rounded-[7px] text-left text-[14px] text-reps-ink whitespace-nowrap hover:bg-reps-raised transition-colors"
              >
                Sign out
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
            aria-labelledby="signout-title"
            className="w-full max-w-[320px] bg-reps-card border border-reps-line rounded-[16px] px-7 pt-7 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="signout-title" className="text-[16px] font-semibold text-reps-ink mb-2">
              Sign out?
            </h2>
            <p className="text-[13px] text-reps-sub mb-7">
              Sign back in anytime with your email.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 min-h-[44px] rounded-[10px] border border-reps-line text-reps-ink font-medium text-[15px] hover:bg-reps-raised transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 min-h-[44px] rounded-[10px] bg-reps-orange text-white font-semibold text-[15px] hover:bg-reps-orange-hi transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
