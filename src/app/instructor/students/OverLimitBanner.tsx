"use client";

import { PauseCircle } from "lucide-react";
import { useUpgrade } from "@/lib/use-upgrade";

/**
 * The account-level "over your plan" notice on the roster.
 *
 * ⚠️ A CLIENT COMPONENT ONLY BECAUSE OF THE UPGRADE CTA. The roster page is an
 * async Server Component, and starting Checkout means calling the same
 * useUpgrade() hook ProfileMenu and the add-student paywall use — the third and
 * now fourth consumer of the one handler, which is exactly the drift that hook
 * exists to prevent. Everything else here is static text.
 *
 * ⚠️ Styled to match the per-student "Inactive" banner on the student detail
 * screen, deliberately: same surface, same border, same 13px/12px type pair,
 * same quiet greys. This is the account-level equivalent of that idea and should
 * read as its sibling, not as a louder relative.
 *
 * ⚠️ NO WARNING COLOUR, and specifically no yellow or amber. Yellow was retired
 * platform-wide once it stopped meaning "in progress"; reintroducing it as a
 * warning tone here would break a locked decision and give the app a second
 * status vocabulary. The blue below is the BRAND accent marking plan capacity,
 * not a warning hue, and the icon and both text tones stay the greys already in
 * use. This is a state the coach can resolve, not a failure.
 */
export default function OverLimitBanner({
  activeCount,
  planLimit,
  canUpgrade,
  studentLabel,
  studentsLabel,
}: {
  activeCount: number;
  planLimit: number;
  /** False for a Pro coach past the ceiling — there is no higher plan to sell,
   *  so the CTA is omitted entirely rather than shown as a dead end. */
  canUpgrade: boolean;
  studentLabel: string;
  studentsLabel: string;
}) {
  const { startUpgrade, upgrading, upgradeError } = useUpgrade();

  // ⚠️ THE REAL NUMBER, not a hardcoded "one". A coach 2 over their limit who
  // deactivates a single student is still blocked, and a banner that told them
  // one would be enough sends them round the loop a second time. Clamped at 1
  // because this only renders when activeCount > planLimit.
  const over = Math.max(1, activeCount - planLimit);
  const overNoun = over === 1 ? studentLabel : studentsLabel;

  return (
    <div
      className="rounded-[10px] px-[14px] py-3 mb-4 mt-2"
      // ⚠️ BLUE marks plan capacity. The all-done panel's idiom — a soft rgba
      // wash with a border in the same hue — in the brand blue instead of
      // emerald, so this reads as a state rather than as another grey card.
      // The reactivate gate modal carries the identical treatment: same state,
      // reached a different way.
      //
      // ⚠️ Layered OVER #161a20 rather than replacing it. The all-done panel
      // washes straight onto the page, but this banner sits on the near-black
      // roster background, so a bare rgba would land DARKER than the surface it
      // has today and read as recessed instead of lifted.
      // ⚠️ A precomputed solid, matching the gate modal — #18222d IS
      // rgba(55,138,221,0.07) over #161a20, flattened. Same reason: no engine
      // variance, one value to read.
      //
      // ⚠️ The border went 0.18 -> 0.35 alpha and 0.5px -> 1px. At 0.18 the
      // banner read as a colour wash with no edge and lost its shape against
      // the roster; this is a light outline that defines it without becoming a
      // saturated blue rule.
      style={{
        background: "#18222d",
        border: "1px solid rgba(55,138,221,0.35)",
      }}
    >
      <div className="flex gap-2.5">
        {/* mt-[1px] optically centres a 16px glyph against the 13px title line.
            Same size/stroke the overflow-menu icons use, in the sub-text grey so
            it reads as part of the quiet block rather than as a badge. */}
        <PauseCircle
          size={16}
          strokeWidth={2}
          className="shrink-0 mt-[1px]"
          style={{ color: "#8a8fa8" }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-reps-ink">Assigning is on hold</div>
          <div className="text-[12px] text-reps-sub mt-0.5 leading-relaxed">
            You have {activeCount} active {studentsLabel} on a plan for {planLimit}.
            Deactivate {over} {overNoun} to free up a spot.
          </div>

          {/* ⚠️ A 44px BUTTON, not an inline link inside the sentence above.
              The app's rule is 44px minimum on every tap target with the visible
              label as the target — an accent phrase mid-paragraph cannot be
              either. That is why the copy ends at "free up a spot." and the offer
              stands on its own line; the "or" is carried by the layout.

              Quiet by design: bordered rather than filled, so it reads as an
              option inside an informational block rather than competing with
              the roster's own primary actions. */}
          {canUpgrade && (
            <button
              type="button"
              onClick={startUpgrade}
              disabled={upgrading}
              className="mt-2.5 inline-flex min-h-[44px] items-center rounded-[8px] bg-transparent px-4 text-[13px] font-medium transition-colors hover:bg-reps-raised disabled:opacity-50 disabled:pointer-events-none"
              // ⚠️ Blue outline, not the grey `border-reps-line` this carried
              // first. Two reasons. It is the plan-capacity system — this button
              // and the one on the student screen's over-limit slot are the same
              // offer from two screens, so they have to look identical. And
              // #378add measures 4.47:1 as 13px text on this tinted surface,
              // just under the 4.5 AA floor; #5ba3ea clears it at 6.03:1.
              style={{ border: "1.5px solid #5ba3ea", color: "#5ba3ea", WebkitTapHighlightColor: "transparent" }}
            >
              {upgrading ? "Starting…" : "Upgrade to Pro"}
            </button>
          )}

          {/* Same treatment as the other two upgrade surfaces: a quiet inline
              line, because the failures reachable here are configuration
              problems a coach cannot act on beyond retrying. */}
          {upgradeError && (
            <p className="mt-2 text-[12px] leading-snug text-red-400">{upgradeError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
