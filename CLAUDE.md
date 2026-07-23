# Reps — CLAUDE.md
*Last updated: July 23 2026 · Prod commit: `193ce48`*

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
- Views each student's progress and shooting percentage (makes/attempts)
- Roster grouped: Done / In progress / Not started / Nothing assigned

### Student
- Gets a text with a unique link — no signup required
- Can also log in from any device at assignreps.com via phone OTP
- Taps link → sees their assignments (persist until instructor clears them)
- Logs attempts (and optionally makes) using a stepper counter
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

⚠️ Local, staging, and prod all share the same Supabase project. Schema migrations hit all environments at once.

---

## Database schema

```
coaches
  id, name, email, phone (nullable), instructor_type, created_at

players
  id, coach_id, name, phone, parent_phone, send_to_parent, token, last_texted_at, created_at

assignments
  id, coach_id, player_id, exercise_name, target, unit (reps/minutes), video_url, week_start, created_at, track_makes (boolean, default false)

logs
  id, player_id, assignment_id, amount, makes (integer, nullable), logged_at

custom_exercises
  id, coach_id, name, unit (reps/minutes), default_amount, created_at
```

### Key schema notes

- `track_makes` on assignments — when true, the student log screen shows the makes stepper. Default false for custom exercises; defaults based on exercise category for presets (all rep-based categories default true, minutes-based default false but toggleable).
- `logs.makes` — nullable integer. `null` means "didn't report makes"; `0` means "made none." Never conflate these — they mean different things for percentage calculations.
- `logs_amount_check` — a constraint requiring `amount > 0` exists on `logs` but is NOT in any migration file (was created directly in Supabase dashboard). Don't try to insert `amount: 0`.
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

## Makes logging system

Built and live on prod as of July 22 2026.

