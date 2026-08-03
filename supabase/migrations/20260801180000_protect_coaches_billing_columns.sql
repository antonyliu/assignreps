-- Stop a coach writing their own billing state.
--
-- ⚠️ THE BUG THIS FIXES WAS LIVE, not theoretical. Verified against the real
-- database on Aug 1 2026, not inferred from migration files:
--
--   * `coaches` carries a dashboard-created "coaches: own row" policy FOR ALL,
--     which is in no migration file.
--   * `authenticated` (and `anon`) hold TABLE-level UPDATE on public.coaches.
--   * 20260725120000 revoked exactly that and re-granted only `update (name)`.
--     The column grant is still present on `name` — {authenticated=w/postgres} —
--     but something re-granted table-level UPDATE over the top of it afterwards,
--     most likely a Supabase dashboard operation re-applying default privileges.
--
-- ⚠️ Postgres privileges are a UNION, and the table-level grant wins. A
-- table-wide GRANT UPDATE permits writing EVERY column, so the surviving
-- column grant on `name` grants nothing extra and restricts nothing. Together
-- with the own-row policy, a signed-in coach could PATCH any column on their
-- own row through the anon key — email (mirrored from auth.users, would
-- silently desync), instructor_type (drives the exercise library), and as of
-- today the three billing columns.
--
-- Nothing read subscription_status yet, so no bypass was exploitable. It would
-- have become one the moment the paywall shipped.
--
-- TWO LAYERS, deliberately, because the first one already failed once:
--
--   1. Re-revoke table-level UPDATE and restore the column allowlist. This
--      restates the intent and is the layer that produces a clean "permission
--      denied for column" error.
--   2. A trigger. ⚠️ This is the layer that actually holds. Whatever re-granted
--      the table privilege in the last seven days can do so again — a fix that
--      a dashboard click silently undoes is not a fix for a billing gate.
--      Triggers are unaffected by grant changes.
--
-- ⚠️ RLS cannot express this. An UPDATE policy's WITH CHECK sees only the new
-- row; Postgres gives no way to reference the old row there, so no policy can
-- say "billing columns must be unchanged." That is why this is a trigger.
--
-- ⚠️ The trigger covers INSERT as well as UPDATE, and that is not incidental.
-- Signup writes the full coaches row as `authenticated`, so an UPDATE-only
-- guard would leave a crafted signup free to set subscription_status = 'active'
-- on the way in — the exact bypass, one step earlier. On INSERT the rule is
-- that a client must leave all three NULL.
--
-- Role detection reads the PostgREST JWT claim rather than auth.role(), which
-- has been deprecated in newer Supabase versions. Direct SQL (dashboard, psql,
-- migrations) sets no claim at all, and the service role reports
-- 'service_role' — both must keep working, since the Stripe webhook is the
-- only legitimate writer of these columns.

-- ── Layer 1: privileges ──────────────────────────────────────────────────────

revoke update on public.coaches from authenticated;
revoke update on public.coaches from anon;

grant update (name) on public.coaches to authenticated;

-- ── Layer 2: trigger ─────────────────────────────────────────────────────────

create or replace function public.coaches_block_client_billing_writes()
returns trigger
language plpgsql
as $$
declare
  jwt_role text := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
begin
  -- service_role (the Stripe webhook) and direct SQL are the legitimate
  -- writers. Only the two client-facing roles are policed.
  if coalesce(jwt_role, '') not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.stripe_customer_id is not null
       or new.stripe_subscription_id is not null
       or new.subscription_status is not null
    then
      raise exception 'coaches billing columns are not client-writable'
        using errcode = '42501';
    end if;
  else
    if new.stripe_customer_id     is distinct from old.stripe_customer_id
       or new.stripe_subscription_id is distinct from old.stripe_subscription_id
       or new.subscription_status    is distinct from old.subscription_status
    then
      raise exception 'coaches billing columns are not client-writable'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

-- Idempotent: re-running the migration must not error on an existing trigger.
drop trigger if exists coaches_block_client_billing_writes on public.coaches;

create trigger coaches_block_client_billing_writes
  before insert or update on public.coaches
  for each row
  execute function public.coaches_block_client_billing_writes();
