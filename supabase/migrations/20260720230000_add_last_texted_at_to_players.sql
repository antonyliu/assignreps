-- Add last_texted_at to players.
--
-- Backs the "notify the student when work is assigned, at most once per day"
-- rule. Stores an absolute instant; the once-per-day comparison interprets it in
-- America/Los_Angeles at read time, so the column stays timezone-agnostic and
-- DST is handled by the caller's Intl formatting rather than baked in here.
--
-- Additive and non-destructive: nullable with no default, so every existing row
-- reads as "never texted" and the next assignment sends.
--
-- ⚠️ Shared-project caveat: local/staging/prod all use the one hosted Supabase
-- project, so running this affects every environment at once.

alter table public.players
  add column if not exists last_texted_at timestamptz;
