import type { ReactNode } from "react";

type Props = {
  /** "Jalen finished everything." / "You finished everything." */
  headline: string;
  /** Where the work went, when that isn't already obvious. Optional: the coach's
   *  not-yet-archived variant carries an action link instead, and a sub-line
   *  above it only restated what the link already says. */
  sub?: string;
  /** Optional call to action. Only the coach gets one (Archive everything);
   *  the student has nothing to do here. */
  action?: ReactNode;
};

// The 🎉 all-done celebration, shared by the coach player detail screen and the
// student's own screen so the two can't drift in styling or tone.
//
// ⚠️ This is now the New tab's own content, not a page-level banner. It used to
// render above the tabs on both screens, gated only on "is everything finished",
// which meant it followed the coach onto the Archive tab and — once everything
// was archived — sat directly above a second, greyer "Nothing open" message
// saying the same thing twice. Rendering it inside the New tab fixes both: it is
// unreachable from Archive, and when New has nothing left it IS the empty state
// rather than a banner stacked on one.
//
// Colours and padding are carried over from that banner unchanged, so the thing
// itself looks exactly as it did — only where it appears has moved.
export default function AllDonePanel({ headline, sub, action }: Props) {
  return (
    <div
      className="text-center rounded-[10px]"
      style={{
        background: "rgba(62,214,138,0.06)",
        border: "0.5px solid rgba(62,214,138,0.15)",
        padding: "18px 14px",
      }}
    >
      <div className="text-[22px] leading-none mb-1.5">🎉</div>
      <div className="text-[14px] font-medium text-reps-ink">{headline}</div>
      {/* Same muted white the student banner already used for its second line —
          present enough to read, quiet enough not to rival the headline. */}
      {sub && (
        <div className="text-[13px] mt-0.5" style={{ color: "rgba(255, 255, 255, 0.55)" }}>
          {sub}
        </div>
      )}
      {/* mt-3 rather than mt-4: the action now follows the headline directly on
          the one variant that has it, with no sub-line in between. */}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
