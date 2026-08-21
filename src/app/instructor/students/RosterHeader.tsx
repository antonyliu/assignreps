"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// useLayoutEffect warns when a client component is server-rendered, and this one
// always is. Falling back to useEffect on the server keeps the warning away
// without giving up pre-paint timing in the browser.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Pins the roster header from OBSERVED GEOMETRY rather than from CSS sticky.
// Built Aug 20 2026, replacing `sticky top-0 z-30`.
//
// ⚠️ WHY, and it is not a variation on anything already tried. Every attempt so
// far has argued about a scroll position read out of JS, and tonight proved that
// number can disagree with what is actually on screen. An IntersectionObserver
// does not read a number — the compositor reports whether a real element is
// really in the viewport. So the header cannot be pinned "because scrollY says
// so"; it is pinned only once the browser has confirmed the sentinel genuinely
// left the viewport.
//
// The shape:
//   sentinel   a 1px marker sitting exactly where the header sits in flow,
//              cancelled by -mb-px so it costs no layout
//   spacer     holds the header's height while the header is out of flow
//   header     RESTING (in flow) until observed, then PINNED (fixed)
//
// ⚠️ THE SPACER IS NOT OPTIONAL. `sticky` occupies its space; `fixed` does not.
// Without it, everything below would jump UP by the header's full height at the
// moment of pinning — a ~117px lurch, far worse than the bug this replaces.
// The height is measured from the header itself and only ever while RESTING, so
// a pinned measurement can never feed back into the space being reserved for it.
//
// ⚠️ CENTRED WITH left/right/auto MARGINS, DELIBERATELY NOT A TRANSFORM. The
// instructor shell is `mx-auto max-w-[390px]`, so a pinned header has to match
// that rather than span the window — full width would look broken on desktop,
// where the app is capped at phone width. `translateX(-50%)` would have done it
// too, and would have been a bug: a transform makes the element a containing
// block for `position: fixed` DESCENDANTS, and ProfileMenu's click-away is
// `fixed inset-0` INSIDE this header. It would have collapsed to the header's
// own box instead of covering the screen. left-0 + right-0 + mx-auto centres
// with no transform and leaves that overlay alone.
//
// ⚠️ z-30 IN BOTH STATES so the stacking context does not appear and disappear
// as it pins. ProfileMenu's dropdown (z-50) and click-away (z-40) live inside
// this element and are resolved within that context, exactly as they were under
// `sticky z-30`.
//
// ⚠️ It starts RESTING on the server and on first paint, which is the point: on
// a fresh load nothing is pinned until the observer says so. If the page really
// is scrolled at load, the observer will fire and pin it — one frame later. That
// frame is the known, accepted cost.
const RESTING = "relative z-30 -mx-[1.25rem] pt-4 bg-reps-bg";
const PINNED =
  "fixed top-0 left-0 right-0 mx-auto max-w-[390px] z-30 pt-4 bg-reps-bg";

export default function RosterHeader({ children }: { children: React.ReactNode }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(false);

  const [pinned, setPinned] = useState(false);
  const [reserved, setReserved] = useState<number | null>(null);

  useIsoLayoutEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const read = () => {
      if (pinnedRef.current) return;
      setReserved(el.getBoundingClientRect().height);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    // threshold 0: the sentinel counts as gone the moment none of it is in the
    // viewport, which is the same instant `sticky top-0` would have pinned.
    const io = new IntersectionObserver(
      ([entry]) => {
        const next = !entry.isIntersecting;
        // ⚠️ The ref is set SYNCHRONOUSLY here, not in an effect keyed on
        // `pinned`. ResizeObserver callbacks are delivered after layout and
        // before paint, which can beat a passive effect — so a ref synced in
        // useEffect could still read `false` while the header is already fixed,
        // and `read()` would then measure an out-of-flow header and feed that
        // height straight back into the space reserved for it. Setting it here
        // closes that loop.
        pinnedRef.current = next;
        setPinned(next);
      },
      { threshold: 0 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* 1px so it has area for the observer — a zero-area element never
          reports an intersection — and -mb-px so it costs no layout. */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px -mb-px" />

      <div style={{ height: pinned && reserved != null ? reserved : undefined }}>
        <div
          ref={headerRef}
          data-scroll-probe="header"
          className={pinned ? PINNED : RESTING}
        >
          {children}
        </div>
      </div>
    </>
  );
}
