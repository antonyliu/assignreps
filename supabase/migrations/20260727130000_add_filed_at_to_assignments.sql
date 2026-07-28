-- Manual filing: which tab an assignment sits in on the coach's player detail
-- screen.
--
-- Null  = the card is in "New". The default, and where everything starts.
-- Set   = the card is in "Logged", and this is when the coach moved it there.
--
-- ⚠️ NAMING — deliberately NOT `logged_at`.
--
-- `logs.logged_at` already exists and means something completely different: the
-- moment a STUDENT recorded reps. An `assignments.logged_at` would sit inches
-- away from it in the same queries — the player detail page reads both tables
-- into one aggregation — and would mean "the moment a COACH filed the card
-- away". Two columns, one name, opposite actors. `filed_at` costs a small
-- mismatch with the tab label ("Logged") and buys an unambiguous schema.
--
-- If the "Logged" tab is later renamed (it currently competes with "Done",
-- "finished" and "Clear finished" elsewhere on the same screen), this column can
-- be renamed to match then — while the collision, once shipped, would be
-- permanent.
--
-- ⚠️ Filing is NOT completion, and the two are now fully independent. Nothing
-- moves automatically: a finished assignment stays in New until the coach files
-- it, and a filed one can be moved back. isComplete() no longer decides tab
-- membership at all — it only draws the ✓ badge on the card.
--
-- Nullable with no backfill, and no default. Every existing assignment reads as
-- null, i.e. "in New", which is exactly where they all are today.
--
-- Non-destructive: filing hides nothing permanently and deletes nothing. It
-- replaces the old "Clear finished" flow, which deleted assignment rows outright
-- and orphaned their logs.
--
-- ⚠️ Shared-project caveat: local/staging/prod all use the one hosted Supabase
-- project, so running this affects every environment at once. Adding a nullable
-- column rewrites no rows.

alter table public.assignments
  add column if not exists filed_at timestamptz;

-- Every read is "this player's cards, split by filed or not", so the player
-- filter and the null test travel together.
create index if not exists assignments_player_filed_idx
  on public.assignments (player_id, filed_at);
