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
// Added Aug 20 2026 to test one specific theory about why the roster can open
// already scrolled, with the first group label and the top of the first card
// under the sticky header. The theory, from the investigation that day:
//
//   The roster is reached from add-student by router.push(), and
//   AddPlayerForm's submit handler never blurs the phone field — it awaits
//   addPlayer() over the network with the keyboard still up, then pushes. Both
//   scroll resets below therefore run while iOS is still animating the keyboard
//   away. When it finishes, the visual viewport grows, the URL bar re-expands,
//   and Safari settles scroll somewhere non-zero — after everything here has
//   already run. Nothing corrects it, because history.scrollRestoration is
//   "manual" (set below) and Next's App Router implements no scroll restoration
//   of its own.
//
// WHAT CONFIRMS IT: scrollY reads 0 at layout and at raf, and NON-ZERO at
// t+600ms — with visualViewport.height SMALLER at layout/raf (keyboard still
// up) than at t+600ms (keyboard gone).
//
// WHAT REFUTES IT: scrollY is 0 at all three readings, or visualViewport.height
// does not change across them.
//
// maxScroll is logged as a second, independent check: body, the instructor
// layout and this page are all min-h-screen (100vh, not dvh) nested three deep,
// and on iOS 100vh is the LARGE viewport. If maxScroll is > 0 on a roster whose
// content fits, that phantom scroll range is real and is the room the offset
// lands in.
//
// A formatted string rather than an object on purpose: Safari's remote console
// evaluates object properties when you expand them, not when they were logged,
// which would show settled values instead of the ones at each moment.
let mountSeq = 0;

function logScroll(seq: number, when: string) {
  const vv = window.visualViewport;
  const doc = document.documentElement;
  const maxScroll = doc.scrollHeight - doc.clientHeight;
  console.log(
    `[reps-scroll] #${seq} ${when}` +
      ` scrollY=${Math.round(window.scrollY)}` +
      ` vvHeight=${vv ? Math.round(vv.height) : "n/a"}` +
      ` innerHeight=${window.innerHeight}` +
      ` maxScroll=${maxScroll}`
  );
}

// Resets scroll so the roster always opens at true scroll-top, with the sticky
// header and the first group label both fully visible.
//
// This exists as its own client component because the roster page itself is an
// async Server Component — it awaits requireCoach(), reads Supabase server-side
// and exports `metadata`, none of which survive a "use client" directive. So the
// effect gets its own file rather than the page changing shape to host it.
//
// Renders nothing; it is mounted purely for the effect.
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

    // TEMPORARY — reading 1 of 3. Before either scrollTo, so it captures what
    // the page was handed rather than what this effect leaves behind.
    const seq = ++mountSeq;
    logScroll(seq, "layout ");

    // ⚠️ A LAYOUT EFFECT, not useEffect. useEffect fires after paint, so a
    // restored offset was briefly VISIBLE and then snapped away — the jump
    // reads as the page settling in the wrong place. Running before paint means
    // the first frame the coach sees is already at the top.
    window.scrollTo(0, 0);

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
    const raf = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      // TEMPORARY — reading 2 of 3. After this frame's scrollTo, so it shows
      // whether the reset held through the frame.
      logScroll(seq, "raf    ");
    });

    // ⚠️ TEMPORARY — reading 3 of 3, and the one the theory turns on. Long
    // enough to outlast an iOS keyboard dismissal (~250ms) and the URL bar
    // resize that follows it. It ONLY logs; it must not scroll, or it would
    // paper over the very thing being measured.
    //
    // Cleared on unmount for the same reason the rAF is cancelled: a fast
    // navigation away would otherwise have this fire against the next route.
    const timer = setTimeout(() => logScroll(seq, "t+600ms"), 600);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
