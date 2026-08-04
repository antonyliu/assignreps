# Reps — CHANGELOG

A running history of what shipped and why. **CLAUDE.md describes the app as it is now; this file records how it got there.**

> **Append new rows here each time a feature ships — ask Claude Code to update this alongside CLAUDE.md.**

Dates are the git commit dates, oldest first. "Why it exists" is the actual reason where CLAUDE.md or the commit records one, and "Reason not recorded" where it doesn't — that gap is deliberate, not an oversight to fill in later by guessing.

---

## MVP / early build (Jul 11–15 2026)

| Feature | Why it exists |
|---|---|
| Next.js App Router scaffold on Supabase | Reason not recorded |
| Coach signup — email OTP, 6-digit, no password | Replaced magic-link auth; reason for the switch not recorded |
| Per-step signup routes (name → type → email/code → students) | Reason not recorded |
| Coach roster with empty state | The instructor is the customer, so their list of students is the app's home |
| Add student — name + one phone number | Students never sign up; they receive a link, so the coach owns the record |
| Player/Parent recipient toggle | Younger students often don't own the phone the link goes to |
| Student link auth (phone OTP) | Lets a student re-open their homework from any device without an account |
| Landing page, /privacy, /terms | Reason not recorded |
| Activity type system (`activityTypes.ts`) | Adding a discipline should be a content change, not engineering work |
| Parent read-only view | Parent signup was killed — read-only link only, to avoid another account |
| Portrait-only landscape notice | Reps is a phone app; orientation can't be locked on the web, so the UI steps aside instead |
| Ghost-row empty state on the roster | Shows what will fill the screen, instead of an empty-state illustration |
| Cool dark palette + `--reps-*` tokens | Reason not recorded |
| WebP hero images (11MB → 130KB) | Page weight |
| Profile menu, sign-out confirm, edit name | The display name is what students and parents see, so it has to be editable |

## RJ onboarding — first real coach (Jul 16–20 2026)

| Feature | Why it exists |
|---|---|
| Completion-based roster grouping (Done / In progress / Not started / Nothing assigned) | A coach scanning the roster needs to see who owes work without opening anyone |
| Assignments persist — `week_start` filter dropped | The filter hid every assignment whenever the stored week didn't match the computed Monday, so all students read "Nothing assigned" |
| `logs.assignment_id` → `ON DELETE SET NULL` | Clearing assignments must never delete a student's logged history |
| "All done" state on student detail | Reason not recorded |
| Per-assignment overflow menu | Gave the coach a way to correct or remove a single assignment |
| Edit amount, gated on no logged progress | Moving the target under a student who has already worked against it would silently rewrite what "done" meant |
| Saved custom exercises ("My exercises") | Default libraries are the product; custom creation is the escape hatch for a coach's own drills |
| Exercise library expansion + per-exercise preset overrides | One category mixes scales — suicides run in tens, planks in single minutes |
| SMS on first assignment of the day, not on add-student | So one setup session doesn't fire five texts while a coach adds five drills |
| Activity type included in the invite SMS | The student's only text has to work as a first touch, not just a repeat |
| `requireCoach()` profile-completion gate + players INSERT RLS | An authed user with no coaches row could otherwise reach the whole instructor app without finishing signup |
| Coach name via `coach_name_for_token` RPC | `coaches` isn't anon-readable, but the student's screen still has to name their coach |
| Landing product-loop section | Reason not recorded |

## Makes logging & goal types (Jul 22–24 2026)

| Feature | Why it exists |
|---|---|
| Makes logging — optional made-count per log | RJ coaches makes-first ("make 50 free throws"), and it's harder to cheat than a rep count |
| Shooting percentage on the coach's card | Gives the coach the receipt the product exists to produce |
| Log screen rebuilt around a stepper | A bare number field and preset buttons both lost to a control you can tap without thinking |
| Steppers seed from banked totals | Reopening a part-logged assignment should pick up where the student left off, not at zero |
| Delta save (only the increment is written) | Logs are increments summed at read time; writing the running total would re-log every prior session |
| Goal types — attempts / makes / consecutive | RJ assigns by makes, not attempts; a streak is a third shape neither covers |
| `isComplete()` as one shared rule | Seven places ask "is this done?" — miss one and it reports completion too early |
| Left/right side on assignments | Reason not recorded |
| Two-tone progress bar | One bar carries two figures: attempts underneath, makes on top |
| Yellow retired platform-wide | Reason not recorded |
| Green consolidated to one family (emerald → lime) | Bars, labels and numbers were drifting across several greens |
| Celebrate screen — three states (loading / ready / missing) | The defaults doubled as the loading state, so every visit asserted "Done." for a frame — and a student who logged 10 of 50 and refreshed was told they'd finished |
| `sessionStorage` write wrapped in try/catch | Safari private browsing throws on write; an uncaught throw stranded the student on a live submit button, inviting a duplicate row |
| Makes ≤ attempts as a control guard, not a data clamp | A banked mismatch is the coach's signal something went wrong — not something to silently rewrite |

