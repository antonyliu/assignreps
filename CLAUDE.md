# Reps — CLAUDE.md
*Last updated: July 27 2026 · Prod commit and environment sync are not tracked here — they drifted three times in two days. Run `git branch -r -v`.*

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
- Adds students by name + phone number; optional parent phone per student
- Assigns exercises from a default library or creates custom ones
- Picks a **goal type** (attempts / makes / consecutive) and an optional **side** (left / right)
- Views each student's progress and shooting percentage (makes/attempts)
- Roster grouped: Done / In progress / Not started / Nothing assigned

### Student
- Gets a text with a unique link — no signup required
- Can also log in from any device at assignreps.com via phone OTP
- Taps link → sees their assignments (persist until instructor clears them)
- Logs with a stepper counter; what the stepper counts depends on the goal type
- Sees a celebration when done: 🔥 + "[Coach] will see this."

### Parent
- Optional per student — instructor decides at add-student time
- Gets a Sunday night text digest (no signup, no account)
- Read-only view: practice days, assignments completed, last activity

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
  goal_type (text, NOT NULL, default 'reps'), side (text, nullable)

logs
  id, player_id, assignment_id, amount, makes (integer, nullable), logged_at,
  exercise_name (text, nullable), unit (text, nullable), goal_type (text, nullable),
  target (int4, nullable), side (text, nullable)   -- snapshot, written at insert

custom_exercises
  id, coach_id, name, unit (reps/minutes), default_amount, created_at
```

Migrations live in `supabase/migrations/`. There is **no base schema migration** — the original tables were created in the Supabase dashboard, so only later changes are captured as files.

### Key schema notes

- `goal_type` — what `target` measures. `'reps'` (attempts), `'makes'`, or `'consecutive'`. Checked by `assignments_goal_type_check`. Defaults to `'reps'`, which backfills every pre-existing row to exactly its prior behavior.
- `side` — `'left'`, `'right'`, or NULL. Checked by `assignments_side_check`. NULL means **unspecified**, not "both". (NULL passes a Postgres CHECK natively, so no explicit allowance is needed.)
- `track_makes` — when true, the log screen offers a makes entry. Forced true by the assign action when `goal_type` is `'makes'` or `'consecutive'`, where makes are the point. Kept as its own column rather than derived, so the stored row states the coach's intent outright.
- `logs.makes` — nullable integer. `null` means "didn't report makes"; `0` means "made none." Never conflate these — they mean different things for percentage calculations.
- **Log snapshot columns** — `exercise_name`, `unit`, `goal_type`, `target`, `side` on `logs`. The log's own copy of the assignment as it stood when the row was written. Set once by `saveLog` from a server-side read, never updated after — a later edit to the assignment must not rewrite what the student actually did. They exist because `logs.assignment_id` is `ON DELETE SET NULL`: without them a cleared assignment leaves a log with no record of what it was. Nullable with **no backfill** — null means "written before July 27 2026." No CHECK constraints, unlike their `assignments` counterparts: these are copies of already-validated values, and a constraint that rejected an unexpected legacy value would fail the student's insert and lose reps they actually did. See the NARROWED entry in Pending.
- `logs_amount_check` — a constraint requiring `amount > 0` exists on `logs` but is NOT in any migration file (created directly in the dashboard). Don't try to insert `amount: 0`.
- `logs_makes_non_negative` — `makes IS NULL OR makes >= 0`.
- Assignments are not time-bounded — they persist until the instructor clears them.
- `logs.assignment_id → assignments.id` is **ON DELETE SET NULL** — clearing assignments never deletes log history.
- The `coaches` table is NOT anon-readable. Student pages use `coach_name_for_token(text)` SECURITY DEFINER RPC to get the coach name for a valid student token.

### Foreign key cascade rules
- `players.coach_id → coaches.id` — CASCADE
- `assignments.player_id → players.id` — CASCADE
- `logs.player_id → players.id` — CASCADE
- `logs.assignment_id → assignments.id` — **SET NULL** (intentional — preserves log history)

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

1. `src/app/student/[token]/page.tsx` — card state + all-done banner
2. `src/app/instructor/student/[id]/page.tsx` — card state + all-done banner
3. `src/app/instructor/students/page.tsx` — roster grouping and counts
4. `src/app/student/[token]/log/[assignmentId]/actions.ts` — `allDone` for confetti
5. `LogScreen.tsx` — client `done` state
6. `src/app/student/[token]/log/[assignmentId]/page.tsx` — the `alreadyLogged` cap
7. `src/app/instructor/student/[id]/actions.ts` — which rows "Clear finished" deletes

⚠️ Miss one and it reports completion **too early**: on a "make 50" assignment a student who attempts 50 and makes 20 satisfies `amount >= target`. The roster was the most exposed — it fetched neither `makes` nor `goal_type`.

⚠️ **A render-time gate is not a correctness guarantee.** Site 7 exists because `clearCompletedAssignments` used to delete the player's whole assignment list unfiltered. That was invisible in the normal flow: the "Clear finished" control only renders under `allDone`, so "everything" and "everything complete" were the same set. They diverge on a **stale page** — the coach loads an all-done student, assigns new work from another tab or device, then clicks the still-rendered button — and under direct invocation of the server action, which no UI gate reaches at all. An action has to establish its own preconditions; it cannot borrow them from whatever rendered its button.

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

⚠️ **Known duplicate, intentional hold:** Finishing still ships `Layups (right hand)` and `Layups (left hand)` as two separate library entries, so a coach can now assign "Layups (right hand) · Left". Collapsing them into one `Layups` entry is the clean fix, but `exercise_name` is free text and is the only link back to a category (`categoryKeyForExercise`), so renaming is a data migration across existing assignments. Deliberately not done yet.

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

## Color system

### One green family — three shades, five roles (lime, not emerald)
| Stop | Hex | Usage |
|------|-----|-------|
| Bar track (empty) | `#2a2d36` | Gray — empty progress track everywhere |
| Bar attempts fill | `#3d7a24` | Muted lime green — attempts progress |
| Attempts label + number | `#3d7a24` | Same as bar attempts — one unified color. **Only when `track_makes` is true on a `reps` goal.** |
| Reps/Minutes label + number (no makes) | `#6bd63d` | Bright lime — a solo counter takes the bright green outright |
| Makes label + number | `#6bd63d` | Bright lime green — same as bar makes fill |
| Done state | `#6bd63d` | Completion everywhere (bars, pills, checkmarks) |

