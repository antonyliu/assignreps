# Reps — CLAUDE.md
*Last updated: Aug 4 2026 · See `CHANGELOG.md` for shipped-feature history. Prod commit and environment sync are not tracked here — they drifted three times in two days. Run `git branch -r -v`.*

---

## 🔖 Where we left off — Aug 4 2026

**Start here tomorrow.** Everything below is committed on local `main`; nothing is in progress and the working tree is clean.

Three threads moved today: **the billing gate** (built and verified), **the landing page** (hero rebuilt and a second section added, both now locked), and **housekeeping** (one real-data mistake corrected, three sets of gotchas written down).

### Git state at close

`main` is **34 commits ahead of prod** and **28 ahead of staging**. Both remotes are ancestors, so either push is a clean fast-forward. Verified with `git branch -r -v` at close — prod sits at `88de42a`, staging at `7e0660d`, local tip `1266b94`. ⚠️ Do not carry these numbers forward; re-run the command.

⚠️ **Prod is held back deliberately, not by neglect — and the reason got STRONGER today, not weaker.** Prod has no Stripe env vars, and `main` now carries two things that depend on them:

1. The **"Upgrade to Pro"** menu item, which would error on tap.
2. The **add-student gate**, which is the serious one. `isEntitled()` reads `subscription_status`, which is NULL for every coach in live mode — so on prod RJ reads as free tier and is **blocked from adding his 11th student**. He is at ~10 and has never been told the limit exists. See the RJ section below; that conversation is the blocking item.

⚠️ **The whole landing-page redesign is stuck behind that same gate** — the new hero, the "one place" section, the CTA and copy work, roughly thirty commits, none of which touch billing. If any of it is wanted on prod sooner, cherry-pick onto a branch off `origin/main` rather than pushing `main`. (The earlier version of this note said "two harmless landing-page commits"; that was true on Aug 3 and is badly out of date now.)

### Billing — where it actually stands

The whole loop **including the add-student gate** is built and verified end to end locally (see Billing architecture). ⚠️ **What remains is live mode**, which does not exist at all — see Stripe status.

⚠️ **RJ is provisioned as Pro in TEST MODE ONLY.** On Aug 3 his Stripe customer (`cus_V0bVdpHROg0RE1`) and subscription (`sub_1U0aJ6JoxKRCY55iGi5HfZ3l`, $0/mo via `COACHRJ`) were created **directly through the Stripe API — not through the app's checkout button** — and his `coaches` row was updated by firing a real `customer.subscription.updated` through the webhook rather than by editing the database.
- **None of this exists in live mode and must be redone at launch.** New customer, new subscription, and the coupon recreated uncapped against a `sk_live_` key. Test and live share nothing.
- Why it was done: so neither real coach is the one blocked while the gate was being built and tested. ✅ **Resolved Aug 4** — testing the block needed a third, non-Pro coach, and one was created for exactly that (`tonyliu34+gate@gmail.com`, "ZZ Test — gate"). ⚠️ It lives in the **same shared Supabase project as prod**, so delete it when it has served its purpose; `players.coach_id` is CASCADE, so its players go with it.
- ⚠️ RJ has still not been told about the 3-student limit — see its own section below, which is now the blocking item.

### ✅ The add-student gate — BUILT and VERIFIED end to end (Aug 4 2026)

**Done, and proven against a real coach in a real browser — not just compiled.** `FREE_STUDENT_LIMIT` is now read by both the mutation and the page. See **The add-student gate** under Billing architecture for the design and the two deliberate asymmetries in it.

What was actually exercised, in order:

1. A third, non-Pro test coach (`tonyliu34+gate@gmail.com`, named "ZZ Test — gate") was blocked at the 4th player. The gate fired at exactly 3.
2. **Upgrade was started from the gate screen itself**, not the ProfileMenu — so the shared `useUpgrade()` handler is confirmed working from **both** entry points, which is the whole reason it was extracted.
3. ⚠️ **The first checkout silently did nothing, because `stripe listen` was not running** — it had died in a reboot. See the gotcha under *To resume local billing work*; this cost real time.
4. After restarting `stripe listen` and taking the **fresh** `STRIPE_WEBHOOK_SECRET` into `.env.local`, checkout completed, the webhook fired, `isPro` flipped, and a 4th player ("Nanna") was added.

⚠️ **Live mode is still untouched by all of this.** The gate works against `sk_test_`; nothing about it has run against a live key, and there is no live product, price or coupon to run it against yet.

### ⚠️ RJ still has not been told about the 3-student limit

**This is now the blocking item, and it changed character today.** Until the gate existed, the limit was theoretical. It is now real code on `main`: the day this reaches an environment RJ uses with live billing, he is stopped at his 11th student.

He is at ~10 students and holds no live-mode subscription. He must either be told, or be provisioned in live mode first — ideally both, in that order. That conversation is still owed and is no longer safe to defer indefinitely.

### ✅ Landing page — hero and section 2 both BUILT and LOCKED (Aug 4 2026)

The largest thread of the day by commit count. Everything below is shipped on `main` and settled; see **Landing page (current)** for the full description and the reasoning behind each choice.

- **The hero was rebuilt around a single device mock**, replacing the two-circle photo collage. It draws the coach's *student-detail* screen — the only screen where progress bars, a completed assignment and a student's note are all simultaneously real. Marked **LOCKED**: no further visual changes.
- **A second section, "one place"**, sits between the hero and the product loop: heading, subtext, a contextual CTA, and two upright device mocks (assign screen + roster) with quiet captions. Warm-dark `#252932` band, a step lighter than the loop's `#1c1f26`, so the page descends hero → here → loop → footer → device frames.
- ⚠️ **A dark hero was built and reverted the same day.** It read as muddy and brown. The cream hero is the shipped design; the groundwork is in `b739fda` if it is ever revisited. Recorded in *What was killed and why* so it is not re-attempted as though untried.
- **One `CAST` constant now owns every invented person and number on the page.** The hero used to be loop frame 4 byte-for-byte with the name swapped — same three exercises, same three figures — so the page read as disconnected mock sets. Coach Mike, Jalen's loop story, Maya's hero screen, and the roster (Tariq, Sofia, Nico) all come from it.
- **One page shell**: `--page-max` (960px) and `--page-pad` on `.paper-grain`, referenced by every band. There are no `1100px` literals left in the file. Header, hero device, section-2 heading, first loop frame and footer all measure the same left edge.
- **A size-hierarchy ratio is now the rule**, not fixed numbers: section 2 sits at ~82% of the hero's equivalent heading and device sizes, expressed as the same clamp curve scaled. Any future section takes the next tier down the same way.
- **Real CTAs have their own treatment** (`.cta-real`): brand blue, real elevation, larger type and radius than anything drawn inside a phone frame. ⚠️ The colour is the brand token deliberately — a separate deeper blue was tried and reverted for reading as off-brand rather than distinct. Copy is `Start free` in the hero (kept literal for a first-time stranger) and `Start your program` in section 2.

### Housekeeping and documentation (Aug 4 2026)

- ⚠️ **Real student names were removed from a committed file.** `docs/explorations/roster-weekly-summary-exploration.html` used Khloe, Caleb, Phoenix, Mason and Avery — five of RJ's actual students, lifted from this file while building a "realistic roster shape". No public exposure (`docs/` is not served), but they are children. Swapped for invented names in `e9eb574`. **The rule, now written into that file and into `CAST`: a realistic SHAPE is worth copying from real data; the names are not part of the shape.**
- **Three sets of gotchas are now written down** rather than living in one session's memory: swapping a hero image (the Next 16 cache path, and why an image swap cannot be verified by eye), recovering hero sources from git, and editing `page.tsx` (breakpoint-scoped rules that look applied because they apply *somewhere* — four instances in one day — plus backticks terminating the `<style>` template literal).
- **The auth user audit** is logged under Medium priority: 8 rows in `auth.users` against 3 in `coaches`.

### Parked, deliberately — not started

- **Activity picker narrowing** — basketball live, soccer/tennis/"create your own" hinted as Soon, everything else removed from what a coach sees at signup. Still only a captured plan; `activityTypes.ts` carries all ten. The homepage half shipped Aug 3 (soccer hero photo); the picker half has not started. See *Queued for next session* item 2.
- **Landing page copy — empty state and permission language.** Reviewed and **deliberately left unchanged**; the existing copy was judged already correct. ⚠️ The specific strings and reasoning were not captured at the time, so this entry records the decision but not its detail — worth writing down properly if it is ever revisited, rather than re-deriving it.
- **Roster weekly summary stat (RJ's consistency + active players)** — explored in depth, not shipped, see `docs/explorations/roster-weekly-summary-exploration.html` for reasoning and visual variations.
- **"How it works" section redesign** — move away from four full dark phone screens in a row, which read as repetitive once the new hero carries a single device mock. Direction: numbered steps (1–4) as the primary structure with short human copy per step, using small contextual screen snippets only where they genuinely help, rather than a full flow. Different section background colour to separate it visually from the hero. **Not started — direction only, no design work done.**

### To resume local billing work

`STRIPE_WEBHOOK_SECRET` is **local-only** and comes from `stripe listen`, which must be running for any webhook to arrive:

```
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

⚠️ It issues a **new secret each session** — update `.env.local` and restart the dev server, or every event fails signature verification. Nothing is configured in Vercel for staging or prod yet.

### ⚠️ `stripe listen` does not survive a reboot — and its failure is SILENT

**This cost real time on Aug 4 and will cost it again.** `stripe listen` is a foreground process. Anything that ends it — a reboot, closing the terminal, killing the tab, the machine sleeping hard enough — ends webhook delivery, and **nothing in the app says so**.

The symptom is not an error. Checkout completes, Stripe takes the payment, the coach is redirected back, and then *nothing happens*: `subscription_status` is never written, `isPro` never flips, and the upgrade appears to have simply failed. The app is behaving correctly — it never received the event.

**Every time the dev environment restarts, before touching billing:**

1. Restart it — `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. Copy the **new** `whsec_…` it prints. ⚠️ It is different every run; the old value in `.env.local` is dead.
3. Paste it into `.env.local` as `STRIPE_WEBHOOK_SECRET` and **restart the dev server** so Next re-reads it.

⚠️ Skipping step 2 or 3 fails differently but just as quietly — events arrive and are rejected `400 Invalid signature` at the webhook. That at least appears in the `stripe listen` output, where a dead listener shows nothing at all.

**Check it is alive before assuming the code is wrong.** A live listener prints each forwarded event; silence during a checkout means the listener, not the app.

---

## What this is

**Reps** keeps the work going between training sessions. A lightweight web app for coaches and instructors to assign practice homework to students, who log their progress on their phone. No bloat — just the accountability loop that makes homework actually happen.

**Live:** assignreps.com · **Staging:** staging.assignreps.com  
**Stack:** Next.js App Router · TypeScript · Tailwind CSS · Supabase · Twilio · Resend · Vercel

---

## Core insight

The instructor is the customer — not the student. Students never choose this tool; they receive a link. The product closes the accountability loop: coaches assign work verbally with no way to verify follow-through. Reps gives them a receipt.

**Product loop:** Assign → student logs → coach sees → optional parent digest.

---

## Three users

### Coach / Instructor
- Signs up via email OTP (6-digit code, no password, no magic link)
- Signup flow (per-step URLs): name → instructor type → email + 6-digit code → students list
- Adds students by name + one phone number, with a Player/Parent toggle for whose number it is
- Assigns exercises from a default library or creates custom ones
- Picks a **goal type** (attempts / makes / consecutive) and an optional **side** (left / right)
- Views each student's progress and shooting percentage (makes/attempts)
- Sorts finished work into **New / Archive** tabs by hand — nothing moves on its own
- Can re-issue finished work with **Assign again**, which creates a fresh assignment
- Roster grouped: Done / In progress / Not started / Nothing assigned — and **within each group, sorted by most recent activity**, so the reading order matches the last-activity dates shown beside each name. See the roster sort note below

### Student
- Gets a text with a unique link — no signup required
- Can also log in from any device at assignreps.com via phone OTP
- Taps link → sees their assignments, split into the same **New / Archive** tabs the coach sees
- Logs with a stepper counter; what the stepper counts depends on the goal type
- Can leave an optional note with a log — one capped line to the coach, on the log screen. The only thing a student **writes** in the app; everything else they do is a count
- Sees a celebration when done: 🔥 + "[Coach] will see this."
- ⚠️ Read-only on the tabs. Only the coach files and unfiles; the student screen has no write path for it.

### Parent
- Optional per student — instructor decides at add-student time
- Read-only web view: practice days, assignments completed, last activity
- ⚠️ **Not built as described anywhere else.** No digest is sent — there is no cron, no scheduled job, and nothing links to `/parent/[token]`. See "Parent contact model" in Pending for the resolved design, which is not yet implemented.

---

## Tech stack

| Tool | Purpose |
|------|---------|
| Next.js App Router | Framework |
| Supabase (project `obkwxyzpugpleahrgcby`, US West) | Database + Auth |
| Tailwind CSS | Styling |
| Twilio | SMS (student assignments + parent digest) |
| Resend | Auth emails from hello@assignreps.com |
| Vercel | Hosting + deploys |
| GitHub `antonyliu/assignreps` | Repo |

**Local dev:** localhost:3000 · test phone uses code `123456` to bypass real SMS

---

## Environments

| Environment | URL | Branch |
|-------------|-----|--------|
| Production | assignreps.com | main |
| Staging | staging.assignreps.com | staging |
| Local | localhost:3000 | — |

**Workflow:** Local → staging (iPhone test) → prod. Never commit directly to staging. Default Claude Code target is local only — always state "push to staging" or "push to prod" explicitly.

Staging is deployed by pushing local `main` to the remote `staging` branch (`git push origin main:staging`); prod is `git push origin main:main`. Both should always be fast-forwards.

⚠️ Local, staging, and prod all share the same Supabase project. Schema migrations hit all environments at once — there is no local-only schema change.

---

## Database schema

```
coaches
  id, name, email, phone (nullable), instructor_type, created_at,
  stripe_customer_id (text, nullable, unique), stripe_subscription_id (text, nullable),
  subscription_status (text, nullable)   -- Stripe's own status string, mirrored

players
  id, coach_id, name, phone, parent_phone, send_to_parent, token, last_texted_at, created_at

assignments
  id, coach_id, player_id, exercise_name, target, unit (reps/minutes), video_url,
  week_start, created_at, track_makes (boolean, default false),
  goal_type (text, NOT NULL, default 'reps'), side (text, nullable),
  filed_at (timestamptz, nullable)   -- null = New tab, set = Archive tab

logs
  id, player_id, assignment_id, amount, makes (integer, nullable), logged_at,
  exercise_name (text, nullable), unit (text, nullable), goal_type (text, nullable),
  target (int4, nullable), side (text, nullable),   -- snapshot, written at insert
  note (text, nullable)                             -- student → coach, max 100 chars

custom_exercises
  id, coach_id, name, unit (reps/minutes), default_amount, created_at
```

Migrations live in `supabase/migrations/`. There is **no base schema migration** — the original tables were created in the Supabase dashboard, so only later changes are captured as files.

### Key schema notes

- `goal_type` — what `target` measures. `'reps'` (attempts), `'makes'`, or `'consecutive'`. Checked by `assignments_goal_type_check`. Defaults to `'reps'`, which backfills every pre-existing row to exactly its prior behavior.
- `side` — `'left'`, `'right'`, or NULL. Checked by `assignments_side_check`. NULL means **unspecified**, not "both". (NULL passes a Postgres CHECK natively, so no explicit allowance is needed.)
- `track_makes` — when true, the log screen offers a makes entry. Forced true by the assign action when `goal_type` is `'makes'` or `'consecutive'`, where makes are the point. Kept as its own column rather than derived, so the stored row states the coach's intent outright.
- `logs.makes` — nullable integer. `null` means "didn't report makes"; `0` means "made none." Never conflate these — they mean different things for percentage calculations.
- ⚠️ **`logs.logged_at` is stored in UTC**, like every timestamp here. Raw dashboard views show it unconverted, so Pacific-time evening sessions appear as the middle of the night — a 7pm log reads as `02:00` the next day. This has already caused one real misread: a run of logs at "2–3am" looked alarming until the offset was accounted for, and they were ordinary evening practice. Convert before drawing any conclusion from raw rows — `rj_logs_readable` exists for exactly this. The app itself is unaffected: it renders relative times, and the SMS gate compares LA calendar dates explicitly via `Intl` (see `notify-assignment.ts`).
- **Log snapshot columns** — `exercise_name`, `unit`, `goal_type`, `target`, `side` on `logs`. The log's own copy of the assignment as it stood when the row was written. Set once by `saveLog` from a server-side read, never updated after — a later edit to the assignment must not rewrite what the student actually did. They exist because `logs.assignment_id` is `ON DELETE SET NULL`: without them a deleted assignment leaves a log with no record of what it was. No CHECK constraints, unlike their `assignments` counterparts: these are copies of already-validated values, and a constraint that rejected an unexpected legacy value would fail the student's insert and lose reps they actually did. See the RESOLVED entry in Pending for the backfill.
- **`logs.note`** — the student's optional message to the coach on a single practice log, capped at 100 characters by `logs_note_length_check` (`char_length(note) <= 100` — characters, not bytes, so an accent or an emoji doesn't cost a student extra room). Nullable, no default, no backfill; NULL means "no note", which every pre-existing row genuinely is. It sits on `logs` rather than `assignments` because it belongs to a session — a second log against the same assignment is a second, separate thing to say. Migration `20260801120000_add_note_to_logs.sql`.
  - ⚠️ **Written on INSERT only.** There is no UPDATE policy on `logs`, so a note cannot be edited or added after the fact — the same limitation as the retroactive-makes gap, and it comes from the same missing policy. Making notes editable needs its own RLS policy and its own replace-vs-append decision.
  - ⚠️ **The write path must cap the text before inserting; the constraint is a backstop, never the guard.** `note` travels on the same INSERT as `amount` and `makes`, so a rejected note fails the whole row and loses reps the student actually did. That is precisely the failure the snapshot columns avoided by taking no CHECK constraints at all — a constraint is only safe here because the column is new and has no legacy values it could reject.
  - **Empty string normalizes to NULL at the write path**, never stored as `''`. Nothing in the schema stops `''` — it satisfies the constraint — so this is the app's job. Two spellings of "said nothing" is the same trap as `logs.makes` null vs 0, and it breaks the reader below: a `note IS NOT NULL` check treats `''` as a real note and renders a blank line.
  - ⚠️ **Display reads the most recent log for an assignment where `note IS NOT NULL`** — *not* the literal latest log. An assignment accumulates logs across sessions and most of them will carry no note, so keying on the newest row would blank out an earlier note the moment the student logs again without writing one.
  - ✅ **Verified live on staging, Aug 1 2026** — against real data, not just the compiler. A note written on a **STAR drill** assignment rendered correctly on both surfaces: the coach's student detail card and the student's own home card, with the right text on each. The fold above and the card rendering are confirmed working end to end; every earlier note in this file describing them as compiler-verified only is superseded.
