-- Stripe billing state on coaches.
--
-- The product: 3 students free forever, paywall at the 4th, $10/mo monthly,
-- promo COACHRJ = lifetime free. The gate this schema has to answer is one
-- question — "may this coach add a 4th student?" — and everything here exists
-- to answer it plus service the subscription afterwards.
--
--   stripe_customer_id      the Stripe Customer. Needed twice: webhooks arrive
--                           keyed on it, and the Billing Portal session (change
--                           card, cancel) is created from it.
--   stripe_subscription_id  the Subscription. Not needed for the gate, but it
--                           makes reconciliation possible without an extra API
--                           round trip when a webhook is missed or replayed.
--   subscription_status     Stripe's own status string, mirrored. THIS is the
--                           gate.
--
-- All nullable, no defaults, no backfill. NULL across all three means "never
-- went through checkout", which is what every existing coach genuinely is, and
-- it reads as the free tier — so every row backfills to exactly its current
-- behaviour. Same shape as filed_at and note.
--
-- ⚠️ NO CHECK CONSTRAINT ON subscription_status, deliberately. Stripe owns that
-- vocabulary (incomplete, incomplete_expired, trialing, active, past_due,
-- canceled, unpaid, paused) and has extended it before. The only writer is a
-- webhook, so a constraint rejecting an unfamiliar value would fail the UPDATE
-- and leave this row frozen at a stale status while Stripe has moved on —
-- meaning a coach is wrongly gated or wrongly admitted, silently, with no error
-- anyone sees. That is the same failure the log snapshot columns avoided by
-- taking no constraints at all: reject the write and you lose the truth.
--
-- Entitlement is therefore decided in app code by an explicit allowlist
-- (active + trialing), not by the database. Anything unrecognised falls through
-- to unentitled, which fails closed.
--
-- ⚠️ The promo does NOT need a column. COACHRJ is a 100%-off forever coupon, so
-- RJ still holds a real subscription that reports 'active' at $0. He passes the
-- same gate by the same rule as a paying coach. Nothing special-cases him — and
-- per today's decision nothing special-cases anyone: the 3-student limit applies
-- identically regardless of how a roster got that large.
--
-- ⚠️ WRITE PROTECTION IS ALREADY IN PLACE, and it is load-bearing.
-- 20260725120000 did:
--     revoke update on public.coaches from authenticated;
--     grant  update (name) on public.coaches to authenticated;
-- That grant is an ALLOWLIST OF ONE COLUMN. A signed-in coach can write `name`
-- and nothing else, so these three columns are unwritable by the coach the
-- moment they exist — no policy work needed here, and no way to PATCH yourself
-- into Pro through the anon key.
-- ⚠️ Any future migration that issues a blanket `grant update on public.coaches`
-- would silently hand every coach the ability to set their own billing status.
-- Keep the grant column-scoped.
-- Writes come from the Stripe webhook via the service role, which bypasses RLS
-- and column grants.
--
-- The unique index is on stripe_customer_id because webhooks look coaches up by
-- it, and because two coach rows must never claim one Stripe customer. Postgres
-- allows many NULLs under a UNIQUE index, so every existing row is fine.
--
-- ⚠️ Deliberately NOT added: current_period_end. Nothing reads it yet, and the
-- gate does not need it — a coach who cancels keeps status 'active' until the
-- period actually ends. Adding it now would repeat parent_phone, which has sat
-- present-but-dead since July 17. It is additive whenever "renews on X" copy is
-- actually built.
--
-- ⚠️ Shared-project caveat: local/staging/prod all use the one hosted Supabase
-- project, so running this affects every environment at once. There is no
-- local-only schema change. Additive and non-destructive — nullable columns
-- rewrite nothing and change no existing row.

alter table public.coaches
  add column if not exists stripe_customer_id text;

alter table public.coaches
  add column if not exists stripe_subscription_id text;

alter table public.coaches
  add column if not exists subscription_status text;

-- Idempotent: re-running the migration must not error on an existing index.
create unique index if not exists coaches_stripe_customer_id_key
  on public.coaches (stripe_customer_id);
