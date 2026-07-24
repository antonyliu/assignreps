-- Goal type + side on assignments.
--
-- goal_type — what the assignment's `target` actually measures. Until now every
-- assignment meant "do N attempts", with track_makes only deciding whether makes
-- were recorded alongside. Two more shapes exist in real coaching:
--
--   'reps'        target = attempts. Today's behaviour, unchanged.
--   'makes'       target = makes ("make 50 free throws"). Attempts still recorded
--                 when offered, but completion is measured in makes.
--   'consecutive' target = STREAK LENGTH ("hit 5 in a row"), not a quantity to
--                 accumulate. See the note below — this one does not follow the
--                 SUM(amount) >= target rule the other two share.
--
-- ⚠️ consecutive completion is deliberately NOT `SUM(amount) >= target`. The
-- target holds the streak length the coach asked for (3/5/10), while the student
-- logs SETS COMPLETED — one row, amount = 1, once they hit the streak. Summing
-- amount against target would demand the student hit "5 in a row" five separate
-- times. Completion is therefore `SUM(amount) >= 1` for this goal type, and the
-- stored target is read as context ("hit 5 in a row") rather than as a quantity.
-- Every completion site has to special-case it; there is no schema-level way to
-- express "this target means something different", which is the cost of folding
-- three shapes into one column.
--
-- NOT NULL DEFAULT 'reps' backfills every existing assignment to exactly the
-- behaviour it has today, so nothing already assigned changes. Postgres 11+
-- applies that default without rewriting the table.
--
-- side — which hand/side the drill is for. Nullable, and null is the common case:
-- it means "unspecified", not "both". Only exercises where a side is meaningful
-- offer it, and the coach can leave it unset on those too.
--
-- Both columns are additive and non-destructive. track_makes is left in place:
-- it stays the record of the coach's choice for a 'reps' goal, and is forced true
-- by the assign action for 'makes'/'consecutive' (where makes are implied). That
-- redundancy is deliberate — deriving track_makes from goal_type at read time
-- would silently rewrite the meaning of every row already out there.
--
-- ⚠️ Shared-project caveat: local/staging/prod all use the one hosted Supabase
-- project, so running this affects every environment at once. There is no
-- local-only schema change.

alter table public.assignments
  add column if not exists goal_type text not null default 'reps';

alter table public.assignments
  add column if not exists side text;

-- Idempotent: re-running the migration must not error on existing constraints.
alter table public.assignments
  drop constraint if exists assignments_goal_type_check;

alter table public.assignments
  add constraint assignments_goal_type_check
  check (goal_type in ('reps', 'makes', 'consecutive'));

alter table public.assignments
  drop constraint if exists assignments_side_check;

-- Null passes a CHECK in Postgres (the expression evaluates to NULL, not false),
-- so "unspecified" needs no explicit allowance here.
alter table public.assignments
  add constraint assignments_side_check
  check (side in ('left', 'right'));
