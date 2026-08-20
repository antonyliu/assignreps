// Shared skeleton primitive for the route-level loading.tsx files.
//
// Follows the convention the roster's "ghost rows" empty state already set:
// faded white shapes on the page background, fully rounded, aria-hidden so a
// screen reader never announces placeholder furniture.
//
// ⚠️ One deliberate difference from that ghost: these PULSE. On the roster the
// ghost rows ARE the empty state ("no students yet"), so a static skeleton on
// the same screen would briefly tell a coach with seven players that they have
// none. The pulse is what separates "still arriving" from "genuinely empty".
//
// ⚠️ THE PULSE LIVES ON THE SHAPES, NOT ON THE PAGE — moved Aug 20 2026, and it
// must not be moved back. `sk-breathe` animates opacity, and an opacity
// animation promotes its element to its own compositing layer for the duration.
// It used to sit on SkPage's <main> and on the roster skeleton's <main>, which
// put the ENTIRE page subtree on one page-sized layer and then destroyed that
// layer when the RSC payload swapped the skeleton out — in the same handful of
// frames as the roster's two scrollTo(0, 0) calls and an iOS toolbar resize.
// That is the suspected trigger for the roster painting a stale frame: correct
// layout (measured), ~20px-stale pixels, and no repaint until the screen was
// touched. On the shapes, the animated layers are small rectangles and nothing
// page-sized is created or torn down across the swap.
//
// ⚠️ WHAT PULSES AND WHAT DOES NOT, since the distinction is easy to undo:
// a shape STANDING IN for content that has not arrived pulses (everything
// filled with SK_FILL — Sk itself, and SkTabs' two pills). A rule or bar
// rendered at exactly the colour the REAL element uses does not — SkCard's 2px
// bar, the log skeleton's 6px bar, the roster header's 1px divider. Those are
// already the finished article, so leaving them static is what lets them hand
// over invisibly instead of flashing, which is the same argument SK_FILL is
// chosen on below.
// ⚠️ Filled with --reps-line (#2a2d36), NOT white-at-low-opacity. Faded white
// on a near-black background still reads as a light shape, and pulsing it made
// the swap flicker. #2a2d36 is the app's own border/bar-track colour — it sits
// one step above the background, so it registers as "something is coming" and
// then quietly hands over instead of flashing out.
const SK_FILL = "#2a2d36";

export function Sk({
  className = "",
  w,
  h,
}: {
  className?: string;
  /** Any CSS width — px, %, rem. */
  w?: string;
  h?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`sk-breathe rounded-full pointer-events-none select-none ${className}`}
      style={{ background: SK_FILL, width: w, height: h }}
    />
  );
}

/** Page shell for a loading state — matches the app's standard page padding so
 *  the skeleton lands where the real content will, with no jump on swap. */
export function SkPage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]" aria-busy="true">
      {children}
    </main>
  );
}

/** The New/Archive tab bar's outline. Same 8px track, 3px inset and pill height
 *  as the real control, so it doesn't shift when the tabs replace it. */
export function SkTabs() {
  return (
    <div className="rounded-[8px] bg-reps-card p-[3px] flex gap-[2px] mb-5" aria-hidden="true">
      {/* Stand-ins for the two tab labels, so they pulse like any other Sk.
          The track around them does not — it is the real control's own surface. */}
      <div className="sk-breathe flex-1 h-[30px] rounded-[6px]" style={{ background: SK_FILL }} />
      <div className="sk-breathe flex-1 h-[30px] rounded-[6px]" style={{ background: SK_FILL }} />
    </div>
  );
}

/** One assignment card outline: title line, then the 2px progress bar the real
 *  card carries. Used by both list screens, which render the identical card. */
export function SkCard() {
  return (
    <div className="rounded-[10px] bg-[#161a20] px-4 py-[14px]" aria-hidden="true">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <Sk h="12px" w="42%" />
        <Sk h="10px" w="56px" />
      </div>
      <div className="h-[2px] rounded-full" style={{ background: "#2a2d36" }} />
    </div>
  );
}
