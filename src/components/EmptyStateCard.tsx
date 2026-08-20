/**
 * The soft blue-tinted card on the student detail screen, shown when a student
 * has no assignments yet.
 *
 * ⚠️ ONE CONSUMER AGAIN, as of the spacing pass: the empty ROSTER was split
 * into a bare celebration plus a hairline prompt block and no longer uses this.
 * Kept as a component rather than inlined because the blue-surface reasoning
 * below is the reason it looks the way it does, and that reasoning should
 * travel with the markup rather than being re-derived at the call site.
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
 *
 * ⚠️ NO BADGE HERE, and the prop that offered one is gone with the roster
 * split. Nothing has been completed on this screen — a success mark over an
 * empty assignment list congratulates nobody.
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
  headline,
  line,
  children,
}: {
  headline: React.ReactNode;
  line: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[14px] px-6 pt-7 pb-6 text-center"
      style={{ background: "#0f1d2c", border: "1px solid rgba(55,138,221,0.22)" }}
    >
      <h2 className="text-[17px] font-semibold tracking-[-0.2px] text-reps-ink mb-1.5">
        {headline}
      </h2>
      {/* 5.34:1 on the card fill. */}
      <p className="text-[14px] leading-relaxed text-reps-sub mb-6">{line}</p>
      {children}
    </div>
  );
}
