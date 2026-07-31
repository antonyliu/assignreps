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
      className={`rounded-full bg-reps-ink pointer-events-none select-none ${className}`}
      style={{ opacity: 0.11, width: w, height: h }}
    />
  );
}

/** Page shell for a loading state — matches the app's standard page padding so
 *  the skeleton lands where the real content will, with no jump on swap. */
export function SkPage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem] animate-pulse" aria-busy="true">
      {children}
    </main>
  );
}

/** The New/Archive tab bar's outline. Same 8px track, 3px inset and pill height
 *  as the real control, so it doesn't shift when the tabs replace it. */
export function SkTabs() {
  return (
    <div className="rounded-[8px] bg-reps-card p-[3px] flex gap-[2px] mb-5" aria-hidden="true">
      <div className="flex-1 h-[30px] rounded-[6px]" style={{ background: "#22252e" }} />
      <div className="flex-1 h-[30px] rounded-[6px]" style={{ background: "#22252e" }} />
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