- **`filed_at`** — which tab an assignment sits in: NULL = **New**, set = **Archive**, and the value is when the coach moved it. Nullable, no default, no backfill; every pre-existing row reads as New, which is where they all were. Indexed as `(player_id, filed_at)` since every read on both list screens is "this player's cards, split by filed or not."
  - ⚠️ **Filing is independent of completion.** Nothing moves automatically. A finished assignment stays in New until a coach archives it, and archiving is reversible. `isComplete()` no longer decides tab membership at all — it only draws the ✓ badge and picks which menu actions a card offers.
  - ⚠️ **Deliberately NOT named `logged_at`.** `logs.logged_at` already means "when a STUDENT recorded reps", and the player detail page reads both tables into one aggregation. Two columns, one name, opposite actors. The small mismatch with the "Archive" tab label is the price; the collision would have been permanent.
- `logs_amount_check` — a constraint requiring `amount > 0` exists on `logs` but is NOT in any migration file (created directly in the dashboard). Don't try to insert `amount: 0`.
- `logs_makes_non_negative` — `makes IS NULL OR makes >= 0`.
- Assignments are not time-bounded — they persist until the instructor archives them (or deletes them, which is only possible before the work is finished).
- `logs.assignment_id → assignments.id` is **ON DELETE SET NULL** — deleting an assignment never deletes log history.
- The `coaches` table is NOT anon-readable. Student pages use `coach_name_for_token(text)` SECURITY DEFINER RPC to get the coach name for a valid student token.
- **`coaches` billing columns** — `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, added Aug 1 2026 (`20260801170000`). All nullable, no defaults, no backfill: NULL across all three means "never went through checkout", which every pre-existing coach is, and which reads as the free tier. `stripe_customer_id` is uniquely indexed — webhooks look coaches up by it, and two coach rows must never claim one Stripe customer.
  - **No CHECK on `subscription_status`**, deliberately. Stripe owns that vocabulary (`incomplete`, `incomplete_expired`, `trialing`, `active`, `past_due`, `canceled`, `unpaid`, `paused`) and has extended it before. The only writer is a webhook, so a constraint rejecting an unfamiliar value would fail the UPDATE and freeze the row at a stale status while Stripe moved on — a coach wrongly gated or wrongly admitted, silently. Same reasoning as the log snapshot columns. **Entitlement is an allowlist in app code** (`active` + `trialing`), so anything unrecognised fails closed.
  - No promo column. `COACHRJ` is a 100%-off-forever coupon, so RJ holds a real subscription reporting `active` at $0 and passes the same gate by the same rule.
- ⚠️ **`coaches: own row` — a policy that exists live and in NO migration file.** `FOR ALL`, created directly in the Supabase dashboard. Same class of invisible-to-the-repo object as `logs_amount_check` and the `rj_*`/`tony_*` views: reading `supabase/migrations/` does **not** show you this table's real security posture. It is what lets a signed-in coach read and write their own row at all.
- ⚠️ **`coaches` write protection is a TRIGGER, not a grant — and that distinction was learned the hard way.**
  - `20260725120000` revoked table-level UPDATE and re-granted only `update (name)`, intending an allowlist of one column. **That protection was silently dead by Aug 1.** Something re-granted table-level UPDATE to `authenticated` in the intervening week — most likely a dashboard operation re-applying Supabase's default privileges. ⚠️ **Postgres privileges are a UNION and the table grant wins**, so the surviving column grant on `name` restricted nothing. Combined with the `coaches: own row` policy above, a coach could PATCH any column on their own row through the anon key — including `email` (mirrored from `auth.users`) and `instructor_type`.
  - Found on Aug 1 by running a verification query when the billing columns landed, **not** by reading the migration file — which described protection that was no longer in force. Nothing read `subscription_status` yet, so no bypass was exploitable; it would have become one the moment the paywall shipped.
  - Fixed in `20260801180000` with **two layers**: the revoke and column grant restated (they produce the clean "permission denied for column" error), plus a `before insert or update` trigger, `coaches_block_client_billing_writes()`, which rejects any change to the three billing columns from the `anon` or `authenticated` JWT roles. **The trigger is the layer that actually holds** — whatever re-granted the privilege once can do so again, and triggers are unaffected by grant changes.
  - ⚠️ It covers **INSERT as well as UPDATE**. Signup writes the full `coaches` row as `authenticated`, so an UPDATE-only guard would leave a crafted signup free to set `subscription_status = 'active'` on the way in.
  - ⚠️ **RLS cannot express this.** An UPDATE policy's `WITH CHECK` sees only the new row — Postgres offers no way to reference the old row there — so no policy can say "billing columns must be unchanged". That is why it is a trigger.
  - ⚠️ **Not verified:** the trigger's rejection path has never executed. The privilege layer fires first, so the negative test was never run. Configuration is confirmed (no table-level UPDATE for the client roles, exactly one column grant, trigger enabled); the trigger's *behaviour* under a future grant regression is not.

### Foreign key cascade rules
- `players.coach_id → coaches.id` — CASCADE
- `assignments.player_id → players.id` — CASCADE
- `logs.player_id → players.id` — CASCADE
- `logs.assignment_id → assignments.id` — **SET NULL** (intentional — preserves log history)

### Dashboard convenience views

`rj_logs`, `rj_assignments`, `rj_players`, `tony_logs`, `tony_assignments`, `tony_players` — per-coach views for reading data in the Supabase dashboard. **Not app-facing**; nothing in `src/` references them, and they are not in any migration file (created in the dashboard, like the base schema).

Rebuilt July 27 2026: player name joined in, columns reordered person-first so a row is readable at a glance. They had frozen at old column lists and were missing everything added since.

⚠️ **A view does not track its base table.** Postgres expands `SELECT *` at creation time and stores the expanded list, so adding a column to `assignments` or `logs` does **not** add it to these views — and `pg_get_viewdef` shows the expanded form either way, so you cannot tell from the definition whether it was written as `*` or spelled out. The only reliable check is comparing the view's column list against the table's.

⚠️ `create or replace view` can append columns but **cannot reorder or remove** them. Reordering needs `drop` + `create`, which also drops any grants and dependent objects. Re-run these after any schema change that should show up in them.

**`rj_logs_readable`** — added on top of `rj_logs` (it does not modify it) purely for human browsing in the dashboard. Adds a formatted `logged_when` text column via `to_char(logged_at at time zone 'America/Los_Angeles', …)`, so a row can be read at a glance without doing UTC arithmetic in your head. Not app-facing, like its siblings, and created directly in the dashboard rather than in a migration file — same as the rest of these.

---

## Goal type system

Live on prod July 24 2026. Three shapes an assignment's `target` can take.

| Goal | Target means | Completion rule | Log screen |
|------|--------------|-----------------|------------|
| `reps` | attempts | `SUM(amount) >= target` | attempts stepper, optional makes row |
| `makes` | makes | `SUM(makes) >= target` | **makes stepper only** |
| `consecutive` | **streak length** | `SUM(amount) >= 1` | single "sets completed" stepper |

### ⚠️ Consecutive does not follow the target

`consecutive` stores the streak the coach asked for ("hit 5 in a row" → `target = 5`) but the student logs **sets completed** — one row, `amount = 1`, once they manage it. Completion is therefore **one set**, not `>= target`. Summing amount against target would demand hitting the streak five separate times.

There is no schema-level way to express "this target means something different", so every completion site special-cases it. That is the cost of folding three shapes into one column.

### One completion rule, seven call sites

`isComplete(goalType, target, logged, makes)` in `src/lib/exercises.ts` is the single source of truth. Seven places ask "is this done?" and all route through it:

1. `src/app/student/[token]/page.tsx` — card state + the all-done panel
2. `src/app/instructor/student/[id]/page.tsx` — card state + the all-done panel
3. `src/app/instructor/students/page.tsx` — roster grouping and counts
4. `src/app/student/[token]/log/[assignmentId]/actions.ts` — `allDone` for confetti
5. `LogScreen.tsx` — client `done` state
6. `src/app/student/[token]/log/[assignmentId]/page.tsx` — the `alreadyLogged` cap
7. `src/app/instructor/student/[id]/actions.ts` — which rows `fileFinishedAssignments` archives (and which cards `AssignmentMenu` offers Archive vs Delete)

⚠️ Miss one and it reports completion **too early**: on a "make 50" assignment a student who attempts 50 and makes 20 satisfies `amount >= target`. The roster was the most exposed — it fetched neither `makes` nor `goal_type`.

⚠️ **A render-time gate is not a correctness guarantee.** Site 7 exists because the retired `clearCompletedAssignments` used to delete the player's whole assignment list unfiltered. The lesson carried straight into its replacement — `fileFinishedAssignments` computes its own set server-side for exactly this reason. That was invisible in the normal flow: the "Clear finished" control only renders under `allDone`, so "everything" and "everything complete" were the same set. They diverge on a **stale page** — the coach loads an all-done student, assigns new work from another tab or device, then clicks the still-rendered button — and under direct invocation of the server action, which no UI gate reaches at all. An action has to establish its own preconditions; it cannot borrow them from whatever rendered its button.

Companions: `progressValue()` (what fills the bar) and `progressTarget()` (the denominator; consecutive collapses to 1).

### Which categories offer what

Two independent gates in `src/lib/exercises.ts`:

- `supportsGoalTypes(categoryKey)` — **shooting, finishing, spot-shots**. A makes or streak goal only means something where a rep is a shot that can go in or miss. Also requires `unit !== 'minutes'`.
- `supportsMakes(categoryKey)` — everything **except conditioning, footwork, handling**. Those three have nothing to make, so the "Track makes?" toggle never renders.

`MAKELESS_CATEGORIES` is currently the exact complement of `GOAL_CATEGORIES`, but they stay separate functions because custom exercises resolve differently in each: a custom keeps the makes toggle (defaulting off) but gets **no** goal selector.

### Side

`supportsSide(exerciseName)` — every exercise except **Free throws, Jump rope, Planks, Isometric squats, Pick-up basketball, Suicides, Sprints (baseline to baseline)**. Matched by exact library name; customs match nothing and therefore offer it.

Nothing is selected by default. Tapping the active option clears it back to NULL.

Displayed as `Corner 3s · Left` on both the coach detail card and the student home card, and as "Left hand" / "Right hand" under the title on the log screen.

✅ **Layups collapsed July 27 2026.** Finishing shipped `Layups (right hand)` and `Layups (left hand)` as two entries from before `side` existed — neither was in `SIDELESS_EXERCISES`, so a coach could assign "Layups (right hand) · Left". They are now one **`Layups`** entry, side-enabled the same way everything else is: by not appearing in the denylist. No flag, no new mechanism.

⚠️ **`RETIRED_EXERCISE_NAMES`** in `src/lib/exercises.ts` maps the two old names to `Layups`. This is load-bearing. `exercise_name` is free text, stamped permanently at assign time, and is the **only** link back to a category — and two live call sites pass a *stored* name into name-based lookups: `categoryKeyForExercise` (student log screen) and `presetsForExercise` (coach's Edit-amount modal). Without the redirect, every existing Layups row would lose its category, flipping the student's hero label from ATTEMPTS to REPS on already-assigned work and stripping the preset row out of the coach's modal.

Existing rows are untouched and still read literally as "Layups (left hand)" for RJ and the student. Only what's *derived* from the name is redirected. History stays literal; new work reads "Layups · Left".

Retiring any other library name in future needs an entry in that map for the same reason.

---

## Makes logging system

Built July 22 2026, extended by the goal type system July 24.

**How it works:**
- Coach toggles "Track makes?" at assign time (per-assignment, not per-exercise) — where the category supports it
- Log screen seeds every stepper from already-logged totals on return
- Delta save — only the new increment is inserted, never the running total
- Coach sees `made X/Y · Z%` on the student detail card and student home card
- Percentage is computed only over logs that recorded makes (null logs don't drag down the average)
- If makes > attempts, the percentage is suppressed but the raw numbers still show (bad data guard)
- The `made X/Y · Z%` line is **hidden entirely on a makes goal** — `21/25 makes` already says it, and the percentage is over attempts rather than the target, so the two read as contradicting each other

**Makes ≤ attempts is a control guard, never a data clamp.** On a `reps` goal the makes `+` stops at parity, a typed value settles down on blur, and reducing attempts drags makes down with it. None of this rewrites already-banked history — a legacy row whose makes exceed its attempts simply freezes. On a `makes` goal the guard is off entirely, since attempts aren't collected.

⚠️ **`logs_amount_check` workaround:** on a makes goal the student can record makes without any attempts field on screen, which would send `amount: 0` and lose the row. The makes delta stands in as the amount. It's the honest floor — you can't make a shot without taking it — but it means attempts are *inferred* there, not measured.

**Known limitation:** a student who logs attempts without makes and completes the assignment cannot retroactively add makes. `logs_amount_check` blocks `amount: 0`, and a makes-only update would need an RLS UPDATE policy that doesn't exist.

---

## Archive model (New / Archive tabs)

Live on prod July 27 2026. Replaces the old **"Clear finished"**, which is gone — see below.

Both list screens — the coach's player detail and the student's own home — split assignments into two tabs, driven by `assignments.filed_at` and nothing else.

| Tab | Rule |
|-----|------|
| **New** | `filed_at IS NULL`. The working list: not-started, in-progress and finished-but-unarchived, in `created_at` order. |
| **Archive** | `filed_at` set. |

**Nothing moves automatically.** A finished card sits in New until a coach archives it. `isComplete()` no longer decides tab membership — it only draws the ✓ badge and picks which menu actions a card offers.

Shared components: `src/components/AssignmentTabs.tsx` (the tab bar + list switch, used by both screens; empty-state copy is injected per caller, since the coach reads about their student and the student reads about themselves) and `src/components/AllDonePanel.tsx` (the 🎉 celebration).

### What a card shows

Identical content on both screens — the coach's player detail and the student's own home — because it is the same information about the same work:

- Exercise name, with `· Left` / `· Right` appended when `side` is set
- The count in the goal's own measure, and the progress bar (2px; two-tone on a `reps` goal with makes)
- `made X/Y · Z%` — only where makes were recorded, and **hidden entirely on a makes goal**
- **The student's note**, when one exists

**The note line** sits **last**, below everything else — under the bar on a card with no makes line, under the makes line where there is one. It follows the card's structure rather than a fixed position, so it needs no branch of its own. Treatment: a `border-t border-reps-line` hairline, `mt-2`/`pt-2`, **11.5px italic** in `text-reps-dim`, wrapped in curly quotes. No label, no icon — the words are the student's own and the quotes say who is speaking; a `NOTE:` prefix would make the card read as a form.

⚠️ **Renders only when a note exists.** A card without one is byte-identical to before the feature — no border, no spacing, no wrapper element. This is why adding it changed no existing layout.

⚠️ Which note is shown is **not** "the latest log's note" — see `logs.note` in Key schema notes for the most-recent-*with-content* rule and why the naive version would blank an earlier note.

### Per-card menu, split on completion

| Card | Menu |
|------|------|
| Not complete | `Edit amount` *(only with no progress yet)* · **`Delete assignment`** — red, confirm modal, a real delete |
| Complete, in New | `Assign again` · **`Archive`** |
| Complete, in Archive | `Assign again` · **`Move back to New`** |

⚠️ The two sets are mutually exclusive, so **`Delete assignment` is unreachable on a finished card.** Deleting finished work is exactly what "Clear finished" did, and it orphaned every log pointing at it. Finished work is moved, never destroyed. (Completion requires logged work under every goal type, so `isDone` implies `hasProgress` — the two branches can't overlap.)

Both moves are **single tap, no confirm** — filing is reversible in one tap the other way, so a modal would be ceremony over a decision that costs nothing to undo. `Delete assignment` keeps its dialog; it's the one genuinely destructive action left on the menu.

**"Delete", not "Remove"** — renamed July 27, because the menu now also carries `Archive` and `Move back to New`, and remove/move read as neighbours. Also matches `Delete exercise` in `CustomExerciseMenu`.

### The all-done panel

The 🎉 celebration is **not a page-level banner** — it lives inside the New tab. It used to render above the tabs, gated only on "is everything finished", which meant it followed the coach onto the Archive tab and, once everything was archived, sat directly above a second greyer message saying the same thing twice.

Two variants, both inside New:

| State | Panel |
|-------|-------|
| All done, finished work still in New | 🎉 · "*{name}* finished everything." · **`Archive it`** — above the cards, which stay visible |
| All done, everything archived | 🎉 · "*{name}* finished everything." · "It's all in Archive." — *is* the empty state, no action |

Student equivalents: "You finished everything." with "*{Coach}* can see your progress." and "It's all in Archive now."

It is **structurally** unreachable from the Archive tab — it lives inside that branch of the tab switch, not behind a condition that could be got wrong.

`Archive it` is the bulk action (`fileFinishedAssignments`), styled as a quiet muted text link, matching the original "Clear finished" treatment rather than a bordered button the app uses nowhere else. Offered only when there's actually something to move (`allDone && fileableCount > 0`).

⚠️ **New-empty-but-not-all-done** falls back to a plain grey line rather than a celebration, so the app never claims a win it can't back up. Only reachable if an incomplete assignment is archived, which the UI doesn't offer.

### Server actions

- `moveAssignmentToLogged(id)` / `moveAssignmentToNew(id)` — one shared `setFiledAt` helper, ownership-scoped. Neither re-derives completion: both are fully reversible, so a mis-tap costs one tap back.
- `fileFinishedAssignments(playerId)` — the bulk action. **Computes the set server-side** rather than inheriting it from whatever rendered the button, and touches only rows that are both finished and still `filed_at IS NULL` so a re-run can't overwrite an earlier timestamp. That server-side filter is the lesson from the delete version, which once deleted a player's whole list unfiltered.
- ⚠️ Function names still say "Logged" (`moveAssignmentToLogged`) from the tab's original name. **UI labels changed, code names didn't** — same rule as when "Repeat" became "Assign again". Don't rename `filed_at` either.
- ⚠️ **These are no longer called from `AssignmentMenu`.** Since the optimistic pass, `CoachAssignmentList` owns the row list and therefore owns the mutation, the optimistic edit, the rollback and the error toast — they have to happen together or the card and the list would disagree about where it is. The menu just reports the tap. See **Navigation & loading feel**.

### ❌ Removed: `clearCompletedAssignments`

Deleted outright, not deprecated. It removed finished assignment rows, and since `logs.assignment_id` is `ON DELETE SET NULL` that silently stripped every log pointing at them of its meaning. Archiving replaces it entirely: nothing is destroyed and any card can be moved back.

---

## Assign again

Live July 27 2026. On any **complete** card's menu. Creates a **new** assignment row copying `exercise_name`, `target`, `unit`, `goal_type`, `side`, `video_url`, `track_makes`, with a fresh `created_at` and the current week's `week_start`.

⚠️ **The original is never touched** — no UPDATE, no DELETE anywhere in the path. It stays finished and keeps its logs, which now carry their own snapshot of what they were. Reopening the original by clearing its logs would have been the smaller change and would have destroyed that history.

Every copied value comes from a **server-side read**; the action takes only an id, so a crafted request can't mint an assignment the coach never chose. That read is player-scoped, which also establishes ownership — the insert previously leaned on the foreign key alone, which proves an assignment exists but not whose it is.

Formerly labelled "Repeat"; renamed for clarity that it creates new work rather than adding reps to the existing card.

---

## Color system

### One green family — emerald, hue 150 (July 27 2026)

Two tokens, one hue. They differ **only** in saturation and lightness, so they read as one colour at two weights rather than as two greens.

| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| `--reps-green` / `reps-green` | `#3ed68a` | 150.0 · 65% · 54% | Makes, every done state, ✓ badges, celebration panel |
| `--reps-green-muted` / `reps-green-muted` | `#247a4f` | 150.0 · 54% · 31% | Attempts fill + ATTEMPTS label/number |
| Bar track (empty) | `#2a2d36` | — | Gray — empty progress track everywhere |

