-- Snapshot an assignment's identifying fields onto each log row at write time.
--
-- The problem: `logs` stores only `assignment_id`, while exercise_name, unit,
-- goal_type, target and side all live on the assignment. "Clear finished" and
-- "Remove assignment" delete assignment rows, and logs.assignment_id is
-- ON DELETE SET NULL, so the log survives carrying an amount and a date and no
-- record of what it was. Every reader keys on assignment_id and skips nulls, so
-- an orphan is invisible rather than visibly broken — the damage is silent.
--
-- Not currently losing real data (nothing has been cleared yet), but it blocks
-- any progress/insights view, and it becomes a WEEKLY loss the moment a
-- repeat-assignment feature ships.
--
-- These five columns are the log's own copy, written by saveLog from a
-- server-side read of the assignment row. Once written they are never updated:
-- the point is that they record what the work WAS at the moment it was logged,
-- so a later edit to the assignment (or its deletion) cannot rewrite history.
--
-- ⚠️ Nullable on purpose, and there is no backfill. Existing rows genuinely do
-- not have this information — their assignment may since have been edited, so
-- copying today's assignment values onto a log written last week would invent a
-- past that may not be true. Null here means "written before snapshots existed",
-- which is honest; readers must keep treating assignment_id as the primary link
-- and fall back to the snapshot only when it is present.
--
-- No CHECK constraints on goal_type/side, deliberately. On `assignments` those
-- constraints guard a coach's live input; here the values are copies the server
-- already read out of a constrained column, and a constraint that rejected an
-- unexpected legacy value would fail the student's insert and lose reps they
-- actually did. The write path is the guard.
--
-- Readers are NOT changed by this migration — every screen still joins live to
-- `assignments` exactly as before. This only means logs written from now on
-- carry enough to survive their assignment being deleted.
--
-- ⚠️ Shared-project caveat: local/staging/prod all use the one hosted Supabase
-- project, so running this affects every environment at once. There is no
-- local-only schema change. Additive and non-destructive — adding nullable
-- columns rewrites nothing and changes no existing row.

alter table public.logs
  add column if not exists exercise_name text;

alter table public.logs
  add column if not exists unit text;

alter table public.logs
  add column if not exists goal_type text;

alter table public.logs
  add column if not exists target integer;

alter table public.logs
  add column if not exists side text;
