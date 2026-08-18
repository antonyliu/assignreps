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

## Billing — Stripe checkout, webhook, entitlement (Aug 2–3 2026)

| Feature | Why it exists |
|---|---|
| Price locked at $10/mo | Cost to serve was never the constraint — SMS runs pennies to low single digits per free coach — so this was positioning, not margin. $10 still sits well under Trainerize and TrueCoach. $9.99 was set aside because a round number reads as honest and a charm-priced one reads as optimised extraction |
| Three billing columns on `coaches`, all nullable with no backfill | NULL across all three means "never went through checkout", which every existing coach is, and which reads as the free tier |
| No CHECK constraint on `subscription_status` | Stripe owns that vocabulary and has extended it before. The only writer is a webhook, so a constraint rejecting an unfamiliar value would fail the UPDATE and freeze a coach at a stale status while Stripe moved on — wrongly gated or wrongly admitted, silently |
| `coaches` billing writes blocked by a TRIGGER, not just a grant | The July 25 column-grant allowlist was silently dead within a week: something re-granted table-level UPDATE, and Postgres privileges are a union, so the surviving `name` grant restricted nothing. A coach could PATCH any column on their own row. The trigger is the layer that holds — whatever re-granted the privilege once can do it again |
| The trigger covers INSERT as well as UPDATE | Signup writes the whole `coaches` row as `authenticated`, so an UPDATE-only guard would leave a crafted signup free to set `subscription_status = 'active'` on the way in |
| Found by querying live state, not by reading the migration | The migration file described protection that was no longer in force. In this repo the base schema, `logs_amount_check`, the dashboard views and the `coaches: own row` policy are all live and in no file |
| `isEntitled()` as one shared rule — an allowlist of `active` + `trialing` | Two surfaces ask "is this coach paying?" and a coach shown "Upgrade" while already paying is the same bug as one blocked at 3 students despite a subscription. Unrecognised statuses fail closed; `past_due` is deliberately not entitled, since Stripe retries a failed payment for weeks |
| Webhook as a route handler under `/api` — the app's only one | Stripe POSTs from its own infrastructure to a URL, which a server action cannot receive. That is the only reason `/api` exists |
| Signature verified before any part of the body is read, and the body read with `req.text()` | This route can grant entitlement, which every other layer exists to stop a coach doing themselves. Re-serialising through `req.json()` changes whitespace and key order, and the HMAC stops matching |
| Subscription retrieved fresh on every event | Stripe delivers at-least-once and in no guaranteed order, so a stale `updated` can land after a newer one and overwrite current status with old |
| Never assume `active` on checkout completion | A card needing 3DS lands as `incomplete`; writing `active` would grant access to someone who has not paid |
| Three routes home, and a 200 when none match | No single identifier covers every event shape. An unmatchable event is not transient, so a 500 would have Stripe retrying it for days |
| Already-subscribed guard on `createCheckoutSession()` | Testing put **three active subscriptions on one customer** — $20/mo of real double-billing in live mode. Hiding the menu item is not protection: `isPro` only turns true once the webhook lands, so the redirect window is a live double-subscribe window |
| Subscription status resolved at the CUSTOMER level, not per event | Cancelling two stray test subscriptions fired `deleted` for each and wrote `canceled` over a coach who still held a live one. The real-world shape of this is cancel-then-resubscribe |
| `COACHRJ` recreated with no redemption cap | The original was capped at 1, and testing consumed the single redemption — leaving the code dead. The lesson is for live mode, where it is one-way |

## Landing page (Aug 3 2026)

| Feature | Why it exists |
|---|---|
| Hero thumbnail swapped from a piano student to a young soccer player | Soccer is one of the three activities that stay visible at signup under the narrowed picker; the hero should show something being built toward rather than an activity being removed. Compressed to WebP (1016 KB → 68 KB, −93%) at a quality tuned to sit beside its siblings, then re-cropped 5% tighter from the original PNG so the zoom did not stack a second lossy encode |

## Free-tier gate (Aug 4 2026)

