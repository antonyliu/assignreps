# Reps — CLAUDE.md
*Last updated: Aug 1 2026 · See `CHANGELOG.md` for shipped-feature history. Prod commit and environment sync are not tracked here — they drifted three times in two days. Run `git branch -r -v`.*

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
- Roster grouped: Done / In progress / Not started / Nothing assigned

### Student
- Gets a text with a unique link — no signup required
- Can also log in from any device at assignreps.com via phone OTP
- Taps link → sees their assignments, split into the same **New / Archive** tabs the coach sees
- Logs with a stepper counter; what the stepper counts depends on the goal type
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
  id, name, email, phone (nullable), instructor_type, created_at

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
- **`filed_at`** — which tab an assignment sits in: NULL = **New**, set = **Archive**, and the value is when the coach moved it. Nullable, no default, no backfill; every pre-existing row reads as New, which is where they all were. Indexed as `(player_id, filed_at)` since every read on both list screens is "this player's cards, split by filed or not."
  - ⚠️ **Filing is independent of completion.** Nothing moves automatically. A finished assignment stays in New until a coach archives it, and archiving is reversible. `isComplete()` no longer decides tab membership at all — it only draws the ✓ badge and picks which menu actions a card offers.
  - ⚠️ **Deliberately NOT named `logged_at`.** `logs.logged_at` already means "when a STUDENT recorded reps", and the player detail page reads both tables into one aggregation. Two columns, one name, opposite actors. The small mismatch with the "Archive" tab label is the price; the collision would have been permanent.
- `logs_amount_check` — a constraint requiring `amount > 0` exists on `logs` but is NOT in any migration file (created directly in the dashboard). Don't try to insert `amount: 0`.
- `logs_makes_non_negative` — `makes IS NULL OR makes >= 0`.
- Assignments are not time-bounded — they persist until the instructor archives them (or deletes them, which is only possible before the work is finished).
- `logs.assignment_id → assignments.id` is **ON DELETE SET NULL** — deleting an assignment never deletes log history.
- The `coaches` table is NOT anon-readable. Student pages use `coach_name_for_token(text)` SECURITY DEFINER RPC to get the coach name for a valid student token.

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
- **Placeholders:** `#5a5f72`
- **Helper text:** `#8a8fa8`

### Bar behavior
- Log screen bar: **6px** (`h-1.5`) — deliberately unchanged. One bar on its own screen, not one of a stack.
- Student home cards: **2px** (`h-[2px]`)
- Coach detail cards: **2px** (`h-[2px]`)
- ⚠️ Card bars went 3px → 2px on July 27 2026, all four sites (both screens × two-tone and single). Some of RJ's players now carry 10+ assignments at once, and at 3px a stack of ten read as heavy banding.
- Two-tone: muted attempts fill + bright makes fill overlaid — **`reps` goal only**. On a makes goal the single bar is already measuring makes, so stacking would draw the same figure twice.
- Single-tone (no makes): single muted fill
- Complete: full bright

---

## Student log screen

Stepper-based; the hero stepper is whatever the assignment is scored on.

**Layout (top to bottom):**
1. `← [Exercise name]` header — 44px back tap target, 17px title
2. `Left hand` / `Right hand` context line (only when `side` is set)
3. `X of Y done` progress text — or `X of 1 set · N in a row` for a streak
4. Progress bar (6px)
5. Primary label + large stepper
6. Divider + inline `MAKES` row — **only on a `reps` goal with `track_makes`**
7. `Log it` button, which **follows the content** rather than anchoring to the bottom

**Spacing tightened July 27 2026** — roughly 100px removed. The gap below the progress bar went 96px → 56px (by far the largest on the screen, and the dead zone between "here's where you are" and "here's what you're entering"); header 56 → 48; stepper block to button 56 → 48; button padding `+2rem` → `+1.5rem`.

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

⚠️ Both the write and the read are wrapped in try/catch. Safari private browsing throws on `sessionStorage`, and an uncaught throw on the write would skip the navigation and strand the student on the log screen with a live "Log it" button — inviting a second tap and a duplicate row.

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

5. **Notes on the log screen.** Already under "Decided, not built". RJ asked for this directly, which is reason to pull it forward rather than leave it as generic backlog.

---

## Pricing (resolved Jul 31 2026 — price point still open)

**Free tier — resolved.** 3 students, full features, no card required, no time limit. **Forever, not a trial.**

