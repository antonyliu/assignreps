-- Fix: "new row violates row-level security policy for table players" when an
-- instructor adds a player.
--
-- Discovered state (Supabase SQL editor, July 20 2026) — public.players has two
-- policies:
--   1. "players: coach owns"    FOR ALL     using: coach_id IN (
--                                             SELECT coaches.id FROM coaches
--                                             WHERE coaches.id = auth.uid())
--                                           with_check: NULL
--   2. "players: read by token" FOR SELECT  using: true   with_check: NULL
--
-- Root cause: the only policy covering INSERT is "players: coach owns" (FOR ALL),
-- and its with_check is NULL. In Postgres, an ALL/INSERT policy with no WITH
-- CHECK reuses its USING expression as the insert check. So every insert must
-- satisfy the *indirect* test coach_id IN (SELECT coaches.id FROM coaches WHERE
-- coaches.id = auth.uid()). That subquery reads public.coaches, which is itself
-- under (locked-down) RLS, and it yields no row in the insert-check context —
-- so coach_id IN (∅) is false and the insert is rejected. (It is not a missing
-- coaches row: that would raise a foreign-key error, not an RLS error.)
--
-- The app already inserts with coach_id = auth.uid() (add-student/actions.ts),
-- so the correct authorization check is the *direct* coach_id = auth.uid(), with
-- no dependency on being able to SELECT coaches under RLS.
--
-- Fix: add a dedicated INSERT policy with that direct check. Permissive policies
-- are OR-ed per command, so this grants the valid insert without removing or
-- altering the existing "players: coach owns" (still governs SELECT/UPDATE/
-- DELETE) or the anon "players: read by token" path the student page relies on.
-- Scoped to `authenticated` — tighter than the existing `public` role, since an
-- anon caller has no auth.uid() to insert against anyway.
--
-- ⚠️ Shared-project caveat: local/staging/prod all use the one hosted Supabase
-- project, so running this affects every environment at once. There is no
-- local-only RLS change.

begin;

-- No-op if RLS is already enabled (it is — the policies above are enforced).
alter table public.players enable row level security;

-- Idempotent: drop-if-exists then create so re-running is safe.
drop policy if exists "players: coach can insert own" on public.players;
create policy "players: coach can insert own"
  on public.players
  for insert
  to authenticated
  with check (coach_id = auth.uid());

commit;