| Feature | Why it exists |
|---|---|
| Add-student gate — blocks the 4th player, offers the paywall | The free tier is 3 students forever, not a trial. A 14-day-unlimited trial was rejected: it doesn't prevent the cold roster dump it was reached for, and it reintroduces a deadline the model deliberately avoids |
| Enforcement in `addPlayer()`, with the page check as convenience only | A stale tab, a second device and a direct invocation all arrive at the action with no page gate in front of them. Same lesson as `fileFinishedAssignments()` computing its own set |
| The action fails CLOSED, the page fails OPEN | `count ?? 0` in the action would read "we don't know" as "zero students" and wave a coach past the paywall on a transient hiccup — the failure nobody would notice. The page only decides whether to draw a form, so on a hiccup it shows the form and lets the action decide |
| `limit_reached` carried as a code, separate from the error string | Hitting a paywall is not a validation failure. A red bordered box reads as "you typed something wrong", which is exactly what the coach did not do |
| The paywall renders in place, inside the add-student screen's own shell | A redirect would strand the coach on the roster hunting for an upgrade item buried in a dropdown; a modal is ceremony this screen uses nowhere else |
| `useUpgrade()` shared by both upgrade entry points | A hook rather than a component, deliberately: the two surfaces render genuinely different controls, so what is shared is the handler, not the markup |
| Count-then-insert race knowingly accepted | Closing it properly needs a database trigger, and any migration hits local, staging and prod at once. The cost of the gap is one extra free player for one coach |

## Landing page rebuild (Aug 4–5 2026)

| Feature | Why it exists |
|---|---|
| Hero rebuilt around a single hand-drawn device mock | Replaced a two-circle photo collage. The coach's student-detail screen is the only one where all three things the hero shows are simultaneously real: progress bars including the two-tone makes bar, a completed assignment, and a student's note |
| Every name in the mock invented, and the page's cast unified behind one `CAST` constant | Real rosters are real children and this page is public |
| Device shadows warm, never black | Black on the cream hero greys the cream and makes the device read as a hole punched in the page |
| A dark hero built and reverted the same day | The warm charcoal read as muddy and brown rather than premium. Kept from that pass: the headline's `text-wrap: balance` |
| `text-wrap: balance` on the hero headline | A hard `<br>` fixes one width and produces a widow at every other; balance evens the lines at whatever width the viewport is |
| Hero bullets rewritten to name the mechanism | The old set described outcomes but never said what "it" was or why "live" mattered, so a first-time reader could not repeat back what Reps does. The new set walks the actual loop — assign → text → log → certainty |
| `white-space: nowrap` dropped from the bullets | With nowrap the lines could not break, so the longest bullet set a min-content floor and **the page widened instead** — a horizontal scrollbar in a band around 768px, where the layout goes side-by-side and the type grows at the same breakpoint. Pre-existing, not introduced by the new copy |
| "How it works" rebuilt as numbered steps, then removed entirely | Not a reversal of the work but a scope decision: the instructor and student sections cover the same ground between them, at full size and split by audience. Redundant rather than wrong, so it came out whole |
| Instructor and student sections built as a peer-sized pair | A deliberate departure from the 82% descending-tier rule: that rule stops a later, *lesser* section outgrowing an earlier one — it does not apply between siblings about two audiences |
| Both middle bands set to one blue family at opposite lightnesses | The student section is light *specifically* so it, the instructor band and the footer are not three darks in a row. The page alternates; it does not descend |
| `.program-caption` re-toned to `#9095ac`, off the app's `--reps-sub` token | Desaturating the instructor band lifted its luminance and dropped the caption to 4.46:1, under the 4.5 floor. The app's token is tuned against the app's own surfaces, and matching it by eye is what put this under AA |
| Device shadows tinted from the band they sit on | The instructor band's warm brown shadow was *lighter* than the band in red and green — it was lightening, not shadowing. Found by measuring, not by looking |
| Pricing section centred rather than zig-zagged | The two sections above alternate because they tell a directional story; pricing is a fair comparison, and putting either plan on a side would weight it |
| One shared feature list under both pricing cards | Every feature belongs to both plans — `FREE_STUDENT_LIMIT` gates the 4th student and nothing else. A per-column tick grid would be a straightforward lie about what the app does |
| CTA type raised to 19px/700 | White on the brand blue is 3.59:1, which fails AA as normal text and passes only as large text — and bold only counts as large from 18.66px. Below that, every CTA on the page fails |
| Eyebrow and page metadata reconciled to "Coaches & Trainers" | They diverged for part of a day. It is **five** strings, four in `page.tsx` plus the root fallback title in `layout.tsx`, which would have kept the divergence alive on its own |
| `flex: 1 0 auto` pinned to whichever band is last before the footer | The page is a 100vh flex column and this is its only grower. With none, a 2200px viewport showed a 679px shell band *below* the footer |

## FAQ, legal accuracy & landing copy (Aug 16 2026)

