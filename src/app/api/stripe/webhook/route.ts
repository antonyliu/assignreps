import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase-service";

// ⚠️ The first /api route handler in this app. Everything else server-side is a
// server action, deliberately — but Stripe POSTs from its own infrastructure to
// a URL, and an action cannot receive that. This is a considered exception, not
// drift.
//
// Node runtime is explicit rather than assumed: the Stripe SDK needs Node's
// crypto for signature verification, and route handlers defaulting to Node is a
// default that could move.
export const runtime = "nodejs";

// Events we act on. Anything else is acknowledged and ignored — an endpoint
// subscribed to more than it handles should not 500 on the rest.
//
// ⚠️ `customer.subscription.created` is deliberately absent.
// checkout.session.completed already covers creation, and handling both would
// mean two writes describing one thing.
const HANDLED = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

/** Stripe fields are `string | Object | null` depending on expansion. */
function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  // ⚠️ 500, not 400. The request is fine; WE are misconfigured. A 400 tells
  // Stripe not to retry and the event is lost forever; a 500 makes it retry
  // with backoff, so once the secret is set the missed events still arrive.
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Webhook not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const stripe = getStripe();

  // ⚠️ THE RAW BODY. Never req.json(): parsing and re-serialising changes
  // whitespace and key order, the HMAC stops matching, and every event fails
  // verification for reasons that look like a Stripe problem.
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    // ⚠️ THIS IS THE SECURITY BOUNDARY OF THE ENTIRE BILLING SYSTEM.
    //
    // The column grant, the coaches_block_client_billing_writes() trigger and
    // the service-role isolation all exist so a coach cannot set their own
    // subscription_status. This route can. If it accepted unsigned requests,
    // anyone who guessed the URL could POST a fabricated event and grant
    // themselves Pro — and every other guard would be theatre.
    //
    // Nothing from the body is read before this line. Not for logging, not for
    // routing.
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    // 400 and no retry: a forged or misconfigured signature is not transient.
    console.error("[stripe-webhook] signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (!HANDLED.has(event.type)) {
    // Acknowledge so Stripe stops sending it.
    return new Response(null, { status: 200 });
  }

  // Per-event: which subscription, and any direct pointer back to the coach.
  let subscriptionId: string | null = null;
  let coachIdHint: string | null = null;
  let customerId: string | null = null;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Guard against future one-off payment sessions landing here.
    if (session.mode !== "subscription") {
      return new Response(null, { status: 200 });
    }

    subscriptionId = idOf(session.subscription);
    // Set at session creation from the authenticated coach — the most direct
    // route home, and one the browser never had a chance to influence.
    coachIdHint = session.client_reference_id ?? null;
    customerId = idOf(session.customer);
  } else {
    const subscription = event.data.object as Stripe.Subscription;
    subscriptionId = subscription.id;
    // Written via subscription_data.metadata at checkout, because
    // customer.subscription.* events carry no client_reference_id.
    coachIdHint = subscription.metadata?.coach_id ?? null;
    customerId = idOf(subscription.customer);
  }

  if (!subscriptionId) {
    console.error("[stripe-webhook] no subscription id on event", event.type, event.id);
    return new Response(null, { status: 200 });
  }

  // ⚠️ RETRIEVE FRESH rather than trusting the payload.
  //
  // Stripe delivers at-least-once and in NO guaranteed order, so a stale
  // `updated` can arrive after a newer one and quietly overwrite current status
  // with old status. Reading the subscription's current state at handling time
  // makes ordering irrelevant, makes duplicate deliveries harmless, and
  // self-corrects if an event was missed entirely. One extra API call per
  // event, which at this volume is nothing.
  let subscription: Stripe.Subscription;
  try {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 404) {
      // Genuinely gone — retrying cannot help. Acknowledge and move on.
      console.error("[stripe-webhook] subscription not found", subscriptionId);
      return new Response(null, { status: 200 });
    }
    // Transient (network, Stripe outage). 500 so Stripe retries with backoff.
    console.error("[stripe-webhook] failed to retrieve subscription", err);
    return new Response("Retrieve failed", { status: 500 });
  }

  const admin = createServiceClient();

  // Three routes home, in priority order. More than one is needed because
  // customer.subscription.* events have no client_reference_id, and a
  // subscription created by hand in the Stripe dashboard would carry no
  // metadata either.
  let coachId = coachIdHint ?? subscription.metadata?.coach_id ?? null;

  if (!coachId && customerId) {
    const { data: match } = await admin
      .from("coaches")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    coachId = match?.id ?? null;
  }

  // ⚠️ Do NOT guess. 200 rather than an error: an event we can never match is
  // not transient, and a 500 would have Stripe retrying the same unmatchable
  // payload with backoff for days.
  if (!coachId) {
    console.error(
      "[stripe-webhook] could not resolve a coach",
      event.type,
      "subscription:", subscriptionId,
      "customer:", customerId,
    );
    return new Response(null, { status: 200 });
  }

  // ⚠️ SERVICE ROLE. These three columns are unwritable by `anon` and
  // `authenticated` by design — that is the whole point of the trigger — so
  // this is the one path allowed to set them.
  //
  // stripe_customer_id is written again here on purpose: the checkout action's
  // write is non-fatal and may have failed, so this self-heals it.
  //
  // .select() is load-bearing. An update matching zero rows returns success
  // with no rows, so without asking for them back a wrong coach id would look
  // like a clean write — the same trap ProfileMenu's name save documents.
  const { data: updated, error: writeError } = await admin
    .from("coaches")
    .update({
      subscription_status: subscription.status,
      stripe_subscription_id: subscription.id,
      ...(customerId ? { stripe_customer_id: customerId } : {}),
    })
    .eq("id", coachId)
    .select("id");

  if (writeError) {
    // Transient database failure — 500 so Stripe retries. ⚠️ Returning 200 here
    // would mark the event delivered and lose the update permanently.
    console.error("[stripe-webhook] failed to write billing state", writeError);
    return new Response("Write failed", { status: 500 });
  }

  if (!updated || updated.length === 0) {
    // Resolved to a coach id that does not exist. Retrying cannot fix that.
    console.error("[stripe-webhook] no coaches row matched", coachId);
    return new Response(null, { status: 200 });
  }

  return new Response(null, { status: 200 });
}
