# Reps — CLAUDE.md

## What this is
**Reps** keeps the work going between training sessions.

A lightweight web app for coaches and instructors to assign practice homework to their students, who log their progress on their phone. Parents get a simple weekly digest. No bloat, no complexity — just the loop that makes homework actually happen.

**Live domain:** assignreps.com
**Staging:** staging.assignreps.com
**Stack:** Next.js · Supabase · Vercel · Tailwind CSS · Twilio · Resend
**Design:** Mobile-first, light/warm background (#ede9e3) on landing; cool dark mode inside the app (#111318 bg, #1c1f26 surfaces, #2a2d36 borders); sky blue (#378add) as sole accent

---

## The core insight
The instructor is the customer — not the student. Students never choose this tool; they receive a link. Marketing targets instructor pain: they assign work verbally between sessions with no way to verify follow-through.

---

## Product north star
More students. More revenue. A reputation that spreads.

Every screen should serve this. Reps isn't a homework tracker — it's part of what makes an instructor look professional and invested, which drives renewals and referrals.

---

## Three users

### Coach / Instructor (e.g. RJ)
- Signs up via email OTP (6-digit code, no password, no magic link)
- Signup flow (per-step URLs, native browser back): name (`/instructor/signup`) → instructor type (`/instructor/signup/type`) → email + 6-digit code (`/instructor/signup/email`) → students list (`/instructor/students`)
- Adds students by name + phone number
- Optional: adds parent phone per student (collapsed by default — tap to expand)
- Assigns exercises from a default library or creates custom ones
- Views each student's weekly progress
- Roster grouped by activity level

### Student (e.g. Neo)
- Gets a text with a unique link — no signup required
- Can also log in from any device at assignreps.com via phone OTP (in case SMS is deleted)
- Taps link → sees their assignments (not time-bounded — persist until cleared/deleted)
- Logs reps using a counter (+1 / +10 / +25 / +50)
- Sees a quiet celebration when done: 🔥 + "[Instructor name] will see this."
- Counter caps at assigned target — no inflating

### Parent
- Optional per student — instructor decides at add-student time
- For young students without phones, instructor adds parent's number as the primary contact
- Gets a Sunday night text digest (no signup, no account)
- Taps link → sees simple view: practice days, assignments completed, last activity
- No drill names, no rep counts, no jargon — just effort signal
- Read-only. No interaction.

---

## Core data loop
Instructor assigns → Student logs → Instructor sees → Parent digest (weekly)

---

## Tech stack

- **Auth:** Supabase email OTP (6-digit code) for coach/instructor. Students use unique SMS link tokens; can also authenticate via phone OTP from any device.
- **Database:** Supabase (Postgres) · Project ID: `obkwxyzpugpleahrgcby` (US West)
- **Hosting:** Vercel (auto-deploys on push to main or staging branch)
- **Repo:** github.com/antonyliu/assignreps
- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **SMS:** Twilio — used only for the assignment SMS to students and the parent digest SMS. NOT used for coach auth.
- **Email:** Resend as Supabase Auth custom SMTP. Sends from hello@assignreps.com. Configured in Supabase dashboard — not in app code. Free tier: 3,000 emails/month, 100/day.
- **Payments:** Stripe (build infrastructure early, not actively charging yet)
- **Domain:** assignreps.com via Porkbun

---

## Environments

| Environment | URL | Branch | Purpose |
|-------------|-----|--------|---------|
| Production | assignreps.com | main | Live — RJ uses this |
| Staging | staging.assignreps.com | staging | iPhone testing before prod push |
| Local | localhost:3000 | — | Desktop dev only |

**There are 4 places code lives:**
1. **Local** — your computer, runs at localhost:3000.
2. **GitHub (origin/main)** — cloud backup, source of truth. Vercel watches this.
3. **Staging** — auto-deploys to staging.assignreps.com when the staging branch is pushed.
4. **Production** — auto-deploys to assignreps.com when main is pushed to origin/main.

**Workflow:**
1. Build + test on desktop at localhost:3000
2. Push to staging branch → test on iPhone at staging.assignreps.com
3. Merge staging → main → prod deploys automatically

> ⚠️ Always build and test locally first. Never commit directly to staging or push to staging before local is updated. Staging should always be a mirror of local, pushed for iPhone testing only. Main should always be ahead of or equal to staging.

> **End of every session:** Always commit to main and push to staging. Local, GitHub, and staging should always be in sync. The only exception is half-built broken work — hold that locally until it's stable. Never let local and staging drift apart.

**Important:** Local, staging, and prod all share the same hosted Supabase project. Changes to Supabase dashboard (email templates, SMTP, auth settings) affect all environments immediately.

**Claude Code prompts:** say "push to staging only" or "push to prod" explicitly. Default is local only.

---

## Twilio status & config

- **Compliance profile:** New business profile approved July 15 2026. Bundle SID: `BUe3d4ce29abb03b218cdb16560fdce0e6`. Legal name: ANTONY LIU. EIN: 42-3784882. Email: hello@assignreps.com.
- **Toll-free registration:** ✅ **Approved** (July 2026). Toll-free number (833) 892-5640 is registered and cleared to send. The earlier ISV-vs-toll-free block (Twilio support ticket #28211833, Julieta) is resolved — no longer waiting on support.
- **Toll-free number:** (833) 892-5640
- **Old local number:** +15625487985 — released.
- **Messaging Service SID:** `MGe3a0a18bf618d102aae9cb26943cd239`
- **⏳ Still pending — repoint the app to the toll-free number:** update `TWILIO_FROM_NUMBER` to `+18338925640` in `.env.local` AND Vercel env vars. Approved but not yet switched over.
- **Important:** Use `MessagingServiceSid` parameter when sending SMS, not `From`
- **Assignment SMS body** includes the coach's activity type when available: `Hey <name> — <Coach> assigned you <type> homework. Tap here: <link>` (e.g. "basketball homework"); falls back to `…assigned you homework` if `instructor_type` is null/empty or the fetch fails. Built in `src/lib/notify-assignment.ts` (July 20 2026); the same copy previously lived in `add-student/actions.ts` as an invite SMS and was removed — see "SMS on assignment" below.
- **Test setup:** Tony's personal number set as test phone in Supabase with code `123456` to bypass real SMS during local dev
- **For RJ demo:** manually share student link via text — SMS invite not needed for the demo

---

## Resend (auth email) status & config

- **Status:** ✅ Configured and live — emails sending from hello@assignreps.com
- **Purpose:** Supabase Auth custom SMTP replacing default noreply@mail.app.supabase.io
- **Provider:** Resend · Host `smtp.resend.com` · Port `465` (SSL) · Username `resend` · Password = Resend API key (stored in password manager)
- **API key name:** `supabase-auth` (Sending access only)
- **DNS:** SPF, DKIM, MX records added at Porkbun for assignreps.com — verified in Resend
- **Rate limit:** Supabase free tier email rate limit bypassed by Resend. Set to 100 emails/hour in Supabase Rate Limits.
- **⚠️ Shared-project caveat:** local/staging/prod all share one Supabase project. SMTP config and email templates affect all environments.

---

## Coach auth — email OTP (6-digit code)

- Coach signup uses `signInWithOtp({ email })` (no `emailRedirectTo`) + `verifyOtp({ type: "email" })`
- **`signInWithOtp` routes by user existence:** new email → "Confirm signup" template; existing user → "Magic Link or OTP" template
- **Both templates must contain `{{ .Token }}`** — this is what renders the 6-digit code. Without it, emails send a link instead of a code.
- **Neither template should contain `{{ .ConfirmationURL }}`** — a link click runs a different auth path than OTP code entry
- **Email OTP length:** 6 digits (set in Supabase → Authentication → Sign In / Providers → Email)
- **Email OTP expiry:** 3600 seconds (1 hour) — set in Supabase → Authentication → Sign In / Providers → Email
- `/auth/callback` and `/auth/complete` were **removed July 14 2026** — dead routes from the old magic-link flow. Their Supabase redirect-URL entries were removed from the dashboard at the same time.

### Current email template (both Confirm signup and Magic Link or OTP)
**Subject:** Your Reps code

**Body:**
```html
<h2>Reps</h2>
<p>Your sign-in code:</p>
<h1>{{ .Token }}</h1>
<p>This code expires in 1 hour. If you didn't request this, ignore this email.</p>
```

---

## Gmail "Send as" setup (hello@assignreps.com)

- hello@assignreps.com forwards to Tony's personal Gmail via Porkbun
- Gmail → Settings → Accounts → "Send mail as" → add hello@assignreps.com
- Gmail sends a confirmation code to hello@, which forwards to Gmail — verify and done
- Allows replying to support emails from hello@assignreps.com without exposing personal address
- Auth emails from Reps are no-reply transactional — no reply expected from those

---

## DNS & infrastructure

- **A record:** 216.198.79.1
- **CNAME www:** 7e1e78157ce60fae.vercel-dns-017.com
- **CNAME staging:** 7e1e78157ce60fae.vercel-dns-017.com
- **Resend DNS records:** SPF TXT (send), MX (send), DKIM TXT (resend._domainkey) — all added at Porkbun

**Supabase URL Configuration:**
- Site URL: https://assignreps.com
- Redirect URLs: none required — the OTP flow uses no `emailRedirectTo`. The old `/auth/callback` entries (prod + staging) were removed July 14 2026 when the dead magic-link routes were deleted.

---

## Database schema

```
coaches
  id, name, email, phone (nullable), instructor_type, created_at

players
  id, coach_id, name, phone, parent_phone, send_to_parent, token (unique link key), last_texted_at, created_at

assignments
  id, coach_id, player_id, exercise_name, target, unit (reps/minutes/target), video_url, week_start, created_at

logs
  id, player_id, assignment_id, amount, logged_at

custom_exercises
  id, coach_id, name, unit (reps/minutes), default_amount, created_at
```

`custom_exercises` (added July 17 2026) — a coach's saved custom exercises, powering the "My exercises" category. RLS: coach reads/writes only their own rows (`coach_id = auth.uid()`, `to authenticated`). Saved (deduped by name) when a custom exercise is sent; assignments copy name/target as their own rows, so deleting a saved custom exercise does not touch existing assignments.

Note: `instructor_type` field added now even though basketball is the only option at launch — enables content branching later without schema rework. `phone` on coaches is nullable since email OTP does not require it.

`send_to_parent` — boolean, default false. Determines whether the homework SMS goes to the student's phone or the parent's phone. ⚠️ The assignment SMS does **not** consult this yet — it always sends to `players.phone`. That's correct today because the recipient toggle governs whose number was typed into `phone` in the first place, but it means `parent_phone` is currently unused by the notify path.

`last_texted_at` — timestamptz, nullable (added July 20 2026). Timestamp of the last assignment SMS sent to this student; powers the once-per-day gate in `notify-assignment.ts`. Written only after Twilio confirms the send, so an outage doesn't burn the student's one text for the day.

**Assignments are not time-bounded — they persist until the instructor clears or deletes them.** The `week_start` column is still stored (set at assign time) but is no longer used as a query filter on the instructor student-detail view, the student page, **or the roster view** (the roster `week_start` filter was removed July 17 2026 — it had bucketed every student into "Nothing assigned" whenever the stored `week_start` differed from the roster's computed Monday). "Clear completed" deletes the player's assignment rows (logs preserved via `ON DELETE SET NULL`). The parent digest still scopes to the current week.

**Student page loads unauthenticated (anon role) — RLS policies must allow anon SELECT on `assignments` and `logs` by player token.** The student taps a magic link with no auth session, so those reads run as the `anon` role, not as the coach.

**Coach name on the student header — resolved via RPC, not RLS (July 16 2026).** The `coaches` table is deliberately NOT anon-readable (it holds email/phone). The student header's "[Coach]'s assignments" line comes from a `SECURITY DEFINER` function, `public.coach_name_for_token(text)`, keyed on the student's link token and granted `EXECUTE` to `anon`. It returns only the coach's name for a valid token (null otherwise → "Coach" fallback). Lives in the shared Supabase project, so it is live across local/staging/prod:

```sql
create or replace function public.coach_name_for_token(p_token text)
returns text language sql security definer set search_path = public as $$
  select c.name from players p join coaches c on c.id = p.coach_id
  where p.token::text = p_token
$$;
grant execute on function public.coach_name_for_token(text) to anon;
```

### Foreign key cascade rules

Cascade down the chain **coaches → players → logs**, with one deliberate exception so student progress is never destroyed by clearing assignments:
- `players.coach_id → coaches.id` — **ON DELETE CASCADE**
- `assignments.player_id → players.id` — **ON DELETE CASCADE**
- `logs.player_id → players.id` — **ON DELETE CASCADE**
- `logs.assignment_id → assignments.id` — **ON DELETE SET NULL** (exception, applied July 17 2026)

Deleting a coach removes their players, those players' assignments, and all related logs (logs go via `player_id`). But deleting an **assignment** only detaches its logs — `logs.assignment_id` is set null and the `amount`/`logged_at` rows survive. This is what makes the student-detail "Clear completed" action safe: the current list is cleared, logged progress is preserved forever.

---

## Activity type content system

`src/config/activityTypes.ts` is the single source of truth for the discipline picker AND for UI copy that branches by discipline. Each entry has: `label`, `emoji`, `available`, `studentLabel`, `studentsLabel`, `groupLabel`, `verb`.

```
basketball: { label: "Basketball", emoji: "🏀", available: true, studentLabel: "player", studentsLabel: "players", groupLabel: "roster", verb: "assign reps" }
piano/martial_arts/tennis/golf/guitar/gymnastics/soccer/swimming/voice: { ..., available: false }
```

10 activity types (display order via `ACTIVITY_TYPE_ORDER`), all `available: false` except basketball:
**Basketball (active) · Piano · Martial Arts · Tennis · Golf · Guitar · Gymnastics · Soccer · Swimming · Voice/Vocal**

- The signup screen maps over `ACTIVITY_TYPE_ORDER` — no duplicated list.
- `labels.verb` (e.g. "assign reps" / "assign practice" / "assign drills") is wired into the assign CTA, so a piano coach sees "Assign practice", not "Assign reps".
- All UI labels pull from this config based on the instructor's `instructor_type`. Adding/enabling an activity type is a content change — no engineering rework needed.

---

## Pricing & monetization

- **Free tier:** 3 students free, forever
- **Trial:** 30 days free, no card required; card collected at end of trial
- **Paywall trigger:** Adding a 4th student
- **Price:** ~$5/month
- **Early adopter promo codes** via Stripe with max redemption limits (e.g. COACHRJ = 1 use = lifetime free for RJ)
- Build Stripe infrastructure early even if not actively charging

---

## Activity types & expansion plan

Launch with basketball only. Top candidates to add next:

1. **Piano** — scales, pieces, sight-reading; identical homework problem to basketball
2. **Martial arts** (karate/BJJ/taekwondo) — katas, drills, conditioning
3. **Tennis** — footwork, serve reps, groundstrokes

Further pipeline: golf, guitar, soccer, swimming, gymnastics, voice/vocal.

Beyond top 10: fully custom mode — instructor names everything themselves, no presets.

The default exercise libraries are the product experience — not custom creation. Custom exercise creation exists as an escape hatch only.

---

## Exercise categories + defaults (Basketball)

Source of truth: `src/lib/exercises.ts`. **30 exercises across 6 categories** as of
July 22 2026. Numbers after each name are its `default`; the category's preset row
(`quick`) is listed per category. A trailing `[unit, presets]` marks an exercise
that overrides its category.

**Shooting** (reps) · presets 25 · 50 · 100 · 200
Form shooting 50, Free throws 50, Mid-range jumpers 50, Corner 3s 25, Catch & shoot 50, Elbow jumpers 25, Short corner jumpers 25, Dribble pull-ups 25

**Ball-handling** (minutes) · presets 5 · 10 · 15 · 20
Stationary dribbling 10, Two-ball dribbling 10, Crossovers 5, Figure 8s 5, Dribble series 10

**Finishing** (reps) · presets 10 · 20 · 50 · 100
Layups (right hand) 20, Layups (left hand) 20, Floaters 20, Euro-step 20, Hop-step 20, Spin 20

**Footwork** (reps) · presets 10 · 20 · 30 · 50
Pivots 20, Jump stops 20, Defensive slides 10 `[minutes, 5/10/15/20]`

**Conditioning** (reps) · presets 5 · 10 · 15 · 20
Suicides 10, Sprints (baseline to baseline) 10, Jump rope 10 `[minutes, 5/10/15]`, Planks 2 `[minutes, 1/2/3/5]`, Isometric squats 2 `[minutes, 1/2/3/5]`, Pick-up basketball 30 `[minutes, 20/30/45/60]`

**Spot shots** (reps) · presets 5 · 10 · 15 · 20
Right corner-to-wing 10, Left corner-to-wing 10 — sets of 5 shots, not total reps

Custom exercise: name + track type (reps/minutes) + optional video URL

### Two per-exercise overrides, and the invariant they must respect

`unit` and `quick` are category properties; an `Exercise` may override either.
Both resolve the same way — `ex.unit ?? cat.unit`, `ex.quick ?? cat.quick`.

- **`unit`** — for timed drills sitting in a reps category (defensive slides, jump
  rope, planks, isometric squats, pick-up basketball). **Ten exercises are
  minutes-based**: those five, plus all five Ball-handling drills, which inherit it.
- **`quick`** — for exercises whose scale differs from their category's. Conditioning
  runs suicides in tens but holds in single minutes, so five of its six entries
  carry their own preset row.

> ⚠️ **INVARIANT: every exercise's `default` must appear in whichever `quick` array
> wins.** If it doesn't, that count screen opens with *no preset highlighted and the
> number input hidden* — the coach sees no sign of the target "Send" will assign.
> This shipped once (layups defaulted to 25 while Finishing's presets were
> `[20,50,100]`) and is the reason Finishing carried a 25 until the presets were
> reworked. Re-check after any edit to this file.

**Both consumers must honour an override**, or it sits in the config doing nothing:
`assign/[category]/[exercise]/page.tsx` (the count screen) and `presetsForExercise`
in `exercises.ts` (the Edit-amount modal on instructor student-detail). The log
screen is unrelated — it computes its own quick-add buttons in `logPresets()` from
unit and target.

---

## Landing page copy (current)

Verified against the shipped page July 21 2026 — the previous version of this
section had drifted on the headline, all three bullets, and both CTAs.

- **Eyebrow:** FOR INSTRUCTORS & COACHES (uppercased in CSS)
- **Headline:** Keep students working between sessions.
- **Bullets:**
  - Assign work in seconds
  - Students log it from anywhere
  - The work doesn't stop
- **Primary CTA:** Try Reps free
- **Secondary CTA:** none — "I'm a student →" was removed July 21 2026. ⚠️ `/student/login` now has **zero inbound links anywhere in the app**; it works, but only by typing the URL. A student who deletes their SMS cannot get back in on their own — the coach must resend the link.
- **Hero:** Two overlapping circles — basketball and piano WebP images. Content-height, not viewport-filling (`<main>` has no `flex: 1`), so the product loop breaks the fold.
- **Background:** #ede9e3 (warm off-white). ⚠️ `/privacy` and `/terms` still use the older `#f8f7f5` — the three light pages do not currently share one background.
- **Footer:** dark `#1a1d24` with a `1px solid #2a2d36` top border, muted `#8a8fa8` text, `#378add` links. Shares its background with the product loop section, so the border is the only thing separating them.

### Product loop section (added July 21 2026, live on prod)

A dark `#1a1d24` band directly under the hero: heading "Here's how it works."
(24px mobile / 32px desktop — deliberately smaller than the 32px hero headline
on mobile), subline "Students get a link. They log it. You see it.", then four
miniature phone frames with captions — "They get a link / They see their work /
They log it / You see it's done".

The frames are simplified rebuilds of the real screens (SMS, student home, log
counter, roster) using the shipped tokens from `globals.css`. Everything inside
a frame is sized in `em` against the frame's own font-size, which is derived
from its width (`font-size: calc(var(--pw) / 13)`) — one set of numbers renders
correctly at both sizes with no second scale. Frames are `9/19`, 263px on
desktop and 240px on mobile.

Desktop is a centred row spanning the hero's 1100px container; mobile is a
horizontal scroll-snap track (`scroll-padding-left: 22px` so snapped frames keep
the 22px gutter) with the next frame peeking in.

**⚠️ 100vw scrollbar caveat.** Desktop frame width is
`calc((min(1100px, 100vw - 80px) - 48px) / 4)`. On platforms where scrollbars
take layout space (Windows, most Linux), `100vw` is ~15px wider than the content
area, so the row can overflow horizontally. Never reproduced in testing — the
dev browser uses overlay scrollbars, where it measures exact. If it shows up,
either subtract more (`100vw - 96px`, costing ~4px of edge alignment) or add
`overflow-x: hidden` to `.loop-section`.

**Frame clearance is tight.** Content is measured to fit, but the log frame
clears its padding edge by only **1px** — its "Log it" button is `margin-top:
auto` and pins to the bottom at any frame height. Anything added to that screen
will clip. Note `scrollHeight` reports **zero** overflow inside these
`overflow: hidden` flex columns — measure child bottoms against the padding
edge instead.

---

## Design decisions locked

- **Accent color:** Sky blue #378add
- **Green:** #3dd68c — completion states only (was #4ade80; updated July 16 2026)
- **Logo:** Tally mark SVG (4 vertical lines + 1 diagonal) — sport-agnostic, scalable
- **Warm dark palette (locked):** #1a1612 app bg, #252018 surfaces, #3a3328 borders, #4a4338 strong borders — NOT cold gray. Sky blue #378add replaced orange throughout the app.
- **Typography:** System font stack; font-weight 600, letter-spacing -0.5px for headlines
- **Mobile-first:** App is mobile-only (max-width ~390px). Landing page is responsive.
- **Roster grouping (current):** completion-based — Done / In progress / Not started / Nothing assigned (colored pills; see "Roster groups" under the Polish session below). The old day-count grouping (4+ / 1–3 / 0 days) was replaced.
- **Coach avatar:** Initials from coach's actual name (e.g. RJ, TL) — not generic "C"
- **iOS forms:** All input+button flows use form onSubmit + type="submit" — required for iOS WebKit
- **Add student — recipient toggle (updated July 16 2026):** the phone field is labelled "Send homework to" with a Player/Parent segmented toggle (the Player option uses `studentLabel`, e.g. "Player"/"Student"). The old "Send parent a weekly recap" expandable card was removed — the add-student form no longer captures a separate optional parent number; the Parent toggle simply routes the homework link to the parent (`send_to_parent`).
- **Phone placeholder:** (555) 000-0000
- **Signup step indicator:** "Step X of 3" text, top-right (small, dim). Pill dots were tried and reverted.
- **Signup back navigation:** no back arrow in the header — each step is its own URL, so native browser/phone back handles it.
- **Signup name placeholder:** `Coach RJ, Mrs. Tai` (italicized).
- **Activity list ("What do you teach?"):** scrollable list with a sticky Continue button pinned at the bottom; a bottom gradient fade (transparent → app bg) softens the scroll edge.
- **Inactive activity rows:** subtle dark surface background, ~60% opacity content, no border highlight; SOON badge (muted gray on gray).
- **"Create your own" row:** last item in the list — dashed border, `+` icon, same height as the preset rows, SOON badge. Escape hatch, not a preset.
- **Removed** "More coming soon." caption + hairline from the activity list (was "More disciplines coming soon.").
- **Logo size standardized** across all in-app header screens (24px mark + 16px wordmark).

### Polish session (locked)
- **Field labels:** `#c8cdd8`, defined as the `--reps-label` CSS token in globals.css.
- **Placeholders:** `#5a5f72`.
- **Helper text:** `#8a8fa8`.
- **Progress bars:** green `#3dd68c` for done, yellow `#f0b429` for in progress (updated July 16 2026; applies to student home, log screen, instructor student-detail cards, and the roster Done/In-progress pills). Note: the `reps-orange` Tailwind token is legacy-named but resolves to sky-blue `#378add`.
- **"Reps" is becoming the brand name, not a product descriptor** — use "homework" in UI copy where possible (e.g. "Assign homework", "homework link").
- **Assignment row (updated July 16–17 2026):** each card has a vertical three-dot (⋮) overflow menu in its own column (no divider line) → "Remove assignment" → centered confirm modal → `deleteAssignment` (ownership-scoped server action; logs preserved via `ON DELETE SET NULL`). The kebab icon is dimmed (`#52576a`). Long names truncate with ellipsis and never push the amount label. Done state shows the full count (e.g. "✓ 20/20 min"), not just "✓ Done". "minutes" is abbreviated to "min" on cards.
- **"All done" state on student detail (restyled July 17 2026):** 🎉 celebration banner appears when all assignments are complete. "Clear completed" is a quiet centered text link directly under the banner (dim `#454a5b`); "+ Assign new work" is the primary blue bottom CTA. (Was a stacked pair of full-width buttons at the bottom.)
- **Clearing assignments:** deletes from the `assignments` table only — the `logs` table is never deleted, preserved forever. Enforced at the DB level: `logs.assignment_id → assignments.id` is `ON DELETE SET NULL`, so clearing assignments detaches logs rather than deleting them (applied July 17 2026).
- **Roster groups (in order):** Done / In progress / Not started / Nothing assigned — colored pills with a dot.
- **Student detail header menu (updated July 16–17 2026):** the `···` trigger is a faint boxed/outlined icon (lucide `MoreHorizontal`); the dropdown (Share homework link / Edit phone number / Remove [first name]) keeps divider lines between items. "Edit phone number" and "Remove [name]" open **centered** modals matching the assignment-remove modal. The Edit-phone modal includes a Player/Parent toggle that sets who receives the homework link — `updatePlayerPhone` now also writes `send_to_parent`.

### What was killed and why
- **Leaderboard:** Privacy (minors) + breaks the 1:1 mentorship dynamic
- **Coach qualitative comments:** Won't stick — RJ's feedback is in-person
- **Milestone push notifications:** Rep counts don't map to real improvement
- **Slider input for logging:** Too much friction; counter is faster
- **Single "Done" button:** Assignments span multiple sessions
- **Parent signup:** Parents get read-only magic link, no account ever
- **"For players who want to be great" tagline:** Wrong audience
- **"I'm a player →" secondary CTA:** Too sport-specific
- **Orange accent:** Replaced with sky blue
- **Cold dark backgrounds:** Replaced with warm dark palette
- **Magic link auth for coaches:** Replaced with email OTP — eliminates PKCE browser-handoff issues

---

## Future ideas (not in V1, worth designing for)

- **Re-engagement nudge:** Monday morning email to coaches who haven't assigned anything that week. One Supabase cron job + Resend email. ~2 hours.
- **One-tap reaction from coach:** After viewing a student's log, coach can send a preselected reaction ("💪 Nice work") that fires as an SMS to the student. No open text field, no thread. Owns the moment right before the most valuable exchange without becoming a messaging app.
- **Account deletion:** Button in settings — deletes all assignments, players, coach row, and Supabase auth user. Required by privacy policy. ~30 min with Claude Code.
- **"Our story" page:** Personal founding story (Tony built this for his friend RJ). Photo of RJ coaching. Plain language. Tina Roth Eisenberg / TeuxDeux energy. Biggest trust signal available.
- **Coach re-engagement:** Weekly nudge if a coach has players with no assignments this week.
- **One-tap coach nudge to quiet students:** same mechanic as the reaction — a preselected message ("Don't forget your reps this week") fires as an SMS, no open text field. High-value future feature.
- **Gate signups** with an invite code or waitlist before broader launch.
- **Stripe billing:** free tier 3 students, 30-day trial, paywall at the 4th student, ~$5/month, promo codes (COACHRJ = 1 use = lifetime free).
- **WhatsApp via Twilio** for international student SMS.
- **Meta ads** targeting instructors once the beta is validated.

---

## Future ideas (tracked, not scheduled)

- **Light mode / dark mode toggle** — data shows females prefer light mode; educational app context also favors light. Build light mode after dark mode polish is complete and validated with RJ. Implement as a simple toggle in user settings, defaulting to system preference. Do not build before RJ demo.
- **New-signup notification email** — fire an email to hello@assignreps.com every time a new coach signs up (not return logins). Include: name, email, instructor type, timestamp. Implement via Supabase webhook → Next.js API route → Resend. Simple, high signal.
- **og:image** — added July 15 2026 using basketball hero photo. Future: consider a designed OG image with logo + tagline for richer link previews.
- **Early launch cohort strategy** — Tony will personally reach out to coaches/instructors he knows in: basketball (RJ), piano, soccer, guitar, possibly ESL. Validates across activity types with real relationships before broader launch.
- **Student image uploads** — raised by a guitar teacher (Tony's wife): students may need to upload a photo of sheet music or a specific section to practice. Future feature — not V1.
- **One-tap coach reaction** — after viewing a student's log, coach sends a preselected reaction (e.g. 'Nice work') as SMS to student. No open text field. High-value future feature.
- **Monday re-engagement email** — nudge to coaches who haven't assigned anything that week.
- **Account deletion flow** — required before wider launch.
- **Demo mode** — 'Try as Coach' with seeded database.
- **Stripe billing** — free tier 3 students, 30-day trial, paywall at 4th student, ~\$5/month, promo codes (e.g. COACHRJ = lifetime free).

---

## Product thinking

- **Closes an existing loop, doesn't create new behavior.** Instructors already assign work verbally between sessions — Reps gives them a way to track the follow-through that already (fails to) happen. Not a new habit to sell; a tool for something that already occurs.
- **Seasonal / cycle use case, not daily maintenance.** Reps is a commitment tracker for defined training blocks — a summer goal, pre-season, pre-recital, a belt test prep — not an everyday habit app.
- **Top 10 activity types by fit:** Basketball, Piano, Martial Arts, Tennis, Golf, Guitar, Gymnastics, Soccer, Swimming, Voice/Vocal.
- **Future: fully custom mode** for any instructor type outside the preset list — instructor names everything themselves.
- **Student SMS nudge from the coach** (one-tap, preselected message) is the highest-value future feature identified so far.

---

## User Research

### RJ — Session 1 · July 20 2026

**Who RJ is**
LB Poly CIF champion, still plays competitively at 32. Trains players from age 6 through early college. Deeply invested in the arc of a player, not just weekly reps. Coaches finesse and details at a high level. Generous, casual, relational — his strength is intuitive and in-person, which is also where structure slips.

**Overall signal**
Open and engaged. Most honest validation: this category just hasn't existed in his world before. Not a painkiller — fills a vacuum he'd normalized. Eyes lit up on the parent visibility piece.

**Count/assign screen**
Currently runs drills about consistency and makes, not just reps — e.g. "5 in a row" from wing to corner. Logging isn't just "I did it" but a scorecard per set (5/10, 7/10, 9/10). The percentage is the point of the drill. Validates "create your own" but hints the count screen may eventually need a makes/attempts mode.

**Progress data over time**
Sees value in longitudinal tracking. Mentioned imposter syndrome — students doubt themselves and data becomes evidence against the lie. Ultimate measure is always game performance, but the arc of practice data matters. Future feature, not V1.

**Student motivation**
Some kids are there because parents made them — he holds that as reality, not a problem to fix. Talked about students needing to "commit" — almost a handshake moment. Reps could formalize that: getting the link means you've earned it. That said, he's also giving it to his entire HS team, so it's not strictly gatekept.

**Student agency (speculative, late in conversation)**
Floated the idea of students setting their own goals — working toward something they named, not just executing the coach's plan. Interesting future direction, not a core revision signal.

**Gaming/cheating**
Students could spam the counter, but the makes/percentage format is a natural deterrent — harder to convincingly fake a scorecard. Ultimately coaches just know: seeing them in session or a game is his "cheat code." Reps doesn't need to be cheat-proof. He is.

**Parents**
Surfaced parent value unprompted. Framed parents as allies who hold students accountable, not just observers. Liked the parent phone toggle immediately. Current reality: parent debrief happens at pickup in 2 fragile minutes. Reps is a better version of that for parents who want it.

**Curriculum blocks**
Runs themes across students — "right now I'm having my kids do X." Assignments aren't always one-off; sometimes it's a group focus for a period of time.

**Between-session communication today**
Informal — text here and there depending on student commitment level. No structured follow-up system. Reps fills a vacuum, doesn't disrupt anything.

---

## Stranger signup incident (July 14 2026)

- An unknown user attempted a signup with `jewellanne032499@gmail.com`. The email bounced; a user record was created in Supabase auth with "waiting for verification" status and **deleted manually**.
- Root cause: the site is publicly indexed and signup is open to anyone.
- **Action:** gate signups (invite code / waitlist) before broader launch — tracked in Pending.

---

## Privacy policy & terms of service

Plain-language pages live at /privacy and /terms (both "Last updated: July 17, 2026"). Key points:

**Privacy:** Collect name, email, phone. Used only to operate the product. Shared with Supabase, Twilio, Resend. No selling. Coaches responsible for consent for minors. Delete via hello@assignreps.com. **"How we use it"** discloses SMS via Twilio + reply STOP to opt out + "message and data rates may apply." A dedicated **"SMS consent"** section (between "How we use it" and "Who we share it with") states a coach must obtain verbal consent before adding any number, and that every SMS includes STOP-to-opt-out instructions. (Added July 16–17 2026.)

**Terms:** Coach responsible for consent before adding player/parent contacts. Reps provided as-is. Accounts can be terminated. Payments monthly, cancel anytime. **"Your responsibilities"** was rewritten (July 17 2026) into clear lines requiring explicit verbal consent before entering a number — including the exact confirmation script the coach reads to the recipient — plus the STOP opt-out.

**COPPA note:** Students log reps via link — we don't collect data directly from children. Coaches are responsible for parental consent for players under 13.

These SMS-consent additions are A2P / toll-free compliance signals. Substantive copy is in place; a final legal review is still advisable before wider launch.

---

## Routes

| Screen | URL |
|--------|-----|
| Landing | / |
| Instructor entry (redirects) | /instructor |
| Signup — name (step 1) | /instructor/signup |
| Signup — activity type (step 2) | /instructor/signup/type |
| Signup — email + code (step 3) | /instructor/signup/email |
| Instructor students list | /instructor/students |
| Add student | /instructor/add-student |
| Student detail | /instructor/student/[id] |
| Assign — category | /instructor/student/[id]/assign |
| Assign — exercise | /instructor/student/[id]/assign/[category] |
| Assign — count | /instructor/student/[id]/assign/[category]/[exercise] |
| Custom exercise | /instructor/student/[id]/assign/custom |
| Student login (phone OTP) | /student/login |
| Student welcome | /student/[token]/welcome |
| Student home | /student/[token] |
| Log reps | /student/[token]/log/[assignmentId] |
| Celebrate | /student/[token]/celebrate |
| Parent digest | /parent/[token] |
| Privacy policy | /privacy |
| Terms of service | /terms |

**Route rename (July 14 2026):** all `/coach/*` → `/instructor/*`, all `/player/*` → `/student/*`, `/instructor/roster` → `/instructor/students`. Dead `/auth/callback` and `/auth/complete` removed. DB table/column names (`coaches`, `players`, `coach_id`, `player_id`) were intentionally NOT renamed — internal only. ⚠️ Old `/player/[token]` SMS links and `/coach` bookmarks now 404 (no redirect stubs added).

---

## Features built (as of July 14 2026)

- Coach signup — email OTP (name → instructor type → email → 6-digit code → roster)
- Instructor type selection (basketball active, piano/martial arts/tennis coming soon)
- Activity type content config (src/config/activityTypes.ts)
- Roster screen with activity grouping
- Add player flow
- Assign reps flow: categories → exercise → count/confirm
- Player welcome screen with phone OTP auth
- Player home screen
- Rep logging screen with counter (+1/+10/+25/+50)
- Celebrate screen
- Parent digest page
- Coach utilities: delete player, edit phone, resend link, copy link
- SMS to the student on assignment — once per day per student (added July 20 2026)
- Monday roster view grouped by activity level
- Landing page (assignreps.com)
- Sky blue color system
- Warm dark palette across all app screens
- Staging environment (staging.assignreps.com)
- iOS form fix (onSubmit pattern for WebKit compatibility)
- Resend SMTP configured — emails from hello@assignreps.com
- Auth cookie fix on /auth/callback redirect
- Email OTP switch (was magic link)

### Added July 14 2026
- Warm dark theme across all app screens (#1a1612 bg, #252018 surfaces)
- Sky blue (#378add) color system replacing orange throughout the app
- Per-step signup URLs (`/instructor/signup`, `/signup/type`, `/signup/email`) with native browser back support
- Activity type list expanded to 10 — Basketball active; Piano, Martial Arts, Tennis, Golf, Guitar, Gymnastics, Soccer, Swimming, Voice/Vocal all SOON
- "Create your own" escape-hatch row (SOON) at the bottom of the activity list
- `labels.verb` wired into the assign UI — activity-specific CTA language
- Gradient fade on the scrollable activity list
- Celebrate screen no longer leaks the coach name in the URL query string (moved to sessionStorage)
- Student-facing error messages use "instructor" not "coach"
- aria-labels updated "Player options" → "Student options"
- Console logs sanitized — no longer expose phone numbers, SMS bodies, or Supabase table names
- SMS links now use `/student/${token}` not `/player/${token}`
- Route rename: `/coach/*` → `/instructor/*`, `/player/*` → `/student/*`, `/instructor/roster` → `/instructor/students`
- Dead `/auth` routes removed; stale Supabase `/auth/callback` redirect URLs removed
- `.env.local.example` comment updated magic-link → OTP

### Added July 15 2026
- Landing page headline updated: 'The work continues between sessions.'
- Landing page bullets updated: Assign work in seconds / Students log their progress / Everything in one place (Layers icon)
- SEO metadata added to landing page: title, description, og:title, og:description, og:image (basketball hero photo)
- App background color updated to cooler palette: #111318 bg, #1c1f26 surfaces, #2a2d36 borders
- Step 3 signup helper text updated: 'We'll email you a sign-in code.'
- Step 2 activity list bottom padding fix — Create your own row now fully clears gradient
- Dead file deleted: src/lib/supabase.ts
- CLAUDE.md logs RLS pending note added
- Empty state: 3 ghost/skeleton rows with graduated opacity (0.25/0.18/0.12) + bottom fade + '+ Add your first player' CTA
- Profile menu: person icon + coach name (display only) on right; person icon is tap target for dropdown
- Sign out confirmation dialog with backdrop rgba(0,0,0,0.6)
- Portrait lock with landscape message (CSS only, no overlay)
- App header logo: dark muted box (#252830) with dimmed tally mark (#6a6a72) + 'Reps' wordmark
- Primary buttons globally: white text on #378add
- Sign out confirmation: improved padding, dimmed body text, updated copy 'Sign back in anytime with your email.'
- Safari iPhone CSS load order fixed — styles now apply correctly on first paint

### Added July 16–17 2026
- **Color update:** completion green `#4ade80` → `#3dd68c`; in-progress yellow `#fbbf24` → `#f0b429`. Applied to the `reps-green` token + all literals — student home, log screen, instructor student-detail cards, roster Done/In-progress pills, celebration banner, all-done buttons. Blue `#378add` and the log counter number untouched.
- **Student home (`/student/[token]`) redesign:** heading is the student's first name; subline "[Coach]'s assignments" (coach name via the `coach_name_for_token` RPC); "ASSIGNMENTS" section label; tappable assignment cards (`bg-[#161a20]`, border, hover) linking to the log screen; in-progress bar yellow / done bar green; page title "Your homework — Reps".
- **coach_name_for_token RPC** added to the shared Supabase project — `SECURITY DEFINER` function returning the coach's name for a valid student token (granted `EXECUTE` to `anon`); replaces the blocked anon read of `coaches` on the student header (see Database schema).
- **Add-student form:** phone label → "Send homework to"; recipient toggle relabelled to `studentLabel`/"Parent" (possessive dropped); removed the "Send parent a weekly recap" card and all its state (the form no longer captures a separate parent number).
- **Roster grouping fix:** removed the `week_start` filter (and the logs date filter) on the roster so it mirrors the student-detail view — every persistent assignment counts. Fixes all students showing "Nothing assigned."
- **Assignment cards (instructor detail):** per-card vertical ⋮ menu → "Remove assignment" → centered confirm → new `deleteAssignment` server action (ownership-scoped; logs preserved). Done cards show the full count ("✓ 20/20 min"); long names truncate; "minutes" → "min".
- **Student-detail polish:** faint boxed header `···` trigger (lucide `MoreHorizontal`); "Edit phone number" + "Remove [name]" redesigned as centered modals; Edit-phone modal gained a Player/Parent toggle that writes `send_to_parent` via `updatePlayerPhone`; "Clear completed" moved under the celebration banner as a quiet text link, "+ Assign new work" is the primary bottom CTA.
- **Invite SMS** now names the coach's activity type ("…assigned you basketball homework") with a generic fallback.
- **Legal / SMS consent:** new "SMS consent" section + STOP/rates line on /privacy; "Your responsibilities" rewrite with the verbal-consent script on /terms. Both dated July 17 2026.

### Added July 17–18 2026
- **Welcome screen deleted** — `/student/[token]/welcome` (the phone-OTP gate) removed; the SMS link goes straight to `/student/[token]`. `PlayerOtpFlow` still used by `/student/login`.
- **Student empty state:** "You're all caught up. 🙌" + "Coach [name] will assign new work when it's time." (coach name via RPC).
- **Assign flow polish:** category rows show example hints; exercise-row height normalized to match category rows; "Default: X reps" subline removed (name only); count screen hides the number input behind a "+ enter your own" link (presets only by default); confirmation moment after send — green check + "Sent to [name] 🏀", holds ~1.3s, then navigates back.
- **Custom exercises:** new `custom_exercises` table (see Database schema). "My exercises" category shown above the presets (faint blue tint `rgba(55,138,221,0.06)`) when the coach has any saved; its count screen skips presets and shows the saved amount directly in the input; each row has a "Delete exercise" dots menu (centered confirm; existing assignments unaffected). Created customs are saved/deduped by name on send.
- **"Target" track type removed** from Create-your-own — Reps and Minutes only.
- **Edit amount:** dots menu on instructor assignment cards, shown only when the assignment has zero logged progress; opens a centered modal (count-screen presets, current target pre-selected; input auto-revealed if not a preset); silent save via `updateAssignmentTarget` (no SMS, no resend).
- **Log screen:** big counter is yellow (`#f0b429`) in progress / green (`#3dd68c`) when done; "Save" → "Log it"; quick-add presets normalized per exercise (minutes 1/5/10/15; small-rep 1/5/10; medium 10/25/50; large 25/50/100); "Log it" button fixed to the bottom of the viewport (sticky + safe-area) so it stays visible under iOS chrome.
- **Celebrate screen:** partial-log heading is unit-agnostic "Logged."; subline widened so it no longer orphans "this."; singular/plural on the remaining count ("1 minute" / "8 minutes"); real coach name via the `coach_name_for_token` RPC; "Back to my week" → "Back to my assignments"; larger "Done."; confetti on full completion (fire stays for individual completions).
- **Student all-done banner:** green banner on the student home when every assignment is complete — "You finished everything. 🎉" + "Coach [name] can see your progress." Sits below the name header, above the assignment list. No "Clear completed" (instructor only).
- **Instructor all-done banner:** "Ready for next week?" removed — just 🎉 + "[Name] finished everything." (no longer week-based); single-line, no subline.
- **All-done banner subline:** `rgba(255,255,255,0.55)` soft white, subordinate to the headline (applies to the student banner; the instructor banner is single-line).

### Added July 20 2026
- **SMS on assignment — built and live.** Assigning work now texts the student their homework link. `notifyAssignmentOnce` (`src/lib/notify-assignment.ts`) is awaited by both `saveAssignment` and `saveCustomAssignment`, and sends via the shared `sendSms` helper (`src/lib/sms.ts`, wraps the Twilio REST call and the `MessagingServiceSid` param).
- **Once per day, per student, America/Los_Angeles.** The gate compares LA *calendar dates* (via `Intl`, `en-CA` → `YYYY-MM-DD`), not elapsed hours — so a 5pm and an 8pm assignment count as the same day, where plain UTC would roll over mid-evening in California and send twice. Assign five exercises in one sitting → one text. State lives in `players.last_texted_at`, written only after Twilio confirms success so an outage retries on the next assignment instead of silently burning the day's text.
- **Best-effort and silent by design.** Every failure in the notify path (player lookup, Twilio, the bookkeeping write) is swallowed — a notification problem must never fail an assignment that already saved successfully. Corollary: a coach gets no UI signal when a text doesn't go out. Check Twilio logs, not the app, when debugging a missing SMS.
- **Add-player SMS intentionally removed.** `addPlayer` no longer texts anyone; its `coaches` select narrowed to `id`, since it now serves only as the profile-completion gate. Adding a student is silent — **the student receives nothing until the coach assigns their first exercise.** This was the point: the old invite SMS said "assigned you homework" at a moment when nothing had been assigned. The message copy dropped the word "new" for the same reason — it's now a student's first touch as often as a repeat.
- **Still the only student-facing SMS paths:** this assignment text, "resend link" (manual, coach-triggered), and the weekly parent digest.

### Added July 21 2026
- **Exercise library expanded** — Elbow jumpers + Short corner jumpers (Shooting); Euro-step, Hop-step, Spin (Finishing); Planks + Isometric squats (Conditioning); new **Spot shots** category (right/left corner-to-wing). 27 exercises across 6 categories.
- **Fixed: count screens that opened with nothing selected.** Layups right/left default to 25 while Finishing's presets were `[20, 50, 100]`, so both screens opened with no preset highlighted and the number input hidden — the coach saw no sign of the 25 that "Send" would assign. Finishing is now `[20, 25, 50, 100]`. **Invariant to preserve: every exercise's `default` must appear in its category's `quick` array**, or that screen opens with an invisible target.
- **Per-exercise unit override** — `Exercise` gained an optional `unit` that overrides its category's, resolved at the count screen as `ex.unit ?? cat.unit`. Used for the held drills in the reps-based Conditioning category: jump rope, planks, isometric squats are all **minutes**. Seven exercises are minutes-based in total (the four Ball-handling drills inherit it).
- **"minutes" label on the count screen** — a 12px `#8a8fa8` line under the preset buttons, shown only when `unit === "minutes"`. The presets are bare numbers, so a coach picking "5" for a timed drill previously had nothing telling them it meant minutes. Rep-based screens are unchanged.
- **Add-student copy fixed** — both helper strings said the student would get a text, which stopped being true when the invite SMS was removed July 20. They now name the real trigger: "They'll get a text when you assign work."
- **Landing page: product loop section** (see "Landing page copy" above) — four phone mocks, dark footer, reworked bullets, hero no longer viewport-filling, "I'm a student" removed. Live on prod.
- **Verified on staging:** Conditioning → Jump rope (minutes + label), Finishing → Layups right (opens with 25 selected), Shooting → Free throws (unchanged control). Confirmed in a browser against the deployed build.

### Added July 22 2026 — exercise library reworked (live on prod, `0102d83`)
- **Per-exercise `quick` override** added alongside the existing `unit` one, because a category can mix scales — Conditioning runs suicides in tens and planks in single minutes. Resolved as `ex.quick ?? cat.quick`. Both consumers updated: the count screen and `presetsForExercise` (the Edit-amount modal, easy to miss).
- **Presets grounded per category:** Finishing `[20,25,50,100]` → `[10,20,50,100]`, Footwork `[10,20,50]` → `[10,20,30,50]`. Holds run `[1,2,3,5]`, jump rope `[5,10,15]`, pick-up basketball `[20,30,45,60]`.
- **Both layups moved 25 → 20.** Not cosmetic — dropping 25 from Finishing's presets would otherwise have left them with no preset selected, re-creating the exact bug fixed on July 21.
- **Defensive slides is now minutes** (`[5,10,15,20]`, default 10) — it was rep-counted in a reps category despite being a timed drill.
- **Jump rope default 5 → 10; planks and isometric squats 5 → 2** (single-minute holds). **Spot shots defaults 5 → 10** — read as sets of 5 shots, not total reps.
- **New:** Dribble series (Ball-handling, minutes 10), Dribble pull-ups (Shooting, 25), Pick-up basketball (Conditioning, minutes 30).
- **Removed from Shooting:** Off the dribble, Midrange totals, 3pt totals — redundant; the planned makes-logging feature covers that use case. The first two never shipped; 3pt totals reached staging for minutes only.
- **Ball-handling left alone.** Note its defaults are *not* uniform: Crossovers and Figure 8s are 5 while the rest are 10. Both are valid presets, so nothing breaks.
- **⚠️ Not verified in a browser.** Checked by `tsc` plus a scripted assertion over all 30 exercises (every `default` lands on a visible preset, no duplicate names or slugs) — but no screen was opened, unlike the July 21 batch. Worth confirming Conditioning → Planks (`1·2·3·5`, 2 selected, minutes label), Footwork → Defensive slides (now minutes), Finishing → Layups right (`10·20·50·100`, 20 selected), and the Edit-amount modal on a Planks assignment.

---

## Pending / loose ends

### Unverified in production — check these first
- **⚠️ Assignment SMS is live but unverified end-to-end.** Shipped to prod July 21 2026 (`aaa3154`) and never confirmed by watching a real text arrive. The notify path swallows every failure by design, so a coach gets **no UI signal** when a send fails — "Sent to [name] 🏀" only means the assignment saved. If `TWILIO_*` env vars are wrong in Vercel production, students silently receive nothing and nobody finds out. **RJ will notice immediately if this is broken**, and the add-student copy now promises the text ("They'll get a text when you assign work"). Verify by assigning one exercise to a test student and checking Twilio Console → Monitor → Logs → Messaging.
- **iOS line above the footer** — a horizontal rule was reported above the footer on mobile that could not be reproduced in devtools at 390px on either localhost or staging: no `<hr>` exists, no element sits between the phone row and the footer, and the scrollbar occupies 0px with `scrollbar-width: none` + `::-webkit-scrollbar { display: none }` already applied (so the webkit rule is **not** the fix — it was already deployed when the line was seen). A `1px solid #2a2d36` footer top border was added July 21 2026 and may mask or resolve it. **Unconfirmed on a real iPhone.** If a line still appears *above* the footer with a gap between it and the border, it is a separate artifact — capture a screenshot before changing anything.

### Everything else
- **Repoint SMS to the toll-free number** — toll-free (833) 892-5640 is APPROVED; update `TWILIO_FROM_NUMBER` to `+18338925640` in `.env.local` AND Vercel env vars (not yet switched over). Old 562 number released; support ticket resolved.
- **Final legal review of /privacy + /terms** — SMS-consent copy is in place (added July 16–17 2026); a lawyer pass is still advisable before wider launch.
- hello@assignreps.com Gmail "Send as" setup
- UI polish pass (see notes below)
- Stripe infrastructure
- Demo mode ("Try as Coach" seeded database)
- Page title metadata review
- Account deletion flow
- Re-engagement nudge (Monday email)
- **Gate stranger signups** — signup is currently open to the public; a bot already attempted a signup July 14 2026 (see incident note below). Add invite code / waitlist before broader launch.
- **Tighten logs RLS policy** — `logs` INSERT/SELECT is currently open. Before wider launch, tighten INSERT to verify the student token matches the player on the assignment.
- **Progress bars on roster rows** — each student row on `/instructor/students` should show name + progress inline with a thin bar underneath ("X of X done", without making the row taller). Not yet built; the roster currently conveys progress only through the group pills (Done / In progress / Not started). Note the landing page's roster mock already depicts the *grouped pill* layout, not this. (Assign flow polish itself is done — see July 17–18 changelog.)
- **Student/player side screens** not yet polished (welcome, log, celebrate — student home was polished July 16 2026).
- **Parent digest screen** not yet polished.
- **Sign in flow (returning coach)** not yet polished.
- ~~CLAUDE.md routes table was stale~~ — updated July 14 2026.

---

## UI polish notes (outstanding)

- Instructor signup flow — needs review pass
- Add player screen — needs review pass
- Assign flow — needs review pass (student-detail view polished July 16–17 2026)
- Student welcome, log, celebrate screens — needs review pass (student home polished July 16 2026)
- Parent digest screen — needs review pass
- ~~'Create your own' link on student detail → 404~~ — not a bug. Verified July 20 2026: there is no such link on student detail. The two real entry points (the category list and the exercise list) both link to `/instructor/student/[id]/assign/custom`, which is a live route.
- Tablet/responsive layout — deferred until a real tablet user requests it

---

## Priority build list (updated July 15 2026)

1. UI polish pass — instructor, student, parent flows (for RJ demo) ← in progress
2. Schedule RJ meeting this week
3. Repoint `TWILIO_FROM_NUMBER` to `+18338925640` — toll-free now APPROVED, just switch env vars (.env.local + Vercel)
4. Final legal review of /privacy + /terms — SMS-consent copy added July 16–17 2026
5. hello@assignreps.com Gmail Send as setup
6. Gate stranger signups — add invite code or waitlist
7. Stripe infrastructure
8. Demo mode
9. Account deletion flow
10. Re-engagement nudge (Monday email)
11. New-signup notification email to hello@
12. Light mode — after dark mode polish is complete

**Near-term goal:** Get the app into RJ's hands this week.

---

## Project expenses (as of July 13 2026)

- Claude: $20/mo (~1 month) + upgraded to $100/mo today
- Porkbun domain: ~$12
- Twilio: $20 credit, ~$4 used, ~$16 remaining
- Resend: free tier
- Total to date: ~$36-40
- Time invested: ~2-3 days active work

---

## V1 scope

- Coach signup (email OTP) ✅
- Add student (name + phone, optional parent phone) ✅
- Assign exercise (default list or custom) ✅
- Student view (tap link, see assignments, log reps) ✅
- Celebration screen ✅
- Coach player detail view ✅
- Coach Monday roster view ✅
- Parent weekly digest (read-only magic link) ✅
- Landing/marketing page ✅
- Staging environment ✅
- Resend email delivery ✅
- Demo mode ❌ in progress
- Account deletion ❌
- Push notifications ❌
- Remove (delete) assignment ✅ (per-card menu, July 16 2026) / Edit assignment ❌
- Multi-coach per roster ❌
- Video playback in-app ❌
- Historical weeks / season view ❌
- Responsive desktop layout for the app ❌

---

## Portfolio context

Solo side project demonstrating end-to-end product design: concept → shipped product, using AI tooling throughout (Claude chat for design thinking, Claude Code for building). Real-world problem from lived experience (basketball parent + coach relationship). No Figma used at any point — design happened in chat and prototype iteration.

---

## Screens reference

See `reps.html` in project root for the full interactive prototype.

- **Coach:** Landing, Signup (3 steps), Empty roster, Add player, Roster, Player detail, Categories, Exercise list, Count/assign, Monday view
- **Student:** Text preview, Welcome, Home, Log, Celebrate
- **Parent:** Text preview, Digest
- **Custom exercise:** Name, track type, video link

---

## Session checklist

Before each Claude Code session, confirm:
- Which flow are we building today?
- What's the done-state for this session?
- Any design decisions to make before coding?
- Push to: local only / staging / prod?