**How it works:**
- Coach toggles "Track makes?" at assign time (per-assignment, not per-exercise)
- Student sees "ATTEMPTS" stepper + "MAKES" stepper on log screen when enabled
- Log screen seeds both steppers from already-logged totals on return
- Delta save — only the new amount is inserted, not the running total
- Coach sees `made X/Y · Z%` on the student detail card and student list rows
- Percentage is computed only over logs that recorded makes (null logs don't drag down the average)
- If makes > attempts in a single log row, the percentage is suppressed (bad data guard)

**Known limitation:** If a student logs attempts without makes and the assignment completes, they cannot retroactively add makes. `logs_amount_check` blocks `amount: 0` inserts, and a makes-only update would need an RLS UPDATE policy that doesn't currently exist. Documented in CLAUDE.md as a known gap.

---

## Color system (current, as of July 23 2026)

### One green family — three shades, five roles (lime, not emerald)
| Stop | Hex | Usage |
|------|-----|-------|
| Bar track (empty) | `#2a2d36` | Gray — empty progress track everywhere |
| Bar attempts fill | `#3d7a24` | Muted lime green — attempts progress |
| Attempts label + number | `#3d7a24` | Same as bar attempts — one unified color. **Only when `track_makes` is true.** |
| Reps/Minutes label + number (no makes) | `#6bd63d` | Bright lime — a solo counter takes the bright green outright |
| Makes label + number | `#6bd63d` | Bright lime green — same as bar makes fill |
| Done state | `#6bd63d` | Completion everywhere (bars, pills, checkmarks) |

⚠️ The muted `#3d7a24` on a **label or number** exists only to subordinate attempts to makes. With no makes row on screen there's nothing to rank against, so a reps-only or minutes assignment renders its label and number in bright `#6bd63d` instead. The muted shade is never the "default" text color — it's the *paired* one. (`ATTEMPTS_NUMBER` vs `SOLO_NUMBER` in `LogScreen.tsx`.)

This applies to text only. **Bar fills are unaffected** — an in-progress bar is `#3d7a24` whether or not makes are tracked (see Bar behavior below).

⚠️ The old emerald `#3dd68c` was replaced app-wide with `#6bd63d` to eliminate the hue shift between lime and teal. The only remaining emerald is the celebrate screen confetti (decorative, intentionally left alone).

### Other colors
- **Background:** `#111318`
- **Surfaces:** `#1c1f26`
- **Borders:** `#2a2d36`
- **Accent (interactive):** `#378add` (sky blue)
- **Labels:** `#c8cdd8` (`--reps-label`)
- **Placeholders:** `#5a5f72`
- **Helper text:** `#8a8fa8`

### Bar behavior
- Log screen bar: **10px** height
- Student list rows: **6px** height
- Coach detail card: **6px** height
- Two-tone: attempts fill (`#3d7a24`) + makes fill (`#6bd63d`) overlaid, both update live as student types
- Single-tone (no makes): single `#3d7a24` fill
- Complete: full `#6bd63d`

---

## Student log screen (rebuilt July 22–23 2026)

Replaced the old preset-button counter with a stepper-based design.

**Layout (top to bottom):**
1. `← [Exercise name]` header (white, no "Log reps" title)
2. `X of Y done` progress text (muted)
3. Two-tone progress bar (10px)
4. Primary label — `#3d7a24` when `track_makes` is true, `#6bd63d` when it isn't
5. Large stepper — `−` button / big number / `+` button, number matches the label's color
6. Divider line
7. `MAKES` label (inline left) + mini stepper (inline right), all in `#6bd63d` — only when `track_makes` is true
8. `Log it` button pinned to bottom

**Copy by context:**
- Minutes: `MINUTES` label (wins over everything — you don't take shots for ten minutes' worth of dribbling)
- Shooting / Finishing / Spot shots + track_makes: `ATTEMPTS` label
- Every other rep case, including a shooting drill with makes off: `REPS` label
- Makes row: `MAKES` label

All four render uppercase. There is no question-form copy on this screen.

**Stepper behavior:**
- Numbers seed from already-logged totals on return (not 0)
- Delta save — only the new increment is written to `logs`
- `−` button floored at the banked total (can't un-log)
- For makes assignments: no upper clamp (student can log more attempts than the target)
- For non-makes assignments: clamped at target
- Native browser number spinner hidden via CSS

---

## Exercise library (Basketball) — 31 exercises, 6 categories

Source of truth: `src/lib/exercises.ts`

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

---

## Twilio status

- ✅ Toll-free (833) 892-5640 — registered and approved
- ✅ SMS confirmed working end-to-end (July 22 2026 — delivered, lands in spam for some carriers until registration fully propagates)
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

## RJ feedback captured (July 22 2026)

RJ is the first real user and primary product validator. Key insights from today:

- **Makes-first coaching philosophy:** RJ assigns by makes ("make 50 free throws"), not attempts. The app now supports both via the track_makes toggle.
- **"Harder to cheat the system"** — makes-first is more accountable. A student can't just tap +50 and call it done if the coach wants makes.
- **Efficiency emphasis increases with player age/level** — younger kids need volume, advanced players track percentage.
- **STAR Drill** — should track attempts + shooting percentage; now in Spot shots. Track_makes handles the percentage.
- **Heel/Toe Hinge** — RJ's personal terminology, not universal. Not added as a preset; coach can create custom.
- **3min/5min Shooting** — student uses shot count estimates for percentage; minutes unit + makes covers it.
- **RJ's reaction to the redesigned log screen:** "It's perfect... almost has that same appeal as PrizePicks... The way the bar loads up and shows completion."

---

## Product decisions locked

- **Instructor is the customer.** All design decisions flow from instructor pain points.
- **Default exercise libraries are the product experience.** Custom creation is the escape hatch.
- **Makes logging is always optional for students** — never blocks logging. Student can skip makes and just log attempts.
- **Track_makes defaults:** true for all rep-based exercises, false for minutes-based (toggleable by coach).
- **Percentage formula:** makes / attempts, only over logs that recorded makes. Null logs excluded from denominator.
- **Bar language:** muted lime = attempts/in-progress, bright lime = makes/complete, gray = empty.
- **No yellow** — removed platform-wide July 23 2026. One green family replaces the yellow/green two-tone.
- **Assignments are not time-bounded** — they persist until manually cleared.
- **Log history is never deleted** — `ON DELETE SET NULL` preserves logs forever.

### What was killed and why
- Leaderboard — privacy (minors), breaks 1:1 dynamic
- Coach qualitative comments — won't stick
- Milestone push notifications — rep counts ≠ improvement
- Slider input — too much friction
- Single "Done" button — assignments span multiple sessions
- Parent signup — read-only magic link only
- Yellow progress color — inconsistent with green family, replaced July 23 2026
- Progressive disclosure on makes input — caused students to miss the makes field
- Full-width stepper — buttons felt too far apart; now centered/compact

---

## Pending / loose ends

### High priority
- **Update `TWILIO_FROM_NUMBER`** to `+18338925640` in `.env.local` AND Vercel env vars
- **Retroactive makes gap** — student who completes an assignment without logging makes cannot add them later. `logs_amount_check` blocks `amount: 0`. Needs RLS UPDATE policy + data model decision (replace vs append). Documented, not yet built.
- **Makes-only log when assignment is complete** — related to above. If student has prior logged attempts and wants to add makes only, there's no path. Bank for next makes-logging pass.
- **Left/right hand option** — some exercises (layups, floaters) should allow specifying which hand/side. Belongs in the logging detail layer, not as separate exercises.
- **"Or type a number" hint** on stepper — students don't know the center number is tappable for direct input.
- **Hold to accelerate** on stepper buttons — hold + button, number climbs faster. Standard mobile UX.
- **Honesty nudge** — when student logs 0 or very low attempts, show a quiet human message. E.g. "Honest reps are the only ones that count." Adds character without being preachy.
- **Progress bars on roster rows** — each student row on `/instructor/students` should show a thin progress bar. Not yet built; roster currently conveys progress only through group pills.

### Medium priority
- **Gate stranger signups** — currently open; add invite code or waitlist before broader launch
- **Stripe infrastructure** — free tier 3 students, paywall at 4th, ~$5/month, promo code `COACHRJ` = lifetime free
- **Tighten logs RLS policy** — INSERT currently open; tighten to verify student token matches player on assignment
- **Demo mode** — "Try as Coach" seeded database with context overlay
- **Account deletion flow** — required by privacy policy
- **hello@assignreps.com Gmail Send as setup**
- **Final legal review of /privacy + /terms**
- **Re-engagement nudge** — Monday email to coaches who haven't assigned anything

### Low priority / future
- **Light mode** — after dark mode is validated with RJ
- **STAR Drill logging** — currently just reps + makes. RJ said: log attempts + shooting %. Makes-logging covers this now.
- **Activate more activity types** — 10 identified (piano, guitar, golf, martial arts, soccer, gymnastics, swimming, tennis, voice). Content problem, not engineering.
- **WhatsApp via Twilio** — international student SMS
- **One-tap coach reaction** — preselected SMS reaction to student's log ("💪 Nice work"), no open text field
- **One-tap nudge to quiet students** — preselected "Don't forget your reps" SMS
- **Performance history** — show prior assignment metrics when reassigning ("Antony shot 30% last time on corner 3s")
- **iOS line above footer** — unconfirmed on real iPhone; may be resolved by existing border

---

## V1 scope

- Coach signup (email OTP) ✅
- Add student (name + phone, optional parent phone) ✅
- Assign exercise (default library or custom) ✅
- Student log screen — stepper with attempts + makes ✅ (rebuilt July 22–23 2026)
- Makes logging — track_makes toggle, coach sees percentage ✅ (July 22 2026, live on prod)
- Celebration screen ✅
- Coach player detail view + two-tone makes bars ✅
- Coach Monday roster view ✅
- Parent weekly digest (read-only magic link) ✅
- Landing page + product loop section ✅
- Staging environment ✅
- Resend email delivery ✅
- SMS on assignment ✅
- Demo mode ❌
- Account deletion ❌
- Stripe billing ❌
- Progress bars on roster rows ❌
- Left/right hand per-exercise option ❌
- Retroactive makes editing ❌

---

## Priority build list (July 23 2026)

1. **Get RJ using it for real** — he has access, SMS works, makes logging is live
2. Honesty nudge on 0 attempts
3. "Or type a number" hint on stepper
4. Hold to accelerate on stepper buttons
5. Left/right hand option on applicable exercises
6. Progress bars on roster rows
7. Retroactive makes gap — solve data model, build RLS UPDATE policy
8. Gate signups — invite code or waitlist
9. Stripe infrastructure
10. Activate additional activity types (piano, guitar, etc.)
11. Light mode

---

## Landing page (current)

- **Headline:** Keep students working between sessions.
- **Bullets:** Assign work in seconds / Students log it from anywhere / The work doesn't stop
- **Primary CTA:** Try Reps free
- **Product loop:** "Here's how it works." — four phone mocks (link, student home, log counter, roster)
- **Footer:** dark `#1a1d24` with `1px solid #2a2d36` top border
- **Background:** `#ede9e3` (warm off-white hero) / dark band for product loop + footer

---

## Session checklist

Before each Claude Code session, confirm:
- Which flow are we building today?
- What's the done-state for this session?
- Any design decisions to make before coding?
- Push to: local only / staging / prod?
- Are local, staging, and prod in sync? (`git log --oneline -5`)
