-- Reversible pause on a student: deactivation.
--
-- Null = ACTIVE. The default, and where every student starts.
-- Set  = INACTIVE, and this is when the coach deactivated them.
--
-- Mirrors assignments.filed_at exactly — the pattern this codebase already uses
-- for reversible state. A timestamp rather than a boolean keeps WHEN as well as
-- WHETHER, at no extra cost, and reads the same way at every call site.
--
-- ⚠️ NAMING — deliberately NOT "archived_at". "Archive" already means a
-- FINISHED ASSIGNMENT FILED AWAY, on both the coach's screen and the student's,
-- and assignments.filed_at is the column behind it. A second meaning for players
-- would make "archived" ambiguous in every conversation and every function name.
-- The UI says Deactivate / Activate and the state reads Active / Inactive.
--
-- ⚠️ The vocabulary is shared with the billing gate ON PURPOSE. The free-tier
-- count and the Pro ceiling both count ACTIVE students — this column, IS NULL —
-- and the roster says "Active" / "Inactive" to mean the same thing. One term end
-- to end, no translation layer between what a coach reads and what the gate
-- computes. See activeStudentLimit() in src/lib/entitlement.ts.
--
-- ⚠️ Deactivation TOUCHES NO DATA. Assignments and logs are untouched and
-- unmoved; reactivating restores full function with nothing lost. It is not a
-- soft delete, and it must never become one — permanent delete stays its own
-- separate, heavier action, and remains reachable directly from the active state
-- rather than sitting behind deactivation.
--
-- ⚠️ It is a full pause in BOTH directions. The coach cannot assign new work to
-- an inactive student, and the student cannot log progress on existing work
-- while inactive. Their token link still opens — it is never a dead link — but
-- it shows a message asking them to check with their coach.
--
-- Nullable, no default, no backfill: every existing player reads as null, i.e.
-- active, which is exactly what they all are today.
--
-- ⚠️ Shared-project caveat: local, staging and prod all use the one hosted
-- Supabase project, so running this affects every environment at once. Adding a
-- nullable column rewrites no rows and takes no meaningful lock.

alter table public.players
  add column if not exists deactivated_at timestamptz;

-- The billing gate's read is "this coach's ACTIVE players, count only", and the
-- roster's is "this coach's players, split by active or not". Both filter on
-- coach_id first and test this column second, so the two travel together —
-- matching assignments_player_filed_idx, which exists for the same shape.
create index if not exists players_coach_deactivated_idx
  on public.players (coach_id, deactivated_at);
