"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

// useLayoutEffect warns when a client component is server-rendered, and this one
// always is. Falling back to useEffect on the server keeps the warning away
// without giving up the pre-paint timing in the browser, which is the whole
// point of the change below.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// ⚠️⚠️ TEMPORARY INSTRUMENTATION — REMOVE BEFORE THE REAL FIX. ⚠️⚠️
//
// SECOND PASS, Aug 20 2026. The first pass logged scrollY at three fixed
// moments and reported 0 at all of them while the screen was visibly cut off.
// Two blind spots in that pass, and this one closes both:
//
//   1. IT MEASURED THE WRONG THING. Whether content is covered is a question
//      about two rectangles, not about scrollY. Measuring the geometry directly
//      is true no matter which viewport moved, or whether scrollY knows about
//      it. OVERLAP below is that number.
//
//   2. IT STOPPED AT 600ms. iOS re-expands the URL bar when the touch gesture
//      ends, not when the page loads, which is routinely later than that. This
//      pass samples on real events until 4s instead of at fixed delays.
//
// Measured against the real compiled CSS at 390px, so these are the numbers to
// read the log against:
//
//   sticky header height 117.5px · first group label ink at y=119.5 (2px below
//   the header) · label ink 16px tall · first card at y=143.5
//
//   OVERLAP = -2  HEALTHY. The 2px resting gap. This is the good reading, not 0
//   OVERLAP > 0   the group label has started disappearing
//   OVERLAP >= 16 the group label is COMPLETELY hidden (~18px of scroll)
//   cardCover > 0 the top of the first card is being clipped (~40px of scroll)
//
// Calibrated against the reproduction, so a reading maps straight back to an
// offset: scrollY 5 -> OVERLAP 3 · 18 -> 16 · 40 -> 38 (cardCover 14) ·
// 60 -> 58 (cardCover 34). The 60 case is the screenshot that matches the
// reported symptom exactly.
//
// ⚠️ THIRD PASS, Aug 20 2026 — OVERLAP ALONE COULD NOT SEE A MISSING LABEL.
// It is measured off the groups WRAPPER, and a wrapper's top does not move
// based on whether its first child has content. So a label that was absent, or
// collapsed to zero height, reported a perfectly healthy OVERLAP -2 for a whole
// run. Two different failures were indistinguishable in every reading so far:
//
//   (a) content pushed UNDER the header by a stale ~20px paint offset
//   (b) content sitting ~24px HIGHER because the label block collapsed
//
// Both give scrollY 0 and OVERLAP -2, and both photograph identically. (b) fits
// the numbers uncomfortably well — the label is 16px of ink plus mb-2, exactly
// 24px, inside the 18-26px displacement measured off the screenshot.
//
// So the label is now probed directly, and the two split cleanly:
//
//   lbl=MISSING                    the element is not in the DOM at all
//   lbl="..."@<top>h0              present but collapsed to zero height
//   lbl="" (empty text)            present and sized but rendering no text
//   lbl="Nothing assigned"@119.5h16 while the screen shows nothing there
//                                  -> DOM is correct and the pixels are lying.
//                                  Paint desync confirmed.
//
// lblCover is the same question OVERLAP was meant to answer, asked of the label
// itself rather than its wrapper: header bottom minus the LABEL top. Negative is
// healthy. It is the number to trust where the two disagree.
//
// op= is printed only when opacity is not 1, to catch a label that is present,
// sized and full of text but painted invisible.
//
// ⚠️ Checked first and ruled out: the text is NOT late-arriving data. It is
// GROUP_STYLE[g].title, a module constant, emitted by the same .map() iteration
// that emits the rows — they are siblings in one <div key={g}>, so the rows
// cannot exist without the label. The page is a pure async Server Component with
// no hooks and no inner Suspense, and loading.tsx swaps the whole <main>
// atomically. There is no frame where rows exist without their label.
//
// ⚠️ At scrollY 0 an in-flow sticky element CANNOT overlap what follows it —
// measured, overlapAtScroll0 is false. So an OVERLAP > 0 reading alongside
// scrollY 0 means something is scrolling that scrollY does not report, which is
// what vvOffsetTop and vvPageTop are here to catch: sticky pins to the LAYOUT
// viewport, and on iOS the VISUAL viewport can be offset within it.
//
// A formatted string rather than an object on purpose: Safari's remote console
// evaluates object properties when you expand them, not when they were logged,
// which would show settled values instead of the ones at each moment.
const PROBE_WINDOW_MS = 4000;

