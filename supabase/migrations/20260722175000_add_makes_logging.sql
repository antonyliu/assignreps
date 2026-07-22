-- Makes logging: let a student optionally record how many they MADE out of the
-- reps they logged, so the coach sees a percentage rather than raw volume.
--
-- Two columns, deliberately split across the two tables:
--
--   assignments.track_makes — the coach's decision, per assignment. Set once at
--     assign time (defaulted by category: shooting-type drills on, everything
--     else off) and read by both the student log screen and the coach's detail
--     view to decide whether makes are part of this drill at all.
--
--   logs.makes — the student's answer, per log entry. Nullable *by design*: the
--     input is optional even when track_makes is true, so null means "logged the
--     reps, didn't say how many went in" and is distinct from 0, which means
--     "made none". Any aggregate must therefore treat null and 0 differently.
--
-- Both are additive and non-destructive. track_makes is NOT NULL DEFAULT false,
-- so every existing assignment reads as "don't track" and no screen changes for
-- work already out there; Postgres 11+ applies that default without rewriting
-- the table. logs.makes is plain nullable, so every existing log reads as "no
-- makes recorded".
--
-- Non-negative is enforced, but makes is deliberately NOT constrained against
-- amount. A student can fat-finger 60 makes on 50 reps, and the product decision
-- is to keep the row and let the coach see the raw numbers with the percentage
-- suppressed — a rejected insert would instead lose the reps they actually did.
-- Only nonsense that can't be displayed at all (a negative) is rejected here.
--
-- RLS is untouched. logs INSERT/SELECT is currently open (see "Tighten logs RLS
-- policy" in CLAUDE.md pending), so the anon student page can already write this
-- column; assignments keeps its existing coach-owned policies.
--
-- ⚠️ Shared-project caveat: local/staging/prod all use the one hosted Supabase
-- project, so running this affects every environment at once. There is no
-- local-only schema change.

alter table public.assignments
  add column if not exists track_makes boolean not null default false;

alter table public.logs
  add column if not exists makes integer;

-- Idempotent: re-running the migration must not error on an existing constraint.
alter table public.logs
  drop constraint if exists logs_makes_non_negative;

alter table public.logs
  add constraint logs_makes_non_negative check (makes is null or makes >= 0);
