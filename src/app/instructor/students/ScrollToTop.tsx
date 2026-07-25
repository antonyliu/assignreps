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
    window.scrollTo(0, 0);
  }, []);

  return null;
}