// ── TIER 2 FIX: force a repaint once the visual viewport settles ───────────
//
// Aug 20 2026. NOT instrumentation — this one is meant to stay if it works.
//
// The evidence it is built on: the roster arrives painted from a stale frame.
// Measured layout is correct and stays correct (OVERLAP -2, scrollY 0, still
// -2 at the 4s reading), while the pixels sit roughly 20px off — the group
// label hidden under the sticky header, the first card intact. It persists for
// as long as nobody touches the screen, and a single swipe with no reload
// corrects it. Layout and paint genuinely disagree, so nothing that adjusts
// layout can fix it; something has to make WebKit re-rasterise.
//
// ⚠️ IT IS NOT THE ADD-PLAYER KEYBOARD. Confirmed Aug 20 on a second path —
// assigning homework and coming back to the roster does it too. The trigger is
// arriving at this page, not anything about that form. Tier 1 (taking the
// page-wide skeleton opacity animation off <main>, so no page-sized
// compositing layer is created and destroyed across the swap) did not fix it
// either, and is deliberately left in place.
//
// The nudge scrolls the document 1px and back. The SCROLLING LAYER is the one
// believed to be stale, and a real scroll is what forces it to re-raster —
// which is exactly what the user's own swipe does, minus the user. It does not
// depend on the scroll position being wrong and does not correct it: net
// displacement is zero from wherever the page happens to be.
//
// ⚠️ THE TWO HALVES MUST LAND IN DIFFERENT FRAMES. Called back to back in one
// task the browser coalesces them, the net change is zero, and the compositor
// may never see a reason to redraw — which would make this look like a failed
// experiment when it had simply never run. The return leg goes in a rAF so a
// frame is committed at +1 first.
//
// ⚠️ Needs somewhere to scroll TO. On iOS there always is: body, the instructor
// layout and this page are all min-h-screen (100vh, not dvh), and 100vh is the
// large viewport, so there is a URL-bar's worth of range even when the content
// fits. If a platform ever has maxScroll 0 the nudge is inert — harmless, but
// it would not fire.
const NUDGE_SETTLE_MS = 120;

// ⚠️ ARRIVAL ONLY, and this guard is not optional. visualViewport resize fires
// every time Safari's toolbar collapses or expands, which happens WHILE the
// coach is scrolling the roster — and a programmatic scrollBy during momentum
// scrolling cancels the momentum. Unguarded, this would turn every toolbar
// transition on a long roster into a stutter. The symptom is an arrival bug, so
// the nudge is confined to the seconds after arrival; past that a coach's own
// touches re-sync the compositor anyway, which is the whole reason the bug is
// invisible once they interact.
const NUDGE_WINDOW_MS = 4000;