| Role | Token |
|------|-------|
| Bar attempts fill | muted |
| Attempts label + number | muted — **only when `track_makes` is true on a `reps` goal** |
| Reps/Minutes label + number (no makes) | bright — a solo counter takes the bright green outright |
| Makes label + number | bright |
| Done state | bright — bars, pills, checkmarks, roster "Done" group |

⚠️ The muted green on a **label or number** exists only to subordinate attempts to makes. With no makes row on screen there's nothing to rank against, so a reps-only, minutes, makes-goal or streak assignment renders its label and number in the bright token instead. The muted shade is never the "default" text color — it's the *paired* one. (`ATTEMPTS_NUMBER` vs `SOLO_NUMBER` in `LogScreen.tsx`.)

This applies to text only. **Bar fills are unaffected** — an in-progress bar is muted whether or not makes are tracked.

**Rotated from lime on July 27 2026.** Bright `#6bd63d` (H102) → `#3ed68a` (H150); muted `#3d7a24` (H102.6) → `#247a4f` (H150). A pure hue move: the S/L relationship between the two tones shifted by 0.2pp (ΔS −10.7→−10.5, ΔL −22.9→−23.1). Both now sit on **150.0 exactly**, where before they differed by 0.6°.

⚠️ **There is no emerald outlier any more.** The celebrate confetti was `#3dd68c` (H151) — the one hue that disagreed with the family — and now uses the bright token outright. Every green in the app is hue 150.

⚠️ Green-to-blue separation is now **60°** (blue is H210), down from 108°. The two are analogous rather than near-triadic. They remain near-identical in lightness (54 vs 54) so they still read as peers.

**Muted green is a real token as of July 27** — it spent eleven releases as a bare hex in 11 places. Inline styles use `var(--reps-green-muted)`; Tailwind consumers use `text-reps-green-muted`. Both were verified present in the built CSS, since Tailwind drops unknown class names silently.

**Disabled controls** go to `#555` — a visible grey rather than near-invisible opacity, so an inactive `−` still reads in bright sunlight on a court. The locked MAKES label uses the same `#555`; its number renders `#8a8fa8` through `disabled:opacity-40`, landing around `#414552`.

### Other colors
- **Background:** `#080b0f` (`--reps-bg`)
- **Surfaces:** `#1c1f26`
- **Borders:** `#2a2d36`
- **Accent (interactive):** `#378add` (sky blue)
- **Labels:** `#c8cdd8` (`--reps-label`)
- **Placeholders:** `#5a5f72` — ⚠️ **the intended token, but NOT what most fields actually render.** See below.
- **Helper text:** `#8a8fa8`

⚠️ **Known inconsistency — the app has two placeholder colours.** This entry read as though `#5a5f72` were applied uniformly; it is not, and never has been. Nine text-field declarations are split roughly down the middle:

| Placeholder | Declarations |
|---|---|
| `#5a5f72` (`placeholder:text-[#5a5f72]`) — the documented token | `SignupUI` (the shared `INPUT`, so every signup screen), `AddPlayerForm`, `ProfileMenu`, the log screen's **note field** |
| `#8a8fa8` (`placeholder:text-reps-dim`) — actually the **helper-text** value | `CustomExerciseScreen` (×2 — its `INPUT` and its inline number field), `CountScreen`, `PlayerManage`, `PlayerOtpFlow` |

**Why it matters:** `#8a8fa8` is `--reps-sub`, the helper-text value used for captions, counters and context lines. As a placeholder it separates from typed white by only **3.19:1**, so example text reads close enough to real input to be mistaken for a filled field. `#5a5f72` roughly doubles that to **6.34:1**. A placeholder's job is to be clearly lighter than what replaces it, and against typed text is the comparison that decides it — not contrast against the field background.

⚠️ The counter-argument, which is why this isn't simply a bug: `#5a5f72` sits at **2.60:1** against the `#1c1f26` field background, **below WCAG AA**. That is defensible for placeholder text — it is decorative, non-essential, and the label above carries the meaning — but it is very likely why someone reached for the brighter value in the first place. Both choices are reasoned; the problem is that both are live.

Only the **note field** has been moved (Aug 1 2026), and deliberately only that one: it was the field under review, and changing the other five as a side effect of a note-field fix would have been a platform-wide visual change nobody had looked at. **Resolving the split needs its own pass** — pick one value, apply it to all nine declarations, and check each on device. Until then this entry documents the reality rather than the intention.

⚠️ Not part of this split: the log screen's **stepper** placeholders (`ATTEMPTS_NUMBER`, `SOLO_NUMBER`, `MAKES_NUMBER`, `MAKES_NUMBER_MUTED`) deliberately use the green tokens with `placeholder:opacity-100`, because the seeded `0` must read as the label's colour rather than as absent input. Those are intentional and unrelated.

### Bar behavior
- Log screen bar: **6px** (`h-1.5`) — deliberately unchanged. One bar on its own screen, not one of a stack.
- Student home cards: **2px** (`h-[2px]`)
- Coach detail cards: **2px** (`h-[2px]`)
- ⚠️ Card bars went 3px → 2px on July 27 2026, all four sites (both screens × two-tone and single). Some of RJ's players now carry 10+ assignments at once, and at 3px a stack of ten read as heavy banding.
- Two-tone: muted attempts fill + bright makes fill overlaid — **`reps` goal only**. On a makes goal the single bar is already measuring makes, so stacking would draw the same figure twice.
- Single-tone (no makes): single muted fill
- Complete: full bright

---

## Roster screen

The coach's home. `src/app/instructor/students/page.tsx`.

Players are grouped by completion — **Done / In progress / Not started / Nothing assigned** — and within each group sorted by **most recent activity, descending** (Aug 1 2026).

⚠️ **This ordering was undocumented until Aug 1, in both directions.** Before that date rows sat in `players.created_at` order — the order a coach added them — which was never written down either. So this is a first description, not a correction: nothing in this file ever claimed the old behaviour.

- Sort key is `lastLoggedByPlayer`, the same `MAX(logged_at)` already computed for the relative timestamp on each row. No extra query, and the order a coach reads now matches the dates they see.
- **Never-logged players sort to the bottom of their own group** rather than being interleaved via a fallback date, which would rank "never" against real activity.
- Ties keep their previous order. `Array.prototype.sort` is stable and the players query is still ordered by `created_at`, so two never-logged players stay in the order they were added.

⚠️ **Only two groups actually move.** *Done* and *In progress* require logs by definition and reorder fully. *Not started* is assignments-with-no-logs and is a guaranteed no-op — if it ever appears to reorder, something is wrong. *Nothing assigned* is usually a no-op too, but not always: a player whose assignments were all deleted keeps their logs (`assignment_id` goes NULL, never the row), and the activity read is player-scoped precisely so that still counts — so they can outrank a genuinely new player.

⚠️ The sort compares with `Date.parse`; the `MAX(logged_at)` fold immediately above it still compares raw strings with `>`. Both work on uniformly-formatted UTC values — the string form quietly depends on every row carrying identical fractional-second precision. Left as-is, noted so the inconsistency isn't mistaken for intent.

## Student log screen

Stepper-based; the hero stepper is whatever the assignment is scored on.

**Layout (top to bottom):**
1. `← [Exercise name]` header — 44px back tap target, 17px title
2. `Left hand` / `Right hand` context line (only when `side` is set)
3. `X of Y done` progress text — or `X of 1 set · N in a row` for a streak
4. Progress bar (6px)
5. Primary label + large stepper
6. Divider + inline `MAKES` row — **only on a `reps` goal with `track_makes`**
7. Note field — `How'd this one go?` with `optional` beside it, a 3-row textarea, and a right-aligned `{n}/100` counter. **Every goal type**: it sits outside all the branching above, since what a student wants to say isn't a function of how the work is scored
8. `Log progress` button, which **follows the content** rather than anchoring to the bottom (renamed from `Log it` Aug 1 2026 — "Log it" read as a single terminal act, but logs are increments a student adds to across sessions)

**Spacing tightened July 27 2026** — roughly 100px removed. The gap below the progress bar went 96px → 56px (by far the largest on the screen, and the dead zone between "here's where you are" and "here's what you're entering"); header 56 → 48; stepper block to button 56 → 48; button padding `+2rem` → `+1.5rem`.

**Revised again Aug 1 2026, when the note field landed.** Two passes the same day. The first reclaimed slack the July 27 numbers had left behind — those were sized for a screen whose last content was the stepper block, and the note now sits between the steppers and the button. The second **redistributed** it: absolute sizes matter less here than ratios, and the first pass left the screen reading as five evenly spaced rows rather than as groups.

The screen is **two units**: a *counting cluster* (progress bar → goal-type label → hero stepper → hairline → MAKES row) and the *note block* below it. Gaps inside the cluster are tight; the gaps bracketing it are the largest on the screen.

**Current values, top to bottom:**

| Gap | Value | Class |
|---|---|---|
| Header → progress text | 48px | `mb-12` |
| Progress text → bar | 12px | `mb-3` |
| **Bar → goal-type label** | **44px** | `mb-11` |
| Label → hero stepper | 12px | `mt-3` |
| Stepper → hairline | 20px | `mt-5` |
| Hairline → MAKES row | 16px | `mt-4` |
| **Cluster → note block** | **56px** | `mb-14` |
| Note block → button | 32px (+12px `pt-3`) | `mb-8` |

Every gap *inside* the cluster is 20px or less against boundaries of 44px and 56px, so the boundary always wins. The note-side boundary is deliberately the larger of the two — that is what makes the note read as the start of something new rather than the tail of the cluster.

- ⚠️ The bar margin is changed in **both** branches of the `showMakesRow` ternary, which keeps all five goal-type layouts moving together rather than the two-tone bar drifting away from the single one.
- ⚠️ **The four single-stepper layouts were evaluated and left unsplit on purpose** — not overlooked. Makes goal, consecutive, minutes and reps-only all drop the MAKES row, leaving a ~105px cluster against ~192px for attempts+makes, so the same 44px above it is proportionally about **1.8× more prominent** (0.42 vs 0.23 of cluster height). The candidate fix is to split the bar margin by ternary branch — `mb-11` with a MAKES row, `mb-8` without — since the branch already maps exactly to that distinction. Not applied: the grouping still holds arithmetically there (56 > 44), and whether the extra air reads as calm or as empty is a judgment that needs a **real device**. One number across all five until that is seen. Splitting would also reverse the rule in the bullet above, so it is a deliberate trade rather than a free tweak.
- The note block's **32px** to the button is about matching the rest of the app rather than reclaiming slack: `CountScreen`, `CustomExerciseScreen` and `AddPlayerForm` all put **32px** before a full-width primary button, and at `mb-12` this screen sat at **60px** once the sticky wrapper's own `pt-3` is counted — nearly double every other screen. The July 27 figure of 48px is superseded.
  - ⚠️ **32px is the floor, not a free choice.** The sticky wrapper carries a gradient (`h-8`, 32px) anchored above it via `top-0` + `-translate-y-full`, so it occupies the **bottom 32px of this gap**. At `mb-8` the fade spans the gap *exactly*: **0px clear** between the counter and the gradient's top edge, down from 16px at `mb-12`. Tightening further would start the fade over the counter itself.
  - **It abuts the counter; it does not overlap it**, and nothing is dimmed at rest. The gradient runs `from-transparent` at the top edge where it meets the counter, fading to `#080b0f` — which *is* the page background, so on an unscrolled screen the whole thing is invisible. It only does work when content scrolls under the sticky footer.
  - ⚠️ The real consequence: on a screen tall enough to scroll, the counter now begins fading the moment it reaches the footer, where it previously had 16px of travel first. Genuine clearance at this margin would mean shrinking the gradient (`h-6` → 8px clear, `h-5` → 12px), which has **not** been done.
  - Margins do not collapse here — `main` is `flex flex-col`, and flex items never collapse margins — so 32px is exact rather than approximate.

