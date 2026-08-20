/**
 * The "nothing here yet" block on the student detail screen, shown when a
 * student has no assignments.
 *
 * ⚠️ THE BLUE-TINTED FILL IS RETIRED. This was a blue wash (#0f1d2c) with a
 * blue outline, matching an empty-roster card that has since been split into a
 * bare celebration plus a hairline prompt. It now carries the same treatment as
 * that prompt block: `1px solid #2a2d36`, NO background, same 14px radius and
 * 24px padding.
 *
 * ⚠️⚠️ WHY THAT MATTERS BEYOND LOOKS — DO NOT REINTRODUCE A TINTED FILL HERE.
 * Blue carries a MEANING in the instructor app: PLAN CAPACITY. The over-limit
 * roster banner (#18222d) and the "No spot for {name}" reactivate modal
 * (#1e2633) are both a blue wash with a `rgba(55,138,221,0.35)` outline, and
 * they read as one thing because they ARE one state reached two ways. These
 * empty states were briefly a third blue surface with a different meaning —
 * "you are set up, nothing here yet". With this change NEITHER empty state uses
 * a tinted surface, so the capacity blue is once again the only blue-washed
 * surface in the instructor app. That collision is resolved rather than
 * managed, and it should stay resolved.
 *
 * ⚠️ Losing the fill IMPROVED contrast rather than costing anything:
 * text-reps-sub measured 5.34:1 on the old blue fill and measures 6.17:1 on the
 * page background.
 *
 * ⚠️ Never a bare `border` class on a dark surface — Tailwind's preflight
 * defaults border-color to a light grey, which would put a white ring around
 * this block. The colour is always set explicitly.
 *
 * ⚠️ NO BADGE. Nothing has been completed on this screen; a success mark over
 * an empty assignment list congratulates nobody. The roster earns its checkmark
 * because the coach has just finished signing up.
 *
 * ⚠️ The roster's equivalent block is written INLINE on that page rather than
 * sharing this component, so the treatment is duplicated in two files. They are
 * meant to stay identical — border colour, radius, padding, and the gap above
 * the button. If one moves, move the other, or unify them.
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
      className="rounded-[14px] px-6 py-6 text-center"
      style={{ border: "1px solid #2a2d36" }}
    >
      <h2 className="text-[17px] font-semibold tracking-[-0.2px] text-reps-ink mb-1.5">
        {headline}
      </h2>
      {/* 6.17:1 on the page background. mb-5 matches the roster prompt's gap to
          its button, so the two blocks share one internal rhythm. */}
      <p className="text-[14px] leading-relaxed text-reps-sub mb-5">{line}</p>
      {children}
    </div>
  );
}
