# scripts/ — one-off testing infrastructure

Throwaway operational scripts for **manual testing only**. Nothing in `src/`
imports from here, and nothing here runs in CI, at build time, or in production.

They exist because several states the app can reach are impractical or
impossible to produce through the UI: a roster of 30 students, a subscription
whose billing period has ended, or a Pro coach *over* the 30 ceiling — which the
add gate is specifically built to prevent.

## ⚠️ Before running anything

- **Test-mode Stripe keys only.** Every script calls `requireTestMode()` and
  aborts unless `STRIPE_SECRET_KEY` starts with `sk_test_`. These scripts mutate
  billing state and delete data; none of it is safe against real customers.
- **`stripe listen` must be running** for anything that expects a webhook —
  `testclock-advance.mjs` above all. Without it the events are delivered
  nowhere, `subscription_status` never changes, and the result is
  indistinguishable from a broken feature:
  ```
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```
  ⚠️ It prints a **new** `whsec_…` every session. Paste it into `.env.local` and
  restart the dev server, or every event fails signature verification.
- ⚠️ **There is no local database.** Local, staging and prod all share the one
  hosted Supabase project, so every row these scripts write or delete is visible
  in production immediately. Only ever point them at a test coach account.
- They read `.env.local` directly and use the **service role** key, which
  bypasses RLS and the `coaches` billing-write trigger. That is the whole reason
  they can set up states the app refuses to.

## The scripts

| Script | What it does |
|---|---|
| `_env.mjs` | Shared bootstrap: env parsing, Supabase service client, a small Stripe REST helper, the test-mode guard, and copies of `isEntitled()` / `activeStudentLimit()`. ⚠️ Those copies mirror `src/lib/entitlement.ts` — change one, change both. |
| `seed-test-players.mjs` | Adds 24 players to bring a Pro coach to exactly 30 active, for testing the ceiling boundary. Refuses to overshoot 30, refuses to run twice, refuses on a non-Pro coach. |
| `delete-test-players.mjs` | Removes them, by primary key. |
| `seed-over-ceiling.mjs` | Pushes a Pro coach to 31 active — **over** the ceiling. Unreachable through the UI, since the add gate stops a coach exactly at 30. Renders the `over_ceiling` variants. |
| `delete-over-ceiling.mjs` | Removes those, by primary key. |
| `testclock-setup.mjs` | Puts a coach's subscription on a Stripe **test clock** so the billing period can be fast-forwarded. ⚠️ A test clock can only be attached to a customer **at creation**, so this necessarily makes a new customer and subscription and repoints the coach at them — an existing subscription can never be retroactively advanced. |
| `testclock-advance.mjs` | Advances that clock past `current_period_end`, then reports Stripe's status beside the database's. ⚠️ The two disagreeing is the signature of a dead `stripe listen`, not a bug. A clock advance is irreversible. |
| `delete-test-coach.mjs` | Fully removes a test coach — logs, assignments, custom exercises, players, the coach row, and the `auth.users` row. **Dry run by default**; needs `--execute`. |

## Conventions every script follows

- **Resolve the account by email, never a hardcoded id.**
- **Delete by primary key**, from an id file written at seed time, so a real
  student can never be caught by a name or phone match.
- **Record what was seeded** to `scripts/_seeded-*.json` / `_testclock-*.json`.
  ⚠️ Those files hold live Stripe and coach ids and are **gitignored** — they are
  run state, not infrastructure.
- **Refuse rather than guess.** Wrong plan, missing id file, rows that no longer
  look seeded, or attached assignments and logs all abort with an explanation.
- Test phone numbers use the reserved fictional `555-01xx` / `555-02xx` range so
  they can never collide with a real student's number.

## ⚠️ Deleting a coach: what does NOT cascade

`delete-test-coach.mjs` deletes bottom-up explicitly rather than relying on
cascade, because **exactly one foreign key in this project is defined in a
migration file** (`logs.assignment_id`, `SET NULL`). Every `coach_id`
relationship was created in the Supabase dashboard and appears in no file, so
their `ON DELETE` behaviour cannot be verified by reading the repo.

Two things are definitely **not** cascades:

- **`auth.users`** — deleting the `coaches` row leaves the auth user behind.
  That is how this project accumulated more auth users than coaches. The script
  removes it via the admin API, last.
- **Stripe** — untouched unless you pass `--stripe`. In test mode that is only
  untidy; the same omission against live data leaves a customer being billed for
  an account that no longer exists.
