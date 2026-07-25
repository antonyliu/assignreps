"use client";

import { useEffect } from "react";

// Resets scroll on mount so the roster always opens at the top.
//
// This exists as its own client component because the roster page itself is an
// async Server Component — it awaits requireCoach(), reads Supabase server-side
// and exports `metadata`, none of which survive a "use client" directive. So the
// effect gets its own file rather than the page changing shape to host it.
//
// Renders nothing; it is mounted purely for the effect.
export default function ScrollToTop() {
  useEffect(() => {
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
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  return null;
}
