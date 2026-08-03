import Stripe from "stripe";

// ⚠️ Deliberately a lazy getter, not a module-scope `new Stripe(...)`.
// Constructing at import time throws when STRIPE_SECRET_KEY is absent, which
// would break `next build` on any machine or CI runner that has not been given
// the key — including this repo right now, where billing is half-built. A
// getter keeps the failure at the point of use, where it is actionable.
let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  // No apiVersion pinned: the SDK's TypeScript types accept only the exact
  // version string it ships with, so a hardcoded value becomes a type error on
  // the next `npm update`. Unpinned, calls use the account's own default API
  // version, which is set in the Stripe dashboard and moves deliberately rather
  // than as a side effect of a dependency bump.
  cached = new Stripe(key);
  return cached;
}

// ⚠️ Which mode you are in is a property of the KEY, not of any code here.
// sk_test_ and sk_live_ hit entirely separate universes: separate products,
// prices, coupons, customers and webhooks. Every Stripe id in .env.local
// changes when the key does — see the Stripe status section in CLAUDE.md.
export function isTestMode(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");
}