| Feature | Why it exists |
|---|---|
| `/faq` — 19 questions in five groups | Strangers trust nothing by default, and a stranger does not email to ask how to cancel; they simply never sign up. It answers what data is collected, who sees a roster, whether data is sold, and how the free tier works |
| Answers checked against shipped behaviour rather than written to sound good | "Nothing to enter" (the signup tree contains no billing code), "no separate login to remember" (students never authenticate), and the drills answer (30 exercises across 6 categories, three named as a sample so adding a category cannot falsify it) |
| No accordion — every question and answer rendered flat | The same surfaced-over-progressive-disclosure principle already locked for the student note field |
| `/faq` sets its own measured colours instead of inheriting the legal pages' | `/privacy` and `/terms` set headings and links in the brand blue at 3.36:1, which fails AA for normal text. All 48 elements on `/faq` were audited against their actual painted background: zero failures, minimum 4.86:1 |
| A consent question was removed rather than softened | Its answer was gentler than both `/terms` and `/privacy`, which place the obligation squarely on the coach. Removing it leaves the binding statement in one place instead of two that disagreed |
| Three false statements removed from `/privacy` | The parent weekly digest (no cron, no scheduled job — the only occurrence of "digest" in the codebase was the sentence describing it); "students and parents receive SMS" (parents receive nothing — both notify paths send only to `players.phone`); and "every SMS includes STOP instructions" (no message body contains it — the mechanism is carrier-level and automatic) |
| The §2 testimonial removed and saved verbatim to `docs/deferred/` | Placeholder copy never approved by RJ, and the only thing in `page.tsx` blocking the rest of the file from shipping. The quote was a **reconstruction** of four reported fragments sitting inside quotation marks, and "AAU coach" appears nowhere in anything recorded about him |
| Header nav — Pricing · FAQ · Sign in | Landing page only; the legal pages carry a `← Back` link into a prose shell instead, so there is no shared header to keep in sync |
| Section CTAs stop reading identically | Each now names its own section's payoff rather than repeating one label four times |
| In-app paywall corrected to "up to 30 students" | It read "Pro unlocks unlimited", which contradicted the pricing card. This is the surface a coach sees at the moment they are asked to pay, so it was the more important of the two to correct |
| Footer reuses the instructor band's colour; its top rule removed | The rule's documented job was separating the footer from a band it once shared a colour with; against the near-white pricing band it measured 1.04:1 — invisible, and merely made the footer 1px taller. Every ink in the footer moved with it, because the lighter background dropped two of them under AA |

## Stripe Customer Portal & copy pass (Aug 17 2026)

| Feature | Why it exists |
|---|---|
| Self-serve cancellation via the Stripe Billing Portal | The pre-launch item most likely to burn a stranger: a coach could subscribe with no visible way out, and `/faq`'s cancel answer described a flow that did not exist. Building it made that answer true |
| Gated on having a Stripe customer, not on `isEntitled()` | A lapsed coach still has invoices and still needs a way back in |
| Verified against a real cancellation, with RJ's row checked on both sides | Stripe reported `active` with `cancel_at` equal to `current_period_end`, both webhook events returned 200, and no other coach was touched — the customer-level resolution held, which is the specific Aug 3 regression |
| Compare `cancel_at` to `current_period_end`, never trust `cancel_at_period_end` | On API version `2026-07-29.dahlia` the boolean reads FALSE even when the cancellation *is* correctly scheduled for period end |
| Hero and pricing copy rewritten, all trial language dropped | "Try" implies an expiry, and the free tier is 3 students forever. Honest *free* framing instead |
| Student-count line made the pricing cards' visible differentiator | It was quieter than the shared feature list beneath it, despite being the only real difference between the two plans |
| Hero headline through three sizing passes in one session | Raised to 36px/700 for hierarchy against the 18px/600 bullets, trimmed to 34px to recover fold clearance, then tracking relaxed from −0.5px to normal after it read as intense on a real device |
| `/faq` mobile spacing and `/privacy` heading contrast | The privacy headings were failing AA at 3.36:1; the fix was already proven on `/faq` and simply had not been applied |

## Student deactivation (Aug 17 2026)

