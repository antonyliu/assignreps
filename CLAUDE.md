# Reps — CLAUDE.md

## What this is
**Reps** keeps the work going between training sessions.

A lightweight web app for coaches and instructors to assign practice homework to their students, who log their progress on their phone. Parents get a simple weekly digest. No bloat, no complexity — just the loop that makes homework actually happen.

**Live domain:** assignreps.com
**Staging:** staging.assignreps.com
**Stack:** Next.js · Supabase · Vercel · Tailwind CSS · Twilio
**Design:** Mobile-first, light/warm background (#f8f7f5) on landing; warm dark mode inside the app; sky blue (#378add) as sole accent

---

## The core insight
The instructor is the customer — not the student. Students never choose this tool; they receive a link. Marketing targets instructor pain: they assign work verbally between sessions with no way to verify follow-through.

---

## Three users

### Coach / Instructor (e.g. RJ)
- Signs up via email magic link (no password, no phone OTP)
- Signup flow: name → instructor type → email → magic link sent
- Adds students by name + phone number
- Optional: adds parent phone per student
- Assigns exercises from a default library or creates custom ones
- Views each student's weekly progress
- Monday view: full roster grouped by activity level

### Student (e.g. Neo)
- Gets a text with a unique link — no signup required
- Can also log in from any device at assignreps.com via phone OTP (in case SMS is deleted)
- Taps link → sees this week's assignments
- Logs reps using a counter (+1 / +10 / +25 / +50)
- Sees a quiet celebration when done: 🔥 + "RJ will see this."
- Counter caps at assigned target — no inflating

### Parent
- Optional per student — coach decides at add-student time
- Gets a Sunday night text digest (no signup, no account)
- Taps link → sees simple translated view: practice days, assignments completed, last activity
- No drill names, no rep counts, no jargon — just effort signal
- Read-only. No interaction.

---

## Core data loop
Coach assigns → Student logs → Coach sees → Parent digest (weekly)

---

## Tech stack

- **Auth:** Supabase email magic link for coach. Students use unique SMS link tokens; can also authenticate via phone OTP from any device.
- **Database:** Supabase (Postgres) · Project ID: `obkwxyzpugpleahrgcby` (US West)
- **Hosting:** Vercel (auto-deploys on push to main or staging branch)
- **Repo:** github.com/antonyliu/assignreps
- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **SMS:** Twilio — used only for student invite SMS and parent digest SMS. NOT used for coach auth.
- **Email:** Resend as Supabase Auth custom SMTP for magic-link email (from hello@assignreps.com). Configured in the Supabase dashboard, not in app code.
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

**Claude Code prompts:** say "push to staging only" or "push to prod" explicitly. Default is local only.

---

## Twilio status & config

- **Status:** Toll-free registration submitted, In Review
- **Toll-free number:** (833) 892-5640
- **Old local number:** +15625487985 (blocked, release when possible)
- **Messaging Service SID:** `MGe3a0a18bf618d102aae9cb26943cd239`
- **TWILIO_FROM_NUMBER:** update to `+18338925640` in `.env.local` AND Vercel env vars once registration approved
- **Important:** Use `MessagingServiceSid` parameter when sending SMS, not `From`
- **Test setup:** Tony's personal number set as test phone in Supabase with code `123456` to bypass real SMS during local dev

---

## Resend (auth email) status & config

- **Status:** Not applied yet — runbook prepared, dashboard config pending
- **Purpose:** Supabase Auth custom SMTP so magic-link email sends from `hello@assignreps.com` (replaces default `noreply@mail.app.supabase.io`)
- **Provider:** Resend · Host `smtp.resend.com` · Port `465` (SSL) or `587` · Username `resend` · Password = Resend API key
- **API key:** stored in password manager; placeholder `RESEND_API_KEY` in `.env.local.example` for reference only — NOT read by app code (SMTP lives in Supabase dashboard)
- **DNS:** SPF + DKIM records for assignreps.com added at Porkbun per Resend's domain-verification screen
- **⚠️ Shared-project caveat:** local/staging/prod all use one hosted Supabase project, so saving SMTP applies to prod too. There is no local-only apply for auth email on a shared project.
- **To complete:** verify domain in Resend → create API key → Supabase Auth → SMTP settings → test magic link → check Resend logs

---

## DNS & infrastructure

- **A record:** 216.198.79.1
- **CNAME www:** 7e1e78157ce60fae.vercel-dns-017.com
- **CNAME staging:** 7e1e78157ce60fae.vercel-dns-017.com

**Supabase redirect URLs (Authentication → URL Configuration):**
- https://assignreps.com/auth/callback
- https://staging.assignreps.com/auth/callback
- Site URL: https://assignreps.com

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

Note: `instructor_type` field added now even though basketball is the only option at launch — enables content branching later without schema rework. `phone` on coaches is nullable since email magic link does not require it.

---

## Activity type content system

`src/config/activityTypes.ts` maps instructor_type to UI labels:

```
basketball: { studentLabel: "player", studentsLabel: "players", groupLabel: "roster", verb: "assign reps", available: true }
piano: { ..., available: false }
martial_arts: { ..., available: false }
tennis: { ..., available: false }
```

All UI labels (player/players/roster etc) pull from this config based on coach's instructor_type. Adding a new activity type is a content sprint — no engineering rework needed.

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
- **Headline:** Assign practice homework, the easy way.
- **Bullets:**
  - Send work to any student in seconds
  - Students log it on their phone
  - You always know where they left off
- **Primary CTA:** Get started
- **Secondary CTA:** I'm a student →
- **Hero:** Authentic photo of RJ coaching Tony's sons (hero collage with piano/tennis coming)
- **Background:** #f8f7f5 (warm off-white)

---

## Design decisions locked

- **Accent color:** Sky blue #378add (shifted from orange #ff7a3d on July 13 2026)
- **Green:** #4ade80 — completion states only (kept — distinct from blue)
- **Logo:** Tally mark SVG (4 vertical lines + 1 diagonal) — sport-agnostic, scalable
- **Warm dark backgrounds:** #161310 app bg, #221e1a surfaces — NOT cold gray
- **Typography:** System font stack; font-weight 600, letter-spacing -0.5px for headlines
- **Mobile-first:** App is mobile-only (max-width ~390px). Landing page is responsive.
- **Roster grouping:** All in 🔥 (4+ days) / Showing up (1–3 days) / Quiet (0 days, gray avatar)
- **Name field placeholder:** e.g. Coach RJ, Mrs. Chen, or Sarah
- **iOS forms:** All input+button flows use form onSubmit + type="submit" — required for iOS WebKit

### What was killed and why
- **Leaderboard:** Privacy (minors) + breaks the 1:1 mentorship dynamic
- **Coach qualitative comments:** Won't stick — RJ's feedback is in-person
- **Milestone push notifications:** Rep counts don't map to real improvement
- **Slider input for logging:** Too much friction; counter is faster
- **Single "Done" button:** Assignments span multiple sessions
- **Parent signup:** Parents get read-only magic link, no account ever
- **"For players who want to be great" tagline:** Wrong audience
- **"I'm a player →" secondary CTA:** Too sport-specific
- **Orange accent:** Too basketball/Claude-specific; replaced with sky blue
- **Cold dark backgrounds:** Replaced with warm dark palette

---

## Routes

| Screen | URL |
|--------|-----|
| Landing | / |
| Coach sign in / sign up | /coach |
| Coach roster | /coach/roster |
| Add student | /coach/add-player |
| Student detail | /coach/player/[id] |
| Assign — category | /coach/player/[id]/assign |
| Assign — exercise | /coach/player/[id]/assign/[category] |
| Assign — count | /coach/player/[id]/assign/[category]/[exercise] |
| Magic link callback | /auth/callback |
| Complete profile | /auth/complete |
| Player login | /player/login |
| Player welcome | /player/[token]/welcome |
| Player home | /player/[token] |
| Log reps | /player/[token]/log/[assignmentId] |
| Celebrate | /player/[token]/celebrate |
| Parent digest | /parent/[token] |
| Privacy policy | /privacy |
| Terms of service | /terms |

---

## Features built (as of July 13 2026)

- Coach signup — email magic link (name → instructor type → email → check email)
- Instructor type selection (basketball active, piano/martial arts/tennis coming soon)
- Activity type content config (src/config/activityTypes.ts)
- Roster screen
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
- Sky blue color system (shifted from orange today)
- Warm dark palette across all app screens
- Staging environment (staging.assignreps.com)
- iOS form fix (onSubmit pattern for WebKit compatibility)

---

## Pending / loose ends

- Update TWILIO_FROM_NUMBER to +18338925640 once toll-free registration approved
- Update .env.local TWILIO_FROM_NUMBER to toll-free number
- Privacy policy page at /privacy
- Terms of service page at /terms
- hello@assignreps.com email forwarding via Porkbun
- Supabase email templates — update from default to Reps branding (subject, body, sender name)
- UI polish pass (see notes below)
- Hero image collage (RJ + piano + tennis circles)
- Stripe infrastructure
- Demo mode ("Try as Coach" seeded experience)
- Page title metadata review
- Release old 562 Twilio number

---

## UI polish notes (outstanding)

- "Check your email" screen — mail icon still shows orange, needs blue
- Logo on player/welcome screen is wrong/old version
- Logo on signed-in screens should be slightly larger
- Logo should link to / on signup screens; to /coach/roster on authenticated screens
- Player welcome screen tagline needs update (currently "For players who want to be great")
- Player welcome: "Enter your number to find your assignments" should fit on one line
- Supabase auth email needs rebranding
- All screens need consistent padding review

---

## Priority build list (updated July 13 2026)

1. UI/styling polish pass (see notes above)
2. Privacy policy + terms pages (/privacy, /terms)
3. hello@assignreps.com email forwarding via Porkbun
4. Supabase email template rebranding
5. Stripe infrastructure (build early, not actively charging)
6. Demo mode — "Try as Coach" seeded database
7. Page title metadata review
8. Update TWILIO_FROM_NUMBER once toll-free approved

**Near-term goal:** Get the app into RJ's hands this week.

---

## Project expenses (as of July 13 2026)

- Claude: $20/mo (~1 month) + upgraded to $100/mo today
- Porkbun domain: ~$12
- Twilio: $20 credit, ~$4 used, ~$16 remaining
- Total to date: ~$36-40
- Time invested: ~2-3 days active work

---

## V1 scope

- Coach signup (email magic link) ✅
- Add student (name + phone, optional parent phone) ✅
- Assign exercise (default list or custom) ✅
- Student view (tap link, see assignments, log reps) ✅
- Celebration screen ✅
- Coach player detail view ✅
- Coach Monday roster view ✅
- Parent weekly digest (read-only magic link) ✅
- Landing/marketing page ✅
- Staging environment ✅
- Demo mode (in progress)
- Push notifications ❌
- Edit/delete assignments ❌
- Multi-coach per roster ❌
- Video playback in-app ❌
- Historical weeks / season view ❌
- Responsive desktop layout for the app ❌

---

## Portfolio context

Solo side project demonstrating end-to-end product design: concept → shipped product, using AI tooling throughout (Claude chat for design thinking, Claude Code for building). Real-world problem from lived experience. No Figma used at any point — design happened in chat and prototype iteration.

---

## Screens reference

See `reps.html` in project root for the full interactive prototype.

- **Coach:** Landing, Signup (3 steps), Empty roster, Add player, Roster, Player detail, Categories, Exercise list, Count/assign, Monday view
- **Student:** Text preview, Welcome, Home, Log, Celebrate
- **Parent:** Text preview, Digest (strong week), Digest (quiet week)
- **Custom exercise:** Name, track type, video link

---

## Session checklist

Before each Claude Code session, confirm:
- Which flow are we building today?
- What's the done-state for this session?
- Any design decisions to make before coding?
- Push to: local only / staging / prod?
