# Reps — CLAUDE.md

## What this is
**Reps** keeps the work going between training sessions.

A lightweight web app for coaches to assign practice work to their students, and for students to log their progress. Parents get a simple weekly digest. No bloat, no complexity — just the loop that makes homework actually happen.

**Live domain:** assignreps.com  
**Stack:** Next.js · Supabase · Vercel · Tailwind CSS  
**Design:** Mobile-first, dark mode with warm undertones, court orange (#ff7a3d) as sole accent

---

## Three users

### Coach (e.g. RJ)
- Signs up with phone number (OTP, no password)
- Adds players by name + phone number
- Optional: adds parent phone per player
- Assigns exercises from a default list or creates custom ones
- Views each player's weekly progress
- Monday view: full roster grouped by activity (All in 🔥 / Showing up / Quiet)

### Student (e.g. Neo)
- Gets a text with a unique link — no signup required
- Taps link → sees this week's assignments
- Logs reps using a counter (+1 / +10 / +25 / +50)
- Sees a quiet celebration when done: 🔥 + "RJ will see this."
- Counter caps at assigned target — no inflating

### Parent
- Optional per player — coach decides at add-player time
- Gets a Sunday night text digest (no signup, no account)
- Taps link → sees simple translated view: practice days, assignments completed, last activity
- No drill names, no rep counts, no jargon — just effort signal
- Read-only. No interaction.

---

## Core data loop
Coach assigns → Student logs → Coach sees → Parent digest (weekly)

---

## Tech stack decisions
- **Auth:** Supabase phone OTP for coach. Students and parents use unique magic links (no auth)
- **Database:** Supabase (Postgres)
- **Hosting:** Vercel
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **SMS:** Skip for v1 — use Supabase email magic links or simulate link sharing manually for portfolio demo
- **Domain:** assignreps.com (registered at Namecheap/Porkbun)

---

## Database schema (rough)

```
coaches
  id, name, phone, created_at

players  
  id, coach_id, name, phone, parent_phone, token (unique link key), created_at

assignments
  id, coach_id, player_id, exercise_name, target, unit (reps/minutes/target), video_url, week_start, created_at

logs
  id, player_id, assignment_id, amount, logged_at
```

---

## Exercise categories + defaults

**Shooting** (reps): Form shooting 50, Free throws 50, Mid-range 50, Corner 3s 25, Catch & shoot 50  
**Ball-handling** (minutes): Stationary dribbling 10, Two-ball 10, Crossovers 5, Figure 8s 5  
**Finishing** (reps): Layups right 25, Layups left 25, Floaters 20  
**Footwork** (reps): Pivots 20, Jump stops 20, Defensive slides 10  
**Conditioning** (reps): Suicides 10, Sprints 10, Jump rope 5  

Custom exercise: name + track type (reps/time/target) + optional video URL

---

## Design decisions locked

- **Name:** Reps
- **Tagline:** "For players who want to be great."
- **One-liner:** "Reps keeps the work going between training sessions."
- **Logo:** Tally mark SVG (4 vertical lines + 1 diagonal) — sport-agnostic, scalable
- **Dark mode:** Warm dark background (~#100d0b), not cool gray
- **Orange:** #ff7a3d — used for primary buttons, active states, progress bars, logo
- **Green:** #4ade80 — used only for completion states
- **Typography:** System font stack for now; consider DM Sans or similar athletic sans
- **Mobile-only:** Max width 390px, centered on desktop with neutral background

### Roster grouping logic
- **All in 🔥** = logged 4+ days this week
- **Showing up** = logged 1–3 days
- **Quiet** = 0 days logged (gray avatar, no shaming)

### What was killed and why
- **Leaderboard:** Killed — kids are minors (privacy), and it breaks the intimacy of the 1:1 mentor relationship. Reps is not a competition tool.
- **Coach qualitative comments:** Killed for v1 — RJ's feedback is in-person. Typing weekly notes is a chore that won't stick.
- **Milestone push notifications:** Killed — rep counts don't map to real improvement. Effort signals (days practiced, assignments completed) are the honest metric.
- **Slider input for logging:** Killed — too much precision required, counter is faster
- **Single "Done" button:** Killed — assignments are high (200 shots), done across multiple sessions
- **Parent signup:** Killed — parents get a read-only magic link, no account ever

---

## V1 scope (build this, nothing else)

✅ Coach signup (phone OTP)  
✅ Add player (name + phone, optional parent phone)  
✅ Assign exercise (from default list or custom)  
✅ Student view (tap link, see assignments, log reps)  
✅ Celebration screen ("RJ will see this.")  
✅ Coach player detail view (see student's week)  
✅ Coach Monday roster view (grouped by activity)  
✅ Parent weekly digest (read-only magic link page)  
✅ Landing/marketing page (assignreps.com)  
✅ Demo mode (try as coach / try as student — no signup for portfolio viewers)

## Not in V1
❌ SMS integration (Twilio) — manual link sharing for now  
❌ Push notifications  
❌ Edit/delete assignments  
❌ Multi-coach per roster  
❌ Payments / subscriptions  
❌ Video playback in-app  
❌ Historical weeks / season view  
❌ Responsive desktop layout for the app (marketing page is responsive)

---

## Portfolio context
This is a solo side project built as a portfolio piece demonstrating:
- End-to-end product design (concept → shipped product)
- AI-assisted design and build workflow (Claude chat for design thinking, Claude Code for build)
- Real-world problem solving from lived experience (basketball parent + coach relationship)
- Mobile-first product judgment

The design prototype was built entirely in Claude chat before a single line of production code was written. No Figma was used at any point.

---

## Screens reference
See `reps.html` in project root for the full interactive prototype with all flows.

The prototype includes:
- Coach: Landing, Signup (3 steps), Empty roster, Add player, Roster, Player detail, Categories, Exercise list, Count/assign, Monday view
- Student: Text preview, Welcome, Home, Log, Celebrate  
- Parent: Text preview, Digest (strong week), Digest (quiet week)
- Custom exercise: Name, track type, video link

---

## Session checklist
Before each Claude Code session, confirm:
- Which flow are we building today?
- What's the done-state for this session?
- Any design decisions to make before coding?