## Roster & landing polish (Jul 24–25 2026)

| Feature | Why it exists |
|---|---|
| Last-activity timestamp on roster rows | Reason not recorded |
| Dark mode contrast pass | Reason not recorded |
| Sticky roster header with profile menu | Keeps the roster's identity and primary action on screen however far the list scrolls |
| Add player moved inline with the heading | Stays reachable without scrolling to the end of the list |
| Scroll-to-top on roster load (`scrollRestoration = manual`) | The browser restored the old offset asynchronously and undid the reset |
| "Clear finished" narrowed to only complete assignments | It previously deleted the player's whole list unfiltered — invisible in the normal flow, wrong on a stale page |
| Landing product loop redrawn around the instructor | The frames spoke to students; the instructor is the customer |
| `Example: basketball` caption on the loop | Basketball is the only active activity, so a broader promise would break at the signup picker |

## Data integrity & the Archive model (Jul 27 2026)

| Feature | Why it exists |
|---|---|
| Log snapshot — `exercise_name`/`unit`/`goal_type`/`target`/`side` copied onto each log | A deleted assignment left its logs with an amount, a date and no record of what they were — and every reader skipped them silently |
| Backfill of RJ's 19 pre-existing logs | Safe because "Edit amount" is hidden once a row has logs, so current values are necessarily the logged-under values |
| `assignments.filed_at` + New/Archive tabs | Replaced a destructive "Clear finished" that deleted finished rows and orphaned their logs |
| Filing is manual and reversible | Nothing auto-archives; a mis-tap costs one tap back, which is why neither move carries a confirm dialog |
| `Delete assignment` unreachable on finished work | Deleting finished work is exactly what the old flow did; finished work is now moved, never destroyed |
| Bulk archive computes its set server-side | An action has to establish its own preconditions — it can't borrow them from whatever rendered its button |
| "Assign again" | RJ asked for auto-reassign when a set is finished; this is the manual half, and it never touches the original row |
| Repeat SMS bypasses the once-per-day gate | A repeat is one deliberate decision days later, not part of a setup batch — swallowing it means the student is never told |
| Layups collapsed to one side-selectable entry | Two entries pre-dated `side`, so a coach could assign "Layups (right hand) · Left" |
| `RETIRED_EXERCISE_NAMES` redirect | `exercise_name` is the only link back to a category, so dropping a name would silently relabel existing work |
| Emerald palette — one hue (150) across the family | The confetti was the lone outlier at 151, and the two greens differed slightly in hue |
| Card progress bars 3px → 2px | Some players now carry 10+ assignments, and a stack of ten read as heavy banding |
| Student screen gets the same New/Archive tabs | Until then nothing could clear finished work off a student's screen, so their list only grew |
| All-done panel moved inside the New tab | As a page-level banner it followed the coach onto Archive and doubled up with the empty state |

## Performance & navigation pass (Jul 30 2026)

| Feature | Why it exists |
|---|---|
| Optimistic UI on Archive / Move back / Assign again / Delete | Each awaited a round trip before anything moved, so a tap read as broken and got tapped again |
| Coach card list moved to client state (`CoachAssignmentList`) | A menu inside a server-rendered card can't remove that card, and the tab wrapper can't tell one node from another |
| `loading.tsx` on the six hot routes | There were none anywhere: nothing painted between tap and render, and Next only prefetches a dynamic route down to its nearest boundary — so prefetch was inert app-wide |
| Assign flow gets its own boundary | It inherited the player-detail skeleton — avatar, tabs, cards — then landed on a category picker |
| Celebrate's boundary renders `null` | It has zero fetches, so any skeleton is a lie about what it's waiting for |
| All seven back links standardised to 44px with the label inside | Six had the label in a `<span>` outside the link — on player detail that label read "Players", so the obvious tap did nothing at all |
| Grey tap-flash removed from assign rows | On iOS `:hover` sticks after a tap, so the row lit grey and stayed lit while the next screen loaded |
| Skeleton fill `#2a2d36` + `sk-breathe` animation | White at low opacity still read as a light shape on near-black, and `animate-pulse` landed the content swap mid-swing |

## Student notes (Aug 1 2026)