⚠️ The muted `#3d7a24` on a **label or number** exists only to subordinate attempts to makes. With no makes row on screen there's nothing to rank against, so a reps-only, minutes, makes-goal or streak assignment renders its label and number in bright `#6bd63d` instead. The muted shade is never the "default" text color — it's the *paired* one. (`ATTEMPTS_NUMBER` vs `SOLO_NUMBER` in `LogScreen.tsx`.)

This applies to text only. **Bar fills are unaffected** — an in-progress bar is `#3d7a24` whether or not makes are tracked.

⚠️ The old emerald `#3dd68c` was replaced app-wide with `#6bd63d`. The only remaining emerald is the celebrate screen confetti (decorative, intentionally left alone).

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
- Log screen bar: **6px** (`h-1.5`)
- Student home cards: **3px** (`h-[3px]`)
- Coach detail cards: **3px** (`h-[3px]`)
- Two-tone: attempts fill (`#3d7a24`) + makes fill (`#6bd63d`) overlaid — **`reps` goal only**. On a makes goal the single bar is already measuring makes, so stacking would draw the same figure twice.
- Single-tone (no makes): single `#3d7a24` fill
- Complete: full `#6bd63d`

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
7. `Log it` button pinned to bottom (`env(safe-area-inset-bottom, 16px) + 2rem`)

**Label resolution, in order:**
- `consecutive` → `SETS COMPLETED`
- `makes` goal → `MAKES` (hero)
- `unit === 'minutes'` → `MINUTES` (wins over everything else)
- Shooting / Finishing / Spot shots **with** `track_makes` → `ATTEMPTS`
- Everything else, including a shooting drill with makes off → `REPS`

All render uppercase. There is no question-form copy on this screen.

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

## Exercise library (Basketball) — 31 exercises, 6 categories

Source of truth: `src/lib/exercises.ts`. Category keys: `shooting`, `handling`, `finishing`, `footwork`, `conditioning`, `spot-shots`.

**⚠️ INVARIANT:** Every exercise's `default` must appear in its `quick` preset array. If it doesn't, the count screen opens with no preset selected and the number input hidden. Re-check after any edit.

**Shooting** (reps · 25/50/100/200)  
Form shooting 50, Free throws 50, Mid-range jumpers 50, Corner 3s 25, Catch & shoot 50, Elbow jumpers 25, Short corner jumpers 25, Dribble pull-ups 25

**Ball-handling** (minutes · 5/10/15/20)  
Stationary dribbling 10, Two-ball dribbling 10, Crossovers 5, Figure 8s 5, Dribble series 10

**Finishing** (reps · 10/20/50/100)  
Layups (right hand) 20, Layups (left hand) 20, Floaters 20, Euro-step 20, Hop-step 20, Spin 20

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

---

## Twilio status

- ✅ Toll-free (833) 892-5640 — registered and approved
- ✅ SMS confirmed working end-to-end (July 22 2026)
- Messaging Service SID: `MGe3a0a18bf618d102aae9cb26943cd239`
- Use `MessagingServiceSid` parameter, not `From`
- SMS fires on first assignment of the day per student (once-per-day gate, LA timezone)
- `last_texted_at` written only after Twilio confirms success
- Old number +15625487985 released

