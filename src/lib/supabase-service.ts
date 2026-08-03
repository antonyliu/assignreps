import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ⚠️ SERVICE-ROLE CLIENT. This bypasses RLS, every policy, and every column
// grant. It is not "the server client with more permissions" — it is the
// database with the safety rails removed, and it must never be reachable from
// anything a user controls.
//
// It exists for exactly one reason: the Stripe webhook has to write
// stripe_customer_id / stripe_subscription_id / subscription_status on
// `coaches`, and those columns are deliberately unwritable by both client roles.
// `coaches_block_client_billing_writes()` rejects any change to them from the
// `anon` or `authenticated` JWT roles, and the column grant allows
// `authenticated` to write `name` and nothing else. That protection is the
// point — a coach must not be able to set their own subscription_status — so
// the only legitimate writer is a role those guards do not police.
//
// ⚠️ Rules for using this:
//   * Server-only. Never import it into a client component, and never return
//     anything derived from it that a caller could not have read themselves.
//   * Read with the USER's client wherever possible and reserve this for the
//     write. A read through the user's session is bounded by RLS; a read
//     through this one is not, so a mistake in a filter is the difference
//     between "their row" and "every row".
//   * Never trust an id that arrived from the client and then look it up with
//     this. Establish ownership with the user's session first.
//
// Deliberately a function rather than a module-scope instance: instantiating at
// import time would throw during `next build` on any machine without the key,
// and would keep one client alive across requests for no benefit.
export function createServiceClient() {
  // A client bundle would strip process.env of anything without the
  // NEXT_PUBLIC_ prefix, so this would fail confusingly rather than obviously.
  // Fail obviously instead.
  if (typeof window !== "undefined") {
    throw new Error("createServiceClient() is server-only and was called in the browser");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // ⚠️ Throw rather than fall back to the anon key. A silent fallback would
  // leave the webhook writing as `anon`, where the trigger rejects it — a
  // billing update that fails on every event, looking like a Stripe problem.
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) must be set to use the service-role client",
    );
  }

  return createSupabaseClient(url, key, {
    // No session, no refresh, no cookie handling. This is not a user session and
    // must never be mistaken for one.
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
