import { Check } from "lucide-react";

/**
 * The soft blue-tinted card used by the app's two "nothing here yet" screens —
 * the empty roster and a student with no assignments.
 *
 * ⚠️ ONE COMPONENT BECAUSE THERE ARE TWO CONSUMERS. The two screens are meant
 * to read as the same object in two places; hand-rolling the surface twice is
 * how the fill and the border drift apart. Same rule the rest of the codebase
 * follows — extract when the second consumer appears, not before.
 *
 * ⚠️⚠️ READ THIS BEFORE REUSING THE FILL. Blue already carries a MEANING in
 * the instructor app: PLAN CAPACITY. The over-limit roster banner (#18222d) and
 * the "No spot for {name}" reactivate modal (#1e2633) are both a blue wash with
 * a `rgba(55,138,221,0.35)` outline, and they look the way they do *because
 * they are the same state reached two ways*. This card is a THIRD blue surface
 * with a different meaning — "you are set up, nothing here yet" — so it is
 * deliberately built to not be mistaken for those two:
 *
 *   - FILL #0f1d2c is the brand blue at 14% over the PAGE background (#080b0f).
 *     The capacity surfaces wash over the RAISED surface (#161a20) instead, so
 *     they land materially lighter. Different base, different result.
 *   - BORDER is 0.22 alpha, not the capacity 0.35. The capacity outline is
 *     documented as load-bearing at 0.35; staying below it keeps that edge
 *     distinctive.
 *   - The capacity surfaces never carry a badge. This one can.
 *
 * ⚠️ These two meanings CAN co-occur on the student detail screen: a coach over
 * their plan limit looking at a student with no assignments. That screen keeps
 * its own over-limit copy and does NOT render this card, precisely so a
 * capacity problem is never dressed as a friendly empty state.
 *
 * ⚠️ Never a bare `border` class on a dark surface — Tailwind's preflight
 * defaults border-color to a light grey. The colour is set inline with the fill.
 */
export default function EmptyStateCard({
  /**
   * The check-in-a-circle at the top. TRUE only where something has actually
   * been completed — the roster, where the coach has just finished signing up.
   * A student with no work assigned has completed nothing, so it gets no badge:
   * a success mark over an empty list would be congratulating nobody.
   */
  badge = false,
  headline,
  line,
  children,
}: {
  badge?: boolean;
  headline: React.ReactNode;
  line: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[14px] px-6 pt-7 pb-6 text-center"
      style={{ background: "#0f1d2c", border: "1px solid rgba(55,138,221,0.22)" }}
    >
      {badge && (
        <span
          aria-hidden="true"
          className="mx-auto mb-4 flex items-center justify-center rounded-full"
          style={{ width: 40, height: 40, background: "#16314c" }}
        >
          {/* #5ba3ea rather than the brand #378add: on a blue-tinted surface the
              brand value drops under AA, which is the same reason the capacity
              CTAs use it. 4.99:1 here. */}
          <Check size={20} strokeWidth={2.5} color="#5ba3ea" />
        </span>
      )}
      <h2 className="text-[17px] font-semibold tracking-[-0.2px] text-reps-ink mb-1.5">
        {headline}
      </h2>
      {/* 5.34:1 on the card fill. */}
      <p className="text-[14px] leading-relaxed text-reps-sub mb-6">{line}</p>
      {children}
    </div>
  );
}
