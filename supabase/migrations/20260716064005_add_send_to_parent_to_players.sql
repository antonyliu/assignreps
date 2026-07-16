-- Add send_to_parent flag to players.
-- Determines whether the homework SMS goes to the student's phone or the
-- parent's phone. Additive and non-destructive: existing rows default to false.
alter table public.players
  add column if not exists send_to_parent boolean not null default false;