| Feature | Why it exists |
|---|---|
| `players.deactivated_at` — a reversible pause | Mirrors `assignments.filed_at`, the pattern this codebase already uses for reversible state. A timestamp rather than a boolean keeps *when* as well as *whether*, at no extra cost |
| Deliberately **not** named `archived_at` | "Archive" already means a finished assignment filed away, on both the coach's screen and the student's. A second meaning for players would make the word ambiguous in every conversation and every function name — the exact collision `filed_at` was named to avoid |
| A full pause in both directions | The coach cannot assign and the student cannot log. Hiding a paused student from the assign flow alone would leave them still logging against work nobody is watching |
| `saveLog()` enforces it server-side | `logs` has **no RLS policy at all** and `saveLog` takes `playerId` as an argument, so the log page's redirect proves nothing. This read is the only thing that actually stops a paused student's write |
| `activatePlayer()` re-checks the seat gate | Activation is the only moment a student re-enters the active count, so it is the only place the gate can be applied — and without it a Pro coach could add 30 students, cancel, and keep all 30 running on Free forever |
| `deactivatePlayer()` deliberately ungated | It only ever frees a seat, and it is a coach's escape hatch when a downgrade leaves them over the ceiling. Gating the escape hatch would trap them |
| `PRO_STUDENT_LIMIT = 30` and `activeStudentLimit()` | "Up to 30" had been copy on three unlinked surfaces with nothing behind it. The reactivate gate needed a plan-aware limit, and two gates disagreeing about what a plan allows was not an option |
| `ceiling_reached` kept distinct from `limit_reached` | A Pro coach at 30 has already paid and has no higher plan to buy, so showing them an upgrade button would be a lie dressed as a solution. They are told to deactivate someone instead |
| Roster gains a collapsed "Inactive" group, last | Inactive comes from the player row and wins over all four completion groups. The rows themselves are identical to active ones — dimming a student's row would make their record look degraded, which is the opposite of what deactivation promises |
| A paused student's token link still opens | Never a 404. A dead link reads as "you've been removed" to a kid who has simply stopped for the season; they get their coach's name and "everything you've logged is saved" |
| Permanent delete moved behind a typed confirmation | `players` cascades to both `assignments` and `logs`, so one tap destroyed every rep a student had ever recorded — the app's most destructive act behind its lightest control. Typing the student's own name proves you know *whose* history is going |
| Delete stays reachable directly from the active state | Forcing deactivate-first would make the safe action a step on the way to the destructive one, which teaches a coach to tap straight through it |

## Over-limit assign gate (Aug 17 2026)

| Feature | Why it exists |
|---|---|
| Assigning blocked account-wide while `active_count > plan_limit` | The add-student gate stopped a lapsed coach ADDING students but not assigning new work to the ones already on the roster — so one $10 payment bought unlimited ongoing operation above the free tier. Pro's value is the ongoing ability to operate above 3, not the one-time ability to get there |
| Account-wide, never per-student | Which students stay operative — who a coach is mid-season with, who is closest to finishing — is real judgment only they have. Deactivation is the tool for it; the moment they are back under the limit everything unfreezes for whoever is left active |
| `>` here against `>=` in the add gate | Adding needs room for one more; assigning only needs the roster to be within the limit. A Free coach at exactly 3 active can still assign to all three and simply cannot add a fourth |
| `saveLog` deliberately untouched | Students keep logging work already assigned. It reads only `players.deactivated_at` and no plan state at all, so logging is plan-agnostic BY CONSTRUCTION rather than by a rule someone has to remember — which is what keeps this distinct from deactivation's full per-student pause |
| The gate fails OPEN, the reverse of the add gate | The add gate guards NEW capacity, where failing open silently gives away paid capacity. This one freezes work for a coach who has already paid, where wrongly freezing a compliant coach on a hiccup is the worse failure |
| `student_paused` wins over `over_limit` when both apply | It is the more specific fact about the student the coach is looking at, and it stays true after the limit is fixed — leading with the account message would send them to solve the wrong problem first |
| `over_ceiling` split from `over_limit` | A Pro coach past 30 has no higher plan to buy, so offering an upgrade would be a lie dressed as a fix. Same split the add-student ceiling already makes |
| Both checks run in parallel; the six assign routes share one convenience guard | Parallel means the gate costs no more latency than the single per-student check it replaced. One shared guard rather than six copies, because partial coverage across those routes is worse than none — the failure becomes unpredictable rather than absent |

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
| 14-day unlimited trial | Doesn't prevent the cold roster dump it was reached for, and reintroduces a deadline the free-forever model deliberately avoids |
| Dark landing hero | Built and reverted the same day — read as muddy and brown rather than premium |
| Per-column tick grid on the pricing cards | Every feature belongs to both plans; a grid would be a straightforward lie, and it would undercut a free tier that is deliberately generous positioning |
| White housed panel around the pricing feature list | Bought presence at the cost of being a third boxed object on a band that already had two |
| §2 testimonial from RJ | Removed pending his sign-off — the quote was a reconstruction, and two claims about him were unverified. Markup saved to `docs/deferred/` |
