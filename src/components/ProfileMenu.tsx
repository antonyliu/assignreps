"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { User } from "lucide-react";
import { useUpgrade } from "@/lib/use-upgrade";

// The display name is what students and parents see — "[Coach] assigned you
// basketball homework" in the SMS, "[Coach] will see this" on the celebrate
// screen, and the header of the parent digest. The roster itself no longer
// prints it, so this menu is the only place it is visible to the coach.

// Profile control: a person silhouette on the right of the header, in a
// contained circle echoing the roster's student avatars (26px, #252830 on a
// hairline #2a2d36) so the header's right end matches the rows below it. It is
// the only thing on that side — the coach's name used to sit beside it in the
// header, and now appears at the top of the dropdown instead, where it labels
// the account the actions below belong to. "Sign out" is gated behind a
// confirmation dialog so an accidental tap can't end the session.
export default function ProfileMenu({
  coachName,
  // Whether the coach is on a paid plan. Decided by isEntitled() on the server
  // — the same helper the add-student gate uses, so this menu and the paywall
  // can never disagree about what "Pro" means.
  isPro,
}: {
  coachName: string;
  isPro: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(coachName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Shared with the add-student paywall so the two upgrade entry points cannot
  // drift in behaviour — see src/lib/use-upgrade.ts. The menu stays open while
  // it runs; the item reports progress rather than appearing to do nothing.
  const { startUpgrade, upgrading, upgradeError } = useUpgrade();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  function openEdit() {
    setMenuOpen(false);
    setDraft(coachName);
    setError("");
    setEditOpen(true);
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    const next = draft.trim();
    if (!next) {
      setError("Enter a name.");
      return;
    }
    if (next === coachName.trim()) {
      setEditOpen(false);
      return;
    }
    setSaving(true);
    setError("");

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSaving(false);
      setError("You're signed out. Sign in again to change your name.");
      return;
    }

    // .select() is load-bearing, not decoration. An UPDATE that no RLS policy
    // permits comes back 200 with zero rows rather than as an error, so without
    // asking for the row back this would report success while saving nothing.
    const { data, error: updateError } = await supabase
      .from("coaches")
      .update({ name: next })
      .eq("id", auth.user.id)
      .select("name");

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    if (!data || data.length === 0) {
      setError("Couldn't save that name. Your account may not have permission to change it.");
      return;
    }

    setEditOpen(false);
    // The name is server-rendered on the screens that show it, so re-fetch
    // rather than trusting local state to match what students will see.
    router.refresh();
  }

  return (
    <>
      <div className="relative">
        {/* The tap target and the visible circle are deliberately different
            sizes: 44px is the minimum a thumb should have to find on a court,
            but a 44px disc reads as a button competing with the logo. So the
            button stays 44px and transparent while the mark inside is 26px.
            The -9px margins pull the visible circle back onto the page gutter
            horizontally, and vertically collapse the row to the 26px circle
            instead of the 44px target — otherwise the invisible padding would
            set the height of the whole top bar. The target keeps its full 44px
            for the thumb either way.

            The margin is half the difference between the two sizes, so it is
            derived from the circle and has to move with it: at 26px that is
            (44-26)/2 = 9. Leaving it at the old 7 would inset the circle 2px
            from the gutter and leave the row 2px taller than the circle. */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="group flex items-center justify-center shrink-0 -mr-[9px] -my-[9px]"
          style={{ width: 44, height: 44, WebkitTapHighlightColor: "transparent" }}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Profile menu"
        >
          <span
            className="flex items-center justify-center rounded-full transition-transform group-active:scale-[0.95]"
            style={{
              width: 26,
              height: 26,
              background: "#252830",
              border: "0.5px solid #2a2d36",
            }}
          >
            <User size={16} color="#8a8fa8" strokeWidth={2} />
          </span>
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
                on all sides — the pattern future menu items should follow. The
                max-width is what makes the name below truncatable: under w-max
                alone the box would simply grow to fit any name and the ellipsis
                would never appear. Names are expected to be short ("Coach RJ",
                "Debbie", "Mr. Chen"), which leaves the two menu items setting
                the width at ~98px. The cap is deliberately close to that rather
                than generous — at 200px a name like "RJW Skills & Development"
                still fitted and simply stretched the menu to 183px, which is the
                oversized shape this is meant to avoid; at 160px it truncates
                instead and the menu stays compact.

                ⚠️ "Upgrade to Pro" is now the widest item, so the panel sits
                wider at rest than the ~98px above and a long name truncates
                slightly later. Still inside the 160px cap. The width therefore
                varies with isPro: a Pro coach sees the original narrower menu,
                because the item is removed rather than disabled. */}
            <div
              role="menu"
              className="absolute right-0 top-full mt-1.5 z-50 w-max max-w-[160px] bg-reps-card border border-reps-line rounded-[10px] p-1 shadow-lg shadow-black/40"
            >
              {/* Identity, not an action: a plain div, so it is neither tappable
                  nor focusable, and role="presentation" keeps it out of the
                  menu's item list for screen readers. Guarded because the roster
                  passes "" when the coach row has no name — an empty string here
                  would render a blank line above a stray divider. `title` keeps
                  the full name reachable on hover once it truncates. */}
              {coachName && (
                <>
                  <div
                    role="presentation"
                    title={coachName}
                    className="px-3 pt-1.5 pb-2 text-[12px] text-[#8a8fa8] truncate"
                  >
                    {coachName}
                  </div>
                  {/* Inset by the menu's own p-1 rather than bled to the edges
                      with a negative margin — the bleed pattern is what has been
                      failing on iOS elsewhere in this header, and 4px of inset
                      reads as deliberate in a rounded card. */}
                  <div
                    role="presentation"
                    className="h-px mb-1"
                    style={{ background: "#2a2d36" }}
                  />
                </>
              )}
              {/* First, above Edit name, with Sign out staying last — that is
                  the one action a thumb should not find by accident.

                  ⚠️ Hidden entirely for a coach already on a paid plan rather
                  than shown disabled: offering "Upgrade" to someone who has
                  already upgraded is worse than offering nothing. Managing an
                  existing subscription is a separate action (Billing Portal)
                  and is not built yet, so a Pro coach currently sees the menu
                  exactly as it was before this feature. */}
              {!isPro && (
                <>
                  <button
                    role="menuitem"
                    onClick={startUpgrade}
                    disabled={upgrading}
                    className="flex items-center w-full h-9 px-3 rounded-[7px] text-left text-[14px] text-reps-ink whitespace-nowrap hover:bg-reps-raised transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {upgrading ? "Starting…" : "Upgrade to Pro"}
                  </button>
                  {/* Inline rather than a toast: this menu has no toast, and the
                      errors reachable here are configuration problems a coach
                      cannot act on beyond retrying. Wraps rather than truncating
                      so the message is actually readable in a 160px panel. */}
                  {upgradeError && (
                    <p className="px-3 pb-1.5 text-[12px] leading-snug text-red-400 whitespace-normal">
                      {upgradeError}
                    </p>
                  )}
                </>
              )}
              <button
                role="menuitem"
                onClick={openEdit}
                className="flex items-center w-full h-9 px-3 rounded-[7px] text-left text-[14px] text-reps-ink whitespace-nowrap hover:bg-reps-raised transition-colors"
              >
                Edit name
              </button>
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

      {editOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70"
          onClick={() => !saving && setEditOpen(false)}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="editname-title"
            className="w-full max-w-[320px] bg-reps-card border border-reps-line rounded-[16px] px-7 pt-7 pb-8"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveName}
          >
            <h2 id="editname-title" className="text-[16px] font-semibold text-reps-ink mb-2">
              Edit name
            </h2>
            {/* Mirrors the signup question, so the field means the same thing in
                both places rather than reading as an account/legal name here. */}
            <p className="text-[13px] text-reps-sub mb-5">
              What should students call you?
            </p>
            <input
              type="text"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. Coach RJ"
              className="w-full bg-reps-bg border border-reps-line rounded-[10px] px-[14px] py-3 text-[15px] text-reps-ink placeholder:text-[#5a5f72] outline-none focus:border-[#378add] transition-colors mb-2"
            />
            <p className="text-[12px] text-reps-sub mb-6 min-h-[16px]">
              {error ? <span className="text-red-400">{error}</span> : "Students and parents see this name."}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                disabled={saving}
                className="flex-1 min-h-[44px] rounded-[10px] border border-reps-line text-reps-ink font-medium text-[15px] hover:bg-reps-raised transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !draft.trim()}
                className="flex-1 min-h-[44px] rounded-[10px] bg-reps-orange text-white font-semibold text-[15px] hover:bg-reps-orange-hi transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

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
