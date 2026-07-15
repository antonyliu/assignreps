"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { User } from "lucide-react";

// Top-right profile control: a person silhouette + the coach's name, tappable.
// Tapping opens a dropdown with a large "Sign out" target; sign out is gated
// behind a confirmation dialog so an accidental tap can't end the session.
export default function ProfileMenu({ name }: { name: string }) {
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
          className="flex items-center gap-2 min-h-[44px] pl-1.5 pr-2.5 rounded-[10px] hover:bg-reps-card active:scale-[0.98] transition-all"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Profile menu"
        >
          <User size={20} color="#378add" strokeWidth={2} />
          <span className="text-[14px] font-medium text-reps-sub">{name}</span>
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
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 z-50 min-w-[190px] bg-reps-card border border-reps-line rounded-[12px] p-1.5 shadow-xl shadow-black/40"
            >
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmOpen(true);
                }}
                className="flex items-center w-full min-h-[44px] px-3 rounded-[8px] text-left text-[15px] text-reps-ink hover:bg-reps-raised transition-colors"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-title"
            className="w-full max-w-[320px] bg-reps-card border border-reps-line rounded-[16px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="signout-title" className="text-[18px] font-semibold text-reps-ink mb-1.5">
              Sign out?
            </h2>
            <p className="text-[14px] text-reps-sub mb-6">
              You can always sign back in with your email.
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
                className="flex-1 min-h-[44px] rounded-[10px] bg-reps-orange text-reps-bg font-semibold text-[15px] hover:bg-reps-orange-hi transition-colors"
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
