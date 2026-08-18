"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

// useLayoutEffect warns when a client component is server-rendered, and this one
// always is. Falling back to useEffect on the server keeps the warning away
// without giving up the pre-paint timing in the browser, which is the whole
// point of the change below.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
    const raf = requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}
