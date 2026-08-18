"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { activatePlayer, deactivatePlayer, deletePlayer, updatePlayerPhone } from "./actions";
import { useUpgrade } from "@/lib/use-upgrade";

type Props = {
  playerId: string;
  playerName: string;
  playerPhone: string;
  playerToken: string;
  sendToParent: boolean;
  studentLabel: string;
  /** null = active, set = paused and when. Drives which of Deactivate/Activate
   *  the menu offers, and every "paused" affordance on this screen. */
  deactivatedAt: string | null;
  /** Unfinished work still in the New tab. Shown as an informational line in the
   *  deactivate modal — "Jalen has 2 open assignments" — so a coach knows what
   *  they are pausing. NOT a second confirmation step: deactivation is fully
   *  reversible, so the extra ceremony would imply a risk that does not exist. */
  openAssignmentCount: number;
};

export default function PlayerManage({
  playerId,
  playerName,
  playerPhone,
  playerToken,
  sendToParent,
  studentLabel,
  deactivatedAt,
  openAssignmentCount,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [menuOpen, setMenuOpen]           = useState(false);
  const [editingPhone, setEditingPhone]   = useState(false);
  const [phone, setPhone]                 = useState(playerPhone);
  const [toParent, setToParent]           = useState(sendToParent);
  const [phoneError, setPhoneError]       = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // The typed confirmation for permanent delete. Compared against the student's
  // first name rather than a generic word: typing "DELETE" proves you can read a
  // prompt, typing "Jalen" proves you know WHOSE history you are destroying.
  const [deleteTyped, setDeleteTyped]     = useState("");
  // Set when activatePlayer() refuses on the seat gate. Carries the server's own
  // message plus whether an upgrade is worth offering, so this modal never has
  // to re-derive the plan rule the action just applied.
  const [gate, setGate]                   = useState<{ error: string; canUpgrade: boolean } | null>(null);
  const [toast, setToast]                 = useState("");

  // The third consumer of the shared upgrade handler, after ProfileMenu and the
  // add-student paywall — reached when a free coach at 3 tries to bring someone
  // back. Exactly the drift this hook exists to prevent: the reactivate gate and
  // the add gate now start checkout identically.
  const { startUpgrade, upgrading, upgradeError } = useUpgrade();

  const isActive = !deactivatedAt;
  const firstName = playerName.trim().split(/\s+/)[0] || playerName.trim();
  const studentLabelCap = studentLabel.charAt(0).toUpperCase() + studentLabel.slice(1);
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
      const result = await updatePlayerPhone(playerId, trimmed, toParent);
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

  function handleDeactivate() {
    startTransition(async () => {
      const result = await deactivatePlayer(playerId);
      if (result.ok) {
        setConfirmDeactivate(false);
        router.refresh();
      } else {
        // Deactivating is never seat-gated — it only ever frees a seat — so
        // anything that fails here is a real error, not a limit.
        setConfirmDeactivate(false);
        setToast(result.error);
        setTimeout(() => setToast(""), 3500);
      }
    });
  }

  function handleActivate() {
    setMenuOpen(false);
    startTransition(async () => {
      const result = await activatePlayer(playerId);
      if (result.ok) { router.refresh(); return; }

      // ⚠️ No confirm on the way IN — activation is safe and reversible, so it
      // runs on the tap like Archive does. The modal only appears when the gate
      // refuses, which is the one outcome a coach has to read and act on.
      if (result.code === "limit_reached" || result.code === "ceiling_reached") {
        setGate({ error: result.error, canUpgrade: result.code === "limit_reached" });
        return;
      }
      setToast(result.error);
      setTimeout(() => setToast(""), 3500);
    });
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
            {/* ⚠️ Overflow-menu tier: z-40 for the click-away, z-50 for the
                panel — the same pair AssignmentMenu uses, because these are the
                same kind of control and must clear the same things.

                Both were 10/20 before the assignment list gained a sticky tab
                bar at z-20. That tie put the bar above this panel on DOM order
                alone (the bar comes later in the document), so the menu opened
                UNDERNEATH it. The click-away was worse: at z-10 it sat below the
                bar entirely, so tapping the bar with the menu open switched tabs
                instead of dismissing.

                Kept below the modals (z-[60]) and toasts (z-[70]) above. Any new
                sticky or pinned element on this screen has to stay under z-40 or
                it will swallow both menus again. */}
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            {/* ⚠️ max-w is what makes `truncate` on the name rows below work at
                all. The panel is absolutely positioned, so it sizes to its
                content: a nowrap row would simply widen it (and push it off the
                left edge on a narrow phone) rather than ellipsizing. The pair
                has to travel together — min-w sets the floor, max-w the point
                where a long name gives up characters instead of space. */}
            <div className="absolute right-0 top-8 z-50 bg-reps-raised border border-reps-line rounded-[10px] shadow-xl min-w-[180px] max-w-[240px] overflow-hidden">
              <button
                onClick={handleShare}
                className="w-full text-left px-4 py-3 text-[14px] text-reps-ink hover:bg-reps-line transition-colors"
              >
                Share homework link
              </button>
              <button
                onClick={() => { setMenuOpen(false); setEditingPhone(true); }}
                className="w-full text-left px-4 py-3 text-[14px] text-reps-ink hover:bg-reps-line transition-colors border-t border-reps-line"
              >
                Edit phone number
              </button>
              {/* ⚠️ All three name rows `truncate` rather than wrap. A long name
                  (seen on "Jamaroquai") broke each row onto two lines and made
                  the panel look broken. Losing the tail of the name costs
                  nothing here: the screen header directly above this menu shows
                  it in full, so the row only has to say WHICH action, not who.
                  Applied to all three, not just the one that happened to wrap —
                  they are the same string in three moods.

                  ⚠️ The SUGGESTED path, listed above Delete and in the panel's
                  normal ink rather than red. Deactivating is what a coach almost
                  always means when a student stops for a season, and it is fully
                  reversible; Delete below is the rare, irreversible one. Order
                  and colour are the whole of that steer — Delete is NOT hidden
                  behind deactivation, it stays one tap away from either state. */}
              {isActive ? (
                <button
                  onClick={() => { setMenuOpen(false); setConfirmDeactivate(true); }}
                  className="w-full truncate text-left px-4 py-3 text-[14px] text-reps-ink hover:bg-reps-line transition-colors border-t border-reps-line"
                >
                  Deactivate {firstName}
                </button>
              ) : (
                <button
                  onClick={handleActivate}
                  disabled={isPending}
                  className="w-full truncate text-left px-4 py-3 text-[14px] text-reps-ink hover:bg-reps-line transition-colors border-t border-reps-line disabled:opacity-50"
                >
                  {isPending ? "Activating…" : `Activate ${firstName}`}
                </button>
              )}
              {/* "Delete", not "Remove" — matching Delete assignment and Delete
                  exercise, and honest about what it does. The word changed; the
                  action did not. */}
              <button
                onClick={() => { setMenuOpen(false); setDeleteTyped(""); setConfirmDelete(true); }}
                className="w-full truncate text-left px-4 py-3 text-[14px] text-red-400 hover:bg-reps-line transition-colors border-t border-reps-line"
              >
                Delete {firstName}
              </button>
            </div>
          </>
        )}
      </div>

      {/* z-[70], matching the toasts in AssignmentMenu and AllDoneActions. Was
          z-50, which now ties with this file's own menu panel and sat below the
          modals — a "Link copied" raised behind an open dialog would simply not
          be seen. Toasts are the top layer on this screen. */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-reps-raised border border-reps-line rounded-[10px] px-5 py-3 text-[14px] text-reps-sub shadow-xl">
          {toast}
        </div>
      )}

      {editingPhone && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70"
          onClick={() => { setEditingPhone(false); setPhone(playerPhone); setToParent(sendToParent); setPhoneError(""); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-phone-title"
            className="w-full max-w-[320px] bg-reps-card border border-reps-line rounded-[16px] px-7 pt-7 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-phone-title" className="text-[16px] font-semibold text-reps-ink mb-2">
              Edit phone number
            </h2>
            <p className="text-[13px] text-reps-sub mb-4">Who gets the homework link?</p>

            {/* Player/Parent toggle — sets who the homework link is sent to. */}
            <div className="flex items-center gap-[2px] rounded-[8px] bg-reps-bg p-[3px] mb-4">
              {([["player", studentLabelCap], ["parent", "Parent"]] as [string, string][]).map(([value, label]) => {
                const active = (value === "parent") === toParent;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setToParent(value === "parent")}
                    className={`flex-1 rounded-[6px] py-[7px] text-[12px] font-medium transition-colors ${
                      active ? "bg-[#378add] text-white" : "text-reps-sub hover:text-reps-ink"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-reps-bg border border-reps-line rounded-[10px] px-4 py-3 text-[15px] text-reps-ink placeholder:text-reps-dim outline-none focus:border-[#378add] transition-colors"
              placeholder="(555) 000-0000"
            />
            {phoneError && <p className="text-[12px] text-red-400 mt-2">{phoneError}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setEditingPhone(false); setPhone(playerPhone); setToParent(sendToParent); setPhoneError(""); }}
                className="flex-1 min-h-[44px] rounded-[10px] border border-reps-line text-reps-ink font-medium text-[15px] hover:bg-reps-raised transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePhone}
                disabled={isPending}
                className="flex-1 min-h-[44px] rounded-[10px] bg-[#378add] text-white font-semibold text-[15px] hover:bg-[#4a9ae8] disabled:opacity-50 transition-colors"
              >
                {isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEACTIVATE — friendly, and explicit that nothing is lost. Warm before
          mechanical, the same order the add-student paywall uses.

          One modal, one step. The open-assignment line below is INFORMATIONAL,
          not a second gate: deactivation is undone in one tap, so a second
          confirmation would be ceremony over a decision that costs nothing. */}
      {confirmDeactivate && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70"
          onClick={() => setConfirmDeactivate(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="deactivate-student-title"
            className="w-full max-w-[320px] bg-reps-card border border-reps-line rounded-[16px] px-7 pt-7 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="deactivate-student-title" className="text-[16px] font-semibold text-reps-ink mb-2">
              Deactivate {firstName}?
            </h2>
            {/* TWO TIERS, not three. Everything here was one grey, so the
                consequence, the upside and the caveat all read at the same
                weight and the block scanned as a wall — short words did not fix
                that, because the problem was hierarchy rather than length.

                Tier one: what deactivating DOES, in the brightest ink, with a
                real subject. It read "Pauses new work and logging", starting
                mid-sentence with no grammatical subject, which is why it needed
                the heading to make sense. */}
            <p className="text-[13px] text-reps-ink leading-relaxed">
              Deactivating pauses new work and logging — nothing is lost.
            </p>
            {/* Tier two: everything secondary, in one dimmer block behind a
                hairline. The upside and the open-assignment caveat are the same
                KIND of information — context the coach may want but does not
                need to act on — so they share a colour and a size instead of
                stepping down again.

                ⚠️ "Frees a spot on your plan" STAYS. It is the whole reason a
                coach arrives here from the ceiling gate, and the only line that
                says what deactivating buys them. "spot" is the app's one word
                for this — see the activate gate, which was "No room" until it
                was standardised.

                ⚠️ The caveat is informational, NOT a second gate. Deactivation
                is undone in one tap, so a confirmation step would be ceremony
                over a decision that costs nothing. */}
            <div className="mt-3 pt-3 border-t border-reps-line text-[13px] text-reps-sub leading-relaxed">
              <p>Frees a spot on your plan. Reactivate anytime.</p>
              {openAssignmentCount > 0 && (
                <p className="mt-1.5">
                  {firstName} has {openAssignmentCount} open{" "}
                  {openAssignmentCount === 1 ? "assignment" : "assignments"}, which
                  will pause too.
                </p>
              )}
            </div>
            <div className="flex gap-3 mt-7">
              <button
                onClick={() => setConfirmDeactivate(false)}
                className="flex-1 min-h-[44px] rounded-[10px] border border-reps-line text-reps-ink font-medium text-[15px] hover:bg-reps-raised transition-colors"
              >
                Cancel
              </button>
              {/* Deliberately NOT red. This is reversible and routine; red is
                  reserved for the delete below, which is neither. */}
              <button
                onClick={handleDeactivate}
                disabled={isPending}
                className="flex-1 min-h-[44px] rounded-[10px] bg-[#378add] text-white font-semibold text-[15px] hover:bg-[#4a9ae8] disabled:opacity-50 transition-colors"
              >
                {isPending ? "Pausing…" : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THE REACTIVATE GATE. Only ever seen when activatePlayer() refused, and
          it shows the SERVER'S OWN message rather than re-deriving the rule —
          the action knows which limit it just enforced.

          Two endings, matching the add-student gate exactly: a free coach gets
          an Upgrade button (the same useUpgrade handler), a Pro coach at the
          ceiling gets no button, because there is nothing to sell them. Both are
          told the move that always works: deactivate someone else. */}
      {gate && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70"
          onClick={() => setGate(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="activate-gate-title"
            // ⚠️ BLUE, where the deactivate modal above stays grey, and the split
            // is a system rather than decoration: blue marks anything touching
            // PLAN CAPACITY, grey marks a routine action. This modal and the
            // roster's "Assigning is on hold" banner are the same state — over
            // the limit — reached two different ways, so they share a surface.
            //
            // Wash and border are the all-done panel's idiom in the brand hue
            // instead of emerald. Layered over the card colour rather than
            // replacing it, because a bare rgba would composite against the
            // black overlay and come out darker than the modal it belongs to.
            className="w-full max-w-[320px] border rounded-[16px] px-7 pt-7 pb-8"
            style={{
              background:
                "linear-gradient(rgba(55,138,221,0.07), rgba(55,138,221,0.07)), #1c1f26",
              borderColor: "rgba(55,138,221,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* "No spot", not "No room". The reassurance below and the deactivate
                modal both say "spot", so the app now has ONE word for this idea
                instead of two for the same thing. */}
            <h2 id="activate-gate-title" className="text-[16px] font-semibold text-reps-ink mb-2">
              No spot for {firstName} right now
            </h2>
            <p className="text-[13px] text-reps-sub leading-relaxed">{gate.error}</p>
            <p className="text-[13px] text-reps-sub leading-relaxed mt-3">
              {firstName}&apos;s history is all still here either way.
            </p>

            {gate.canUpgrade && (
              <button
                onClick={startUpgrade}
                disabled={upgrading}
                className="mt-6 w-full min-h-[44px] rounded-[10px] bg-[#378add] text-white font-semibold text-[15px] hover:bg-[#4a9ae8] disabled:opacity-50 transition-colors"
              >
                {upgrading ? "Starting…" : "Upgrade to Pro"}
              </button>
            )}
            {upgradeError && (
              <p className="mt-3 text-[13px] leading-snug text-red-400">{upgradeError}</p>
            )}

            <button
              onClick={() => setGate(null)}
              className={`w-full min-h-[44px] rounded-[10px] border border-reps-line text-reps-ink font-medium text-[15px] hover:bg-reps-raised transition-colors ${gate.canUpgrade ? "mt-3" : "mt-7"}`}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* DELETE — the one genuinely irreversible action on this screen, and now
          the only one behind a typed confirmation.

          ⚠️ It was a single red button until the deactivation build. players
          cascades to BOTH assignments and logs, so one tap destroyed every rep a
          student had ever recorded — the app's most destructive act sitting
          behind its lightest control. Deactivation gives the safe path a home;
          this gives the dangerous one a cost.

          ⚠️ Reachable directly from the ACTIVE state on purpose. Forcing
          deactivate-first would make the safe action a step on the way to the
          destructive one, which teaches a coach to tap through it. */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-student-title"
            className="w-full max-w-[320px] bg-reps-card border border-reps-line rounded-[16px] px-7 pt-7 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-student-title" className="text-[16px] font-semibold text-reps-ink mb-2">
              Delete {playerName}?
            </h2>
            <p className="text-[13px] text-reps-sub leading-relaxed">
              This permanently deletes every assignment and every rep {firstName}{" "}
              has ever logged. It can&apos;t be undone.
            </p>
            {isActive && (
              <p className="text-[13px] text-reps-sub leading-relaxed mt-3">
                Just taking a break? Deactivate {firstName} instead — it frees the
                same spot and keeps everything.
              </p>
            )}

            <p className="text-[13px] text-reps-sub mt-5 mb-2">
              Type <span className="text-reps-ink font-medium">{firstName}</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteTyped}
              onChange={(e) => setDeleteTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label={`Type ${firstName} to confirm deletion`}
              className="w-full bg-reps-bg border border-reps-line rounded-[10px] px-4 py-3 text-[15px] text-reps-ink placeholder:text-[#5a5f72] outline-none focus:border-red-500 transition-colors"
              placeholder={firstName}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 min-h-[44px] rounded-[10px] border border-reps-line text-reps-ink font-medium text-[15px] hover:bg-reps-raised transition-colors"
              >
                Cancel
              </button>
              {/* Case- and whitespace-insensitive: the typed word is a proof of
                  attention, not a spelling test, and a coach on a phone keyboard
                  should not be defeated by autocapitalisation. */}
              <button
                onClick={handleDelete}
                disabled={isPending || deleteTyped.trim().toLowerCase() !== firstName.toLowerCase()}
                className="flex-1 min-h-[44px] rounded-[10px] bg-red-500 text-white font-semibold text-[15px] hover:bg-red-400 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                {isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