⚠️ **Still pending:** Update `TWILIO_FROM_NUMBER` to `+18338925640` in `.env.local` AND Vercel env vars.

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

### July 26 2026 — first real usage

**It is being used.** First completed assignments came in. One student told RJ she likes the app and how simple it is, and his summary: *"kids are liking it and really using it."* This is the first evidence of the loop closing with real students rather than in testing.

Requests, in his words:

- **Move "Assign more" button to the top** — currently pinned to the bottom of the student detail screen.
- **A notes section for players** — somewhere to ask questions or write down what they understood that day. ❓ *Awaiting clarification:* whose note is it — the coach writing to the student, the student writing back, or both? That decides whether it is a new column, a new table, or a two-way thread, and whether the student page needs a write path it does not currently have.
- **"Can timeframe be minutes & hours for weekly breakdown"** — verbatim. ❓ *Awaiting clarification:* unclear whether this means a new `hours` unit alongside `minutes`, or a time-spent total rolled up per week on a view that does not exist yet.
- **A repeat-schedule function for when a set is finished** — reassign automatically once a student completes something. ✅ *Unblocked July 27 2026* — this was the sharpest reason to fix orphaned logs first, since a weekly reassign cycle would have turned a one-off loss into a recurring one. New logs now carry their own snapshot, so the cycle is safe to build. See the NARROWED entry in Pending.
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

## Product decisions locked

- **Instructor is the customer.** All design decisions flow from instructor pain points.
- **Default exercise libraries are the product experience.** Custom creation is the escape hatch.
- **Makes logging is always optional for students on a reps goal** — never blocks logging.
- **Track_makes defaults:** true for shooting/finishing/spot-shots, false for minutes-based and for the three makeless categories, false for customs.
- **Percentage formula:** makes / attempts, only over logs that recorded makes. Null logs excluded from denominator.
- **Bar language:** muted lime = attempts/in-progress, bright lime = makes/complete, gray = empty.
- **No yellow** — removed platform-wide July 23 2026.
- **Assignments are not time-bounded** — they persist until manually cleared.
- **Log history is never deleted** — `ON DELETE SET NULL` preserves logs forever.
- **A banked mismatch is never silently rewritten.** Guards live on the controls, not on stored data.

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

---

## Pending / loose ends

### High priority
- **⚠️ NARROWED — new logs are safe; every log written before July 27 2026 is not, and cannot be.** Fixed going forward as of **July 27 2026**: `saveLog` now copies `exercise_name`, `unit`, `goal_type`, `target` and `side` onto each log row at insert time, so a log written from that date survives its assignment being cleared or deleted. Verified on staging against live assignments — all five columns populate correctly on new logs.

  *What remains:* a log written **before** July 27 2026 still carries only `assignment_id`. When "Clear finished" or "Remove assignment" deletes the assignment, `ON DELETE SET NULL` leaves that row with an amount and a date and **no record of what it was**. Every reader keys on `assignment_id` and skips nulls, so those orphans stay invisible rather than visibly broken — the damage is silent, exactly as before.

  *There is no honest backfill, and this is permanent.* Copying today's assignment values onto an old log would invent a past that may not be true: the target may have been changed since via "Edit amount", and a deleted assignment is gone outright. Null is the truthful answer, so the columns are nullable and no backfill was run. The only mitigation is that RJ has cleared nothing yet — the pre-fix rows are still readable *because* their assignments happen to survive. Nothing guarantees that, and the first "Clear finished" tap starts losing them.

  *Implementation:* exactly **one** INSERT site, `saveLog` in `src/app/student/[token]/log/[assignmentId]/actions.ts` (audited repo-wide — no other insert, upsert, route handler or DB trigger writes `logs`). The assignments query the confetti check already needed moved *above* the insert and was widened, so the snapshot costs **no extra round trip**; the logs read stays below it, since the completion check has to see the row just written. Server-side only — the five values come from that DB read and `saveLog` accepts no snapshot parameters at all, because the student log page is public and token-addressed and a crafted request could otherwise write any exercise name it liked into permanent history. That read is scoped to the player, which also establishes that the assignment *belongs* to them: the insert previously leaned on the foreign key alone, which proves an assignment exists but not whose it is. Migration `20260727120000_add_log_snapshot_columns.sql` (applied via the dashboard; the file is committed so the repo matches the deployed schema).

  *Readers are unchanged.* Every screen still joins live to `assignments`. The snapshot is the fallback for an orphan, not the primary source — nothing reads it yet, and a future progress/insights view is what would first consume it.