⚠️ **The button lost its `mt-auto`, and that was the load-bearing part.** Auto margin absorbs all remaining vertical slack, so tightening the gaps above would have made the empty band below them *larger* — every pixel saved went straight into that margin. The two problems were one problem. `sticky bottom-0` stays, so it still pins once the screen genuinely fills (long name + side line + makes row on a small phone).

The coach detail CTA **keeps** its `mt-auto` and is untouched. It's free there: that screen's content is a card list long enough to fill the viewport, so the auto margin has nothing to absorb. Same code, opposite result — the difference is content shape.

**Label resolution, in order:**
- `consecutive` → `SETS COMPLETED`
- `makes` goal → `MAKES` (hero)
- `unit === 'minutes'` → `MINUTES` (wins over everything else)
- Shooting / Finishing / Spot shots **with** `track_makes` → `ATTEMPTS`
- Everything else, including a shooting drill with makes off → `REPS`

All render uppercase — these are the goal-type labels, and they stay uppercase and non-question.

⚠️ **One deliberate exception: the note field's `How'd this one go?`** — sentence case, and the only question-form copy on the screen. Validated with RJ and a real student before it shipped, so it is a considered break from the rule above rather than drift. The distinction is what each piece of text is doing: a goal-type label *names the measure* the stepper counts, where a question would be noise; the note field *asks the student for something optional*, which a bare uppercase `NOTE` does not do. Keep new labels uppercase; this exception covers the note field alone.

**Stepper behavior:**
- Numbers seed from already-logged totals on return (not 0)
- Delta save — only the new increment is written to `logs`
- `−` floored at the banked total (can't un-log)
- Attempts capped at target only on a `reps` goal with no makes; a makes or streak goal never caps them
- Makes row is fully inert (label, number and both buttons greyed) until attempts ≥ 1 — on a `reps` goal only
- Native browser number spinner hidden via CSS

---

## Celebrate screen

Reads a `sessionStorage` payload written by the log screen immediately before navigating. Nothing sensitive travels in the URL.

Three states, not two: **loading → ready | missing**. The payload is read once and deleted, so "haven't looked yet" and "looked, found nothing" are genuinely different situations.

- **loading** renders no headline at all — the defaults used to double as the loading state, so every visit asserted "Done." for a frame
- **missing** (refresh, direct visit, or storage that refused the write) shows `Logged.` / "Your progress is saved." — modest by default, because a missing payload means the outcome is unknown. Previously a student who logged 10 of 50 and refreshed was told they had finished.
- **ready** shows `Done.` (40px) or `Logged.` (26px) with the remaining count

The payload carries `noun` (derived from the same label the stepper shows, so "12 attempts to go" can't say "reps") and `goalType`. `unit` stays as a fallback for payloads written by an older bundle mid-deploy.

⚠️ Both the write and the read are wrapped in try/catch. Safari private browsing throws on `sessionStorage`, and an uncaught throw on the write would skip the navigation and strand the student on the log screen with a live `Log progress` button — inviting a second tap and a duplicate row.

Confetti fires only when the **last** open assignment closes (`allDone`).

---

## Exercise library (Basketball) — 30 exercises, 6 categories

Source of truth: `src/lib/exercises.ts`. Category keys: `shooting`, `handling`, `finishing`, `footwork`, `conditioning`, `spot-shots`.

**⚠️ INVARIANT:** Every exercise's `default` must appear in its `quick` preset array. If it doesn't, the count screen opens with no preset selected and the number input hidden. Re-check after any edit.

**Shooting** (reps · 25/50/100/200)  
Form shooting 50, Free throws 50, Mid-range jumpers 50, Corner 3s 25, Catch & shoot 50, Elbow jumpers 25, Short corner jumpers 25, Dribble pull-ups 25

**Ball-handling** (minutes · 5/10/15/20)  
Stationary dribbling 10, Two-ball dribbling 10, Crossovers 5, Figure 8s 5, Dribble series 10

**Finishing** (reps · 10/20/50/100)  
Layups 20, Floaters 20, Euro-step 20, Hop-step 20, Spin 20

**Footwork** (reps · 10/20/30/50)  
Pivots 20, Jump stops 20, Defensive slides 10 `[minutes, 5/10/15/20]`

**Conditioning** (reps · 5/10/15/20)  
Suicides 10, Sprints (baseline to baseline) 10, Jump rope 10 `[minutes, 5/10/15]`, Planks 2 `[minutes, 1/2/3/5]`, Isometric squats 2 `[minutes, 1/2/3/5]`, Pick-up basketball 30 `[minutes, 20/30/45/60]`

**Spot shots** (reps · 5/10/15/20)  
Right corner-to-wing 10, Left corner-to-wing 10, STAR drill 5

**Goal presets** (`GOAL_PRESETS`) — used instead of the category row when the goal isn't `reps`:
- `makes` → 10 / 25 / 50 / 100
- `consecutive` → 3 / 5 / 10

---

## Assign count screen

`CountScreen.tsx`, shared by the preset flow and by re-assigning a saved custom.

Order matters: **Goal first**, because it decides what the number below it means. Switching goals swaps the preset row and resets the target — "50" makes sense as attempts and not as a streak.

1. **Goal** — Attempts / Makes / Consecutive. Only for `supportsGoalTypes` categories on rep-based units.
2. **How many?** — label changes per goal (`How many makes?`, `Hit how many in a row?`)
3. `minutes` caption under the presets for timed exercises only
4. Consecutive note: "Student shoots until they hit the goal, then logs 1 completion."
5. **Track makes?** — only on an attempts goal, and only where `supportsMakes`
6. **Side** — Left / Right, nothing selected by default, tap again to clear
7. `Send to [Player]`

**Edit modal** (`AssignmentMenu.tsx`) uses the same `GOAL_PRESETS` rule so assigning and editing can't drift. Gated on `hasProgress` — "Edit amount" disappears once anything is logged. It edits **quantity only**; `goal_type` and `side` cannot be changed after assigning.

⚠️ That `hasProgress` gate is also what made the July 27 log backfill safe: `target` is the only one of the five snapshot fields that can change after assigning, and it cannot change once a row has logs.

### Overflow menu styling (July 27 2026)

Three of the app's four menus now share one pattern, lifted from `PlayerManage`: raised surface, items flush to the container edges (clipped by `overflow-hidden`), a `border-t` hairline between rows rather than gaps, no inner padding on the panel.

`AssignmentMenu` was the odd one out with a padded `p-1` panel and rounded inner items; it now matches. Each item carries a **lucide** icon at `size 16 / strokeWidth 2` — `RotateCcw` (Assign again), `ArrowRight` / `ArrowLeft` (Archive / Move back to New), `Pencil` (Edit amount), `Trash2` (Delete assignment) — dimmed to `opacity-60` so the glyph supports the label rather than competing with it. Opacity rather than a fixed grey, so the Delete row's icon stays red.

`CustomExerciseMenu` still uses the old padded style — see Low priority.

### Z-index tiers on the coach detail screen

Adding the sticky tab bar broke `PlayerManage`'s dropdown, which sat at `z-10`/`z-20`. Equal z with the bar meant DOM order won and the menu rendered *underneath* it; worse, the `z-10` click-away sat below the bar, so tapping the bar with the menu open switched tabs instead of dismissing.

The screen's tiers, now consistent:

| Layer | z |
|---|---|
| Sticky tab bar | 20 |
| Menu click-aways (both menus) | 40 |
| Menu panels (both menus) | 50 |
| Modals (all four) | 60 |
| Toasts (all three) | 70 |

⚠️ **Any new sticky or pinned element on this screen must stay under z-40**, or it swallows both menus the same way. `PlayerManage`'s toast was also raised 50 → 70 to join the other two; at 50 it sat below the modals, so a "Link copied" raised behind an open dialog was invisible.

The two menu panels tie at z-50, which is unreachable: each menu's full-screen click-away sits at z-40 and neither trigger is elevated, so opening one closes the other.

---

## Navigation & loading feel

Live on prod **July 30 2026** (`874ddfa`). Prompted by roster → player detail and back taking several taps to register.

⚠️ This section was originally dated July 27 in error. Everything else marked July 27 in this file is correct — the Archive model, Assign again, the emerald palette and the log snapshot all landed that day (`ade9e23`…`caedec8`). Only this pass (`4f992ba`…`874ddfa`) is July 30.

⚠️ **The two navigations had different root causes**, which is the useful lesson. Roster → detail was real latency (five sequential round trips) made to *feel* broken by zero feedback. Detail → roster was a hit-target bug wearing a latency costume: the back label was not a link at all.

### Optimistic card actions

Archive, Move back to New, Assign again and Delete update the list on the next frame; the server call runs behind. They previously awaited the mutation and then `router.refresh()`, so nothing moved until a full round trip finished.

⚠️ **This required moving the coach's card list to the client** (`CoachAssignmentList.tsx`). The list used to be built server-side and handed to `AssignmentTabs` as an opaque `ReactNode[]` — a menu sitting *inside* a pre-rendered card cannot remove that card, and the tab wrapper cannot tell one node from another to move it or recount. Nobody on the client owned the list. The server still does the DATA work (the queries and the log aggregation) and passes plain rows down; only rendering and the ownership of "which card is where" moved. This inverts the note in `AssignmentTabs` about keeping cards on the server — that note predates optimistic updates.

Rollback is `useOptimistic`, not hand-written: the optimistic layer is discarded when the transition ends. On failure the handler simply returns — the card snaps back — and toasts the server's error. On success `router.refresh()` runs **inside** the transition, holding it open until fresh data lands, so the optimistic row is *replaced* rather than reverted-then-reapplied, which would flash.

Derived state moved with the list or it would lag a frame behind the card that caused it: tab counts, both empty states, the all-done panel, and the bottom CTA — whose label depends on `allDone`, which an "Assign again" placeholder changes.

"Assign again" inserts a dimmed placeholder with its menu disabled; its id is local-only until the server replies.

`Edit amount` still calls the server directly from `AssignmentMenu` — it changes nothing about which list a card belongs to, so it has no optimistic state to own.

### Loading boundaries

There were **none anywhere in the app**. On a dynamic route that costs twice over: nothing paints between tap and render, *and* Next only prefetches a dynamic route down to its nearest loading boundary — so with none, prefetch was inert app-wide.

| Route | Boundary |
|---|---|
| `/instructor/students` | own |
| `/instructor/student/[id]` | own |
| `/instructor/student/[id]/assign` | own — serves the whole subtree |
| `/student/[token]` | own |
| `/student/[token]/log/[assignmentId]` | own |
| `/student/[token]/celebrate` | own — **renders `null`** |

⚠️ **A wrong shape is worse than no shape.** Before `/assign` had its own, "+ Assign more" inherited the player detail skeleton — avatar, tab bar, progress cards — and then landed on a category picker. The same class of bug put the *student home* skeleton in front of the celebrate screen.

⚠️ **Celebrate's boundary returns `null` deliberately.** It has zero server fetches, so any skeleton is a lie about what it is waiting for. It still needs the file, because `use(params)` suspends — `params` is a Promise in Next 16, so even a fetch-free route hits a boundary for a frame — and celebrate is a *sibling* of `/log/[assignmentId]`, not a child, so the nearest boundary was the student home. Returning null gives the bare page background instead. Do not add a shape: it would reintroduce from outside the exact "asserting an outcome it hasn't read yet" problem celebrate's own three-state loading exists to prevent.

One boundary covers the whole `/assign` subtree because the category picker, exercise list and My exercises are the same shape — back row, heading pair, column of bordered rows. Three leaves under it (`custom`, `[category]/[exercise]`, `mine/[exerciseId]`) are *form* screens inheriting a row-list shape: much closer than the player detail skeleton they had, still not right, and each would want its own if it starts to show.

Primitives live in `src/components/Skeleton.tsx`, one file so the six states can't drift.

- **Fill is `#2a2d36`** — the app's own border/bar-track colour — not white at low opacity, which still reads as a light shape against near-black.
- **Animation is `sk-breathe`** (1 → 0.72 over 1.8s, in `globals.css`) rather than Tailwind's `animate-pulse` (1 → 0.5), which flickered and landed the content swap mid-swing.
- ⚠️ The roster's "ghost rows" empty state uses the same faded-shape idiom. The skeletons **pulse** specifically so a coach with seven players is never briefly told they have none.

### Back links — one pattern, all seven

44×44px (or 44 tall with the label inside), `aria-label`, `WebkitTapHighlightColor: transparent`.

⚠️ **Six of the seven had the label in a `<span>` OUTSIDE the link.** On player detail that label read "Players" — the name of the destination — so the obvious tap did nothing at all, ever. That was the multiple-taps bug, and it was never latency.

Round one left five of them arrow-only, on the grounds that their labels are screen titles ("Shooting", "My exercises") rather than back destinations. Reversed the same day: in daily use they read as "go back" and get tapped as such. The seventh (add-student) was missed in the original sweep because it already carried an `aria-label` and so looked done.

### Tap feedback

`hover:bg-reps-card` on the assign flow's category, exercise and My-exercises rows caused a grey flash. ⚠️ **On iOS the `:hover` state STICKS after a tap**, so the row lit grey and *stayed* lit while the next screen loaded — which read as a glitch, not a response. Replaced with the treatment the roster rows already used: `active:scale-[0.99]` plus a transparent tap highlight, keeping the border hover for desktop. On My exercises only the link half scales; that row is split with a menu beside it, and scaling the whole thing would pull the two visibly apart.

### Diagnosed, NOT fixed

- **Region mismatch.** No `vercel.json`, so functions default to `iad1` (US East) while Supabase is US West — roughly 60–70ms each way, × five sequential calls on player detail. A three-line region pin fixes it, but confirm the Supabase region in the dashboard first rather than trusting this file, and take it through staging.
- **Player detail's waterfall** — five sequential round trips (`getUser` → `coaches` → `players` → `assignments` → `logs`). `players` and `assignments` are independent and could be one `Promise.all`.
- ⚠️ **`getUser()` is a network call on every instructor page load — and must stay one.** It revalidates the JWT; `getSession()` reads the cookie without validating and is explicitly unsafe for server-side authorization. Swapping it would be a security regression, not a perf win. The fix is the waterfall, not the auth call.
- **Four `router.refresh()` sites remain** — `PlayerManage` (edit phone), `ProfileMenu` (edit name), `CustomExerciseMenu` (delete exercise), `AssignmentMenu` (edit amount). All behind modals or menus where the pause doesn't read as broken; deliberately left. `AllDoneActions` (bulk archive) is the one genuine candidate for conversion.
- **Cold starts.** One real coach, so these functions are almost always cold — which is why the first tap after idle is worse than the rest.

---

## Twilio status

- ✅ Toll-free (833) 892-5640 — registered and approved
- ✅ SMS confirmed working end-to-end (July 22 2026)
- Messaging Service SID: `MGe3a0a18bf618d102aae9cb26943cd239`
- Use `MessagingServiceSid` parameter, not `From`
- Old number +15625487985 released

⚠️ **Still pending:** Update `TWILIO_FROM_NUMBER` to `+18338925640` in `.env.local` AND Vercel env vars.

### Two notify paths (July 27 2026)

`src/lib/notify-assignment.ts` exports two functions. They share the recipient lookup and message wording — a repeat reads identically to a first assignment, since "new work landed" is true either way — and differ only in gating.

| | `notifyAssignmentOnce` | `notifyRepeatAssignment` |
|---|---|---|
| Used by | both assign flows (preset + custom) | **Assign again** only |
| Daily gate | **Yes** — at most one per student per LA day | **No** — always sends |
| Writes `last_texted_at` | Yes, only after Twilio confirms | **No** |

The gate exists so one setup session doesn't fire five texts while a coach adds five drills. A repeat is the opposite shape: a single deliberate decision about one piece of work, usually days later. Swallowing it would mean the student is never told the work came back.

⚠️ **The repeat path deliberately neither reads nor writes `last_texted_at`.** Not writing it is what keeps the two independent — a repeat must not consume the day's allowance and silence a genuinely separate assignment made later.

⚠️ Consequence: **`last_texted_at` now means "last *gated* notification", not "last contact."** A repeat leaves no trace on the row, so null there does not prove the student was never texted. Anything wanting a true last-contact timestamp needs its own column.

Both paths always send to `players.phone`. `send_to_parent` is still not consulted — see the parent contact model in Pending.

---