⚠️ A 14-day-unlimited trial was considered and **rejected**. It does not solve the problem it was reached for — the "cold roster dump", where a coach adds twenty students on day one and blind-texts them all before feeling the product work. A trial doesn't prevent that; a coach can dump a full roster on day one of a trial just as easily. And it reintroduces a hard deadline, which the free-tier model deliberately does not have.

**Paid tier — resolved in shape.** Monthly only, cancel anytime. No annual plan, no discount tiers, deliberately not built — nothing at this stage requires them.

**Price point — NOT locked.** Genuinely open between **$5 and $10/mo**. What is settled is the reasoning around it:

- **Cost to serve is a non-issue either way.** SMS per free user runs pennies to low single-digit dollars a month even in heavy-use edge cases, so the price is a positioning decision, not a margin one.
- **Both sit well under market.** Comparable products in this niche charge substantially more — see the section below.
- **$9.99 was considered and set aside in favour of $10.** A round number reads as honest; a charm-priced one reads as optimised extraction, which is the opposite of the voice this pricing is meant to carry.

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
- **Notes field.** Resolved small: one optional, length-capped "anything to tell coach" field on the **student log screen**. Explicitly *not* the larger recap/insights idea, which is tracked separately below. Needs a write path the student page doesn't currently have.

### Medium priority
- **Gate stranger signups** — currently open; invite code or waitlist before broader launch
- **Stripe infrastructure** — free tier 3 students, paywall at 4th, promo code `COACHRJ` = lifetime free. See **Pricing** for the resolved model; the price point ($5 vs $10) is the one piece still open.
- **Tighten logs RLS policy** — INSERT currently open
- **Demo mode** — "Try as Coach" seeded database with context overlay
- **Account deletion flow** — required by privacy policy
- **hello@assignreps.com Gmail Send as setup**
- **Final legal review of /privacy + /terms**
- **Re-engagement nudge** — Monday email to coaches who haven't assigned anything
- **Landing page product-loop frames are hand-drawn** — `src/app/page.tsx` redraws four miniature phones in JSX, so every design change has to be re-applied here by hand and can silently drift from the real screens. Redrawn July 25 2026 (assign → text → log → student detail); the specific staleness previously listed — retired preset buttons and `#27500a` — is fixed, but the maintenance burden is structural
- **"Consecutive" goal label vs "In a row"** — known drift, not a bug. The landing page's assign frame labels the third goal **In a row**, which is how instructors actually speak; the app's `CountScreen` still shows **Consecutive**. The stored `goal_type` value is `'consecutive'` either way, so this is display copy only — but the app and the marketing page currently name the same goal differently. Renaming the app label is the likely fix; it touches `GOALS` in `CountScreen.tsx` and the `SETS COMPLETED` / streak wording on the log screen

### Low priority / future
- **Finish tokenising the greens** — 4 sites still hardcode `#3ed68a` rather than using the token: the celebrate confetti array, the two `Check` icon `color` props (CountScreen + CustomExerciseScreen), and the roster `GROUP_STYLE` object. The icons are the reason it stopped: lucide passes `color` into an SVG `stroke` attribute, where a CSS var resolves in practice but wants seeing rendered before trusting.
- **`CustomExerciseMenu` is the odd one out** — three of the app's four overflow menus now share the raised/flush/divider style with icons; this one keeps the old padded `p-1` panel with rounded inner items and no icon. Its single item is `Delete exercise`, which pairs naturally with the `Trash2` on `Delete assignment`.
- **Toast is dim** — noted on device, not fixed. All three toasts use `text-reps-sub` on `--reps-raised`.
- **Student / parent progress recap** — "*Khloe's first 8 months*" style longitudinal view. Explicitly backburner, but explicitly *connected*: it is the original founding vision and it is what the July 20 RJ meeting notes on longitudinal tracking were about. Depends entirely on accumulated history, which the July 27 log-snapshot fix now protects going forward. Distinct from the small notes field above.
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
- Notes field on the log screen ❌ — decided, not built
- Demo mode ❌
- Account deletion ❌
- Stripe billing ❌
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
3. **Notes field** on the student log screen — small, capped, optional; needs a student write path
4. Consecutive stepper overshoot (`1 of 1 set` vs stepper at 2)
5. Edit `goal_type` / `side` after assigning
6. Honesty nudge on 0 attempts
7. "Or type a number" hint — fix the keystroke clamp first
8. Hold to accelerate on stepper buttons
9. Progress bars on roster rows
10. Retroactive makes gap — data model + RLS UPDATE policy
11. Gate signups — invite code or waitlist
12. **First-student onboarding nudge** — a suggestion shown when a coach adds their *first* student, along the lines of starting with one or two players before adding a full roster. ⚠️ Explicitly **not** a gate or a limit: purely a nudge, to reduce the chance a coach blind-texts an existing roster before they have felt the product work. New Jul 31 2026, not designed.
13. Stripe infrastructure
14. Activate additional activity types
15. Light mode

