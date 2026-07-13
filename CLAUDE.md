# Reps — CLAUDE.md

## What this is
**Reps** keeps the work going between training sessions.

A lightweight web app for coaches and instructors to assign practice homework to their students, who log their progress on their phone. Parents get a simple weekly digest. No bloat, no complexity — just the loop that makes homework actually happen.

**Live domain:** assignreps.com
**Stack:** Next.js · Supabase · Vercel · Tailwind CSS · Twilio
**Design:** Mobile-first, light/warm background (#f8f7f5) on landing; dark mode with warm undertones inside the app; court orange (#ff7a3d) as sole accent

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
- **Hosting:** Vercel (auto-deploys on push to main)
- **Repo:** github.com/antonyliu/assignreps
- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **SMS:** Twilio — used only for student invite SMS and parent digest SMS. NOT used for coach auth.
- **Payments:** Stripe (build infrastructure early, not actively charging yet)
- **Domain:** assignreps.com via Porkbun

---

## Twilio status & config

- **Status:** Blocked on local number (Error 30034 — A2P 10DLC unregistered)
- **Toll-free number purchased:** (833) 892-5640 — pending verification
- **To complete:** Get EIN at irs.gov → complete Twilio toll-free verification → add number to Messaging Service → update `TWILIO_FROM_NUMBER` in `.env.local` AND Vercel env vars
- **Messaging Service SID:** `MGe3a0a18bf618d102aae9cb26943cd239`
- **Important:** Use `MessagingServiceSid` parameter when sending SMS, not `From`
- **Test setup:** Tony's personal number set as test phone in Supabase with code `123456` to bypass real SMS during local dev

---

## DNS & infrastructure

- **A record:** 216.198.79.1
- **CNAME www:** 7e1e78157ce60fae.vercel-dns-017.com
- **Always include in Claude Code prompts:** "Do not push to Vercel. Local only." unless explicitly deploying.

---

## Database schema

```
coaches
  id, name, email, instructor_type, created_at

players
  id, coach_id, name, phone, parent_phone, token (unique link key), created_at

assignments
  id, coach_id, player_id, exercise_name, target, unit (reps/minutes/target), video_url, week_start, created_at

logs
  id, player_id, assignment_id, amount, logged_at
```

Note: `instructor_type` field added now even though basketball is the only option at launch — enables content branching later without schema rework.

---

## Pricing & monetization

- **Free tier:** 3 students free, forever
- **Trial:** 30 days free, no card required; card collected at end of trial
- **Paywall trigger:** Adding a 4th student
- **Price:** ~$5/month
- **Early adopter promo codes** via Stripe with max redemption limits (e.g. COACHRJ = 1 use = lifetime free for RJ)
- Build Stripe infrastructure early even if not actively charging

---

## Activity types & expansion

Launch with basketball. Top candidates to add next (all meet the threshold: repeatable, solo-drillable homework):

1. **Piano** — scales, pieces, sight-reading; identical homework problem to basketball
2. **Martial arts** (karate/BJJ/taekwondo) — katas, drills, conditioning
3. **Tennis** — footwork, serve reps, groundstrokes

Further pipeline: golf, guitar, soccer, swimming, gymnastics, voice/vocal.

The default exercise libraries *are* the product experience — not custom creation. Custom exercise creation exists as an escape hatch only.

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
- **Hero:** Authentic photo of RJ coaching Tony's sons
- **Background:** #f8f7f5 (warm off-white)

---

## Design decisions locked

- **Logo:** Tally mark SVG (4 vertical lines + 1 diagonal) — sport-agnostic, scalable
- **Orange:** #ff7a3d — primary buttons, active states, progress bars, logo
- **Green:** #4ade80 — completion states only
- **Typography:** System font stack; font-weight 600, letter-spacing -0.5px for headlines
- **Mobile-first:** App is mobile-only (max-width ~390px). Landing page is responsive.
- **Roster grouping:** All in 🔥 (4+ days) / Showing up (1–3 days) / Quiet (0 days, gray avatar)

### What was killed and why
- **Leaderboard:** Privacy (minors) + breaks the 1:1 mentorship dynamic
- **Coach qualitative comments:** Won't stick — RJ's feedback is in-person
- **Milestone push notifications:** Rep counts don't map to real improvement
- **Slider input for logging:** Too much friction; counter is faster
- **Single "Done" button:** Assignments span multiple sessions (200 shots can't be done in one sitting)
- **Parent signup:** Parents get read-only magic link, no account ever
- **"For players who want to be great" tagline:** Wrong audience — targets students, not coaches
- **"I'm a player →" secondary CTA:** Too sport-specific; changed to "I'm a student →"

---

## Features built (as of July 13 2026)

- Coach signup (phone OTP — migrating to email magic link)
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

---

## Priority build list

1. Fix Twilio — EIN → toll-free verification → update env vars in `.env.local` and Vercel
2. Switch coach signup from phone OTP to email magic link
3. Add `instructor_type` field to schema
4. UI/styling polish pass across all screens
5. Privacy policy + terms of service pages (`/privacy`, `/terms`)
6. hello@assignreps.com email forwarding via Porkbun
7. Stripe integration (infrastructure only, not actively charging)
8. Demo mode — seeded database via "Try as Coach" button with context overlay
9. Page title metadata review

**Near-term goal:** Get the app into RJ's hands this week.

---

## V1 scope

✅ Coach signup
✅ Add student (name + phone, optional parent phone)
✅ Assign exercise (default list or custom)
✅ Student view (tap link, see assignments, log reps)
✅ Celebration screen
✅ Coach player detail view
✅ Coach Monday roster view
✅ Parent weekly digest (read-only magic link)
✅ Landing/marketing page
✅ Demo mode

❌ Push notifications
❌ Edit/delete assignments
❌ Multi-coach per roster
❌ Video playback in-app
❌ Historical weeks / season view
❌ Responsive desktop layout for the app

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
- Do not push to Vercel. Local only. (unless explicitly deploying)
