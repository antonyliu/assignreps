"use client";

import { useState } from "react";
import { createCheckoutSession } from "@/app/instructor/billing/actions";

// The "start a Stripe Checkout session and leave" handler, owned in one place.
//
// Two surfaces offer the upgrade and must behave identically:
//
//   1. ProfileMenu — the "Upgrade to Pro" menu item
//   2. The add-student gate — the CTA a blocked coach sees at the paywall
//
// This is the isEntitled() reasoning one layer up. That helper stops the two
// from disagreeing about WHO is entitled; this stops them from disagreeing
// about what pressing Upgrade DOES — the pending state, which failures are
// surfaced and which are swallowed, and the fact that leaving for Stripe is a
// full navigation rather than a router push.
//
// ⚠️ A HOOK, not a shared component, deliberately. The two call sites render
// genuinely different controls — a 36px menu row inside a 160px panel, and a
// full-width primary button on its own screen. A shared component would have to
// carry a variant prop for every visual difference between them and would push
// one shape into a slot it does not fit. What must not drift is the handler,
// so the handler is what is shared; each surface keeps its own markup.
export function useUpgrade() {
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

  // Creating a Checkout session is a real Stripe round trip, so the caller can
  // report progress rather than appearing to do nothing.
  async function startUpgrade() {
    if (upgrading) return;
    setUpgrading(true);
    setUpgradeError("");

    let result;
    try {
      result = await createCheckoutSession();
    } catch {
      // A thrown action means a server-side failure the coach can do nothing
      // about — a missing key, Stripe unreachable. Don't leak the detail.
      setUpgrading(false);
      setUpgradeError("Couldn't start checkout. Try again in a moment.");
      return;
    }

    if (!result.ok) {
      setUpgrading(false);
      setUpgradeError(result.error);
      return;
    }

    // ⚠️ Full navigation, not router.push — Checkout is on Stripe's domain and
    // the Next router cannot route to it. `upgrading` is deliberately left true:
    // the browser is leaving, and resetting it would flash the idle label for a
    // frame on the way out.
    window.location.href = result.url;
  }

  return { startUpgrade, upgrading, upgradeError };
}
