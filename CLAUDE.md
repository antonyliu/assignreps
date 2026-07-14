# Reps — CLAUDE.md

## What this is
**Reps** keeps the work going between training sessions.

A lightweight web app for coaches and instructors to assign practice homework to their students, who log their progress on their phone. Parents get a simple weekly digest. No bloat, no complexity — just the loop that makes homework actually happen.

**Live domain:** assignreps.com
**Staging:** staging.assignreps.com
**Stack:** Next.js · Supabase · Vercel · Tailwind CSS · Twilio · Resend
**Design:** Mobile-first, light/warm background (#f8f7f5) on landing; warm dark mode inside the app; sky blue (#378add) as sole accent

---

## The core insight
The instructor is the customer — not the student. Students never choose this tool; they receive a link. Marketing targets instructor pain: they assign work verbally between sessions with no way to verify follow-through.

---

## Three users

### Coach / Instructor (e.g. RJ)
- Signs up via email OTP (6-digit code, no password, no magic link)
- Signup flow: name → instructor type → email → enter 6-digit code → roster
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

**Important:** Local, staging, and prod all share the same hosted Supabase project. Changes to Supabase dashboard (email templates, SMTP, auth settings) affect all environments immediately.

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
- `/auth/callback` and `/auth/complete` are dead routes — leftover from old magic-link flow, unused

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
- Redirect URLs: https://assignreps.com/auth/callback, https://staging.assignreps.com/auth/callback

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

`src/config/activityTypes.ts` maps instructor_type to UI labels:

```
basketball: { studentLabel: "player", studentsLabel: "players", groupLabel: "roster", verb: "assign reps", available: true }
piano: { ..., available: false }
martial_arts: { ..., available: false }
tennis: { ..., available: false }
```

All UI labels pull from this config based on coach's instructor_type. Adding a new activity type is a content sprint — no engineering rework needed.

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
- **Hero:** Authentic photo of RJ coaching Tony's sons
- **Background:** #f8f7f5 (warm off-white)

---

## Design decisions locked

- **Accent color:** Sky blue #378add
- **Green:** #4ade80 — completion states only
- **Logo:** Tally mark SVG (4 vertical lines + 1 diagonal) — sport-agnostic, scalable
- **Warm dark backgrounds:** #161310 app bg, #221e1a surfaces — NOT cold gray
- **Typography:** System font stack; font-weight 600, letter-spacing -0.5px for headlines
- **Mobile-first:** App is mobile-only (max-width ~390px). Landing page is responsive.
- **Roster grouping:** All in 🔥 (4+ days) / Some activity (1–3 days) / No activity yet (0 days, gray avatar)
- **Coach avatar:** Initials from coach's actual name (e.g. RJ, TL) — not generic "C"
- **iOS forms:** All input+button flows use form onSubmit + type="submit" — required for iOS WebKit
- **Add player — parent phone:** Collapsed by default. Shown as "Add parent for weekly digest →" tap to expand. Reduces visual weight for instructors who don't need it.
- **Phone placeholder:** (555) 000-0000

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
| Coach sign in / sign up | /coach |
| Coach roster | /coach/roster |
| Add student | /coach/add-player |
| Student detail | /coach/player/[id] |
| Assign — category | /coach/player/[id]/assign |
| Assign — exercise | /coach/player/[id]/assign/[category] |
| Assign — count | /coach/player/[id]/assign/[category]/[exercise] |
| Player login | /player/login |
| Player welcome | /player/[token]/welcome |
| Player home | /player/[token] |
| Log reps | /player/[token]/log/[assignmentId] |
| Celebrate | /player/[token]/celebrate |
| Parent digest | /parent/[token] |
| Privacy policy | /privacy |
| Terms of service | /terms |
| (Dead) Magic link callback | /auth/callback |
| (Dead) Complete profile | /auth/complete |

---

## Features built (as of July 13 2026)

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

---

## UI polish notes (outstanding)

- "Create your own" link on player detail → 404, needs fix
- Logo on player welcome and welcome back screens — wrong/old version
- Player welcome: shrink logo, remove/minimize tagline, prioritize "Hey [name]" and CTA
- Player welcome: "Enter your number to find your assignments" → fit on one line
- Player welcome back: same logo fix, same one-line fix, update old tagline
- Coach avatar → show initials from actual name, not "C"
- Roster group labels → "Some activity" and "No activity yet" (replacing "Showing up" / "Quiet")
- Add player: spacing between helper text and input fields too tight
- Add player: parent phone collapsed by default → "Add parent for weekly digest →"
- Add player: phone placeholder → (555) 000-0000
- "Assign more" and "Create your own" buttons not visible below fold — fix positioning
- Add player button on mobile cut off by iPhone UI — sticky bottom + safe area inset
- Terms/privacy: text size too small, links still orange → fix to #378add
- All screens: consistent padding review

---

## Priority build list (updated July 13 2026)

1. UI polish pass (see notes above) ← in progress
2. Privacy policy + terms final copy at /privacy and /terms
3. hello@assignreps.com Gmail "Send as" setup
4. Stripe infrastructure (build early, not actively charging)
5. Account deletion flow
6. Demo mode — "Try as Coach" seeded database
7. Re-engagement nudge (Monday email to coaches)
8. Page title metadata review
9. Update TWILIO_FROM_NUMBER once toll-free approved

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
