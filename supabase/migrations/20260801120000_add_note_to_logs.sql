-- Optional student note on a practice log.
--
-- RJ asked for "a notes section for players"; clarified July 27 to the small
-- shape: one optional, length-capped "anything to tell coach" field on the
-- STUDENT log screen. The student writing to the coach, not a two-way thread
-- and not the longitudinal recap idea tracked separately.
--
-- Nullable, no default, no backfill. Null means "no note", which is what every
-- existing row genuinely is — there was nowhere to write one until now. It
-- lives on `logs` rather than `assignments` because it belongs to a session:
-- the student says something about the reps they just did, and a second log
-- against the same assignment is a second, separate thing to say.
--
-- ⚠️ SCHEMA ONLY. Nothing writes or reads this column yet. saveLog is unchanged
-- and the log screen has no field for it, so this migration is inert until the
-- application-code step lands.
--
-- The 100-character cap is enforced here as a BACKSTOP, not as the primary
-- guard. char_length counts characters rather than bytes, so a student gets 100
-- real characters and is not cut short by a multibyte accent or emoji. (Note
-- that a few emoji are several code points and so count as more than one.)
--
-- ⚠️ The write path must cap the note BEFORE inserting, and this constraint must
-- never be the thing that stops an over-length note. A note travels on the same
-- INSERT as `amount` and `makes`, so a rejected note fails the whole row and
-- loses reps the student actually did — the exact failure the log snapshot
-- columns avoided by taking no CHECK constraints at all. The difference that
-- makes a constraint safe here: this column is new, so there is no legacy value
-- for it to reject. Every value it will ever see is one the app wrote today.
--
-- Null passes a CHECK in Postgres (the expression evaluates to NULL, not false),
-- so "no note" needs no explicit allowance — same as assignments_side_check.
--
-- ⚠️ Two things this migration deliberately does NOT decide, both belonging to
-- the write path rather than the schema:
--   - Empty string vs null. '' satisfies the constraint, so the app has to pick
--     whether a blank field normalises to null. Same class of distinction as
--     logs.makes, where null ("didn't report") and 0 ("made none") mean
--     different things and must never be conflated.
--   - Editing. There is no UPDATE policy on `logs`, so a note cannot be changed
--     once written — the same limitation as the retroactive-makes gap. If a note
--     should be editable, that needs its own RLS policy and its own decision.
--
-- ⚠️ Shared-project caveat: local/staging/prod all use the one hosted Supabase
-- project, so running this affects every environment at once. There is no
-- local-only schema change. Additive and non-destructive — adding a nullable
-- column rewrites nothing and changes no existing row.

alter table public.logs
  add column if not exists note text;

-- Idempotent: re-running the migration must not error on an existing constraint.
alter table public.logs
  drop constraint if exists logs_note_length_check;

alter table public.logs
  add constraint logs_note_length_check
  check (char_length(note) <= 100);
