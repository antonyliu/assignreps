-- Preserve student progress when an assignment is cleared.
--
-- Previously logs.assignment_id -> assignments.id was ON DELETE CASCADE, so
-- deleting an assignment (e.g. the student-detail "Clear completed" action)
-- also deleted its logs. This changes the rule to ON DELETE SET NULL: the log
-- rows (amount + logged_at) survive, just detached from the deleted assignment.
--
-- NOTE: this is a deliberate exception to the "all FKs cascade" convention.
-- logs.player_id -> players.id stays ON DELETE CASCADE, so deleting a player
-- still removes all of their logs.

begin;

-- 1) Allow the column to be null so a deleted assignment can detach its logs.
alter table public.logs alter column assignment_id drop not null;

-- 2) Drop whatever FK currently enforces logs.assignment_id (by discovered name).
do $$
declare r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class cl on cl.oid = con.conrelid
    join unnest(con.conkey) as k(attnum) on true
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = k.attnum
    where con.contype = 'f'
      and cl.relname = 'logs'
      and att.attname = 'assignment_id'
  loop
    execute format('alter table public.logs drop constraint %I', r.conname);
  end loop;
end $$;

-- 3) Recreate it with ON DELETE SET NULL.
alter table public.logs
  add constraint logs_assignment_id_fkey
  foreign key (assignment_id) references public.assignments(id) on delete set null;

commit;