## Resend (auth email)

- ✅ Configured and live — emails from hello@assignreps.com
- Host: `smtp.resend.com` · Port 465 (SSL) · Username `resend`
- SPF/DKIM/MX configured at Porkbun

---

## Stripe status

- ✅ **Test mode** product **Reps** — $10.00/month recurring, created in the dashboard Aug 1 2026
- Test price ID: `price_1U0EVsJoxKRCY55iExnvBMmP`
- ✅ Coupon `COACHRJ` — 100% off, **Forever** duration (not Once, not Repeating — it is lifetime free, so anything else bills RJ from month two). Coupon `OuDvRjjw`, recreated Aug 3 with **no redemption cap** — see finding 3 below for why the original was replaced.
- ✅ Stripe CLI 1.45.0 installed (Homebrew). `stripe listen --forward-to localhost:3000/api/stripe/webhook` is how the webhook is exercised locally.
- Env var names: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` — see `.env.local.example`
- Schema: three columns on `coaches` — see **`coaches` billing columns** and **`coaches` write protection** in Key schema notes

⚠️ **Live mode does not exist yet.** No live product, price or coupon has been created. None of the test values above work in live mode — Stripe keeps the two entirely separate, so *every* ID changes at launch, and the whole dashboard sequence has to be repeated. `sk_test_` vs `sk_live_` is the tell for which mode a key is in.

⚠️ **Still pending:** all three Stripe env vars in Vercel, **staging AND prod** — alongside the `TWILIO_FROM_NUMBER` update already outstanding in both.

---

## Billing architecture (Aug 2 2026)

Every piece is built, and the loop is **verified end to end locally** (Aug 3 2026, and again with the gate on Aug 4 — see below). Free tier is 3 students forever, paywall at the 4th, $10/mo. ⚠️ Nothing here has ever run against a live-mode key.

| Piece | Where | What it does |
|---|---|---|
| Schema | `20260801170000` | `stripe_customer_id`, `stripe_subscription_id`, `subscription_status` on `coaches` |
| Write protection | `20260801180000` | Revoke + column grant, **plus a trigger** — see `coaches` write protection in Key schema notes |
| Service-role client | `src/lib/supabase-service.ts` | The only role allowed to write the billing columns |
| Stripe client | `src/lib/stripe.ts` | Lazy `getStripe()`; no `apiVersion` pinned |
| Checkout action | `src/app/instructor/billing/actions.ts` | Create-or-reuse customer, then a Checkout session |
| Entitlement | `src/lib/entitlement.ts` | `isEntitled()` + `FREE_STUDENT_LIMIT` — the single source of truth |
| Upgrade handler | `src/lib/use-upgrade.ts` | `useUpgrade()` — shared by both upgrade entry points |
| Upgrade button | `src/components/ProfileMenu.tsx` | First menu item, hidden when `isPro` |
| **Add-student gate** | `add-student/actions.ts` + `page.tsx` + `AddPlayerForm.tsx` | Blocks the 4th player, offers the paywall |
| Webhook | `src/app/api/stripe/webhook/route.ts` | Writes billing state back |

⚠️ **`/api` now exists, and it is a deliberate exception.** Every other server entry point in this app is a server action. Stripe POSTs from its own infrastructure to a URL, which an action cannot receive, so the webhook had to be a route handler. That is the *only* reason — a new route handler for anything reachable from our own UI would be drift.

### `isEntitled()` is the one rule

`active` + `trialing`, an **allowlist**. Asked by the upgrade button today and by the add-student gate when it exists, so the two can never disagree — the `isComplete()` lesson applied before the drift rather than after it.

- ⚠️ Unrecognised statuses **fail closed**. Stripe owns this vocabulary and has extended it before; a denylist would silently admit whatever it invents next.
- ⚠️ `past_due` is **not** entitled. Stripe retries a failed payment for weeks, and treating that window as paid means a coach who never successfully pays keeps access throughout it.
- `COACHRJ` needs no special case: a 100%-off-forever coupon still yields a real subscription reporting `active` at $0.

### The add-student gate (Aug 4 2026)

Blocks a non-entitled coach's **4th** player and offers the paywall instead. Three layers, and **only one of them is enforcement**.

| Layer | Where | Job |
|---|---|---|
| **Enforcement** | `addPlayer()` in `add-student/actions.ts` | The gate. Counts server-side, blocks the insert |
| Convenience | `add-student/page.tsx` | Renders the paywall instead of a form the coach can't submit |
| Presentation | `AddPlayerForm.tsx` | Draws the paywall, in the same screen shell as the form |

✅ **`addPlayer()` is the ONLY INSERT into `players` anywhere in `src/`** — audited across all 15 files that touch the table before building. Signup has no student-creation step in code. So the gate has one enforcement point, not several to keep in sync.

⚠️ **The page check is not protection and must never be mistaken for it.** A stale tab, a second device, or a direct invocation of the action all arrive with no page gate in front of them. This is the `fileFinishedAssignments` lesson and the already-subscribed guard in `createCheckoutSession()`, applied a third time: an action establishes its own preconditions rather than borrowing them from whatever rendered its button.

**Two deliberate asymmetries, both easy to "fix" into bugs:**

- ⚠️ **The action fails CLOSED, the page fails OPEN.** In `addPlayer()`, an unreadable count (`countError`, *or* a `null` count with no error) blocks. `count ?? 0` there would read "we don't know" as "zero players" and wave a coach straight through the paywall on a transient hiccup — the failure nobody would ever notice. The page does use `count ?? 0`, because it only decides whether to draw a form; on a hiccup it shows the form and lets the action have the final word, rather than telling a coach they are out of room when we could not read how much room they have.
- **The blocked result carries `code: "limit_reached"`, separate from its error string.** Hitting a paywall is not a validation failure and must not render as one — a red bordered box reads as "you typed something wrong", which is exactly what the coach did not do. The form swaps the whole screen for the prompt instead.

**Existing students are never touched.** The rule is `count >= FREE_STUDENT_LIMIT` blocks the *add*; a coach already over the limit (RJ at ~10, or a lapsed Pro) keeps everyone they have.

⚠️ **KNOWN AND ACCEPTED: count-then-insert is not atomic.** Two submits racing could land a 4th and 5th player. Closing it properly needs a database trigger, and any migration hits local, staging and prod at once (one shared Supabase project). The cost of the gap is one extra free player for one coach — not a security hole, not meaningful revenue at this scale. Deliberately left; revisit if the free tier ever guards something expensive.

**The paywall is in-place, not a redirect or a modal.** It renders inside the add-student screen's own shell — same back link, same padding — so the back link is reused rather than hand-copied into an eighth version. A redirect would strand the coach on the roster hunting for an upgrade item buried in a dropdown; a modal is ceremony this screen uses nowhere else. Copy is warm before transactional, because reaching the limit means the coach is actually using the product: *"You've got 3 players — nice work."* / *"Pro unlocks unlimited, $10/month."* The noun comes from `getActivityLabels`, so a piano teacher reads "students".

⚠️ The count in that copy is `Math.max(playerCount, FREE_STUDENT_LIMIT)`. A stale page can be told "blocked" by the action while holding an older, lower number — and it must never print a figure below the limit that was just enforced.

### `useUpgrade()` — one handler, two entry points

`src/lib/use-upgrade.ts` owns starting a Checkout session: the pending state, which failures surface, and the fact that leaving for Stripe is a **full navigation** rather than a router push. `ProfileMenu` and the add-student paywall both call it.

⚠️ **A HOOK, not a shared component, deliberately.** The two surfaces render genuinely different controls — a 36px menu row inside a 160px panel, and a full-width primary button on its own screen. A shared component would need a variant prop for every visual difference and would force one shape into a slot it does not fit. What must not drift is the *handler*, so that is what is shared; each surface keeps its own markup. Same reasoning as `isEntitled()` one layer up: that stops the two disagreeing about **who** is entitled, this stops them disagreeing about what pressing Upgrade **does**.

### Webhook contract

| Event | Writes |
|---|---|
| `checkout.session.completed` | `subscription_status`, `stripe_subscription_id`, `stripe_customer_id` |
| `customer.subscription.updated` | `subscription_status` |
| `customer.subscription.deleted` | `subscription_status` (`canceled`) |

`customer.subscription.created` is deliberately **not** handled — checkout covers creation, and both would mean two writes for one thing.

⚠️ **Signature verification is the security boundary of the entire billing system.** The column grant, the trigger and the service-role isolation all exist so a coach cannot set their own `subscription_status`. This route can. Unsigned requests would hand that to anyone who guesses the URL. The body is read with `req.text()` and never `req.json()` — re-serialising changes whitespace and key order and the HMAC stops matching — and nothing from the body is read before `constructEvent`.

⚠️ **Retrieves the subscription fresh on every event** rather than trusting the payload. Stripe delivers at-least-once and in no guaranteed order, so a stale `updated` can land after a newer one and overwrite current status with old. Reading current state at handling time makes ordering irrelevant and duplicates harmless.

⚠️ **Never assume `active` on checkout completion.** A card needing 3DS lands as `incomplete`; writing `active` would grant access to someone who has not paid.

**Three routes home**, priority-ordered — no single one covers every event:

1. `client_reference_id` — checkout sessions only
2. `subscription.metadata.coach_id` — subscription events carry no `client_reference_id`
3. `stripe_customer_id` lookup — catches a subscription created by hand in the dashboard, which has neither

⚠️ If none match it does **not** guess: logs and returns 200. An unmatchable event is not transient, and a 500 would have Stripe retrying it for days.

**Status codes are the retry protocol**, not decoration: `400` bad signature (never retry) · `500` missing secret (we are broken; retry succeeds once fixed, so events aren't lost) · `500` write or retrieve failure (transient) · `200` handled or ignorable. ⚠️ A `200` on a failed write marks the event delivered and loses it permanently.

### ✅ Verified end to end — the gate (Aug 4 2026)

Local, real browser, real coach. A third non-Pro coach (`tonyliu34+gate@gmail.com`, "ZZ Test — gate") was blocked at the 4th player; upgrade was started **from the gate screen rather than the ProfileMenu**, confirming the shared `useUpgrade()` handler from both entry points; checkout completed; the webhook wrote `active`; `isPro` flipped; and a 4th player ("Nanna") was then added successfully.

⚠️ **The first attempt of that run failed silently because `stripe listen` was not running** — killed by a reboot. It was restarted with a fresh `STRIPE_WEBHOOK_SECRET` and the run repeated. See the gotcha in *To resume local billing work*; this is the single most likely way to lose time in this area.

### ✅ Verified end to end — the billing loop (Aug 3 2026)

Local, via `stripe listen --forward-to localhost:3000/api/stripe/webhook`. Stripe CLI 1.45.0 installed with Homebrew.

- **The full loop works.** Checkout → webhook → `subscription_status = active` → `isPro` flips → the Upgrade item disappears.
- **Signature verification executes and rejects.** Unsigned → 400 `Missing stripe-signature`. Forged HMAC → 400 `Invalid signature`, including a hand-crafted `checkout.session.completed` naming a coach id, refused **before any part of the body was read**. `GET` → 405. The message text is the proof: `Invalid signature` comes only from the `constructEvent` catch, where previously the missing-secret guard fired first.
- **The webhook wrote to exactly one coach.** RJ's row stayed NULL throughout — the three-routes-home lookup did not spray.
- **One customer across three checkouts** — the idempotency key on customer creation holds.
- ⚠️ **The `?upgraded=1` race is real and was observed.** The Upgrade item was still showing on the redirect back and disappeared after one refresh. That is why the landing is a silent return rather than a "you're Pro" claim.

### Three findings from that test

1. **No already-subscribed guard** *(fixed, `cf04f83`)*. `createCheckoutSession()` created-or-reused the customer but never checked for an existing subscription, so **three active subscriptions** ended up on one customer — $20/mo of real double-billing in live mode. ⚠️ Hiding the menu item is not protection: `isPro` only turns true once the webhook lands, so the redirect-to-webhook window is a live double-subscribe window, and the action can be invoked directly regardless. Same lesson as `fileFinishedAssignments`.
2. **The webhook clobbered state from stray events** *(fixed, `bc24e51`)*. It retrieved the event's own subscription — correct for that subscription, silent about whether it is the coach's current one. Cancelling the two strays fired `customer.subscription.deleted` for each and wrote `canceled` over a coach who still held a live subscription. ⚠️ The real-world shape is cancel-then-resubscribe. Now resolves at the **customer** level: list the customer's subscriptions, any `isEntitled()` one wins, else the most recent. Proven by the failing case — a real event about a canceled stray now leaves the row `active`.
3. ⚠️ **`COACHRJ` was burned by the test.** The coupon had `max_redemptions: 1`, and testing consumed the single redemption, leaving RJ's own code dead. Recreated Aug 3 with **`max_redemptions` unset** (coupon `OuDvRjjw`, code active, 0 redeemed). **The lesson is for live mode, where it is one-way:** a code meant for exactly one person must not be capped at one redemption, or testing it destroys it. Test with a throwaway code instead.

### Open — next session

- ✅ **The add-student gate is built and verified** (Aug 4) — see its own section above. ⚠️ What it leaves open is the RJ conversation: he has ~10 students and no live subscription, so the gate stops his 11th the day it reaches an environment he uses with live billing.
- **Some upgrade UI is still unrendered.** The gate's own paywall was seen and used on Aug 4, and the `Starting…` pending state was exercised on the way to Checkout from that screen. Still unseen: the **ProfileMenu panel's width at its new widest item**, and the **wrapping error line** inside that 160px panel — no upgrade error has been made to occur there.
- **The `?upgraded=1` landing is a silent return.** Now unblocked — `isPro` is trustworthy — so the warm success screen can be designed. Still needs to survive the redirect/webhook race observed above.
- ⚠️ **`STRIPE_WEBHOOK_SECRET` is local-only.** It comes from `stripe listen` and rotates between sessions; staging and prod each need their own endpoint and secret. Nothing is configured in Vercel yet.
- ⚠️ **No `apiVersion` is pinned in `getStripe()`, so the app runs on the account default — currently `2026-07-29.dahlia`.** That is not theoretical drift: on dahlia, `promotion_codes.create` rejects `coupon` as an unknown parameter, and recreating `COACHRJ` only worked pinned to `2024-06-20`. Checkout and the webhook are fine on dahlia, but a dashboard-side version change can alter API shapes underneath us with no code change.
- **Live mode does not exist** — see Stripe status above. Every id changes, and the coupon must be recreated there uncapped.

---

## Activity type system

`src/config/activityTypes.ts` — single source of truth for discipline picker and UI copy.

Active: **Basketball** only  
Available (not yet active): Piano · Martial Arts · Tennis · Golf · Guitar · Gymnastics · Soccer · Swimming · Voice

Adding a new activity type is a content change — no engineering rework needed. The `instructor_type` field on coaches enables content branching.

---

## Coach auth — email OTP

- `signInWithOtp({ email })` + `verifyOtp({ type: "email" })`
- Both email templates must contain `{{ .Token }}` — renders the 6-digit code
- Neither template should contain `{{ .ConfirmationURL }}`
- OTP length: 6 digits · Expiry: 1 hour

---

## RJ feedback captured

RJ is the first real user and primary product validator.

### July 27 2026 — roster growing, asks clarified

**Two new players added: Mason and Avery.** RJ is now at **7 players**, up from 5.

Three of his open asks were resolved by text and are now scoped in Pending under "Decided, not built":

- ~~**"Minutes & hours"** means weekly / daily aggregated time totals~~ — ⚠️ **this reading was wrong; corrected Aug 1.** He meant hours as a unit on a single drill. See the corrected entry under "Decided, not built".
- **Notes** means one small, capped, optional "anything to tell coach" field on the **student log screen** — the student writing to the coach, not a two-way thread.
- **Parent contact** resolved to the two-contact model: the existing single phone + Player/Parent toggle stays tone-only, plus a separate report-only `parent_phone` that never receives assignment SMS.

### July 26 2026 — first real usage

**It is being used.** First completed assignments came in. One student told RJ she likes the app and how simple it is, and his summary: *"kids are liking it and really using it."* This is the first evidence of the loop closing with real students rather than in testing.

Requests, in his words:

- **Move "Assign more" button to the top** — currently pinned to the bottom of the student detail screen.
- **A notes section for players** — ✅ *Clarified July 27:* the student writing to the coach. One small capped field on the log screen. See "Decided, not built".
- **"Can timeframe be minutes & hours for weekly breakdown"** — verbatim. ⚠️ *Clarified twice.* The July 27 reading (aggregated weekly/daily totals) was **wrong**; on Aug 1 RJ confirmed he means hours as a unit on one drill — "1 hour of jump rope" rather than "60 minutes". The word "weekly" in his original text is what misled the first reading. See "Decided, not built".
- **A repeat-schedule function for when a set is finished** — reassign automatically once a student completes something. ✅ *Partly delivered July 27 2026* as **Assign again**: one tap on a finished card creates fresh work. The automatic/scheduled half is still unbuilt, but it is now safe to build — a weekly reassign cycle would have turned the orphaned-log problem into a recurring loss, and logs now carry their own snapshot.
- **Add exercises to the library without being in the middle of assigning** — custom exercise creation is currently only reachable inside the assign flow for a specific player.

### July 22 2026

- **Makes-first coaching philosophy:** RJ assigns by makes ("make 50 free throws"), not attempts. Now a first-class goal type, not just a toggle.
- **"Harder to cheat the system"** — makes-first is more accountable. A student can't just tap +50 and call it done if the coach wants makes.
- **Efficiency emphasis increases with player age/level** — younger kids need volume, advanced players track percentage.
- **STAR Drill** — attempts + shooting percentage; in Spot shots, so it can take a makes or consecutive goal.
- **Heel/Toe Hinge** — RJ's personal terminology, not universal. Not a preset; coach can create custom.
- **3min/5min Shooting** — minutes unit + makes covers it.
- **RJ's reaction to the redesigned log screen:** "It's perfect... almost has that same appeal as PrizePicks... The way the bar loads up and shows completion."

---

## Open exploration — not yet decided (Jul 31 2026)

From a phone call with RJ, carrying second-hand feedback from **Zach** — another coach in RJ's circle who has been talking with him about Reps but is **not a Reps user himself**.

⚠️ **Nothing in this section is scoped, prioritized or scheduled**, and none of it is in the Priority build list — deliberately. These are open questions with the tension left in them. The point of the section is that they are unresolved. Resolving one means moving it *out* of here: into "Decided, not built" if it earns a design, or deleting it if it doesn't.

### Social sharing (Strava-style)

Students sharing achievements or reps socially.

**The tension identified on the call:** not all reps are equal. 500 reps of a warm-up drill and 500 of something genuinely hard should not carry the same weight — so any version of this likely needs the platform to distinguish a *share-worthy moment* from routine logging, rather than "share anything, anytime."

**Unresolved:** whether this connects to an older goal-setting idea — a student setting their own target versus receiving a coach-assigned one. A goal the student set *and* hit feels more earned, and therefore more shareable, than one they were handed.

⚠️ **Runs against the current product philosophy.** Students have no accounts, and a coach can remove one at any time; the relationship is coach-mediated by design. Any sharing concept has to fit *inside* that, not around it.

**One direction floated in conversation, not decided:** the existing celebrate screen as a possible natural home — it is already the one moment completion gets its own beat — rather than a separate social system.

Worth revisiting once there is more real log data, to see whether usage patterns say anything.

### Reusable / recently-used presets (instructor side)

RJ wants the app to remember what he usually enters for a given exercise. His comparison: MyFitnessPal remembering your usual serving size for a food.

**Current state:** `exercises.ts` holds static defaults, identical for every coach — nothing is personalized. A true "remember what I last assigned" needs per-coach-per-exercise storage that does not exist today.

**Current leaning, not finalized:** additive rather than a swap. Keep the static library defaults as the permanent baseline — what the vanilla app provides — and add a separate "recently used" row of a few recent values, dismissible or clearable by the coach.

**Scoping — resolved (the rest of the entry stays open):** per **player AND exercise**, not per-exercise alone.

Real `rj_logs` data settled it. RJ's players are different ages and levels, and his Layups targets already vary by player — Khloe 350, Caleb and Phoenix 500. That is a genuinely different number per kid, not one number RJ reuses everywhere, so a "recently used" row keyed on the exercise alone would offer him the wrong figure most of the time. It has to be scoped to the player he is assigning to as well.

Note this is narrower than the MyFitnessPal analogy that prompted the idea: that app remembers *your* usual serving, one axis. Here the coach is not the one doing the reps, so the memory belongs to the pairing, not to the coach.

### AAU / org-level licensing

A different business model, not a feature: selling to an organization — multiple coaches, procurement, admin permissions, likely different pricing — rather than to an individual private instructor.

Distant horizon. Not connected to the current beta plan.

### Tight advocate group (~30 coaches)

In tension with the current plan of five hand-picked trainers reached by careful personal outreach. Thirty implies a later phase: testing whether the product holds up with less founder-level personal touch per coach. Not where the product is now.

### Sensor integration (e.g. Dribble Up-style smart equipment)

Interesting but distant. Would mean Reps depends on hardware it does not control, and requires the student to own separate smart equipment. Furthest out of anything in this section.

### Archive at scale — one player's own history

⚠️ **This entry did not previously exist.** It was referred to on Aug 1 as already captured; it wasn't. Written down now so the next reference to it resolves.

The assumed pain point, Tony's own rather than RJ's: one player's archive grows into a long list of visually similar cards over time. Every card is the same shape, the ✓ is on all of them, and nothing separates last week from three months ago. Not yet a felt problem — RJ's oldest archive is days old — but it is the predictable end state of a model where finished work is moved and never destroyed.

⚠️ **RJ's "folder method / group by grade or age" suggestion does NOT fit here.** Grouping by grade makes no sense inside one player's own history — their grade doesn't vary across their own cards. That suggestion belongs to the entry below, which is a different thing entirely. The two were nearly conflated on Aug 1; keeping them apart is the point.

### Roster-level archive — a view that does not exist

⚠️ **New gap, not previously documented.** There is **no cross-student view of archived work anywhere in the app.** Only two archive views exist, and both are scoped to a single player: the coach's player-detail screen, and the student's own home screen.

RJ suggested a "folder method" and grouping by grade or age. That only makes sense **across students** — organising a roster, not one child's history. Which suggests he may have been gesturing at a view that does not exist at all, rather than asking for a filter on one that does.

⚠️ **Unresolved, and a clarifying question needs to go back to RJ before any design.** A roster-level, cross-student archive view is a meaningfully larger scope than tidying one player's list — different screen, different queries, different navigation. Guessing which he meant would risk building the expensive one to answer the cheap question, or the reverse.

### Real-time stats on the landing page

A live stats row on the landing page — the "684 / 18 / 123" pattern other product homepages use — pulling from Reps' own real usage: assignments, logs, reps.

⚠️ **Too early right now, and that is the whole point of the entry.** The real numbers today (~10 students) are too small to be persuasive as raw counts. Publishing them would undercut trust rather than build it.

**Better direction identified in discussion, not decided:** a **rate** rather than a raw count. A rate is honest and compelling regardless of scale — "% of assigned work logged within 24 hours", or a rolling "reps logged this week" that resets and so can never look stale.

The distinction worth keeping: **raw totals** (student count, coach count) are the ones that specifically need time before they are a credible flex. **Rates and current-week figures work now and later** — they do not have to wait for scale.

**Placement, as pictured (Jul 31):** directly **below** the landing page's "Here's how it works" section — the four phone mocks, which item 3 of *Queued for next session* imagines becoming a per-activity carousel. Not elsewhere on the page. That is the only part of this that has been pinned down; everything above is still open.

Not connected to any current landing page work. Captured so the idea isn't lost.

### Validation signal

Factual, no interpretation:

- RJ has grown his roster to **~10 students** organically in under three weeks. (The July 27 entry above records 7 — both are accurate at their dates.)
- Asked directly, RJ described the app as having changed his own coaching practice — organization, and a repeatable record he sticks to — rather than as something he is trying out.
- On the same call, RJ described Reps as having become part of his actual coaching workflow: his words were **"streamlined"**, that it helps him **"stick to it"**, and that it has become a **"template"** of his program and a **"record"** of it. Read as pointing to a *second, distinct use case* beyond student accountability — basic business and practice organisation for the instructor himself. ⚠️ This is a separate validation thread from the bullet above, not a restatement of it: that one is about his coaching changing, this one is about the app doing a job the product was not explicitly built for.
- **Parents, second-hand but independent of RJ's own view.** RJ confirmed by text (Aug 1) that parents using the app are "all in on it" and "think it's extremely useful". ⚠️ Worth separating from the bullets above: those are RJ's own enthusiasm, repeatedly recorded. This is a different constituency reacting — the people who pay for the coaching — reported through him.
- **Zach**, a second coach in RJ's circle, engaged with the product enough to generate several of the ideas above without being a user himself.

---

## Queued for next session (end of day, Jul 31 2026)

⚠️ Fast end-of-day capture, not decisions and not a plan. Nothing here is scoped or prioritized, and none of it has been added to the Priority build list. Deliberately short — enough that nothing is lost overnight, no more.

1. **Scale app screens beyond mobile.** The landing page supports desktop/tablet/mobile, but every in-app screen and mock is mobile-only. Consider taking app screens up to at least tablet width for those visitors.

2. **Narrow the signup activity list — revised Jul 31, more conservative than first captured.** The picker should show **only four rows**:

   | Row | State |
   |---|---|
   | Basketball | live |
   | Soccer | "Soon" |
   | Tennis | "Soon" |
   | Create your own | "Soon" |

   ⚠️ **Everything else is removed outright, not tagged.** Piano, Martial Arts, Golf, Guitar, Gymnastics, Swimming and Voice come *out of what a coach sees at signup* — not deprioritized, not left visible under a "Soon" label. The earlier capture said to keep them tagged; that was reversed. Rationale: only tease what is actually intended to be built next — adjacent, structurally similar activities — rather than advertising the full possible list. Stop overpromising.

   Tennis stays because it is the close structural analog: individual instruction, drill/rep structure, and makes-based tracking translates directly.

   Also swap the homepage thumbnail from a piano student to a young female soccer athlete.

   ⚠️ Placeholder for a future session — **no code change yet**. `activityTypes.ts` still carries all ten; this is a correction to the captured plan so it is accurate when picked up.

3. **Landing page second section as a carousel.** Currently a static basketball showcase. Consider one slide per activity, each with its own device mocks and content matching that sport.

4. **Real-time stats, placed directly below that section.** Revisit the idea already captured under Open exploration ("% logged within 24 hours", weekly rep counts) — this time thinking through how to frame and select only the positive-reading figures rather than raw counts. Pictured sitting *underneath* the activity carousel / phone-mocks section, not elsewhere on the page.

---

## Pricing (fully resolved — model Jul 31 2026, price point Aug 1 2026)

**Free tier — resolved.** 3 students, full features, no card required, no time limit. **Forever, not a trial.**

⚠️ A 14-day-unlimited trial was considered and **rejected**. It does not solve the problem it was reached for — the "cold roster dump", where a coach adds twenty students on day one and blind-texts them all before feeling the product work. A trial doesn't prevent that; a coach can dump a full roster on day one of a trial just as easily. And it reintroduces a hard deadline, which the free-tier model deliberately does not have.

**Paid tier — resolved in shape.** Monthly only, cancel anytime. No annual plan, no discount tiers, deliberately not built — nothing at this stage requires them.

**Price point — LOCKED at $10/mo (Aug 1 2026).** The $5–$10 range is closed; use **$10** everywhere — the Stripe Price object, any pricing UI copy, and this file. The reasoning that settled it:

- **Cost to serve was never the constraint.** SMS per free user runs pennies to low single-digit dollars a month even in heavy-use edge cases, so this was a positioning decision, not a margin one — which is why the range could stay open as long as it did without blocking anything.
- **$10 still sits well under market.** Comparable products charge substantially more — see the section below. Taking the top of the range costs nothing in competitiveness.
- **$9.99 was considered and set aside in favour of $10.** A round number reads as honest; a charm-priced one reads as optimised extraction, which is the opposite of the voice this pricing is meant to carry.

⚠️ **$10 is the figure, not $10.00 or $9.99.** Stripe stores it as `1000` (cents, USD). Any UI copy should read `$10/mo`.

Promo code `COACHRJ` = lifetime free.

---

## Competitive landscape (Jul 31 2026)

Factual, from real research. Not a reason to change direction — captured so pricing and positioning decisions aren't made blind.

| Product | Free tier | Paid |
|---|---|---|
| **Trainerize** | 1 client — functions more like a trial than a working free tier | from ~$9/mo (2 clients) → $23/mo (5) → $248/mo (500+) |
| **TrueCoach** | none — 14-day trial only, no card | from ~$26/mo (5 clients) → $137/mo (50), annual billing |
| **Utrain** | 100% free for trainers | monetises payment processing, not subscription |

Trainerize and TrueCoach figures are screenshot-confirmed.

**Utrain** (utrainmobileapp.com) is the closest adjacent competitor **by audience** — basketball-specific, aimed directly at private trainers, and apparently well funded (tech incubator cohorts, a Ganon Baker partnership, Yahoo Finance coverage). ⚠️ But its **core function is different**: booking, scheduling and automated payment collection, not practice-homework accountability. Trainers keep 100% of the session price. Worth knowing it sits in the same audience's feed; not competing for the same job.

**Conclusion:** against this set, Reps' free tier — 3 students, forever, full features, no card — is on the **generous** end of this market, not the stingy end.

---

## Product decisions locked

- **Instructor is the customer.** All design decisions flow from instructor pain points.
- **Default exercise libraries are the product experience.** Custom creation is the escape hatch.
- **Makes logging is always optional for students on a reps goal** — never blocks logging.
- **Track_makes defaults:** true for shooting/finishing/spot-shots, false for minutes-based and for the three makeless categories, false for customs.
- **Percentage formula:** makes / attempts, only over logs that recorded makes. Null logs excluded from denominator.
- **Bar language:** muted emerald = attempts/in-progress, bright emerald = makes/complete, gray = empty.
- **No yellow** — removed platform-wide July 23 2026.
- **One green hue** — the whole family is emerald H150 as of July 27 2026. No exceptions, including the confetti.
- **Assignments are not time-bounded** — they persist until manually archived.
- **Finished work is moved, never destroyed.** Archiving replaced deleting; `Delete assignment` is unreachable once anything is complete.
- **Filing is manual and reversible.** Nothing auto-archives, and every move can be undone in one tap — which is why neither move carries a confirm dialog.
- **Log history is never deleted** — `ON DELETE SET NULL` preserves logs forever, and since July 27 each log also carries its own snapshot of what it was.
- **A banked mismatch is never silently rewritten.** Guards live on the controls, not on stored data.
- **UI labels may change without renaming code.** "Repeat" → "Assign again", "Logged" → "Archive", "Remove" → "Delete" all left their functions and columns alone.
- **A tap must acknowledge itself.** Either the UI moves on the next frame (optimistic) or a boundary paints something. A screen that sits unchanged during a round trip reads as broken, not slow — and gets tapped again.
- **44px minimum on every tap target, and the visible label is the target.** A label beside a link rather than inside it is a dead zone, whatever it looks like.
- **A wrong-shaped loading state is worse than none.** It promises one screen and delivers another. Where there is no data to wait for, the boundary renders nothing.

### What was killed and why
- Leaderboard — privacy (minors), breaks 1:1 dynamic
- Coach qualitative comments — won't stick
- Milestone push notifications — rep counts ≠ improvement
- Slider input — too much friction
- Single "Done" button — assignments span multiple sessions
- Parent signup — read-only magic link only
- Yellow progress color — replaced July 23 2026
- Progressive disclosure on makes input — caused students to miss the makes field
- Full-width stepper — buttons felt too far apart; now centered/compact
- Attempts row on a makes goal — the coach asked for makes; attempts were neither the score nor worth reporting
- Gradient fade under the sticky ASSIGNMENTS header — the card list starts flush with the label, so any overhanging gradient dimmed the first card. Solid background, hard edge.
- **"Clear finished"** — deleted finished assignments outright and silently orphaned their logs. Replaced by Archive, July 27 2026.
- **The standalone all-done banner** — followed the coach onto the Archive tab and doubled up with the empty-state message. It is now the New tab's own content.
- **A bordered button for the bulk archive action** — a pattern the app uses nowhere else, and it competed with the primary CTA. Quiet text link instead.
- **A dark landing hero** — built Aug 4 2026 and reverted the same day; the warm charcoal read as muddy and brown rather than premium. See the landing page section; the technical groundwork survives in `b739fda` if it is ever revisited.
- **The "Clear finished" confirmation sheet** — existed to slow a coach before an irreversible delete. Archiving is reversible, so the ceremony implied a risk that no longer exists.

---

## Pending / loose ends

### High priority
- **✅ RESOLVED July 27 2026 — orphaned logs.** Kept here as the record; nothing outstanding.

  *Fixed forward:* `saveLog` copies `exercise_name`, `unit`, `goal_type`, `target` and `side` onto every log row at insert time, so a log survives its assignment being deleted. Applies to all logs, all coaches, from that date.

  *Backfilled:* **RJ's 19 pre-existing rows were backfilled and verified safe.** The check that made it safe: `target` is the only one of the five that can ever change after assigning, and "Edit amount" is hidden once anything is logged — so for a row that HAS logs, the current assignment values are necessarily the values it was logged under. The other four (`exercise_name`, `unit`, `goal_type`, `side`) are immutable after insert; the only `.update()` on `assignments` writes `{ target }` and nothing else.

  *Not backfilled:* **Coach Tony's 23 orphaned test rows.** Dev debris whose assignments were already gone, so nothing existed to copy. Irrelevant — no real history there.

  *Implementation:* exactly **one** INSERT site, `saveLog` in `src/app/student/[token]/log/[assignmentId]/actions.ts` (audited repo-wide — no other insert, upsert, route handler or DB trigger writes `logs`). The assignments query the confetti check already needed moved *above* the insert and was widened, so the snapshot costs **no extra round trip**. Server-side only — `saveLog` accepts no snapshot parameters at all, because the student log page is public and token-addressed and a crafted request could otherwise write any exercise name it liked into permanent history. That read is player-scoped, which also establishes ownership. Migration `20260727120000_add_log_snapshot_columns.sql`.

  *Readers are unchanged.* Every screen still joins live to `assignments`. The snapshot is the fallback for an orphan, not the primary source — nothing reads it yet, and a future progress/insights view is what would first consume it. This is what makes longitudinal history possible at all.
- **⚠️ OPEN QUESTION, no design — a parent asked for date + time on completed work.** Connected to the Parent contact model, not part of it.

  A parent receiving assignment texts directly (via the existing Player/Parent toggle) asked for timestamps with dates on completed work. RJ's own suggestion was to show it in the **Archive** section specifically.

  The tension, unresolved:
  - **Date is meaningful either way** — did practice happen on a given day.
  - **Time is only meaningful in one usage mode.** If the student logs live, in the moment (on a parent's phone at the park), the timestamp is real. If a parent logs it for their kid later, or in a batch, the timestamp records when the parent got round to data entry — not when practice happened. So "time" is misleading or honest depending on how a given family actually uses the app, and the app cannot tell which.
  - **Tony's stated preference is clean, simple cards**, resistant to visual clutter.
  - ⚠️ **Relevant data already exists and is not surfaced anywhere:** the app already distinguishes the assigned amount from the logged amount, including partial versus fully complete. That may be more informative to a parent than a raw timestamp, and is worth weighing as part of any eventual design rather than defaulting to a clock.

  No design proposed. The usage-mode question above needs answering before one would mean anything.

- **⚠️ OPEN GAP, no decision — a student who asks "is there an app?" has nowhere to be sent.** Recorded, deliberately without a proposed fix.

  There is **no student-discovery path on the landing page at all**: no "I'm a student" link, nothing pointing at `/student/login`, and the footer carries only Privacy and Terms. Verified against `src/app/page.tsx`, not assumed.

  *It was there once.* A student entry point was restored to the footer on Jul 21 (`ebfea68`), then removed again Jul 27 in favour of a **coach-only landing framing** — the eyebrow narrowed to "For instructors", the hero speaks to the instructor, and the mocks note for that release records the removal explicitly: "The standalone 'I'm a student →' link is gone — students arrive by SMS link or via `/student/login`." That was a deliberate decision, not an oversight.

  *What surfaced it:* a real student texted back **"is there an app??"** and there was no channel to answer them. Today a student can only arrive by their SMS link, or by knowing `/student/login` exists — and nothing anywhere points at that fallback.

  ⚠️ Any future fix has to weigh the coach-only framing it would reopen. Recorded here so that trade-off is visible when the decision is made, rather than rediscovered.
- **Device-test the goal type feature** — shipped to prod July 24 with no real-iPhone pass. Never observed on device: the incomplete-consecutive label `0/1 set · N in a row` (every consecutive row in the DB is already complete).
- **Update `TWILIO_FROM_NUMBER`** to `+18338925640` in `.env.local` AND Vercel env vars
- **Consecutive stepper overshoots its own progress line** — reads `1 of 1 set` while the stepper sits at 2. `progressValue` caps at 1 by design, but the two numbers visibly disagree.
- **Edit `goal_type` / `side` after assigning** — currently quantity only, so a wrong hand means delete and re-assign. `goal_type` should stay behind the `hasProgress` gate (switching a logged reps assignment to makes reinterprets history); `side` is metadata and could be looser.
- **Custom exercises get no goal selector** — they keep the makes toggle but can't take a makes or consecutive goal, since they belong to no category.
- **Retroactive makes gap** — a student who completes an assignment without logging makes cannot add them later. Needs an RLS UPDATE policy + a replace-vs-append decision.
- **"Or type a number" hint** on stepper — students don't know the centre number is tappable. ⚠️ Shipping this makes a latent bug real: typing attempts clamps makes on each intermediate keystroke (retyping "60" passes through "6" and drags makes to ≤6).
- **Hold to accelerate** on stepper buttons
- **Honesty nudge** — when a student logs 0 or very low attempts, a quiet human message
- **Progress bars on roster rows** — also the prerequisite for showing side on the roster, which today has no per-assignment surface at all

### Decided, not built

Design resolved — these need building, not deciding.

⚠️ One exception as of Aug 1: **hours as a unit** sits here because the *requirement* is settled (RJ asked for it, unambiguously), but its *direction* is not — the approach below is a suggestion, not a choice. It stays in this list because the ask is real and won't change; move it once an approach is picked.

- **Parent contact model.** Two contacts, distinct purposes:
  - The **existing single phone + Player/Parent toggle** stays as-is. It is **tone only** — it does not change routing, and every assignment SMS goes to `players.phone` regardless. That is by design, not an oversight.
  - A **separate optional `parent_phone`** becomes a *report-only secondary contact*. It **never** receives assignment SMS — only future digest/report sends. This revives the column, which has been dead since July 17 (present, written as `null` by the only caller, read nowhere).
  - ⚠️ The "Send parent a weekly recap" UI must be **rebuilt from scratch** with new copy. It was fully deleted in commit `c9bb887`, not hidden — the state, the effect and the card all went.
  - **Existing flexibility, previously undocumented (Aug 1).** The single phone + toggle already stretches further than this file recorded. A student with no phone of their own can tap the assignment link on a parent's phone and log directly there; or the parent can forward that same link so the student has it on their own device. And the coach's per-student "..." menu carries **"Share homework link" as a standing action** — always available, not limited to the add-student moment. ⚠️ This may *reduce* the urgency of the report-only `parent_phone` work, since some parent-visibility need is already served. It does **not** change this item's scope or design today — worth having in mind when it is picked up.
  - ⚠️ **A soft commitment exists with a real user.** Tony told RJ by text on Aug 1 that he is "working on some type of automated weekly digest or report for parents" and that "it'll shape up when we have more data." The digest remains undesigned internally and unbuilt. Light expectation, not a promise of a date — but it is out there, and worth knowing next time this area is prioritized.
  - **Open question attached to this work:** timestamps on completed work — see High priority.
- **Hours as well as minutes on a single drill.**

  ⚠️ **CORRECTION (Aug 1 2026) — the July 27 reading of this was wrong.** This file previously recorded RJ's "minutes & hours" ask as *aggregated daily/weekly time totals*, and stated flatly that it was "not a per-assignment unit toggle". That was a misreading of a July 27 text. It is kept visible here rather than quietly overwritten, because it stood as a documented conclusion for five days and shaped Priority #2.

  *What he actually wants*, clarified by text this morning: a single drill's duration expressible in **hours as well as minutes** — being able to set "1 hour of jump rope" instead of "60 minutes of jump rope", with the minutes option kept. It has **nothing to do with aggregation** across days or weeks.

  *One candidate direction, discussed but **NOT** decided — suggestion only, not greenlit:* keep everything stored in **minutes internally**, so there is no schema change and nothing that sums or reports breaks. Add hour-flavoured preset buttons on the assign screen that simply send a larger minutes value (a "1 hr" preset sends `amount: 60, unit: minutes`), and optionally format any round multiple of 60 as "1 hr" on display screens. This is one option among others; Tony has not chosen it.

  No design work started.

### Medium priority
- **Gate stranger signups** — currently open; invite code or waitlist before broader launch
- **Stripe infrastructure** — ✅ **built and verified in TEST MODE** as of Aug 4 2026: schema, webhook, checkout, entitlement, and the add-student gate. See **Billing architecture**. ⚠️ What is left is not code — it is **live mode**, which does not exist: no live product, price or coupon, and no Stripe env vars in Vercel for staging or prod. Every test-mode id changes at launch.
- **Tighten logs RLS** — ⚠️ **corrected Aug 1 2026: there is no RLS policy on `logs` at all.** This entry read "INSERT currently open", which implied SELECT/UPDATE/DELETE were covered and only the insert path was loose. They never were. Confirmed by investigation, not assumed: no policy on `logs` appears in any migration file, and the student home page has always read `logs` straight through the **anon** key with none present. So SELECT has been exactly as open as INSERT this whole time.
  - No column-level grants exist **on `logs`**, so any column added there is readable wherever the others are. That is why `note` needed no policy work to be read back — worth knowing, and worth not mistaking for a policy having permitted it.
    - ⚠️ **This bullet was corrected twice on Aug 1 2026, and the second correction matters more than the first.** It originally claimed no column-level grants existed *anywhere* — wrong, and wrong because of a bad grep rather than a bad reading: the pattern used could not match `grant update (name)`. **One does exist**, in `20260725120000`. It doesn't touch `logs`, so the point above stands on its own; only the blanket version was false.
    - ⚠️ **The first correction then over-claimed in the opposite direction.** It stated that the `coaches` grant was an allowlist making every column on that table unwritable by a coach. It was not — the grant had already been silently overridden by a re-granted table-level privilege, and had been dead for roughly a week. Both errors share one cause: **a claim about live database state inferred from a migration file.** In this repo that is never safe — the base schema, `logs_amount_check`, the dashboard views and the `coaches: own row` policy are all live and in no file.
    - The real account of what protects `coaches`, what failed, and why the fix is a trigger rather than a grant is in **Key schema notes** under `coaches` write protection.
  - ⚠️ `note` raises the practical stakes of the gap without changing its shape. Until Aug 1 `logs` held only numbers and copied assignment metadata; `note` is the first **free-text field a student wrote themselves**. Still their own words on their own token-addressed page, so nothing new is exposed to anyone who wasn't already able to read the row — but the consequence of the gap is qualitatively different from a rep count.
  - Priority is unchanged — still Medium, deliberately. This is a correction to what the entry *says*, not a re-rating of how urgent it is.
- **Demo mode** — "Try as Coach" seeded database with context overlay
- **Account deletion flow** — required by privacy policy
- **Auth user audit** — 8 rows in `auth.users` against 3 in `coaches` (noticed Aug 4 2026 while deleting the gate test account, not investigated). Four carry no email and are *probably* student phone-OTP logins, which is expected — confirm that rather than assume it, since a blank-email row could also be a half-finished coach signup, the "authenticated but no coaches row" case `requireCoach()` exists to catch. One is a typo signup, `tonyliu34@gnail.com` (`gnail`), which can never receive an OTP and should go. Not urgent; nothing is broken by it.
- **hello@assignreps.com Gmail Send as setup**
- **Final legal review of /privacy + /terms**
- **Re-engagement nudge** — Monday email to coaches who haven't assigned anything
- **Landing page product-loop frames are hand-drawn** — `src/app/page.tsx` redraws four miniature phones in JSX, so every design change has to be re-applied here by hand and can silently drift from the real screens. Redrawn July 25 2026 (assign → text → log → student detail); the specific staleness previously listed — retired preset buttons and `#27500a` — is fixed, but the maintenance burden is structural
- **"Consecutive" goal label vs "In a row"** — known drift, not a bug. The landing page's assign frame labels the third goal **In a row**, which is how instructors actually speak; the app's `CountScreen` still shows **Consecutive**. The stored `goal_type` value is `'consecutive'` either way, so this is display copy only — but the app and the marketing page currently name the same goal differently. Renaming the app label is the likely fix; it touches `GOALS` in `CountScreen.tsx` and the `SETS COMPLETED` / streak wording on the log screen

