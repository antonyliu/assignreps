# Reps — CLAUDE.md

## What this is
**Reps** keeps the work going between training sessions.

A lightweight web app for coaches and instructors to assign practice homework to their students, who log their progress on their phone. Parents get a simple weekly digest. No bloat, no complexity — just the loop that makes homework actually happen.

**Live domain:** assignreps.com
**Staging:** staging.assignreps.com
**Stack:** Next.js · Supabase · Vercel · Tailwind CSS · Twilio · Resend
**Design:** Mobile-first, light/warm background (#f8f7f5) on landing; cool dark mode inside the app (#111318 bg, #1c1f26 surfaces, #2a2d36 borders); sky blue (#378add) as sole accent

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
- Taps link → sees this week's assignments
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
- **SMS:** Twilio — used only for student invite SMS and parent digest SMS. NOT used for coach auth.
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

**Workflow:**
1. Build + test on desktop at localhost:3000
2. Push to staging branch → test on iPhone at staging.assignreps.com
3. Merge staging → main → prod deploys automatically

> ⚠️ Always build and test locally first. Never commit directly to staging or push to staging before local is updated. Staging should always be a mirror of local, pushed for iPhone testing only. Main should always be ahead of or equal to staging.

**Important:** Local, staging, and prod all share the same hosted Supabase project. Changes to Supabase dashboard (email templates, SMTP, auth settings) affect all environments immediately.

**Claude Code prompts:** say "push to staging only" or "push to prod" explicitly. Default is local only.

---

## Twilio status & config

- **Compliance profile:** New business profile approved July 15 2026. Bundle SID: `BUe3d4ce29abb03b218cdb16560fdce0e6`. Legal name: ANTONY LIU. EIN: 42-3784882. Email: hello@assignreps.com.
- **Toll-free registration:** Still blocked — ISV business identity type is incompatible with toll-free verification. Waiting on Twilio support (Julieta, ticket #28211833) to advise whether to change to Direct Customer.
- **Do not resubmit toll-free registration until hearing back from Julieta.**
- **Toll-free number:** (833) 892-5640
- **Old local number:** +15625487985 (blocked, release when possible)
- **Messaging Service SID:** `MGe3a0a18bf618d102aae9cb26943cd239`
- **TWILIO_FROM_NUMBER:** update to `+18338925640` in `.env.local` AND Vercel env vars once registration approved
- **Important:** Use `MessagingServiceSid` parameter when sending SMS, not `From`
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
  id, coach_id, name, phone, parent_phone, token (unique link key), created_at

assignments
  id, coach_id, player_id, exercise_name, target, unit (reps/minutes/target), video_url, week_start, created_at

logs
  id, player_id, assignment_id, amount, logged_at
```

Note: `instructor_type` field added now even though basketball is the only option at launch — enables content branching later without schema rework. `phone` on coaches is nullable since email OTP does not require it.

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

**Shooting** (reps): Form shooting 50, Free throws 50, Mid-range 50, Corner 3s 25, Catch & shoot 50
**Ball-handling** (minutes): Stationary dribbling 10, Two-ball 10, Crossovers 5, Figure 8s 5
**Finishing** (reps): Layups right 25, Layups left 25, Floaters 20
**Footwork** (reps): Pivots 20, Jump stops 20, Defensive slides 10
**Conditioning** (reps): Suicides 10, Sprints 10, Jump rope 5

Custom exercise: name + track type (reps/time/target) + optional video URL

---

## Landing page copy (current)

- **Eyebrow:** FOR COACHES & INSTRUCTORS
- **Headline:** Practice homework for your students.
- **Bullets:**
  - Send work to any student in seconds
  - Students log it on their phone
  - You always know where they left off
- **Primary CTA:** Get started
- **Secondary CTA:** I'm a student →
- **Hero:** Two overlapping circles — basketball and piano WebP images
- **Background:** #f8f7f5 (warm off-white)

---

## Design decisions locked

- **Accent color:** Sky blue #378add
- **Green:** #4ade80 — completion states only
- **Logo:** Tally mark SVG (4 vertical lines + 1 diagonal) — sport-agnostic, scalable
- **Warm dark palette (locked):** #1a1612 app bg, #252018 surfaces, #3a3328 borders, #4a4338 strong borders — NOT cold gray. Sky blue #378add replaced orange throughout the app.
- **Typography:** System font stack; font-weight 600, letter-spacing -0.5px for headlines
- **Mobile-first:** App is mobile-only (max-width ~390px). Landing page is responsive.
- **Roster grouping:** All in 🔥 (4+ days) / Some activity (1–3 days) / No activity yet (0 days, gray avatar)
- **Coach avatar:** Initials from coach's actual name (e.g. RJ, TL) — not generic "C"
- **iOS forms:** All input+button flows use form onSubmit + type="submit" — required for iOS WebKit
- **Add player — parent phone:** Collapsed by default. Shown as "Add parent for weekly digest →" tap to expand. Reduces visual weight for instructors who don't need it.
- **Phone placeholder:** (555) 000-0000
- **Signup step indicator:** "Step X of 3" text, top-right (small, dim). Pill dots were tried and reverted.
- **Signup back navigation:** no back arrow in the header — each step is its own URL, so native browser/phone back handles it.
- **Signup name placeholder:** `Coach RJ, Mrs. Tai` (italicized).
- **Activity list ("What do you teach?"):** scrollable list with a sticky Continue button pinned at the bottom; a bottom gradient fade (transparent → app bg) softens the scroll edge.
- **Inactive activity rows:** subtle dark surface background, ~60% opacity content, no border highlight; SOON badge (muted gray on gray).
- **"Create your own" row:** last item in the list — dashed border, `+` icon, same height as the preset rows, SOON badge. Escape hatch, not a preset.
- **Removed** "More coming soon." caption + hairline from the activity list (was "More disciplines coming soon.").
- **Logo size standardized** across all in-app header screens (24px mark + 16px wordmark).

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

## Stranger signup incident (July 14 2026)

- An unknown user attempted a signup with `jewellanne032499@gmail.com`. The email bounced; a user record was created in Supabase auth with "waiting for verification" status and **deleted manually**.
- Root cause: the site is publicly indexed and signup is open to anyone.
- **Action:** gate signups (invite code / waitlist) before broader launch — tracked in Pending.

---

## Privacy policy & terms of service

Plain language versions drafted. Key points:

**Privacy:** Collect name, email, phone. Used only to operate the product. Shared with Supabase, Twilio, Resend. No selling. Coaches responsible for consent for minors. Delete via hello@assignreps.com.

**Terms:** Coach responsible for consent before adding player/parent contacts. Reps provided as-is. Accounts can be terminated. Payments monthly, cancel anytime.

**COPPA note:** Students log reps via link — we don't collect data directly from children. Coaches are responsible for parental consent for players under 13.

Pages at /privacy and /terms — placeholder copy in place, final copy to be dropped in.

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

---

## Pending / loose ends

- Update TWILIO_FROM_NUMBER to +18338925640 once toll-free registration approved
- Update .env.local TWILIO_FROM_NUMBER to toll-free number
- Release old 562 Twilio number
- Privacy policy final copy at /privacy
- Terms of service final copy at /terms
- hello@assignreps.com Gmail "Send as" setup
- UI polish pass (see notes below)
- Stripe infrastructure
- Demo mode ("Try as Coach" seeded database)
- Page title metadata review
- Account deletion flow
- Re-engagement nudge (Monday email)
- **Gate stranger signups** — signup is currently open to the public; a bot already attempted a signup July 14 2026 (see incident note below). Add invite code / waitlist before broader launch.
- **Tighten logs RLS policy** — `logs` INSERT/SELECT is currently open. Before wider launch, tighten INSERT to verify the student token matches the player on the assignment.
- ~~CLAUDE.md routes table was stale~~ — updated July 14 2026.

---

## UI polish notes (outstanding)

- Instructor signup flow — needs review pass
- Add player screen — needs review pass
- Student detail / assign flow — needs review pass
- Student welcome, home, log, celebrate screens — needs review pass
- Parent digest screen — needs review pass
- 'Create your own' link on student detail → 404, needs fix
- Tablet/responsive layout — deferred until a real tablet user requests it

---

## Priority build list (updated July 15 2026)

1. UI polish pass — instructor, student, parent flows (for RJ demo) ← in progress
2. Schedule RJ meeting this week
3. Update TWILIO_FROM_NUMBER once toll-free approved
4. Privacy policy + terms final copy
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
- Edit/delete assignments ❌
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