**Shipped since the July 24 list:** log snapshot + backfill, manual Archive model, Assign again, layups collapse, emerald palette, device-test of the goal type feature, and the navigation/loading pass (optimistic card actions, six loading boundaries, seven back links, tap feedback).

⚠️ Nothing was removed from the list above by that pass — there was never a "performance audit" item on it. The work came out of a reported symptom (taps not registering), not a planned entry. What it *added* is the "Diagnosed, NOT fixed" set in **Navigation & loading feel**: the region pin, the player detail waterfall, and `AllDoneActions`. Those are the natural next perf items and are deliberately not slotted into this list, because none of them is user-visible on their own the way the feedback fixes were.

---

## Landing page (current)

- **Eyebrow:** For instructors
- **Headline:** Help students work between sessions. (breaks after "work" via a literal `<br />`)
- **Bullets:** Assign in seconds / Students log it from anywhere / You see it as it happens
- **Primary CTA:** Try Reps free
- **Product loop:** "Here's how it works." → `Example: basketball` caption → four phone mocks, numbered: 1. You assign it (assign screen, makes tracked) / 2. They get a text (SMS thread) / 3. They log it (stepper + two-tone bar) / 4. You see it (coach student detail, `made 28/50 · 56%`)
- **Footer:** dark `#1a1d24` with `1px solid #2a2d36` top border
- **Background:** `#ede9e3` (warm off-white hero) / `#1c1f26` band for the product loop, `#1a1d24` footer

The loop band is deliberately **lighter** than the `#111318` phone frames — the band is the surface, the phones are objects on it, the same relationship the hero has putting dark photographs on cream.

⚠️ The four loop mocks are hand-drawn React, not screenshots — a second surface that has to track the design system by hand. Redrawn July 26 2026, so they are current, but nothing keeps them that way.

⚠️ The frames are basketball-specific (real exercise names, a real shooting percentage) while the rest of the page is activity-agnostic — hence the `Example: basketball` caption. It deliberately claims nothing about other activities: Basketball is the only ACTIVE entry in `activityTypes.ts`, so a broader promise would break at the signup picker one screen later.

---

## Screen inventory

`mocks-2026-07-27-1830.html` in the project root — a static gallery of every screen and meaningful state, rebuilt from the page code. Opens standalone; image paths are relative, so it must stay at the project root. Current as of the July 27 2026 Archive/emerald release. The older `2026-07-25-1441`, `2026-07-24-1330` and `2026-07-23-1607` snapshots sit beside it as history.

⚠️ The gallery renders through a small **JS macro layer** at the bottom of the file (`%ACARD(...)%`, `%TABS(...)%`, `%ALLDONE(...)%` and friends, expanded into `.main` on load). A macro used but not registered in the expansion pass leaves raw `%NAME(...)%` text on screen; a JS error blanks the whole gallery, because the script replaces `.main.innerHTML` wholesale. Open it in a browser after editing — a syntax check alone won't catch either.

New in this snapshot: New/Archive tabs on both list screens, the all-done panel in both variants, the Archive tab itself, the finished-card menus (Assign again / Archive / Move back to New), emerald tokens, 2px bars, and the divider-style menus with icons. The **Clear finished sheet frame was deleted**, matching the feature.

⚠️ **The gallery is one release behind as of the navigation pass.** The six skeleton states are genuinely new UI and appear in no snapshot: five route shapes (roster, player detail, assign subtree, student home, log screen) plus celebrate's deliberate blank. They are transient, which is exactly why a static gallery is the only place they can be inspected side by side — a reviewer cannot hold one on screen. Also unrepresented: the widened back-link tap targets (invisible in a static frame but a real layout change, since the header row is now 44px tall), and the `active:scale` tap feedback. Worth folding into the next snapshot rather than regenerating for this alone.

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