| Feature | Why it exists |
|---|---|
| Optional note on the log screen, capped at 100 characters | RJ asked for "a notes section for players" — clarified to the student writing to the coach, not a two-way thread |
| `logs.note` rather than a column on `assignments` | A note belongs to a session; a second log against the same assignment is a second, separate thing to say |
| The cap is enforced at the write path, with the DB CHECK as backstop | `note` rides the same INSERT as `amount`, so letting the constraint reject an over-long note would fail the whole row and lose reps the student actually did |
| Empty and whitespace-only notes normalise to `null`, never `""` | Two spellings of "said nothing" break every reader keying on `note IS NOT NULL` — `""` reads as a real note and renders a blank line |
| Trimmed and re-capped server-side, not just in the textarea | The log screen is public and token-addressed, so the client's cap proves nothing about what arrives |
| The field starts blank on every visit | The steppers seed from banked totals because they show a running total; a note is about the session being logged now, and there is no edit path to take a resent one back |
| Most recent log **with a note** wins, per assignment | Most sessions carry no note, so keying on the newest log would blank an earlier note the moment the student logged again without writing one |
| Surfaced on both the coach's student detail cards and the student's own home cards | A note nobody can read isn't a message — and the student's own card is their only confirmation it was received |

## Log screen layout & type (Aug 1 2026)

| Feature | Why it exists |
|---|---|
| Vertical spacing tightened once the note field landed | The July 27 numbers were sized for a screen whose last content was the stepper block; with the note filling that space, 56px above the stepper was dead air rather than breathing room |
| Note block set to 32px above the button | Every other full-width primary button in the app sits 32px below its last content; this screen sat at 60px once the sticky wrapper's own padding counted — nearly double, on the one screen students use most |
| Progress bar, goal label, stepper and MAKES row grouped as one cluster | Ratios matter more than absolute sizes: the largest gap *inside* the counting cluster was close enough to the gap separating it from the note that nothing grouped, so the screen read as five evenly spaced rows |
| Note label dropped to the progress text's colour | As white it ran at over 3× the contrast of the progress line above it, so an optional field announced itself louder than the work the student opened the screen to do. Its rank over `optional` now rests on weight and size, which colour had been drowning out |
| Note placeholder moved to the documented placeholder token | It had inherited the helper-text value, which separates from typed white by only 3.19:1 — close enough that example text read as a filled field |

## Log screen copy (Aug 1 2026)

| Feature | Why it exists |
|---|---|
| `Log it` renamed to `Log progress` (log screen button + the landing page's hand-drawn mock) | A student paused before logging partial progress — "Log it" read as a final, complete commitment rather than a session update. Surfaced in real testing, not a design guess. Logs are increments summed at read time and the steppers seed from banked totals, so returning across sessions is exactly what the screen expects |
| Note placeholder made exercise-agnostic | "Left hand felt off today" implies a side most of the library doesn't have — every exercise in `SIDELESS_EXERCISES` (jump rope, planks, suicides, sprints, free throws) was being prompted with an example that could not apply to it |

## Roster & add-student polish (Aug 1 2026)

| Feature | Why it exists |
|---|---|
| Roster groups sorted by most recent activity, never-logged players last | Rows were ordered by when the player was added, which bore no relation to the last-activity dates rendered beside their names — the coach read one order and saw another. Never-logged players sort to the bottom of their group rather than being interleaved via a fallback date that would rank "never" against real activity |
| Parent recipient helper text combined into one paragraph | The second sentence sat in its own `<p>` with a 2px margin — too small to read as a deliberate paragraph break, too large to read as continuous prose, so it landed as neither |

## Landing page (Aug 3 2026)

| Feature | Why it exists |
|---|---|
| Hero thumbnail swapped from a piano student to a young soccer player | Soccer is one of the three activities that stay visible at signup under the narrowed picker; the hero should show something being built toward rather than an activity being removed. Compressed to WebP (1016 KB → 68 KB, −93%) at a quality tuned to sit beside its siblings, then re-cropped 5% tighter from the original PNG so the zoom did not stack a second lossy encode |

---

## Not shipped — recorded so the history is honest

| Killed / deferred | Why |
|---|---|
| Leaderboard | Privacy (minors), and it breaks the 1:1 coach/student dynamic |
| Coach qualitative comments | Wouldn't stick |
| Milestone push notifications | Rep counts aren't improvement |
| Slider input for logging | Too much friction |
| Single "Done" button | Assignments span multiple sessions |
| Parent signup | Read-only link only — no second account |
| Progressive disclosure on the makes input | Students missed the makes field entirely |
| Full-width stepper | Buttons felt too far apart |
| Parent weekly digest | Page exists, but no cron, no scheduled job — never sent |
| Retroactive makes editing | `logs_amount_check` blocks `amount: 0`, and there's no RLS UPDATE policy |