- **Device-test the goal type feature** — shipped to prod July 24 with no real-iPhone pass. Never observed on device: the count screen and coach detail (auth-gated locally), and the incomplete-consecutive label `0/1 set · N in a row` (every consecutive row in the DB is already complete).
- **Update `TWILIO_FROM_NUMBER`** to `+18338925640` in `.env.local` AND Vercel env vars
- **Consecutive stepper overshoots its own progress line** — reads `1 of 1 set` while the stepper sits at 2. `progressValue` caps at 1 by design, but the two numbers visibly disagree.
- **Edit `goal_type` / `side` after assigning** — currently quantity only, so a wrong hand means delete and re-assign. `goal_type` should stay behind the `hasProgress` gate (switching a logged reps assignment to makes reinterprets history); `side` is metadata and could be looser.
- **Custom exercises get no goal selector** — they keep the makes toggle but can't take a makes or consecutive goal, since they belong to no category.
- **Retroactive makes gap** — a student who completes an assignment without logging makes cannot add them later. Needs an RLS UPDATE policy + a replace-vs-append decision.
- **"Or type a number" hint** on stepper — students don't know the centre number is tappable. ⚠️ Shipping this makes a latent bug real: typing attempts clamps makes on each intermediate keystroke (retyping "60" passes through "6" and drags makes to ≤6).
- **Hold to accelerate** on stepper buttons
- **Honesty nudge** — when a student logs 0 or very low attempts, a quiet human message
- **Progress bars on roster rows** — also the prerequisite for showing side on the roster, which today has no per-assignment surface at all

### Medium priority
- **Collapse the layups pair** into one `Layups` entry now that `side` exists — needs a data migration, `exercise_name` is free text
- **Gate stranger signups** — currently open; invite code or waitlist before broader launch
- **Stripe infrastructure** — free tier 3 students, paywall at 4th, ~$5/month, promo code `COACHRJ` = lifetime free
- **Tighten logs RLS policy** — INSERT currently open
- **Demo mode** — "Try as Coach" seeded database with context overlay
- **Account deletion flow** — required by privacy policy
- **hello@assignreps.com Gmail Send as setup**
- **Final legal review of /privacy + /terms**
- **Re-engagement nudge** — Monday email to coaches who haven't assigned anything
- **Landing page product-loop frames are hand-drawn** — `src/app/page.tsx` redraws four miniature phones in JSX, so every design change has to be re-applied here by hand and can silently drift from the real screens. Redrawn July 25 2026 (assign → text → log → student detail); the specific staleness previously listed — retired preset buttons and `#27500a` — is fixed, but the maintenance burden is structural
- **"Consecutive" goal label vs "In a row"** — known drift, not a bug. The landing page's assign frame labels the third goal **In a row**, which is how instructors actually speak; the app's `CountScreen` still shows **Consecutive**. The stored `goal_type` value is `'consecutive'` either way, so this is display copy only — but the app and the marketing page currently name the same goal differently. Renaming the app label is the likely fix; it touches `GOALS` in `CountScreen.tsx` and the `SETS COMPLETED` / streak wording on the log screen

### Low priority / future
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
- Parent weekly digest (read-only magic link) ✅
- Landing page + product loop section ✅
- Staging environment ✅
- Resend email delivery ✅
- SMS on assignment ✅
- Log snapshot — new logs survive their assignment being deleted ✅ (July 27 2026, new rows only)
- Demo mode ❌
- Account deletion ❌
- Stripe billing ❌
- Progress bars on roster rows ❌
- Retroactive makes editing ❌
- Editing goal_type / side after assigning ❌

---

## Priority build list (July 24 2026)

1. **Device-test the goal type feature on a real iPhone** — it is on prod untested
2. **Get RJ using it for real** — makes-first is now a first-class goal
3. Consecutive stepper overshoot (`1 of 1 set` vs stepper at 2)
4. Edit `goal_type` / `side` after assigning
5. Honesty nudge on 0 attempts
6. "Or type a number" hint — fix the keystroke clamp first
7. Hold to accelerate on stepper buttons
8. Progress bars on roster rows
9. Retroactive makes gap — data model + RLS UPDATE policy
10. Collapse the layups pair
11. Gate signups — invite code or waitlist
12. Stripe infrastructure
13. Activate additional activity types
14. Light mode

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

`mocks-2026-07-25-1441.html` in the project root — a static gallery of every screen and meaningful state, rebuilt from the page code. Opens standalone; image paths are relative, so it must stay at the project root. Current as of the July 26 2026 landing page redraw; the older `2026-07-24-1330` and `2026-07-23-1607` snapshots sit beside it as history.

---

## Session checklist

Before each Claude Code session, confirm:
- Which flow are we building today?
- What's the done-state for this session?
- Any design decisions to make before coding?
- Push to: local only / staging / prod?
- Are local, staging, and prod in sync? (`git log --oneline -5`)