### Low priority / future
- **Finish tokenising the greens** — 4 sites still hardcode `#3ed68a` rather than using the token: the celebrate confetti array, the two `Check` icon `color` props (CountScreen + CustomExerciseScreen), and the roster `GROUP_STYLE` object. The icons are the reason it stopped: lucide passes `color` into an SVG `stroke` attribute, where a CSS var resolves in practice but wants seeing rendered before trusting.
- **`CustomExerciseMenu` is the odd one out** — three of the app's four overflow menus now share the raised/flush/divider style with icons; this one keeps the old padded `p-1` panel with rounded inner items and no icon. Its single item is `Delete exercise`, which pairs naturally with the `Trash2` on `Delete assignment`.
- **Toast is dim** — noted on device, not fixed. All three toasts use `text-reps-sub` on `--reps-raised`.
- **Student / parent progress recap** — "*Khloe's first 8 months*" style longitudinal view. Explicitly backburner, but explicitly *connected*: it is the original founding vision and it is what the July 20 RJ meeting notes on longitudinal tracking were about. Depends entirely on accumulated history, which the July 27 log-snapshot fix now protects going forward. Distinct from the small notes field, which shipped Aug 1 — that is one capped line per log, this is a longitudinal view.
- **Light mode** — after dark mode is validated with RJ
- **Activate more activity types** — content problem, not engineering
- **WhatsApp via Twilio** — international student SMS
- **One-tap coach reaction** — preselected SMS reaction to a student's log
- **One-tap nudge to quiet students**
- **Performance history** — prior metrics when reassigning ("Antony shot 30% last time on corner 3s")

