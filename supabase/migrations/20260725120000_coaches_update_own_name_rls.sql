-- Lets a signed-in coach change their own display name from the profile menu.
--
-- Until this runs, the "Edit name" save is a silent no-op: with RLS enabled and
-- no UPDATE policy, PostgREST returns 200 with an empty result rather than an
-- error, so the client cannot tell "saved" from "blocked" without inspecting the
-- returned rows. ProfileMenu therefore asks for the updated row back via
-- .select() and treats zero rows as a failure — that guard is what surfaces a
-- missing policy instead of quietly dropping the coach's edit.
--
-- There is no base schema migration in this repo (the original tables were made
-- in the Supabase dashboard), so the existing coaches SELECT/INSERT policies are
-- not represented as files. This adds only the UPDATE path and leaves those
-- alone. Written idempotently so re-running it is safe.

alter table public.coaches enable row level security;

drop policy if exists "Coaches can update their own row" on public.coaches;

create policy "Coaches can update their own row"
  on public.coaches
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- The policy alone would let a coach PATCH any column on their own row through
-- the anon key — including email, which is mirrored from auth.users and would
-- silently desync, and instructor_type, which drives the exercise library. The
-- app only ever needs to write `name`, so narrow the privilege to that column.
-- INSERT is a separate privilege and is unaffected: signup still writes the full
-- row at /instructor/signup/email.
revoke update on public.coaches from authenticated;
grant update (name) on public.coaches to authenticated;