// ⚠️⚠️ EXPERIMENT, Aug 20 2026 — SET BACK TO true TO RESTORE. ⚠️⚠️
//
// Both forced scrollTo(0, 0) calls are switched off. scrollRestoration stays
// "manual", tier 1, tier 2 and the header are untouched: one variable.
//
// WHY. Every log tonight showed the same shape — scrollY ~40 at the first
// reading, then a "scroll" event single-digit milliseconds later reading 0 —
// and that was taken as the layout recovering on its own. It is not. Reproduced
// in a browser with no bug present, using this file's exact ordering:
//
//     layout  t=0.1ms  y=40
//     scroll  t=0.4ms  y=0
//     raf     t=0.5ms  y=0
//
// The scroll event IS this component's own scrollTo(0, 0). The listener is
// attached after the call, but scroll events dispatch asynchronously, so it
// still catches it. So the "healthy" readings were never evidence of anything —
// they were the echo of our own correction, and every "layout is fine"
// conclusion tonight was drawn from them.
//
// ⚠️ WHICH MAKES THE layout READING THE ONLY HONEST ONE, and it says the roster
// ARRIVES AT ~40px. That is squarely in the band measured off the screenshot:
// at 40 the group label is fully hidden and the first card is clipped 14px.
//
// WHAT THIS TESTS. The hypothesis is that the correction is the problem — a
// synthetic scrollTo landing while the visual viewport is still resizing
// (toolbar collapsing behind a dismissing keyboard, or just re-expanding after
// any navigation) leaves the compositor showing a stale frame, and only a real
// touch-driven scroll, which goes through a different pipeline, resolves it.
//
// ⚠️ A CLEAN RESULT IS NOT THE ONLY USEFUL ONE. If the roster now arrives
// visibly scrolled at ~40 and simply stays there, that is equally decisive and
// simpler: it was never a paint bug, and we have spent the night masking a real
// scroll offset instead of finding out why the page arrives at 40.
//
// ⚠️ ONE CONFOUND, LEFT IN DELIBERATELY because the brief was to isolate this
// variable: tier 2's nudge is also a synthetic scroll. It is debounced to fire
// AFTER the resize settles rather than during it, so it is far less implicated
// — but if the result comes out clean, check the log for nudge lines before
// crediting this change. If the screen was already right before nudge1-pre,
// tier 2 was not the repair.
const FORCE_SCROLL_TO_TOP: boolean = false;

let mountSeq = 0;