---

## V1 scope

- Coach signup (email OTP) ✅
- Add student (name + phone, optional parent phone) ✅
- Assign exercise (default library or custom) ✅
- Student log screen — stepper ✅
- Makes logging — track_makes toggle, coach sees percentage ✅
- Goal types — attempts / makes / consecutive ✅ (July 24 2026)
- Left/right side on assignments ✅ (July 24 2026)
- Celebration screen ✅
- Coach player detail view + two-tone makes bars ✅
- Coach roster view ✅
- Landing page + product loop section ✅
- Staging environment ✅
- Resend email delivery ✅
- SMS on assignment ✅
- Log snapshot — logs survive their assignment being deleted ✅ (July 27 2026, backfilled)
- Manual Archive — New/Archive tabs on both screens ✅ (July 27 2026)
- Assign again — re-issue finished work ✅ (July 27 2026)
- Parent read-only web view ⚠️ page exists, but nothing links to it and no digest is sent
- Parent weekly digest ❌ — no cron, no scheduled job, never sent
- Hours as a unit alongside minutes ❌ — asked for, direction not chosen (was mis-recorded as "weekly / daily time totals" until Aug 1)
- Notes field on the log screen ✅ (Aug 1 2026) — optional, 100-char capped; most recent log *with* a note shows on both card lists
- Demo mode ❌
- Account deletion ❌
- Stripe billing ⚠️ — the whole loop (checkout, webhook, entitlement) and the 3-student gate are built and verified **in test mode only** (Aug 3–4 2026). Live mode does not exist yet, so this is not shippable to a paying coach
- Add-student gate — blocks the 4th student, offers the paywall ✅ (Aug 4 2026, verified end to end locally)
- Progress bars on roster rows ❌
- Retroactive makes editing ❌
- Editing goal_type / side after assigning ❌
- ~~Clear finished~~ — **removed July 27 2026**, replaced by Archive. Not deprecated; the action is deleted.

---

## Priority build list (July 27 2026)

The three at the top are the ones RJ has actually asked for and that now have a resolved design.

1. **Parent contact model** — report-only `parent_phone` + rebuild the recap toggle UI (deleted in `c9bb887`, must be written fresh)
   - *Why this matters (supporting context, not a new requirement):* Tony's own multi-year experience paying for private soccer and basketball coaching — wanting visibility into what the coach noticed and what the kid should work on beyond the paid hour. Visible "homework" reads to a parent as tangible proof of value: evidence of getting what you pay for. Does not change the design or the priority above.
2. **Hours as well as minutes on a single drill** — "1 hour of jump rope" rather than "60 minutes". ⚠️ Re-scoped Aug 1: this was previously written as "weekly / daily time totals", which was a misreading. No weekly view is required after all, which makes this materially smaller than it looked.
3. Consecutive stepper overshoot (`1 of 1 set` vs stepper at 2)
4. Edit `goal_type` / `side` after assigning
5. Honesty nudge on 0 attempts
6. "Or type a number" hint — fix the keystroke clamp first
7. Hold to accelerate on stepper buttons
8. Progress bars on roster rows
9. Retroactive makes gap — data model + RLS UPDATE policy
10. Gate signups — invite code or waitlist
11. **First-student onboarding nudge** — a suggestion shown when a coach adds their *first* student, along the lines of starting with one or two players before adding a full roster. ⚠️ Explicitly **not** a gate or a limit: purely a nudge, to reduce the chance a coach blind-texts an existing roster before they have felt the product work. New Jul 31 2026, not designed.
12. **Stripe — LIVE MODE ONLY.** The code is done and verified in test mode (Aug 3–4); what is left is dashboard and configuration work, not engineering: create the live product, price and an uncapped `COACHRJ`, add the three Stripe env vars to Vercel for staging and prod, and provision RJ in live mode before he meets the gate.
13. Activate additional activity types
14. Light mode