export default function ScrollToTop() {
  // ⚠️ KEYED ON THE PATHNAME, not mounted once. The original ran on mount only
  // (`[]`), which covers a fresh mount but not a re-render in place — a
  // router.refresh(), or a push to /instructor/students from a page that is
  // already the roster. Those leave the previous offset untouched.
  const pathname = usePathname();

  useIsoLayoutEffect(() => {
    // Order matters: hand scroll control over BEFORE scrolling. Left on the
    // default "auto", the browser restores the previous offset on a history
    // traversal asynchronously, which can land after this effect and silently
    // undo the scrollTo below. "manual" means the browser stops restoring at
    // all, so nothing arrives later to compete.
    //
    // Deliberately not reverted on unmount. The value is read at the moment of
    // a history traversal, so restoring "auto" on the way out would put it back
    // to "auto" before any navigation INTO this page — reinstating exactly the
    // race this removes. It is set once and left.
    //
    // ⚠️ This is a document-wide setting, not a per-page one. The app is a SPA,
    // so once the roster has mounted, scroll restoration is off for every other
    // route in the session too — going back to any scrolled page will no longer
    // return to where it was.
    //
    // ⚠️ AND IT IS NOT SET EARLY ENOUGH ON A FRESH DOCUMENT. Measured: after a
    // full page load, `history.scrollRestoration` reads "auto" until this
    // component's effect has run. A fresh document always starts at "auto", the
    // browser's own restoration is queued before React hydrates, and nothing
    // here can pre-empt that from inside a component. Closing that completely
    // needs a script that runs before hydration, in the layout — deliberately
    // not done here, since this file is not the right place for it. The rAF
    // pass below is what covers it in practice.
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    // ── TEMPORARY probe ────────────────────────────────────────────────────
    // Reads only. Never scrolls, never writes style — measuring must not
    // perturb the thing being measured.
    const seq = ++mountSeq;
    const t0 = performance.now();
    let last = "";

    const sample = (why: string) => {
      const header = document.querySelector('[data-scroll-probe="header"]');
      const groups = document.querySelector('[data-scroll-probe="groups"]');
      // First player row, found through the groups wrapper so it needs no
      // probe of its own inside the group map.
      const card = groups?.querySelector('a[href^="/instructor/student/"]') ?? null;
      // First match in document order is the first rendered group's label.
      // InactiveGroup carries its own header and always sorts last, so this
      // picks a plain group whenever one exists.
      const label = document.querySelector('[data-scroll-probe="label"]');

      const h = header?.getBoundingClientRect();
      const g = groups?.getBoundingClientRect();
      const c = card?.getBoundingClientRect();
      const l = label?.getBoundingClientRect();
      const vv = window.visualViewport;

      // Is the label there, sized, and carrying its text — and is it covered?
      const lblDesc = !label || !l
        ? "MISSING"
        : `"${(label.textContent ?? "").trim().slice(0, 24)}"@${l.top.toFixed(1)}h${l.height.toFixed(1)}`;
      const lblCover = h && l ? h.bottom - l.top : null;
      const op = label ? getComputedStyle(label).opacity : "1";

      // THE headline number: how far the sticky header's bottom edge reaches
      // past the top of the content below it. Positive means covered.
      const overlap = h && g ? h.bottom - g.top : null;
      const cardCover = h && c ? h.bottom - c.top : null;

      const line =
        `scrollY=${Math.round(window.scrollY)}` +
        ` OVERLAP=${overlap === null ? "n/a" : overlap.toFixed(1)}` +
        ` lbl=${lblDesc}` +
        ` lblCover=${lblCover === null ? "n/a" : lblCover.toFixed(1)}` +
        (op !== "1" ? ` op=${op}` : "") +
        // ⚠️ NOT clamped at 0. It was, and clamping is exactly the habit that
        // let OVERLAP hide four of five label failures — a negative value says
        // how far BELOW the header the card sits, which is what separates a
        // scrolled page from a collapsed label. All three cover numbers now
        // read the same way: negative healthy, positive covered.
        ` cardCover=${cardCover === null ? "n/a" : cardCover.toFixed(1)}` +
        ` hdrBottom=${h ? h.bottom.toFixed(1) : "n/a"}` +
        ` vvOffsetTop=${vv ? vv.offsetTop.toFixed(1) : "n/a"}` +
        ` vvPageTop=${vv ? vv.pageTop.toFixed(1) : "n/a"}` +
        ` vvH=${vv ? Math.round(vv.height) : "n/a"}` +
        ` innerH=${window.innerHeight}`;

      // Only log when something actually moved, so a scroll gesture does not
      // bury the timeline. The reason and elapsed time still identify what
      // caused each change.
      if (line === last) return;
      last = line;
      console.log(`[reps-scroll] #${seq} +${Math.round(performance.now() - t0)}ms ${why.padEnd(10)} ${line}`);
    };

    // Says which build is running, so a console full of readings can never be
    // mistaken for the other one.
    console.log(
      `[reps-scroll] BUILD forcedScrollTo=${FORCE_SCROLL_TO_TOP ? "ENABLED" : "DISABLED (experiment)"}`
    );
    sample("layout");
    // ── end probe ──────────────────────────────────────────────────────────

    // ⚠️ A LAYOUT EFFECT, not useEffect. useEffect fires after paint, so a
    // restored offset was briefly VISIBLE and then snapped away — the jump
    // reads as the page settling in the wrong place. Running before paint means
    // the first frame the coach sees is already at the top.
    //
    // ⚠️ DISABLED BY THE EXPERIMENT ABOVE.
    if (FORCE_SCROLL_TO_TOP) window.scrollTo(0, 0);

    // ⚠️ AND AGAIN ON THE NEXT FRAME. This is the part that actually closes the
    // race the comment above describes rather than merely narrowing it.
    //
    // Three things can move the page after a layout effect has run, and none of
    // them can be ordered against from here: the browser's native restoration
    // on a fresh document (queued before hydration), Next's own scroll-and-focus
    // handler in layout-router (an ANCESTOR, so its lifecycle runs AFTER a
    // child's — React commits bottom-up), and the document's height changing as
    // the roster's content settles, which lets the browser clamp or anchor the
    // offset. A second pass one frame later lands after all three.
    //
    // Cancelled on cleanup so a fast navigation away cannot have this fire
    // against the next route.
    // ⚠️ The rAF still runs and still samples — only the scroll is disabled, so
    // the timeline keeps its shape and the two builds stay comparable.
    const raf = requestAnimationFrame(() => {
      if (FORCE_SCROLL_TO_TOP) window.scrollTo(0, 0);
      sample("raf");
    });

    // ── TEMPORARY: event-driven sampling ───────────────────────────────────
    // Every listener is passive and read-only. The events are the ones that
    // actually move an iOS viewport: the document scrolling, the layout
    // viewport resizing (URL bar), the visual viewport moving or resizing
    // independently of it (keyboard), and the touch gesture ending — which is
    // what triggers the URL bar re-expansion the first pass sampled too early
    // to see.
    const onScroll = () => sample("scroll");
    const onResize = () => sample("resize");
    const onTouchEnd = () => sample("touchend");
    const onVvResize = () => sample("vv-resize");
    const onVvScroll = () => sample("vv-scroll");

    const opts = { passive: true } as const;
    window.addEventListener("scroll", onScroll, opts);
    window.addEventListener("resize", onResize, opts);
    window.addEventListener("touchend", onTouchEnd, opts);
    window.visualViewport?.addEventListener("resize", onVvResize);
    window.visualViewport?.addEventListener("scroll", onVvScroll);

    // ── TIER 2 FIX (not instrumentation) ──────────────────────────────────
    const mountedAt = performance.now();
    let nudgeTimer: ReturnType<typeof setTimeout> | undefined;
    let touchActive = false;
    let nudgeSeq = 0;

    const onTouchStart = () => { touchActive = true; };
    const onTouchStop = () => { touchActive = false; };

    const forceRepaint = () => {
      // A touch in flight means the coach is already driving the compositor;
      // scrolling underneath them is both unnecessary and disruptive.
      if (touchActive) return;
      if (performance.now() - mountedAt > NUDGE_WINDOW_MS) return;

      const n = ++nudgeSeq;
      sample(`nudge${n}-pre`);
      window.scrollBy(0, 1);
      // Second half next frame — see the note above on coalescing.
      requestAnimationFrame(() => {
        window.scrollBy(0, -1);
        sample(`nudge${n}-post`);
      });
    };

    // Debounced, so the whole toolbar animation counts as one resize and the
    // nudge lands after it has settled rather than during it.
    const onVvResizeNudge = () => {
      clearTimeout(nudgeTimer);
      nudgeTimer = setTimeout(forceRepaint, NUDGE_SETTLE_MS);
    };

    window.addEventListener("touchstart", onTouchStart, opts);
    window.addEventListener("touchend", onTouchStop, opts);
    window.addEventListener("touchcancel", onTouchStop, opts);
    window.visualViewport?.addEventListener("resize", onVvResizeNudge);
    // ── end tier 2 fix ────────────────────────────────────────────────────

    // Backstops, so a run where the coach never touches the screen still
    // produces a timeline. Deduping means these stay silent if nothing moved.
    const timers = [300, 600, 1200, 2500, PROBE_WINDOW_MS].map((ms) =>
      setTimeout(() => sample(`t+${ms}`), ms)
    );

    // Stop after the window closes: force one final unconditional reading so
    // the settled state is always in the log even if it never changed, then
    // detach so this cannot follow the coach around the app.
    const stop = setTimeout(() => {
      last = "";
      sample("final");
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("touchend", onTouchEnd);
      window.visualViewport?.removeEventListener("resize", onVvResize);
      window.visualViewport?.removeEventListener("scroll", onVvScroll);
    }, PROBE_WINDOW_MS + 50);
    // ── end probe ──────────────────────────────────────────────────────────

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      clearTimeout(stop);
      clearTimeout(nudgeTimer);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchStop);
      window.removeEventListener("touchcancel", onTouchStop);
      window.visualViewport?.removeEventListener("resize", onVvResizeNudge);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("touchend", onTouchEnd);
      window.visualViewport?.removeEventListener("resize", onVvResize);
      window.visualViewport?.removeEventListener("scroll", onVvScroll);
    };
  }, [pathname]);

  return null;
}