**Shipped since the July 24 list:** log snapshot + backfill, manual Archive model, Assign again, layups collapse, emerald palette, device-test of the goal type feature, the navigation/loading pass (optimistic card actions, six loading boundaries, seven back links, tap feedback), the **student notes field** (Aug 1 — schema, write path, read fold and rendering on both card lists), which was item 3 and is removed above rather than struck through, and the **billing loop + add-student gate** (Aug 3–4 — test mode only, which is why item 12 above survives as configuration rather than disappearing).

⚠️ **The following is about the July 30 navigation/loading pass only — not about the notes removal above.** Nothing was removed from the list by *that* pass; there was never a "performance audit" item on it. The work came out of a reported symptom (taps not registering), not a planned entry. What it *added* is the "Diagnosed, NOT fixed" set in **Navigation & loading feel**: the region pin, the player detail waterfall, and `AllDoneActions`. Those are the natural next perf items and are deliberately not slotted into this list, because none of them is user-visible on their own the way the feedback fixes were.

---

## Landing page (current)

- **Eyebrow:** For instructors
- **Headline:** The work doesn't stop when the session does. ⚠️ **No literal `<br />`** — it carries `text-wrap: balance` instead. A hard break fixes one width and produces a widow at every other; balance evens the lines at whatever width the viewport is. Verified 375 → 1440: two balanced lines at 390 and below and at 1280+, three at 768–1024, no single-word last line anywhere. ⚠️ Removing the break is necessary but **not sufficient** — natural wrapping still strands words, which is what `balance` is for. Measured at 900px: plain wrapping gives "…stop / when the session / **does.**" with a one-word last line; balance gives "The work doesn't / stop when the / session does." ⚠️ It buys **no fold clearance** — at 375×667 the headline is 64px and the CTA clears by 11px with or without it. An earlier note in `b739fda` claimed ~26px; that reading came from a viewport that had not finished resizing and is wrong.
- **Bullets:** Assign homework to a student / They get a text, log it there / You know exactly what got done
  - **Rewritten Aug 4 2026 to name the mechanism rather than the feeling.** The previous set — "Assign it in seconds" / "Students log it from anywhere" / "You see it happen live" — described outcomes but never said what "it" *was* or why "live" mattered, so a first-time reader could not repeat back what Reps does. This set walks the actual loop — assign → text → log → certainty — so a stranger can explain the product to someone else after one read.
  - ✅ **`white-space: nowrap` was REMOVED from `.bullet-text` (Aug 4 2026) — a bug fix, not a style change.** With nowrap the lines could not break, so the longest bullet set a min-content floor for `.landing-text` (`flex: 1`, default `min-width: auto`) and **the page widened instead of the line breaking** — a horizontal scrollbar in a band around 768px, where the layout goes side-by-side and the type grows to 20px at the same breakpoint, so the column is narrowest exactly when the copy is widest.
    - The overflow was **pre-existing**: the old bullets overflowed 5px at 768 as well, verified by swapping the strings back in place and re-measuring. The current copy is ~20px wider at 20px type, which took it to 25px and widened the band from ~768–772 to ~768–793.
    - After the fix: **0px overflow at 768**, where the three bullets now wrap to two lines each. ⚠️ That wrapping is the visible trade and it is the right one — a wrapped line is a safe failure, a horizontally scrolling document is not.
    - **Verified byte-identical at every width that already passed** — 375, 390, 414, 1024, 1280, 1440 all still render one line per bullet with zero overflow. The rendering changes *only* inside the band that was already broken.
    - Slack on the longest bullet: **27px at 375**, **0px at 768**, comfortable from 820. Treat **~30 characters at 20px** as the practical ceiling for any future bullet — the third one sits exactly on it.
- **Primary CTA:** Start free. ⚠️ Renamed from **"Try Reps free"** on Aug 4 2026, and the reason is the pricing model rather than the wording: "Try" implies a trial with an expiry, and the free tier is 3 students **forever** — no card, no clock. See **Pricing**, where a 14-day trial was considered and explicitly rejected. Do not reintroduce trial language here.
- ✅ **Hero visual — LOCKED Aug 4 2026, no further visual changes.** A **single device mock** of the coach's student-detail screen, replacing the two-circle photo collage. Hand-drawn from the loop section's own primitives — `ScreenHeroDetail` + `.hero-device`, sharing `MiniCard`/`MiniBar2` and the same em-scaling contract.
  - **Student detail rather than the roster, deliberately.** It is the only screen where all three things the hero shows are simultaneously real: progress bars including the two-tone makes bar, a completed assignment, and a student's note. Roster rows carry none of those — no note surface, and progress bars on roster rows are not built — so a roster mock with a note would have been inventing UI.
  - ⚠️ **Every name in it is invented.** Real rosters are real children and this page is public. Do not paste anything from `rj_players`.
  - **Warm two-layer shadow plus a warm radial glow**, never black: black on `#ede9e3` greys the cream and makes the device read as a hole punched in the page. The dark UI inside keeps the shipped colours exactly; the softening is entirely around it.
  - ⚠️ **Sized by aspect ratio, not width, on short screens.** Both the frame height and its contents scale off `--pw`, so width cancels out and only the RATIO decides whether the screen overflows its own frame. Shortening the ratio to fit a 375×667 viewport clipped "+ Assign more" off the bottom; the fix was to shorten only to what the content needs (~9/16.4) and take the remaining height out of the width. The `max-height: 700px` query exists because a 375×812 phone fits comfortably and only genuinely short screens pay.
  - `basketball-hero.webp` and `soccer-hero.webp` are now **unreferenced by the app but NOT deleted** — five dated `mocks-*.html` snapshots still load them, exactly as with `piano-hero.webp`.
- ⚠️ **A dark hero was built and reverted the same day (Aug 4 2026).** The cream `#ede9e3` was replaced with a warm charcoal `#2e2823` — lighter than the loop band, so the page descended into the product — with the full text inversion and the device's glow flipped from absorption to emission. **Reverted on sight: it read as muddy and brown rather than premium.** The cream hero below is the shipped design; this entry exists so the idea is not re-attempted as though it were untried.
  - The two fixes from that pass that were **kept** are the headline's `text-wrap: balance` and the fold clearance it bought. Everything else went back.
  - ⚠️ If it is ever revisited, the groundwork is in commit `b739fda` and is worth reading rather than re-deriving — particularly that the device treatment **inverts**: on cream the device sits at ~17:1 and needs *softening* (warm darkening haze, warm-brown shadows), on a dark hero it sits at ~1.3:1 and needs *separating* (warm light halo, a hairline rim, black shadows, because a warm shadow has nothing to darken). Also recorded there: `#378add` drops to 4.05:1 on that background and fails AA at eyebrow size, the CTA must **not** be brightened to match because its label is white and a lighter fill lowers contrast, and the paper grain is ~an order of magnitude louder proportionally on a dark base and reads as dither.
- **Product loop:** "Here's how it works." → `Example: basketball` caption → four phone mocks, numbered: 1. You assign it (assign screen, makes tracked) / 2. They get a text (SMS thread) / 3. They log it (stepper + two-tone bar) / 4. You see it (coach student detail, `made 28/50 · 56%`)
- **Footer:** dark `#1a1d24` with `1px solid #2a2d36` top border
- **Background:** `#ede9e3` (warm off-white hero) / `#1c1f26` band for the product loop, `#1a1d24` footer

The loop band is deliberately **lighter** than the `#111318` phone frames — the band is the surface, the phones are objects on it, the same relationship the hero has putting dark photographs on cream.

⚠️ The four loop mocks are hand-drawn React, not screenshots — a second surface that has to track the design system by hand. Redrawn July 26 2026, so they are current, but nothing keeps them that way.

### ⚠️ Swapping a hero image: the browser will lie to you

**Cost real time on Aug 4 2026.** Replacing a file in `public/` and reloading shows the **old** image, through hard reloads and dev-server restarts. Nothing is wrong with the file.

`next/image` serves optimised copies from a disk cache, and in **Next 16 that cache is `.next/dev/cache/images`** — *not* `.next/cache/images`, which is the path worth guessing and which does nothing. Clearing the wrong one and reloading also repopulates the right one from the running server's memory, so it gets *more* stale, not less.

**The sequence that works:** stop the dev server → `rm -rf .next/dev/cache/images` → start it again. Order matters; clearing while it runs lets it write the old bytes straight back.

⚠️ **Do not verify an image swap by eye.** A screenshot mid-fade shows empty circles, and a cached hit is indistinguishable from a fresh one. Compare bytes instead — `sharp(file).stats()` mean RGB per channel, against three references: the old version out of git (`git show HEAD:public/x.webp`), what the server actually returns (`curl` the `/_next/image?url=…` URL the DOM is using), and the new file on disk. Served must match disk, not HEAD. That is what caught it here after two restarts had "confirmed" the wrong thing.

### Hero image sources — recover them from git, do not re-encode the WebP

⚠️ **Re-cropping the shipped `.webp` stacks a second lossy encode on the first.** Always crop from the original.

The originals are **not in the working tree** — `026b623` deleted them when the heroes were converted to WebP. They are still in history:

| Source | Recover with |
|---|---|
| `basketball-hero.png` (2048×2048) | `git show 626c7f9:public/basketball-hero.png` |
| `piano-hero.png` | in history, same commit range |

⚠️ **The soccer source is GONE and cannot be recovered.** `soccer.png` and `soccer-updated.png` were both untracked when deleted, so no commit holds them — re-cropping soccer means re-supplying the original by hand. Confirm a recovered file is the right one before trusting it: compare its mean RGB against the shipped WebP, which should match to within a fraction of a level.

**Encode quality is chosen by sweeping, not by reusing a number.** The rule from `ad9e14d` is that the output should land beside its siblings in file size. The right quality moves with the pipeline: a 768×768 source encoded 1:1 needed q68, while a 1696×1696 or 2048×2048 source downscaled to the same output needs ~q82, because the downscale removes noise and the same quality number lands 30% smaller.

⚠️ The frames are basketball-specific (real exercise names, a real shooting percentage) while the rest of the page is activity-agnostic — hence the `Example: basketball` caption. It deliberately claims nothing about other activities: Basketball is the only ACTIVE entry in `activityTypes.ts`, so a broader promise would break at the signup picker one screen later.

### ⚠️ Editing `src/app/page.tsx` — two traps that have each bitten more than once

This file is ~1500 lines with the entire stylesheet inside one `<style>{\`…\`}</style>` template literal and a dozen media queries. Two specific mistakes cost real time on Aug 4 2026 and will again.

**1. A rule that looks applied because it is applied SOMEWHERE. Four instances in one day.**

A breakpoint-scoped rule can be silently outranked, and the symptom is always the same: the value is right in the source, wrong on screen, and correct at *some* width — so it looks fine wherever you happen to be looking.

| What happened | Why |
|---|---|
| Section-2 devices stayed mobile-sized | The desktop rules went into a `768` block that sits **earlier in the stylesheet** than the base `.program-*` rules. Equal specificity, later wins, so the base overrode them. |
| Hero image column stayed 420px above 1023 | The `768` override was correct; the **`1024` block re-declared `flex`/`width` after it** and put the old value straight back. |
| The section-2 CTA ran the full column width | `display: inline-block` was put in the `768–1023` block **only**, so at 1280 the base `display: block; width: 100%` still applied. |
| The section-2 heading rendered at 48% of the hero instead of 82% | The `clamp()` was put in the `768–1023` block **only**, so at 1280 it fell back to the 27px mobile size. |

Related, same family: the `768` block once held **two** `.landing-layout { gap }` declarations (80px, then a 56px override further down). The value in effect was not the one you would find first.

**How to not lose an hour to it:**
- A rule meant for "desktop and up" belongs in its own `@media (min-width: 768px)` block placed **after** the base rules — not inside a `768–1023` range block, and not duplicated per breakpoint.
- **Check the widest width, not the one you are on.** Three of the four survived a screenshot at the width being worked on.
- **Measure, do not look.** `getComputedStyle` / `getBoundingClientRect` in the console is what caught every one of these; a large bold heading looks fine on its own and only a *ratio* against the hero exposes it.
- Before adding an override, grep the selector — the duplicate is often already there.

**2. Backticks inside the `<style>` template literal terminate the string. Twice.**

Both times it was a CSS *comment* written in prose — `` `.landing-text` `` and `` `pretty` rather than `balance` `` — using backticks the way this file's own markdown does. The build fails with a confusing JSX error (`TS1381: Unexpected token. Did you mean {'}'}`) pointing at a line nowhere near the comment.

Use plain words in CSS comments in that file. `tsc --noEmit` catches it immediately, so run it before assuming an edit landed.

**3. A batch edit that throws part-way writes NOTHING.** The Python helper scripts used for these edits build the whole string and write once at the end, so an `AssertionError` on match 5 of 8 silently discards matches 1–4 — while still having printed `ok:` for them. Verify the file, not the log.

---

## Screen inventory

`mocks-2026-07-27-1830.html` in the project root — a static gallery of every screen and meaningful state, rebuilt from the page code. Opens standalone; image paths are relative, so it must stay at the project root. Current as of the July 27 2026 Archive/emerald release. The older `2026-07-25-1441`, `2026-07-24-1330` and `2026-07-23-1607` snapshots sit beside it as history.

⚠️ The gallery renders through a small **JS macro layer** at the bottom of the file (`%ACARD(...)%`, `%TABS(...)%`, `%ALLDONE(...)%` and friends, expanded into `.main` on load). A macro used but not registered in the expansion pass leaves raw `%NAME(...)%` text on screen; a JS error blanks the whole gallery, because the script replaces `.main.innerHTML` wholesale. Open it in a browser after editing — a syntax check alone won't catch either.

New in this snapshot: New/Archive tabs on both list screens, the all-done panel in both variants, the Archive tab itself, the finished-card menus (Assign again / Archive / Move back to New), emerald tokens, 2px bars, and the divider-style menus with icons. The **Clear finished sheet frame was deleted**, matching the feature.

⚠️ **The gallery is TWO releases behind** — the July 30 navigation pass and the whole of Aug 1.

*From the navigation pass:* the six skeleton states are genuinely new UI and appear in no snapshot — five route shapes (roster, player detail, assign subtree, student home, log screen) plus celebrate's deliberate blank. They are transient, which is exactly why a static gallery is the only place they can be inspected side by side. Also unrepresented: the widened back-link tap targets (invisible in a static frame but a real layout change, since the header row is now 44px tall), and the `active:scale` tap feedback.

*From Aug 1, and this is the larger half:*
- **The entire notes feature** — the log screen's label/textarea/counter block, and the note line on **both** card lists. New UI on three screens with no frame anywhere.
- **Both log screen spacing passes.** Every vertical relationship on that screen moved: bar→label 32→44, label→stepper 20→12, stepper→hairline 24→20, hairline→MAKES 20→16, cluster→note 40→56, note→button 48→32.
- **Log screen typography** — the note label at `#8a8fa8`/500/15px and the placeholder at `#5a5f72`.
- **The button rename.** `Log it` appears **10 times** in the Jul 27 file.
- **The parent helper text**, still shown as two paragraphs on the add-student frame.
- **The roster activity sort** — the roster frames show a fixed order that no longer reflects how rows rank.

⚠️ **This is a regeneration, not a touch-up.** The log screen needs its frames redrawn rather than edited, and the note line touches every card frame in the gallery (70 phone frames total). Deliberately deferred: nothing depends on the gallery, and CLAUDE.md's own warning applies — a JS error in the macro layer blanks the whole page, so it wants a session with time to open it in a browser afterwards, not a late-night edit.

---

## Shipped-feature history

`CHANGELOG.md` at the repo root — a Feature / Why-it-exists table, oldest first, grouped by phase. **This file describes the app as it is now; CHANGELOG.md records how it got there.** Append a row there whenever something ships.

⚠️ It carries roughly **a dozen "Reason not recorded" rows**, nearly all from the Jul 11–15 build days — the email-OTP switch, the original scaffold, per-step signup routes, the landing page, yellow's retirement, side-on-assignments. Those are honest gaps, not placeholders: the reason was never written down anywhere. Worth filling in from memory in a future session while it is still recoverable.

---

## Session checklist

Before each Claude Code session, confirm:
- Which flow are we building today?
- What's the done-state for this session?
- Any design decisions to make before coding?
- Push to: local only / staging / prod?
- Are local, staging, and prod in sync? (`git log --oneline -5`)
