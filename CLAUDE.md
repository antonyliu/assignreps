# Reps — CLAUDE.md
*Last updated: Aug 17 2026 · See `CHANGELOG.md` for shipped-feature history. Prod commit and environment sync are not tracked here — they drifted three times in two days. Run `git branch -r -v`.*

---

## 📍 Current state — Aug 17 2026

**Read this first. It supersedes the two dated sections below** (*Where we left off — Aug 5* and *Where things stand — Aug 6*), which are kept as history and are stale wherever they disagree.

**Git:** local `main` = `origin/staging` = `8933a97`. Prod (`origin/main`) is `88de42a`, **73 commits back** — everything below is on staging only, nothing is live.
⚠️ Re-run `git branch -r -v` rather than trusting these numbers; they go stale immediately.

### Shipped tonight

- **Stripe Customer Portal — built and verified end to end.** `createPortalSession()` in `instructor/billing/actions.ts`, reached from a **"Manage subscription"** row in `ProfileMenu` (panel cap raised 160px → 176px so the label is not crushed). Verified in test mode against a real cancellation: the portal opened, the cancellation registered at period end, the webhook processed both events, and **RJ's account was confirmed untouched** during Tony's cancellation.
- **`/faq`'s cancel answer is now TRUE**, not a promise written ahead of the build. The 🛑 gates on it in code and in this file are cleared.
- **Hero and pricing copy rewritten.** All "try/trial" language dropped in favour of honest *free forever* framing. Headline is **"The work you give them, gets done."** at 34px/700 with **normal tracking** (relaxed from −0.5px the same night, after it read as intense on device). CTA button reads **"Start free"**.
- **Pricing cards:** the student-count line is now the visual differentiator at **20px/600**, where it was previously quieter than the shared feature list. A note sits under the **Pro card only** — "Need more than 30? Just email us."
- **`/faq` mobile spacing** fixed (heading clamp + line-height, Q/A separation 22px → 32px).
- **`/privacy` heading contrast** fixed — was failing AA at 3.36:1, now matches `/faq`'s measured values.
- **Testimonial removed** from `page.tsx`, saved verbatim to `docs/deferred/section-2-testimonial.md`. Waiting on RJ, low priority.
- **Hero device mock scaled to 120%** (`--pw` 206px), header gap halved (48px → 24px).
- **Deactivate/Activate students — BUILT.** Migration `20260817120000` adds `players.deactivated_at` (nullable timestamptz, mirroring `assignments.filed_at`). A full pause in both directions: the coach cannot assign, and the student cannot log. Their token link still opens and shows a "you're on pause" screen naming their coach. Roster gains a collapsed **Inactive** group; `PlayerManage` gains **Deactivate/Activate**, and **Delete** moves behind a typed confirmation. See *Deactivation* below.
- **Assigning is now blocked account-wide while a coach is over their plan limit** (`d1018f7`) — the other half of the downgrade loophole. Assign-only and account-wide; logging is untouched. See *Over-limit assign gate* below.
- **The 30-student Pro cap is now ENFORCED**, as a side effect of the above. `PRO_STUDENT_LIMIT = 30` and `activeStudentLimit()` are real code in `entitlement.ts`, asked by both the add gate and the reactivate gate.

### Still open, ranked

1. ✅ **Deactivate/Activate students — BUILT Aug 17 2026.** The loophole it was elevated for is closed: `activatePlayer()` re-checks the seat gate, which is the only moment a student re-enters the active count, so a downgraded coach cannot quietly keep 30 running on Free. ⚠️ **The migration must be run by hand in the Supabase SQL editor** — see `supabase/migrations/20260817120000_add_deactivated_at_to_players.sql`. Nothing else in this build works until it is applied. ⚠️ **Not yet device-tested**, and the deactivate/activate/delete modals and the collapsed roster group have never been seen on a real phone.
2. ✅ **Students and parents can reach `/privacy`** (Aug 17 2026, `e18b5c2`). `PrivacyFooter` on the student home, the paused screen, `/student/login` and the parent view, pointing at the minors anchor. See *PrivacyFooter* below.
3. ✅ **Signed-in coaches can now reach `/faq`, `/privacy` and `/terms`** (Aug 18 2026, `fbf53d0` then `5f7ca47`). A **"Help & Legal"** row in `ProfileMenu` which swaps the open panel in place to a second view holding all three links. ⚠️ **LOCAL ONLY — neither commit is on staging or prod.**
   - ⚠️ **CORRECTION — this item used to state that `ProfileMenu` "is on every instructor screen". IT IS NOT, and never was.** It renders on exactly ONE screen, the roster (`instructor/students/page.tsx`), which `instructor/billing/actions.ts` had already recorded independently — *"the only page ProfileMenu renders on"*. Two places in this repo disagreed and the wrong one was the one being planned against.
   - **The host choice survived the correction, on different grounds than the false ones.** Not "it is everywhere" but: the roster is the app's home and every task starts there, and the alternative — a persistent footer — was rejected because **four of the eight coach screens end in a `sticky bottom-0 mt-auto` CTA** that a footer would sit beneath or fight (the same argument that keeps `PrivacyFooter` off the student log screen), and because the only shared wrapper, `instructor/layout.tsx`, is a bare width container **shared with the signup tree** — which already carries its own consent notice and whose state any navigation destroys (item 10).
   - ⚠️ **Roster-only is therefore the DECISION, not a shortfall.** A coach three screens into the assign flow backs out to reach it. That is the right trade: nobody wonders about a privacy policy mid-assign.
   - ✅ **Neither a `PrivacyFooter` variant nor a sibling was needed** — the two shapes this item predicted. The menu links to the **top** of `/privacy`, which is written to coaches, rather than `#students-and-minors`, which is written to parents; and students are never handed a `/terms` link they did not agree to. `PrivacyFooter` is untouched.
   - ⚠️ **The app's FIRST multi-level menu.** All four overflow menus are one boolean plus a rendered `fixed inset-0 z-40` click-away sibling — no document listeners, refs, Escape handling or focus traps anywhere. `menuOpen` stays the sole authority on open/closed; the sub-view is a second state **normalized when the menu OPENS, never reset on close**, which is what makes "closed but stuck in the sub-view" unreachable and what makes click-away closing the whole thing free. The reasoning is written out at length in `ProfileMenu.tsx`; read it there before adding a second level anywhere else.
   - ✅ **Device-tested Aug 18 2026 and accepted.** The panel changes size between the two views — width in **opposite directions by plan** (Pro 169px → 142.5px, free 132.4px → 142.5px), height 191px → 159px for both. Confirmed good on a real phone; `w-max` stays. A fixed height was rejected rather than skipped — there is no single main-view height to match, since `isPro` swaps the billing row, both error paths add wrapping paragraphs, and an absent `coachName` drops the name row and its divider together.
4. **Desktop hero headline still reads "intense."** Mobile was addressed via tracking (now `normal`); desktop was not. Next lever is already scoped: colour `#0f0f10` → `#1a1a1a`, still 13.4:1 and zero layout cost. ⚠️ Do not drop the 700 weight — it is what carries the hierarchy against the 18px/600 bullets.
5. **Mobile scroll rhythm** — hero CTA to the next section's CTA feels too fast. Proposed and undecided: swap §2/§3 stacking order on mobile to mocks-first rather than copy-first.
6. **Fold clearance is thin.** 10.4px at 375×812, and the "Free, forever. No card." support line now sits **below the fold on tall phones**, not just SE-class. Flagged; not yet decided whether it matters. `--pw` toward 190px is worth ~30px if it does.
7. ✅ **The 30-student Pro cap is now ENFORCED** (Aug 17 2026), closed as a side effect of item 1 — the reactivate gate needed a plan-aware limit, and having two gates disagree about what a plan allows was not an option. `PRO_STUDENT_LIMIT = 30` plus `activeStudentLimit(subscriptionStatus)` in `entitlement.ts`; both `addPlayer()` and `activatePlayer()` route through it and both fail closed.
   - ⚠️ **A Pro coach at 30 now gets a DIFFERENT dead end from a free coach at 3**, and the distinction is load-bearing: they have already paid and there is no higher plan, so showing them an upgrade button would be a lie. `AddPlayerResult` carries `ceiling_reached` alongside `limit_reached` for exactly this, and `AddPlayerForm` renders `CeilingBlock` instead of `UpgradeBlock`.
   - ⚠️ **`AddPlayerForm` now reads the number from the constant; the pricing card and `/faq` still hold hand-written 30s.** Two of the three surfaces still move by hand.
8. **Remaining privacy-audit bundle.** ✅ **Phase 1 (accuracy) done Aug 17 2026** — Stripe named, student notes and billing fields disclosed, the player-delete cascade and deactivation covered, the account-deletion promise made honest about being manual, `/terms` re-worded to "coaches and trainers", and `/faq`'s advertiser over-claim trimmed. ✅ **Phase 2 (minors) done Aug 17 2026** — the section now addresses parents and carries a deletion route that does not go through the coach. ✅ **Phase 3 (contrast) and phase 4 (date bump) done Aug 17 2026** — both pages audited to **zero AA failures** and dated **August 17, 2026**. **The bundle is closed.** ⏸️ What remains was never part of it: three gaps needing NEW terms written (refunds, user termination, stating the plan limits), deferred as a group — see *Legal pages* below. ⚠️ And ranked item 9: coaches still never see or accept `/terms` at all, which no amount of copy on that page can fix.
9. ✅ **Coaches now see `/terms` and `/privacy` at signup** (Aug 17 2026). A notice under the "Send code" button on `/instructor/signup/email`: *"By continuing, you agree to our Terms and Privacy Policy."* Both linked. Until then the entire signup tree contained no reference to either.
   - ⚠️ **A NOTICE, NOT A GATE — no checkbox, no consent column, no timestamp, and that is deliberate.** The `coaches` row is inserted CLIENT-SIDE in `submitCode()`, so a checkbox gating a button the client also controls proves nothing a bug or a crafted request could not walk past. It would look more rigorous while being exactly as unenforceable. **Do not "strengthen" this into theatre.** ⚠️ A backfilled `terms_accepted_at` for existing coaches was also rejected — it would manufacture a record of something that never happened, which is the class of thing the Aug 16 pass deleted three of from `/privacy`.
   - ⚠️ **It renders on BOTH first signup and every returning sign-in**, because that screen serves both — the landing header's "Sign in" links straight to it, and the insert tolerates a 23505 unique violation precisely because the row may already exist. Nothing distinguishes new from returning until after the email is submitted. A checkbox would therefore also have been shown to coaches who signed up months ago.
   - ⚠️ **CORRECTION to what this item used to say.** It claimed *First-touch trust at signup* wanted the same real estate and the two should be built together. **That was wrong.** That item targets the FIRST screen — `/instructor/signup`, the name field, "below the *Already have an account?* line" — and this one is the THIRD. Different screens, no conflict, and nothing about the trust line was built here. It also carries an unverified claim (*"nothing shared"*) that now has to be checked against a `/privacy` naming four processors.
   - ⚠️ **What this does NOT fix:** the strongest place for the SMS verbal-consent requirement is not signup at all — it is the add-student screen, where a coach is actually about to type someone else's phone number. That is its own, better-targeted item and is still unbuilt.
10. ⚠️ **Signup state is unprotected — one navigation away loses it.** `SignupProvider` holds `name`, `instructorType` and `email` in plain `useState`, mounted by the signup layout. **Nothing is persisted** — no `sessionStorage`, no draft row — so leaving the signup segment by ANY route destroys all three and drops the coach back at step 1: a link out, browser-back (which remounts the provider empty), an accidental tab close, a phone killing a backgrounded tab.
    - ⚠️ **`4dfcaed` guards ONE LINK, not the flow.** Opening the consent links in a new tab means the signup tab is never navigated — but that is a guard rail on the only link that exists today, not a fence. **The next link added out of signup hits the same cliff**: a help line, an activity-type explainer, a pricing link. *First-touch trust at signup* is a live candidate for exactly that.
    - **Direction: `sessionStorage`, and the pattern is already in this codebase.** The celebrate screen writes and reads a payload that way, with BOTH sides wrapped in try/catch — ⚠️ Safari private browsing throws on write, and an uncaught throw there would strand the coach mid-flow, which is the same failure that would have stranded a student on a live log button.
    - **Cheap, and easy to forget** once the current symptom is gone — which is the whole reason this is written down rather than left in a commit message.
11. **Landing page metadata** (title/description/OG — **five strings**, four in `page.tsx` plus the fallback in `layout.tsx`). Parked, needs real thought: SEO wants "practice/drills" keywords, but "practice" collides with basketball's team-session meaning.
12. ⚠️ **`saveAssignment()` and `saveCustomAssignment()` do not verify the player belongs to the coach.** Both insert with `coach_id: user.id` and a **client-supplied `player_id`**, leaning on RLS alone rather than reading the row first — unlike `repeatAssignment()`, which is player-scoped, and `addPlayer()`, which counts server-side. **Found Aug 17 2026 while building deactivation and deliberately left**, to keep that build scoped; the pause check added to both actions goes through `requireActivePlayer()`, which *is* ownership-scoped, so it happens to close the gap for those two calls — but the insert itself is still unguarded and would remain so if that check were ever removed. Its own small pass: read the player scoped by `coach_id` and refuse if absent, in both actions.
13. ⚠️ **CLAUDE.md date error — the Aug 6 / Aug 16 mixup.** `/faq`, the privacy fixes and the testimonial removal are labelled **"Aug 6" throughout this file**, but git dates every one of those commits **Aug 16** (`c675f39`, `f5ccbff`, `7416c69`, `b5f4db0`, `ab6a7f3`). The cause is visible in the log: there is a clean ten-day gap with no commits between `72469a8` (Aug 5) and `c675f39` (Aug 16), matching the *"⏸️ Where things stand — Aug 6, pausing for a while"* note — so the pause date got carried forward as the session's own date when work resumed. Roughly a dozen references need correcting, across the `/faq` section, the legal-pages audit and the Landing page section. Found Aug 17 2026 while backfilling `CHANGELOG.md`, which uses the git dates and is therefore correct where the two disagree. **Not urgent — but the case study should use the right dates**, so this wants its own pass rather than being fixed opportunistically.
14. **CLAUDE.md restructure** — split current state from narrative history into `docs/`. Its own isolated pass.
15. **Roster view at scale — backburner design question.** Testing the 30-student Pro ceiling surfaced that a flat card list of 30 feels overwhelming to scan, even though most of a coach's actual attention only lives in two of the four status groups (Done / In progress). ⚠️ **Some of that reaction was likely the test data itself** — 24 identically-named placeholder rows with no real variation — rather than the list format; real names and real activity patterns would read differently. But the underlying question is worth keeping: whether a card list is the right format for scanning thirty players at once, versus something more spreadsheet-like. **Revisit once a coach actually approaches that number organically, not from seeded test data.**
16. **Later, no urgency:** the signed-in app is capped at phone width on desktop/tablet; landing page modules feel rigid block-to-block (TeuxDeux-style overlap was the direction); an animated hero walkthrough.

### ✅ Going live — DONE (Aug 18–19 2026)

⚠️ **This section used to read "Going live is a separate task" and listed what was outstanding. It is done.** Live product and price created, live API keys and webhook endpoint configured, all three Stripe env vars set on prod, and the whole path proven end to end — see *Verified end to end — LIVE MODE ON PROD*. **Prod runs on `sk_live_`.**

⚠️ **The dated section this sits inside is Aug 17 and predates all of it.** Where the two disagree, this block and the live verification block are current.

✅ **The Customer Portal cancellation setting IS confirmed in live mode** (Aug 19 2026) — checked directly in the live dashboard and already set to **"Cancel at end of billing period"**, matching test. `/faq`'s cancel answer is therefore true in live as well as test. ⚠️ It is still a DASHBOARD setting with no code representation: switch it to Immediately and that answer silently becomes false, with nothing in the repo to catch it.

✅ **RJ has been re-provisioned in live mode** (Aug 18 2026) — a subscription created **by hand in the live dashboard** with a **"RJ Free Access, 100% off forever"** coupon applied (first invoice $0.00, Active), and his `coaches` row repointed to his live customer and subscription ids by a direct database write. Dashboard-confirmed by Tony; the CLI here has test credentials only and cannot see live.

⚠️ **His old test-mode subscription did NOT carry over and was never meant to** — `sub_1U0aJ6JoxKRCY55iGi5HfZ3l` is still `active` in test mode, now orphaned and referenced by no row. Harmless; part of the stale-test-data audit.

⚠️ **A redeemable promo CODE named `COACHRJ` in live mode is NOT established.** What was confirmed is a *coupon* applied directly to RJ's subscription — which is not the same thing as a code anyone could enter at Checkout. If RJ's subscription is ever rebuilt via Checkout rather than by hand, check whether a live promo code exists first, and create it **uncapped** — the test original was destroyed by a single redemption.

⚠️ **`COACHRJ` IS RJ'S PERSONAL CODE. It must never be given to, reused for, or renamed for another coach.** The name is his; handing it to someone else makes every later conversation and every dashboard row ambiguous about who it was for.

⚠️ **A second comped coach needs a NEW, GENERICALLY-NAMED code — created fresh when that need actually arises**, not pre-made and not adapted from this one. Something in the register of `FRIENDSANDFAM` or `COMPED`; **the name is not decided** and should be chosen at the time rather than inherited from this note.

⚠️ **"Uncapped" is a TESTING-SAFETY measure, not an invitation to share.** `max_redemptions` is unset on `COACHRJ` for one reason only: a cap of 1 means testing the code consumes the single redemption and destroys it, which is exactly what happened on Aug 3. It does **not** mean the code is meant for more than one person. Read the two properties separately — *who it is for* is one person; *how many redemptions it allows* is unlimited so it survives being tested.

---

## 🔖 Where we left off — Aug 5 2026

**Start here tomorrow.** Everything below is committed on local `main`; nothing is in progress and the working tree is clean.

Today was **one thread, all day: the landing page.** No billing, schema or app code was touched. The page went from hero → section 2 → *"how it works"* → footer, to **hero → section 2 (instructor) → section 3 (student) → pricing → footer**, and the colour system underneath it was rebuilt.

### Git state at close

**Counting this commit**, `main` is **41 commits ahead of prod** and **35 ahead of staging**. Both remotes are ancestors, so either push is a clean fast-forward. Prod sits at `88de42a`, staging at `7e0660d`.

⚠️ **Do not carry these numbers forward — re-run `git branch -r -v`.** Yesterday's close-out recorded 34/28 and was already 35/29 by the next morning, because the commit that writes this line also increments it. That is why the two remote SHAs are given and the local tip is not: those are stable, the count is not.

### ⚠️ Carried forward from Aug 4 — NOTHING here moved today

Today was a landing-page day and touched none of this. It is restated rather than pointed at, because it is the only blocking item on the project and it must not fade out of this section just because a different thread was active.

⚠️ **Prod is held back deliberately, not by neglect.** Prod has no Stripe env vars, and `main` carries two things that depend on them:

1. The **"Upgrade to Pro"** menu item, which would error on tap.
2. The **add-student gate**, which is the serious one. `isEntitled()` reads `subscription_status`, which is NULL for every coach in live mode — so on prod RJ reads as free tier and is **blocked from adding his 11th student**.

⚠️ **RJ still has not been told about the 3-student limit, and that conversation is the blocking item.** He is at ~10 students and holds no live-mode subscription. It is real code on `main`: the day this reaches an environment he uses with live billing, he is stopped. He must either be told, or be provisioned in live mode first — ideally both, in that order. Still owed, and no longer safe to defer indefinitely.

⚠️ **The whole landing-page redesign is stuck behind that same gate** — now roughly thirty-five commits, none of which touch billing. If any of it is wanted on prod sooner, cherry-pick onto a branch off `origin/main` rather than pushing `main`.

### The day's arc, in order

Five commits, each verified with `tsc`, a real `next build`, and a measured width sweep (375/414/768/1024/1280/1440) before the next began.

1. **`b57a7ee` — rebuilt "how it works" as numbered steps.** Replaced four cramped phone frames with an ordered list, and fixed a measured hierarchy inversion: the old heading was a flat 32px that *tied* section 2 at 768 and sat at 70% at 1280, and the frames were 228px against section 2's 222px.
2. **`5f2faad` — then removed that section entirely.** Not a reversal of the work but a scope decision: section 2 and the incoming student section cover the same ground at full size, split by audience. Redundant rather than wrong, so it came out whole.
3. **`5bef362` — eyebrow copy**, in two steps: instructors → coaches → **"For coaches & trainers"**.
4. **`1bce6c0` — section 3, the student side, plus the colour system.**
5. **`a101285` — the pricing section.**

### ✅ Section 3 — the student side (BUILT)

Section 2's template, flipped: copy and screens swap sides at 1024, so the device side alternates down the page (hero left, section 2 right, here left). Two new screens, both Jalen's — the log screen and his own home with New/Archive tabs.

⚠️ **Jalen's state is not free.** Section 2's roster already says *"Jalen — 1 of 3 done"*, so his screens must show exactly three assignments with exactly one finished. `CAST` gained his other two drills to satisfy that. The log screen deliberately draws **Free throws, not Corner 3s** — showing the chained assignment mid-log on one screen and finished on the other would put two states of one thing on one page.

⚠️ **Peer-sized with section 2, a deliberate departure from the 82% tier rule.** That rule stops a later, *lesser* section outgrowing an earlier one; it does not apply between siblings. This matters for the flow pass below — the sameness is partly on purpose.

### ✅ Colour system — sections 2 and 3 locked (BUILT)

Both middle bands are now **one blue family at opposite lightnesses**, two degrees apart:

| Band | Hex | HSL |
|---|---|---|
| Hero | `#ede9e3` *(untouched)* | 36°, 22%, 91% |
| Section 2 | `#262a39` | 227°, 20%, 18.6% |
| Section 3 | `#caccd5` | 229°, 12%, 81.4% |
| Pricing | `#f8f7f5` | effectively neutral |
| Footer | `#1a1d24` *(untouched)* | — |

Arrived at over three passes: section 2 off the old neutral `#252932`, both saturated into real blue, then both **desaturated ~12–15 points** at identical hue and lightness. Section 3 is deliberately light — without it the page runs section 2, section 3 and the footer as three darks in a row.

⚠️ **Two things broke as a side effect and were fixed, both found by measuring rather than looking:**
- **`.program-caption` failed AA.** Desaturating section 2 lifted its luminance and dropped the caption to **4.46:1**, under the 4.5 floor for 13px. Now `#9095ac` at 4.81:1, and deliberately **no longer the app's `--reps-sub` token** — that value is tuned against the app's own surfaces, not this band, and matching it by eye is what put it under AA.
- **Section 2's device shadow was lightening, not shadowing.** The warm brown was *lighter* than the band in red and green. Both device shadows are now tinted from the surface they sit on — the rule the warm hero already followed — and both are verified to darken their band.

### ✅ Pricing section (BUILT)

Centred, not zig-zagged: sections 2 and 3 alternate because they tell a directional story; pricing is a fair comparison and putting either plan on a side would weight it. Background `#f8f7f5`, reused from `/privacy` and `/terms` rather than invented, and outside both existing families so it reads as a resting point.

⚠️ **Every feature belongs to BOTH plans, and the section is built to say so** — one shared list under both cards, headed *"Everything included, always"*. The only real difference is the student count, since `FREE_STUDENT_LIMIT` gates the 4th student and nothing else. **Never rebuild this as a per-column tick grid**; it would be a straightforward lie about what the app does, and it would undercut a free tier that is deliberately generous positioning rather than a trial.

Copy is literal feature names in TeuxDeux's register, each checked against shipped behaviour. ⚠️ **"Log history" claims logs are kept and nothing more** — nothing reads them longitudinally yet, so any progress-over-time wording would promise a view that does not exist. An earlier draft said *"Full history, always"* and was pulled for exactly that.

⚠️ **Both CTAs read "Start free", identically, and that is the point.** Both target `/instructor/signup`; there is no "start Pro" path anywhere, because Pro is only reachable *after* signup via the add-student gate or the profile menu. Wording them differently implied a commitment distinction that does not exist at the click.

Subtext is **"Free forever with your first three students."** — one line at every standard width, wrapping cleanly below ~348px. It absorbs a standalone "No card to start" line that was removed. ⚠️ That absorption is **implicit**: "free forever" reads as no-payment, but the words *card* and *payment* now appear nowhere in the section.

**Two visual iterations worth not repeating:**
- A **white housed panel** around the feature list was built and removed — it bought presence at the cost of being a third boxed object on a band that already has two.
- **Solid brand-blue badges** were built and backed off to a tint: at eight repetitions they read as a wall of blue dots. Presence now comes from scale (24px badges at 1.5× the label, a 22px/700 statement) rather than from colour.

⚠️ **The pricing statement is brand blue only because it is large.** `#378add` is 3.36:1 there, which passes *only* under the large-text allowance — that needs **≥18.66px AND bold**. Smaller or lighter and it silently fails.

### ⚠️ `flex: 1 0 auto` has moved three times in one day

The page is a 100vh flex column, and this is its **only** grower. It has to sit on **whichever band is last before the footer**, or the shell colour shows as a band *below* the footer. Verified real, not theoretical: with no grower at all, a 2200px viewport showed a **679px** band under the footer.

It went `.program-section` → `.student-section` → `.pricing-section` today. **Move it again the moment a new section lands at the bottom.**

### ⚠️ OPEN — `.cta-real` fails AA, on all four CTAs

**Found today, deliberately not fixed, and it predates today.** White text on the brand blue `#378add` is **3.59:1**. At 17px/700 that is under the 18.66px-bold threshold for large text, so it needs 4.5:1.

It affects **every** `.cta-real` on the page — hero, section 2, section 3 and pricing — so it is not a pricing bug. Left alone because the brand blue has been locked twice and this reaches well past the scope it surfaced in. Three ways out:

1. **CTA text to 19px/700** — crosses the large-text threshold, so 3.59:1 then passes against a 3.0 requirement. No colour change; every CTA grows.
2. **Darken the fill** to roughly `#2f7ac4` — reaches 4.5:1, but changes the brand blue.
3. **Accept it** — large, high-elevation, unambiguous buttons, and the miss is narrow.

⚠️ Note that both pricing buttons now read "Start free", so option 1 grows them together.

### Next sessions — two distinct pieces of work, do not merge them

⚠️ **There are now two "next" threads and they are not the same job.** Keeping them apart is the point:

1. **The pre-launch checklist** — see *🚪 Pre-launch checklist: strangers, not RJ* immediately below. This is the **gate** before the landing page and billing go live to anyone who is not RJ. Nothing ships to strangers until it is done.
2. **The organic flow pass** — landing-page craft, described next. It is **not** a launch blocker; the page is shippable without it.

If they compete for a session, the checklist wins — it contains promises to real people, where the flow pass is polish.

**The flow pass** is written up in full under *Parked, deliberately* below: the page is five bands with a hard colour cut at every seam, and the direction is to explore gradients and bleed — content crossing a boundary rather than each band starting and stopping cleanly. That entry also records what must **survive** the pass (the deliberate peer-sizing of sections 2 and 3), what has already been **tried and reverted** (tilting the device mocks), and the two load-bearing things bleed will fight (the shared left edge, and the flex grower above).

### Housekeeping from today

- ✅ **The eyebrow and the page metadata now agree.** Both read "coaches & trainers" (`eb30463`). They diverged for part of the day and were reconciled before close. ⚠️ It was **five** strings, including the root fallback title in `layout.tsx` — change one and change all five.
- **Four components were deleted and one restored.** `ScreenText`, `ScreenLog` and `ScreenDetail` went with the four-frame row; `MiniStepper` went with them and came back hours later for the student log screen. Anything needed again is in `b57a7ee`'s parent.
- **`CAST` keeps `coach` and the loop's `target`/`makes`/`pct`** even though only `exercise` and `student` are read today. Deliberate, not stranded — documented at the constant.
- ⚠️ **`CAST.roster` is unread**, and has been since before this session. Pre-existing, left alone.

### Parked, deliberately — not started

- ~~**Activity picker narrowing**~~ — ❌ **CLOSED Aug 19 2026, and NOT by being built.** The plan was to cut the picker from ten rows to four (basketball live, soccer/tennis/"create your own" as Soon). Instead **the whole screen was removed** and signup went from three steps to two, so there is no list left to narrow. ⚠️ The reasoning that produced the four-row plan is still sound and should be re-read if a picker ever returns — see *Queued for next session* item 2, kept for that reason. The homepage half of it shipped Aug 3 (soccer hero photo) and is unaffected.
- **Landing page copy — empty state and permission language.** Reviewed and **deliberately left unchanged**; the existing copy was judged already correct. ⚠️ The specific strings and reasoning were not captured at the time, so this entry records the decision but not its detail — worth writing down properly if it is ever revisited, rather than re-deriving it.
- **Roster weekly summary stat (RJ's consistency + active players)** — explored in depth, not shipped, see `docs/explorations/roster-weekly-summary-exploration.html` for reasoning and visual variations.
- ~~**"How it works" section redesign**~~ — ✅ **CLOSED Aug 5 2026, and not by being built.** It was rebuilt as numbered steps that day (commit `b57a7ee`), then the whole section was **removed** (commit `5f2faad`): section 2 (instructor) and the new student section cover the same ground between them, at full size and split by audience. ⚠️ Do not resurrect this entry as a to-do — the section is gone deliberately, not pending.
- ⚠️ **Landing page flow feels rigid/boxy top-to-bottom** — ✅ **this is the NEXT SESSION'S work.** Written down mid-day Aug 5 as "revisit after the pricing section is built"; pricing shipped that evening, so the trigger has fired.
  - **The symptom:** the page is five bands stacked with a hard colour cut at every seam, and section 2 → section 3 is the worst of it — same shape, same vertical mock pairs, only mirrored. It reads mechanical rather than organic.
  - **The direction (added at close of Aug 5):** stop treating each seam as a hard edge. Explore **gradients and bleed** — content crossing a section boundary rather than every band starting and stopping cleanly, in the way TeuxDeux lets screenshots break out of their section. Also still open from the earlier capture: organic background shapes, and a slight tilt on the device mocks.
  - ⚠️ **The sameness is partly deliberate, and that part must survive.** Sections 2 and 3 are peer-sized *on purpose* — identical heading clamp, identical device widths — so they read as a matched pair about two audiences. See the peer-sizing note in `page.tsx`. What was never a decision is that both are literally "copy block beside two upright phones". Fix the second without destroying the first.
  - ⚠️ **The tilt has already been tried and reverted once**, in section 2: it cut controls off the back screen and read as broken. See the "Upright and side by side" note in `page.tsx` before re-attempting it.
  - ⚠️ **Bleed fights two things currently load-bearing**, and whoever picks this up has to deal with both rather than discover them: (1) the shell's shared left edge — header, hero device, section 2 and section 3 all measure the same edge at every width ≥768, verified repeatedly; (2) `flex: 1 0 auto`, which sits on whichever band is *last before the footer* and has moved three times in one day. Content crossing a seam breaks the first assumption and probably complicates the second.
  - **Starting context, so a cold session does not have to reconstruct it.** All of this is one file, `src/app/page.tsx` — about 2,100 lines with the **entire stylesheet inside a single `<style>` template literal**, not a separate CSS file.
    - **The five bands, top to bottom, are what a gradient pass is working between:** hero `#ede9e3` (warm cream, hue 36) → section 2 `#262a39` (hsl 227, 20%, 18.6%) → section 3 `#caccd5` (hsl 229, 12%, 81.4%) → pricing `#f8f7f5` (near-neutral, shared with `/privacy` and `/terms`) → footer `#1a1d24`.
    - ⚠️ **The page ALTERNATES, it does not descend, and that is deliberate as of Aug 5.** The rule recorded at `.program-section` is *"do not leave two same-tone bands touching"* — section 3 is light specifically so section 2, section 3 and the footer are not three darks in a row. A gradient pass must not quietly restore a single top-to-bottom descent.
    - ⚠️ **Read *"Editing `src/app/page.tsx`"* in this file before the first edit.** Two traps there have each cost real time more than once: breakpoint-scoped rules that look applied because they apply *somewhere* (a "desktop and up" rule dropped into a `768–1023` range block silently stops at 1024), and **backticks inside CSS comments terminating the template literal** with a confusing JSX error pointing nowhere near the cause.
    - **How today's work was checked, and the bar to match:** measured, not eyeballed — `getBoundingClientRect` / `getComputedStyle` in the console, swept at **375 / 414 / 768 / 1024 / 1280 / 1440**, checking horizontal overflow, wrapping, and the shared left edge at each. ⚠️ Screenshots were unavailable all day (the browser pane never painted), so nothing on this page has been visually confirmed by anyone but Tony — a flow pass is exactly the kind of work that needs a real look, not only numbers.
    - **Related entry, same root cause:** *"The feature checklist drops straight into the footer"* below. That is this problem at the page's final seam; a pass treating only mid-page transitions would leave it.

*The five below came from a final review pass at the close of Aug 5 2026. None is started; each records a direction, not a design.*

- ⚠️ **First-touch trust at signup — a stranger hits a bare name field with no context.** Every CTA on the landing page lands on `/instructor/signup`, whose first screen is the heading **"What should students call you?"**, an input, and a Continue button. Nothing on it acknowledges that someone who has never met Tony is now typing personal information into an unknown product.
  - **Why it did not matter until now:** the only real user was RJ, where personal trust was already established before he ever saw a screen. It stops holding the moment outreach targets actual strangers, which is the current plan.
  - **Direction:** a quiet trust line in the **existing empty space on that first screen — not a new screen and not a new step.** The screen is `flex flex-col min-h-screen` with top-packed content, so there is real room below the "Already have an account? Sign in" line. Something in the register of *"Just your name to start — no card, nothing shared."*
  - ⚠️ Any such line has to stay true: signup genuinely collects no card (verified Aug 5 — the whole signup tree contains no billing code), so that half is safe. **"Nothing shared" is a privacy claim and needs checking against `/privacy` before it ships**, not assumed.
  - **Not built — direction only.**

- **Section 2's copy undersells what RJ actually values.** It currently sells organisation and visibility: *"Your whole program, finally in one place."* That is real but generic.
  - **What is on record, in his words:** Reps has become a **"template"** of his program and a **"record"** of it; it is **"streamlined"** and helps him **"stick to it"**.
  - ⚠️ **CORRECTED Aug 5 2026 — an earlier version of this entry read that language as being about his CUSTOM-created drills, and that was wrong.** RJ primarily uses the **default exercise library**. He was not describing ownership of bespoke content.
  - **What he actually means:** he has never had a **consistent, reliable library to pull from and reference**. The value is that a default library he trusts now has **permanence and structure** — the same drills, named the same way, there every week, instead of whatever he remembered in the moment. "Template" and "record" are about the *program* being durable, not about the drills being his invention.
  - ⚠️ **The conflict flagged in the earlier version is GONE, and this correction is the reason to re-read the entry rather than trust a summary of it.** That version claimed this needed reopening the locked decision *"Default exercise libraries are the product experience. Custom creation is the escape hatch."* Under the corrected reading it does the **opposite**: it is a stronger, more specific argument **for** the locked decision — the default library is not a starter kit to graduate from, it is the thing that gives a coach's program permanence. Nothing here promotes custom creation, so nothing needs unlocking. Also disregard the earlier sequencing note about custom-exercise reachability; that remains a real Pending item on its own merits but is **not** a blocker for this copy.
  - **So what is actually undecided is narrower:** the copy, not the product. Section 2 currently sells *tidiness* ("one place"); the claim available is nearer *permanence* — a program you can rely on being there, the same way, every week. That is a better claim and it is compatible with everything already locked.
  - **Not started — a copy pass against RJ's actual language. No product decision is required first.**

- **Section 3's core claim may be the shallow one, and parent excitement is real, proven and entirely unused.** Two related threads, deliberately kept in one entry because a rewrite would likely touch both.
  - **The headline claim.** *"Nothing for your students to download."* removes friction. It does not say why a student would care. The deeper truth is nearer *"someone is paying attention to you between sessions"* — which is the actual product thesis (see **Core insight**: the loop exists so a coach can verify follow-through).
  - **The parent thread.** ⚠️ **Documented and real**, not a hunch: RJ confirmed by text on Aug 1 that parents are **"all in on it"** and **"think it's extremely useful"** — the people who pay for the coaching, reacting independently of RJ's own enthusiasm. Parent excitement drives retention and referrals for his business, and **none of it appears on the page**. Parents are currently implied once, mechanically, via *"log on a parent's phone"* — never as anyone with a reaction.
  - **Direction:** revisit section 3's headline and framing, and consider whether a parent-facing line belongs there at all.
  - ⚠️ **The blocker is a PROMISE problem, and it is why this is undecided rather than just unwritten.** Any parent-facing line risks implying parents *receive* something. They do not: no digest is sent, there is no cron or scheduled job, nothing anywhere links to `/parent/[token]`, and the report-only `parent_phone` sits in *Decided, not built*. A line like "parents love it" is read by a stranger as "parents get updates".
  - ⚠️ **And the promise already exists, to one person.** Tony told RJ by text on Aug 1 that he is *"working on some type of automated weekly digest or report for parents"* — see the parent contact model in *Decided, not built*. That is currently a light expectation held by **one** user who is owed it personally. **A landing-page line would extend that same implied promise from RJ to every stranger who reads the page**, before anything exists to honour it. That is the difference between a soft commitment and a public claim.
  - **The two ways out, and one must be chosen before drafting:** either (a) **build something real first** — the digest, or at least a working parent view something links to — and then say so plainly; or (b) **find wording that celebrates the reaction without promising a mechanism**, e.g. reporting that parents respond well to seeing the work, with nothing that implies delivery. (b) is cheaper and available now, but it is genuinely hard to write without tipping into (a)'s promise, which is exactly why this is parked rather than drafted.
  - **Not started. Blocked on that choice, not on the copy.**

- **The feature checklist drops straight into the footer.** The pricing section ends on the last checklist row and the dark footer begins immediately, with no transition at the page's final boundary.
  - This is the **same rigid-seam problem** as the flow-pass entry above, and will probably take the same fix. It is recorded separately because that entry is written around *section-to-section* transitions and the mid-page 2 → 3 seam in particular; the point here is that **the bottom edge has it too**, and a pass that only treats mid-page seams would leave it.
  - **Not started.**

- ~~**Eyebrow and page metadata disagree on one word.**~~ — ✅ **RESOLVED Aug 5 2026** (`eb30463`). Everything now pairs **"Coaches & Trainers"**. ⚠️ It was **five** strings, not two: `page.tsx`'s title, description, `og:title` and `og:description`, plus the root fallback title in `layout.tsx`, which mirrors the page's and would have kept the divergence alive on its own. Change one and change all five. The app's internal `instructor` vocabulary is deliberately untouched.

### To resume local billing work

`STRIPE_WEBHOOK_SECRET` is **local-only** and comes from `stripe listen`, which must be running for any webhook to arrive:

```
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

⚠️ It issues a **new secret each session** — update `.env.local` and restart the dev server, or every event fails signature verification. Nothing is configured in Vercel for staging or prod yet.

### ⚠️ `stripe listen` does not survive a reboot — and its failure is SILENT

**This cost real time on Aug 4 and will cost it again.** `stripe listen` is a foreground process. Anything that ends it — a reboot, closing the terminal, killing the tab, the machine sleeping hard enough — ends webhook delivery, and **nothing in the app says so**.

The symptom is not an error. Checkout completes, Stripe takes the payment, the coach is redirected back, and then *nothing happens*: `subscription_status` is never written, `isPro` never flips, and the upgrade appears to have simply failed. The app is behaving correctly — it never received the event.

**Every time the dev environment restarts, before touching billing:**

1. Restart it — `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. Copy the **new** `whsec_…` it prints. ⚠️ It is different every run; the old value in `.env.local` is dead.
3. Paste it into `.env.local` as `STRIPE_WEBHOOK_SECRET` and **restart the dev server** so Next re-reads it.

⚠️ Skipping step 2 or 3 fails differently but just as quietly — events arrive and are rejected `400 Invalid signature` at the webhook. That at least appears in the `stripe listen` output, where a dead listener shows nothing at all.

**Check it is alive before assuming the code is wrong.** A live listener prints each forwarded event; silence during a checkout means the listener, not the app.

---

## ⏸️ Where things stand — Aug 6, pausing for a while

Tony is stepping away to focus on other work for an unknown stretch. This section exists so anyone (Tony or CC) can resume exactly where this left off, without re-deriving context.

**Landing page** — done. Copy across all four sections (hero, §2, §3, pricing) finalized and shipped. Header nav updated with Pricing/FAQ links, mobile-responsive. Footer color reused from §2's band.

**Testimonial — REMOVED FROM THE PAGE Aug 16 2026, deferred not cancelled.** It was built at the bottom of §2 with a quote from RJ, marked PLACEHOLDER/NOT APPROVED in code. It is **no longer live in §2** — the `<figure>` and its CSS were pulled so the rest of `page.tsx` (header nav, hero and §2 copy, pricing eyebrow, footer colour) could ship without it.

⚠️ **The markup is saved verbatim at [`docs/deferred/section-2-testimonial.md`](docs/deferred/section-2-testimonial.md)** — JSX, CSS, the three sign-off items, and the two traps for putting it back (the `<figure>` must sit OUTSIDE `.program-inner` or it becomes a third flex column at ≥1024; the media query must stay AFTER the base rules or it silently never applies). ⚠️ It existed in **no commit** before that file, so there is nothing else to recover it from.

**RJ has seen it, likes the direction, and is workshopping his own wording** — he said he'd reply "by tonight" as of Aug 6. **That reply is still the single most likely thing to have a real update waiting whenever this resumes. Check with him before restoring anything.**

**FAQ (`/faq`)** — done and refined through several copy passes. One answer ("How do I cancel?") describes self-serve cancellation from a coach's profile — this is **PENDING**, flagged in code, and is **NOT true today**. Do not let this answer go live to real strangers until the Stripe Customer Portal feature (below) actually ships.

**Privacy policy audit — Aug 6.** Full audit completed; three false statements fixed (parent digest removed, SMS recipient description corrected, STOP-instructions claim corrected to describe the automatic carrier-level mechanism rather than message content). Still open, none fixed yet:

- Stripe not listed as a data processor/subprocessor
- "What we collect" list is stale — missing student notes (`logs.note`) and billing/subscription fields
- Player-delete cascade (removing a student permanently deletes all their assignments and logs) is not disclosed anywhere public
- Minors section is thin — flagged as needing real, careful attention before strangers arrive, not a quick copy patch
- AA contrast: 9 of 17 text elements fail (`#378add` at 3.36:1, `#888888` at 3.31:1) — the fix is already known and proven on `/faq` (`#2a6fb5` / `#1a1a1a`), just not applied here yet
- "Last updated" date intentionally left at July 17 — bump it once, when the remaining items above are also done, not before

**Terms** — not touched in this audit cycle beyond what privacy fixes implied. Cancellation language ("can be cancelled anytime") is vague rather than false, and is deliberately being left as-is until self-serve cancellation is real, at which point it becomes true without editing.

**Self-serve Stripe cancellation — ✅ BUILT AND VERIFIED Aug 17 2026** (`41ea622`). Stripe Customer Portal integration, a "Manage subscription" row in `ProfileMenu`, cancelling at period end. Verified end to end in test mode against a real cancellation: portal opens, cancellation registers, the coach keeps Pro to `current_period_end`, the webhook processes both events, and no other coach is affected. This unblocked the FAQ's cancel answer and closes pre-launch checklist item 5. ✅ **Live mode confirmed too** (Aug 19 2026): the live portal's cancellation setting was checked in the dashboard and is already "Cancel at end of billing period". ⚠️ The live portal's *behaviour* has not been exercised by an actual live cancellation — only the setting was read.

**RJ's actual open asks — corrected this session, several prior attributions were wrong:**

- **Parent contact model + weekly digest** — intentionally **ON HOLD per RJ himself**: he wants usage data to mature before deciding what's worth reporting. Priority right now is data preservation, not building this.
- **Hours as a unit** — direction decided in conversation: applies to the **ASSIGNED TARGET** on duration-based drills only (jump rope, holds, sprints), **not** to how a student logs progress, which should stay in minutes. Not built.
- **Move "Assign more" button to the top** of the student detail screen — confirmed, still pending.
- **Custom exercise creation reachable outside the assign flow** — confirmed as a real, direct RJ ask (not an inference). Not built.
- **Roster grouping by age/grade/team** — genuinely unresolved. Tony is asking RJ directly what he actually meant; would require a new player attribute that doesn't exist today. **Do not scope or design until that conversation happens.**
- **Consecutive-goal stepper overshoot bug**, and **editing `goal_type`/`side` after assignment** — both were **misattributed to RJ** in earlier CLAUDE.md versions; corrected to Tony's own (or his son's) feedback. Still real, still open, just not RJ's asks.
- **"Auto-reassign on completion"** — **REMOVE this as an RJ ask.** Tony has no memory of this conversation happening and no source material (text, call notes) supports it. Likely a misreading in an earlier summarization pass. Downgrade to unverified or strike entirely.

**Meta note:** this file has now had three separate attribution corrections in one evening (hours/weekly-digest mixup, custom-drills sourcing, and the two items above). Worth a dedicated accuracy pass across all RJ-attributed items before the planned in-person sit-down with him, rather than trusting the file's existing attributions at face value.

⚠️ **The corrections above are recorded here but NOT yet applied to the rest of this file.** The older entries they correct are still standing in their original sections — most visibly *RJ feedback captured*, which still lists "a repeat-schedule function for when a set is finished" as his ask and still records the stepper overshoot and `goal_type`/`side` editing among his requests. **This section is the current truth where the two disagree.** Reconciling them is exactly the accuracy pass described above; it was deliberately left undone rather than half-done at the pause point.

---

## 🚪 Pre-launch checklist: strangers, not RJ

**This is the gate before the landing page and the billing flow go live together.** It is not part of the parked list and should not be picked at in the tail of another session — it wants **its own dedicated session, one item at a time**, the same discipline the Aug 5 landing work used.

### Why the bar moved

Everything shipped so far was validated by **RJ, who trusted Tony personally before he ever saw a screen.** Gaps that did not matter with him — no FAQ, no visible way to cancel, no statement of what the product even is — were covered by that relationship.

The plan now is to invite **a small number of real basketball trainers, unconnected to RJ**, as genuine validation beyond a single user. **Strangers trust nothing by default.** They arrive with no context, no relationship, and every reason to close the tab. The experience has to be clear, thorough and error-free — **answering the questions a stranger would have before they would ever bother to ask them.** A stranger does not email to ask how to cancel; they simply never sign up.

⚠️ **Nothing below is started.** Two items are already-known blockers carried from earlier work; the rest came out of the Aug 5 close discussion. Verified findings are marked as such — where this file says something was *checked*, it was checked against the code, not assumed.

### The eight items

**1. Live-mode Stripe.** Scoped in detail already (see **Stripe status** and **Billing architecture**), not done. Create the live product, price and an **uncapped** `COACHRJ`; add all three Stripe env vars to Vercel for staging *and* prod; re-provision RJ in live mode **before** the gate can reach him. ⚠️ Test and live share nothing — every id changes.

**2. The RJ heads-up conversation.** Still owed, and still the actual blocking item for him specifically. He is at ~10 students with no live-mode subscription; the day the gate reaches an environment he uses with live billing, he is stopped at his 11th. Told first, or provisioned first — ideally both, in that order.

**3. `/privacy` and `/terms` — confirm they are real, now that strangers will read them.** ✅ **Checked Aug 5: both are real prose, not placeholder** — no lorem, no TODO, no "coming soon". Privacy covers what is collected, how it is used, SMS consent, sharing, students and minors, and deletion; Terms covers what Reps is, responsibilities, payments, availability and termination. ⚠️ **Both are dated "Last updated: July 17, 2026"** and predate everything about billing, so the *accuracy* pass is the real work here, not existence. See also the standing *Final legal review of /privacy + /terms* item under Medium priority.

⚠️ **A full line-by-line audit of both pages was run on Aug 6 2026, against the code rather than by reading.** Its findings are recorded under *Legal pages — Aug 6 audit* below. **Three false statements in `/privacy` were fixed the same day; everything else it found is still open.** Do not treat item 3 as done.

**4. Trust and security messaging + an FAQ.** ⚠️ **Was "neither exists" on Aug 5. The FAQ half SHIPPED locally on Aug 6** — `/faq`, **19 questions** in five groups, linked from the landing header, with **three** content passes already applied the same day. See the `/faq` section under Landing page. It answers what data is collected, who sees a roster, whether data is sold, what happens on cancellation, whether a coach has to build their own drill library, and how the free tier and the 4th-student prompt work.
- ⚠️ **This is a first draft and Tony expects to revise it after seeing it live.** It is not signed off.
- ✅ **The item-5 gate is CLEARED (Aug 17 2026).** Its cancel answer described a self-serve flow that did not exist; the Stripe Customer Portal is now built and verified, so that answer is true. `/faq` is no longer blocked from being shown to strangers on this count. ⚠️ It is still a first draft Tony has not signed off.
- ⚠️ **The trust-and-security half is still open.** There is still no page stating the security basics, and no trust line on the signup screen — that last one is its own parked entry (*First-touch trust at signup*) and did not move.
- ⚠️ **It surfaced a real finding about the legal pages:** `/privacy` and `/terms` set their headings and links in `#378add`, which is **3.36:1** on their own `#f8f7f5` background and fails AA for normal text. `/faq` uses passing values; the two older pages were out of scope and still carry the failure. Fold this into item 3's accuracy pass rather than treating it as separate.

**5. Subscription management.** ✅ **DONE — built and verified end to end on Aug 17 2026** (`41ea622`, test mode). This was the item most likely to burn a stranger; it is closed.
- **`createPortalSession()`** in `src/app/instructor/billing/actions.ts` creates a Stripe Billing Portal session for the coach's own customer, returning to `/instructor/students`. Gated on having a `stripe_customer_id`, not on `isEntitled()` — a lapsed coach still has invoices and a way back.
- **"Manage subscription"** row in `ProfileMenu`, shown when `isPro`, mirroring the `!isPro` "Upgrade to Pro" row so the menu offers exactly one billing action.
- ✅ **Verified against a real cancellation**, not assumed: the portal opened, the cancellation registered, Stripe reported status `active` with `cancel_at` equal to the exact `current_period_end`, the listener forwarded two `customer.subscription.updated` events and the webhook returned 200 to both, and **RJ's row was untouched on both sides** — the customer-level resolution held, which is the specific regression from the Aug 3 finding.
- ✅ **No entitlement or webhook changes were needed**, and that was confirmed rather than assumed. Stripe keeps the subscription `active` until the period ends, `isEntitled()` allows `active`, and the existing handler re-resolves at customer level.
- ⚠️ **The period-end behaviour depends on a DASHBOARD SETTING that no code can enforce:** Stripe Dashboard → Settings → Billing → Customer portal → Cancellation must stay on **"At end of billing period"**. Confirmed set Aug 17. Switch it to Immediately and `/faq`'s cancel answer silently becomes false.
- ⚠️ **On API version `2026-07-29.dahlia`, `cancel_at_period_end` reads FALSE even when the cancellation IS scheduled for period end** — the flag moved to `cancel_at`. Compare `cancel_at` against `current_period_end`; do not trust the boolean. This cost a moment of false alarm during verification.
- ⚠️ **Live mode is still untested**, as with everything else billing — item 1 covers it. The code is mode-agnostic; only the dashboard portal configuration has to be set up again in live.
- ⚠️ **Still leaves item 8 (player deactivation) sharing the "what counts as an active student" question.** That was flagged here as a reason to design them together; item 5 is now done without touching the free-tier gate, so item 8 inherits the question unchanged rather than resolved.

**6. "This is basketball" — decide whether to say so outright.** RJ never needed telling. A stranger lands on a page whose device mocks carry real exercise names and a real shooting percentage, with **nothing on the page saying the product is basketball-only today**.
- ⚠️ **Decide this together with the open `Example: basketball` question** from the Aug 5 audit, not separately — they are the same decision. That caption used to disclaim exactly this and was removed along with the "how it works" section; the page has carried the specificity without the disclaimer ever since. See **Landing page (current)**.
- Basketball is still the only ACTIVE entry in `activityTypes.ts`, so any broader promise breaks at the signup picker one screen later.

**7. Error and edge-case handling.** As far as is known, failure paths have never been exercised end to end: signup failures, payment failures, webhook-arrives-late, card declined, 3DS challenge, network drop mid-checkout. ⚠️ Two specific known-unseen states are already recorded under **Open — next session** in Billing architecture: the ProfileMenu panel's width at its widest item, and **the wrapping error line inside that 160px panel — no upgrade error has ever been made to occur there.** `useUpgrade()` has a `catch` and an `upgradeError` string, so the plumbing exists; what has never been seen is what a coach actually reads when something breaks. **Needs a real pass, not a code read.**

**8. Player deactivation — ✅ BUILT Aug 17 2026.** Everything below was the plan; it shipped essentially as decided, with the deviations recorded under *Deactivation* in the app sections. ⚠️ **The migration still has to be run by hand in the Supabase SQL editor.** ⚠️ **Never device-tested.** The original entry is kept below as the record of what was decided and why.

⚠️ **This is NOT a menu-label change.** It touches the schema, the roster UI and the billing gate at once, and it cannot be designed in isolation from item 5 or the downgrade/subscription work — the same vocabulary has to mean the same thing in the copy and in `isEntitled()` / `FREE_STUDENT_LIMIT`. Treat it with the care the Aug 5 landing builds got, not as a late add-on.

*Decided on the night of Aug 5. Implementation design is deliberately NOT attempted here.*

- **Terminology: "Deactivate" / "Activate", state language "Active" / "Inactive".** ⚠️ **Not "Archive"** — that word is already taken, and taking it twice would be the exact collision `filed_at` was named to avoid. Archive means *a finished assignment filed away*, on both the coach and student screens. A second meaning for players would make "archived" ambiguous in every conversation and every function name.
  - ⚠️ **The vocabulary is shared with the billing logic on purpose.** `FREE_STUDENT_LIMIT` counts **active** students; the UI says **active**. One term end to end, no translation layer between what a coach reads and what the gate computes. This is the single most important decision in the item — get it wrong and every later question ("does an inactive player count?") has to be re-answered per surface.
- **Roster UI: an "Inactive" group** alongside the existing status groups (Done / In progress / Not started / Nothing assigned). Visually quieter, likely collapsed or pinned to the bottom — one tap away rather than cluttering the working view.
- **The player 3-dot menu: `Remove {name}` becomes `Deactivate {name}`** (or `Activate {name}` when already inactive). The confirm modal explains, in a friendly register, what deactivation means, how it affects the plan and billing, and reassures that nothing is lost — in the spirit of *"Taking a break? Deactivating keeps all their history safe."*
- **Permanent delete becomes a separate, heavier action reachable ONLY from the deactivated state** — never directly from active. That forces the safe path first, and the irreversible one earns a heavier confirmation than a single button (a typed confirmation was the shape discussed).

⚠️ **Two things were checked against the code on Aug 5, and one corrects a premise from the discussion.**

- **This will NOT be the app's first fully irreversible action — that already exists, and it is the very thing being replaced.** `Remove {firstName}` in `PlayerManage.tsx` calls `players.delete()`, and both `assignments.player_id` and `logs.player_id` are **CASCADE**, so removing a player permanently destroys every assignment and every log that student ever wrote. It sits behind **one modal with one button**. So this work is not adding a dangerous new capability; it is **retrofitting a safe path in front of a destructive one that is already a single tap deep.** That makes the item more valuable than it sounds, and it is the strongest argument for the deactivate-first ordering above.
- ⚠️ **It also resolves a contradiction in the locked product decisions.** *Product decisions locked* states flatly: *"Log history is never deleted — `ON DELETE SET NULL` preserves logs forever."* That is true when deleting an **assignment**, and false when deleting a **player**, where the cascade takes the logs with it. The current modal is honest about this (*"This deletes all their assignments and logs. This can't be undone."*), so nothing is deceptive — but the principle as written is not universally true, and whoever builds this should either make it true or narrow its wording.

**Open questions, not decided tonight** — listed so the next session starts from them rather than rediscovering them:
- Does an inactive player still receive assignment SMS, and can they still open their token link? (Their link is live today and nothing about deactivation implies revoking it.)
- What happens to a coach already **over** the free limit who deactivates down to 3 — does the gate reopen immediately? This is the same shape as the downgrade question in item 5 and should be answered once, for both.
- Schema: a nullable `deactivated_at` timestamp mirrors `assignments.filed_at`, which is the pattern this codebase already uses for exactly this kind of reversible state. Not decided, but it is the obvious candidate and it would keep "when" as well as "whether".
- ⚠️ Any migration hits local, staging and prod at once — one shared Supabase project, no local-only schema change.

### How to run this session

One item at a time, in the order above — 1 and 2 gate everything (there is no point polishing trust copy for a flow that cannot bill), 5 is the highest-risk item that is purely our own doing, and 7 wants a real browser and deliberate breakage rather than reasoning about the code.

⚠️ **Item 8 is the odd one out and should not be squeezed in here.** Items 1–7 are configuration, verification and copy — things that can be worked through in a sitting. **8 is a feature build** touching schema, roster UI and the billing gate together, and it needs its own dedicated session with the same care the Aug 5 landing work got. Its only hard dependency on the rest is item 5: decide *what counts as an active student* once, and both fall out of it.

⚠️ **Do not batch this with feature work.** Every item here is a promise made to someone who has no reason to give the benefit of the doubt.

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
- Signup flow (per-step URLs): **name → email + 6-digit code → students list**. ⚠️ **TWO steps as of Aug 19 2026** — the activity picker that sat between name and email is gone. `instructor_type` is still written at signup, from `SignupProvider`'s constant rather than from a screen. See *Activity type system*.
- Adds students by name + one phone number, with a Player/Parent toggle for whose number it is
- Assigns exercises from a default library or creates custom ones
- Picks a **goal type** (attempts / makes / consecutive) and an optional **side** (left / right)
- Views each student's progress and shooting percentage (makes/attempts)
- Sorts finished work into **New / Archive** tabs by hand — nothing moves on its own
- Can re-issue finished work with **Assign again**, which creates a fresh assignment
- Roster grouped: Done / In progress / Not started / Nothing assigned — and **within each group, sorted by most recent activity**, so the reading order matches the last-activity dates shown beside each name. See the roster sort note below

### Student
- Gets a text with a unique link — no signup required
- Can also log in from any device at assignreps.com via phone OTP
- Taps link → sees their assignments, split into the same **New / Archive** tabs the coach sees
- Logs with a stepper counter; what the stepper counts depends on the goal type
- Can leave an optional note with a log — one capped line to the coach, on the log screen. The only thing a student **writes** in the app; everything else they do is a count
- Sees a celebration when done: 🔥 + "[Coach] will see this."
- ⚠️ Read-only on the tabs. Only the coach files and unfiles; the student screen has no write path for it.

### Parent
- Optional per student — instructor decides at add-student time
- Read-only web view: practice days, assignments completed, last activity
- ⚠️ **Not built as described anywhere else.** No digest is sent — there is no cron, no scheduled job, and nothing links to `/parent/[token]`. See "Parent contact model" in Pending for the resolved design, which is not yet implemented.

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
  id, name, email, phone (nullable), instructor_type, created_at,
  stripe_customer_id (text, nullable, unique), stripe_subscription_id (text, nullable),
  subscription_status (text, nullable)   -- Stripe's own status string, mirrored

players
  id, coach_id, name, phone, parent_phone, send_to_parent, token, last_texted_at, created_at,
  deactivated_at (timestamptz, nullable)   -- null = Active, set = Inactive

assignments
  id, coach_id, player_id, exercise_name, target, unit (reps/minutes), video_url,
  week_start, created_at, track_makes (boolean, default false),
  goal_type (text, NOT NULL, default 'reps'), side (text, nullable),
  filed_at (timestamptz, nullable)   -- null = New tab, set = Archive tab

logs
  id, player_id, assignment_id, amount, makes (integer, nullable), logged_at,
  exercise_name (text, nullable), unit (text, nullable), goal_type (text, nullable),
  target (int4, nullable), side (text, nullable),   -- snapshot, written at insert
  note (text, nullable)                             -- student → coach, max 100 chars

custom_exercises
  id, coach_id, name, unit (reps/minutes), default_amount, created_at
```

Migrations live in `supabase/migrations/`. There is **no base schema migration** — the original tables were created in the Supabase dashboard, so only later changes are captured as files.

### Key schema notes

- `goal_type` — what `target` measures. `'reps'` (attempts), `'makes'`, or `'consecutive'`. Checked by `assignments_goal_type_check`. Defaults to `'reps'`, which backfills every pre-existing row to exactly its prior behavior.
- `side` — `'left'`, `'right'`, or NULL. Checked by `assignments_side_check`. NULL means **unspecified**, not "both". (NULL passes a Postgres CHECK natively, so no explicit allowance is needed.)
- `track_makes` — when true, the log screen offers a makes entry. Forced true by the assign action when `goal_type` is `'makes'` or `'consecutive'`, where makes are the point. Kept as its own column rather than derived, so the stored row states the coach's intent outright.
- `logs.makes` — nullable integer. `null` means "didn't report makes"; `0` means "made none." Never conflate these — they mean different things for percentage calculations.
- ⚠️ **`logs.logged_at` is stored in UTC**, like every timestamp here. Raw dashboard views show it unconverted, so Pacific-time evening sessions appear as the middle of the night — a 7pm log reads as `02:00` the next day. This has already caused one real misread: a run of logs at "2–3am" looked alarming until the offset was accounted for, and they were ordinary evening practice. Convert before drawing any conclusion from raw rows — `rj_logs_readable` exists for exactly this. The app itself is unaffected: it renders relative times, and the SMS gate compares LA calendar dates explicitly via `Intl` (see `notify-assignment.ts`).
- **Log snapshot columns** — `exercise_name`, `unit`, `goal_type`, `target`, `side` on `logs`. The log's own copy of the assignment as it stood when the row was written. Set once by `saveLog` from a server-side read, never updated after — a later edit to the assignment must not rewrite what the student actually did. They exist because `logs.assignment_id` is `ON DELETE SET NULL`: without them a deleted assignment leaves a log with no record of what it was. No CHECK constraints, unlike their `assignments` counterparts: these are copies of already-validated values, and a constraint that rejected an unexpected legacy value would fail the student's insert and lose reps they actually did. See the RESOLVED entry in Pending for the backfill.
- **`logs.note`** — the student's optional message to the coach on a single practice log, capped at 100 characters by `logs_note_length_check` (`char_length(note) <= 100` — characters, not bytes, so an accent or an emoji doesn't cost a student extra room). Nullable, no default, no backfill; NULL means "no note", which every pre-existing row genuinely is. It sits on `logs` rather than `assignments` because it belongs to a session — a second log against the same assignment is a second, separate thing to say. Migration `20260801120000_add_note_to_logs.sql`.
  - ⚠️ **Written on INSERT only.** There is no UPDATE policy on `logs`, so a note cannot be edited or added after the fact — the same limitation as the retroactive-makes gap, and it comes from the same missing policy. Making notes editable needs its own RLS policy and its own replace-vs-append decision.
  - ⚠️ **The write path must cap the text before inserting; the constraint is a backstop, never the guard.** `note` travels on the same INSERT as `amount` and `makes`, so a rejected note fails the whole row and loses reps the student actually did. That is precisely the failure the snapshot columns avoided by taking no CHECK constraints at all — a constraint is only safe here because the column is new and has no legacy values it could reject.
  - **Empty string normalizes to NULL at the write path**, never stored as `''`. Nothing in the schema stops `''` — it satisfies the constraint — so this is the app's job. Two spellings of "said nothing" is the same trap as `logs.makes` null vs 0, and it breaks the reader below: a `note IS NOT NULL` check treats `''` as a real note and renders a blank line.
  - ⚠️ **Display reads the most recent log for an assignment where `note IS NOT NULL`** — *not* the literal latest log. An assignment accumulates logs across sessions and most of them will carry no note, so keying on the newest row would blank out an earlier note the moment the student logs again without writing one.
  - ✅ **Verified live on staging, Aug 1 2026** — against real data, not just the compiler. A note written on a **STAR drill** assignment rendered correctly on both surfaces: the coach's student detail card and the student's own home card, with the right text on each. The fold above and the card rendering are confirmed working end to end; every earlier note in this file describing them as compiler-verified only is superseded.
- **`filed_at`** — which tab an assignment sits in: NULL = **New**, set = **Archive**, and the value is when the coach moved it. Nullable, no default, no backfill; every pre-existing row reads as New, which is where they all were. Indexed as `(player_id, filed_at)` since every read on both list screens is "this player's cards, split by filed or not."
  - ⚠️ **Filing is independent of completion.** Nothing moves automatically. A finished assignment stays in New until a coach archives it, and archiving is reversible. `isComplete()` no longer decides tab membership at all — it only draws the ✓ badge and picks which menu actions a card offers.
  - ⚠️ **Deliberately NOT named `logged_at`.** `logs.logged_at` already means "when a STUDENT recorded reps", and the player detail page reads both tables into one aggregation. Two columns, one name, opposite actors. The small mismatch with the "Archive" tab label is the price; the collision would have been permanent.
- **`deactivated_at`** — a student's reversible pause: NULL = **Active**, set = **Inactive**, and the value is when the coach deactivated them. Nullable, no default, no backfill; every pre-existing player reads as active, which they all are. Indexed as `(coach_id, deactivated_at)` — both readers filter by coach first and test this second. Migration `20260817120000_add_deactivated_at_to_players.sql`.
  - ⚠️ **Deliberately NOT `archived_at`.** "Archive" already means *a finished assignment filed away* (`assignments.filed_at`) on both the coach's screen and the student's. A second meaning for players would make "archived" ambiguous in every conversation and every function name — the exact collision `filed_at` was named to avoid.
  - ⚠️ **The vocabulary is shared with the billing gate on purpose.** `FREE_STUDENT_LIMIT` and `PRO_STUDENT_LIMIT` count **active** students — this column `IS NULL` — and the roster says "Inactive". One term end to end, no translation layer between what a coach reads and what the gate computes.
  - ⚠️ **A full pause in BOTH directions, and that is the part that is easy to half-build.** The coach cannot assign (three write paths, all gated) and the student cannot log (`saveLog` refuses). Hiding it from the assign flow alone would leave a paused student still logging.
  - ⚠️ **It touches NO data.** No assignment is deleted, moved or filed; no log changes. Reactivating restores everything untouched. It is not a soft delete and must never become one — `players.delete()` is still a real cascade and is still its own separate action.
- `logs_amount_check` — a constraint requiring `amount > 0` exists on `logs` but is NOT in any migration file (created directly in the dashboard). Don't try to insert `amount: 0`.
- `logs_makes_non_negative` — `makes IS NULL OR makes >= 0`.
- Assignments are not time-bounded — they persist until the instructor archives them (or deletes them, which is only possible before the work is finished).
- `logs.assignment_id → assignments.id` is **ON DELETE SET NULL** — deleting an assignment never deletes log history.
- The `coaches` table is NOT anon-readable. Student pages use `coach_name_for_token(text)` SECURITY DEFINER RPC to get the coach name for a valid student token.
- **`coaches` billing columns** — `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, added Aug 1 2026 (`20260801170000`). All nullable, no defaults, no backfill: NULL across all three means "never went through checkout", which every pre-existing coach is, and which reads as the free tier. `stripe_customer_id` is uniquely indexed — webhooks look coaches up by it, and two coach rows must never claim one Stripe customer.
  - **No CHECK on `subscription_status`**, deliberately. Stripe owns that vocabulary (`incomplete`, `incomplete_expired`, `trialing`, `active`, `past_due`, `canceled`, `unpaid`, `paused`) and has extended it before. The only writer is a webhook, so a constraint rejecting an unfamiliar value would fail the UPDATE and freeze the row at a stale status while Stripe moved on — a coach wrongly gated or wrongly admitted, silently. Same reasoning as the log snapshot columns. **Entitlement is an allowlist in app code** (`active` + `trialing`), so anything unrecognised fails closed.
  - No promo column. `COACHRJ` is a 100%-off-forever coupon, so RJ holds a real subscription reporting `active` at $0 and passes the same gate by the same rule.
- ⚠️ **`coaches: own row` — a policy that exists live and in NO migration file.** `FOR ALL`, created directly in the Supabase dashboard. Same class of invisible-to-the-repo object as `logs_amount_check` and the `rj_*`/`tony_*` views: reading `supabase/migrations/` does **not** show you this table's real security posture. It is what lets a signed-in coach read and write their own row at all.
- ⚠️ **`coaches` write protection is a TRIGGER, not a grant — and that distinction was learned the hard way.**
  - `20260725120000` revoked table-level UPDATE and re-granted only `update (name)`, intending an allowlist of one column. **That protection was silently dead by Aug 1.** Something re-granted table-level UPDATE to `authenticated` in the intervening week — most likely a dashboard operation re-applying Supabase's default privileges. ⚠️ **Postgres privileges are a UNION and the table grant wins**, so the surviving column grant on `name` restricted nothing. Combined with the `coaches: own row` policy above, a coach could PATCH any column on their own row through the anon key — including `email` (mirrored from `auth.users`) and `instructor_type`.
  - Found on Aug 1 by running a verification query when the billing columns landed, **not** by reading the migration file — which described protection that was no longer in force. Nothing read `subscription_status` yet, so no bypass was exploitable; it would have become one the moment the paywall shipped.
  - Fixed in `20260801180000` with **two layers**: the revoke and column grant restated (they produce the clean "permission denied for column" error), plus a `before insert or update` trigger, `coaches_block_client_billing_writes()`, which rejects any change to the three billing columns from the `anon` or `authenticated` JWT roles. **The trigger is the layer that actually holds** — whatever re-granted the privilege once can do so again, and triggers are unaffected by grant changes.
  - ⚠️ It covers **INSERT as well as UPDATE**. Signup writes the full `coaches` row as `authenticated`, so an UPDATE-only guard would leave a crafted signup free to set `subscription_status = 'active'` on the way in.
  - ⚠️ **RLS cannot express this.** An UPDATE policy's `WITH CHECK` sees only the new row — Postgres offers no way to reference the old row there — so no policy can say "billing columns must be unchanged". That is why it is a trigger.
  - ⚠️ **Not verified:** the trigger's rejection path has never executed. The privilege layer fires first, so the negative test was never run. Configuration is confirmed (no table-level UPDATE for the client roles, exactly one column grant, trigger enabled); the trigger's *behaviour* under a future grant regression is not.

### Foreign key cascade rules
- `players.coach_id → coaches.id` — CASCADE
- `assignments.player_id → players.id` — CASCADE
- `logs.player_id → players.id` — CASCADE
- `logs.assignment_id → assignments.id` — **SET NULL** (intentional — preserves log history)

### Dashboard convenience views

`rj_logs`, `rj_assignments`, `rj_players`, `tony_logs`, `tony_assignments`, `tony_players` — per-coach views for reading data in the Supabase dashboard. **Not app-facing**; nothing in `src/` references them, and they are not in any migration file (created in the dashboard, like the base schema).

Rebuilt July 27 2026: player name joined in, columns reordered person-first so a row is readable at a glance. They had frozen at old column lists and were missing everything added since.

⚠️ **A view does not track its base table.** Postgres expands `SELECT *` at creation time and stores the expanded list, so adding a column to `assignments` or `logs` does **not** add it to these views — and `pg_get_viewdef` shows the expanded form either way, so you cannot tell from the definition whether it was written as `*` or spelled out. The only reliable check is comparing the view's column list against the table's.

⚠️ `create or replace view` can append columns but **cannot reorder or remove** them. Reordering needs `drop` + `create`, which also drops any grants and dependent objects. Re-run these after any schema change that should show up in them.

**`rj_logs_readable`** — added on top of `rj_logs` (it does not modify it) purely for human browsing in the dashboard. Adds a formatted `logged_when` text column via `to_char(logged_at at time zone 'America/Los_Angeles', …)`, so a row can be read at a glance without doing UTC arithmetic in your head. Not app-facing, like its siblings, and created directly in the dashboard rather than in a migration file — same as the rest of these.

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

1. `src/app/student/[token]/page.tsx` — card state + the all-done panel
2. `src/app/instructor/student/[id]/page.tsx` — card state + the all-done panel
3. `src/app/instructor/students/page.tsx` — roster grouping and counts
4. `src/app/student/[token]/log/[assignmentId]/actions.ts` — `allDone` for confetti
5. `LogScreen.tsx` — client `done` state
6. `src/app/student/[token]/log/[assignmentId]/page.tsx` — the `alreadyLogged` cap
7. `src/app/instructor/student/[id]/actions.ts` — which rows `fileFinishedAssignments` archives (and which cards `AssignmentMenu` offers Archive vs Delete)

⚠️ Miss one and it reports completion **too early**: on a "make 50" assignment a student who attempts 50 and makes 20 satisfies `amount >= target`. The roster was the most exposed — it fetched neither `makes` nor `goal_type`.

⚠️ **A render-time gate is not a correctness guarantee.** Site 7 exists because the retired `clearCompletedAssignments` used to delete the player's whole assignment list unfiltered. The lesson carried straight into its replacement — `fileFinishedAssignments` computes its own set server-side for exactly this reason. That was invisible in the normal flow: the "Clear finished" control only renders under `allDone`, so "everything" and "everything complete" were the same set. They diverge on a **stale page** — the coach loads an all-done student, assigns new work from another tab or device, then clicks the still-rendered button — and under direct invocation of the server action, which no UI gate reaches at all. An action has to establish its own preconditions; it cannot borrow them from whatever rendered its button.

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

✅ **Layups collapsed July 27 2026.** Finishing shipped `Layups (right hand)` and `Layups (left hand)` as two entries from before `side` existed — neither was in `SIDELESS_EXERCISES`, so a coach could assign "Layups (right hand) · Left". They are now one **`Layups`** entry, side-enabled the same way everything else is: by not appearing in the denylist. No flag, no new mechanism.

⚠️ **`RETIRED_EXERCISE_NAMES`** in `src/lib/exercises.ts` maps the two old names to `Layups`. This is load-bearing. `exercise_name` is free text, stamped permanently at assign time, and is the **only** link back to a category — and two live call sites pass a *stored* name into name-based lookups: `categoryKeyForExercise` (student log screen) and `presetsForExercise` (coach's Edit-amount modal). Without the redirect, every existing Layups row would lose its category, flipping the student's hero label from ATTEMPTS to REPS on already-assigned work and stripping the preset row out of the coach's modal.

Existing rows are untouched and still read literally as "Layups (left hand)" for RJ and the student. Only what's *derived* from the name is redirected. History stays literal; new work reads "Layups · Left".

Retiring any other library name in future needs an entry in that map for the same reason.

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

## Archive model (New / Archive tabs)

Live on prod July 27 2026. Replaces the old **"Clear finished"**, which is gone — see below.

Both list screens — the coach's player detail and the student's own home — split assignments into two tabs, driven by `assignments.filed_at` and nothing else.

| Tab | Rule |
|-----|------|
| **New** | `filed_at IS NULL`. The working list: not-started, in-progress and finished-but-unarchived, in `created_at` order. |
| **Archive** | `filed_at` set. |

**Nothing moves automatically.** A finished card sits in New until a coach archives it. `isComplete()` no longer decides tab membership — it only draws the ✓ badge and picks which menu actions a card offers.

Shared components: `src/components/AssignmentTabs.tsx` (the tab bar + list switch, used by both screens; empty-state copy is injected per caller, since the coach reads about their student and the student reads about themselves) and `src/components/AllDonePanel.tsx` (the 🎉 celebration).

### What a card shows

Identical content on both screens — the coach's player detail and the student's own home — because it is the same information about the same work:

- Exercise name, with `· Left` / `· Right` appended when `side` is set
- The count in the goal's own measure, and the progress bar (2px; two-tone on a `reps` goal with makes)
- `made X/Y · Z%` — only where makes were recorded, and **hidden entirely on a makes goal**
- **The student's note**, when one exists

**The note line** sits **last**, below everything else — under the bar on a card with no makes line, under the makes line where there is one. It follows the card's structure rather than a fixed position, so it needs no branch of its own. Treatment: a `border-t border-reps-line` hairline, `mt-2`/`pt-2`, **11.5px italic** in `text-reps-dim`, wrapped in curly quotes. No label, no icon — the words are the student's own and the quotes say who is speaking; a `NOTE:` prefix would make the card read as a form.

⚠️ **Renders only when a note exists.** A card without one is byte-identical to before the feature — no border, no spacing, no wrapper element. This is why adding it changed no existing layout.

⚠️ Which note is shown is **not** "the latest log's note" — see `logs.note` in Key schema notes for the most-recent-*with-content* rule and why the naive version would blank an earlier note.

### Per-card menu, split on completion

| Card | Menu |
|------|------|
| Not complete | `Edit amount` *(only with no progress yet)* · **`Delete assignment`** — red, confirm modal, a real delete |
| Complete, in New | `Assign again` · **`Archive`** |
| Complete, in Archive | `Assign again` · **`Move back to New`** |

⚠️ The two sets are mutually exclusive, so **`Delete assignment` is unreachable on a finished card.** Deleting finished work is exactly what "Clear finished" did, and it orphaned every log pointing at it. Finished work is moved, never destroyed. (Completion requires logged work under every goal type, so `isDone` implies `hasProgress` — the two branches can't overlap.)

Both moves are **single tap, no confirm** — filing is reversible in one tap the other way, so a modal would be ceremony over a decision that costs nothing to undo. `Delete assignment` keeps its dialog; it's the one genuinely destructive action left on the menu.

**"Delete", not "Remove"** — renamed July 27, because the menu now also carries `Archive` and `Move back to New`, and remove/move read as neighbours. Also matches `Delete exercise` in `CustomExerciseMenu`.

### The all-done panel

The 🎉 celebration is **not a page-level banner** — it lives inside the New tab. It used to render above the tabs, gated only on "is everything finished", which meant it followed the coach onto the Archive tab and, once everything was archived, sat directly above a second greyer message saying the same thing twice.

Two variants, both inside New:

| State | Panel |
|-------|-------|
| All done, finished work still in New | 🎉 · "*{name}* finished everything." · **`Archive it`** — above the cards, which stay visible |
| All done, everything archived | 🎉 · "*{name}* finished everything." · "It's all in Archive." — *is* the empty state, no action |

Student equivalents: "You finished everything." with "*{Coach}* can see your progress." and "It's all in Archive now."

It is **structurally** unreachable from the Archive tab — it lives inside that branch of the tab switch, not behind a condition that could be got wrong.

`Archive it` is the bulk action (`fileFinishedAssignments`), styled as a quiet muted text link, matching the original "Clear finished" treatment rather than a bordered button the app uses nowhere else. Offered only when there's actually something to move (`allDone && fileableCount > 0`).

⚠️ **New-empty-but-not-all-done** falls back to a plain grey line rather than a celebration, so the app never claims a win it can't back up. Only reachable if an incomplete assignment is archived, which the UI doesn't offer.

### Server actions

- `moveAssignmentToLogged(id)` / `moveAssignmentToNew(id)` — one shared `setFiledAt` helper, ownership-scoped. Neither re-derives completion: both are fully reversible, so a mis-tap costs one tap back.
- `fileFinishedAssignments(playerId)` — the bulk action. **Computes the set server-side** rather than inheriting it from whatever rendered the button, and touches only rows that are both finished and still `filed_at IS NULL` so a re-run can't overwrite an earlier timestamp. That server-side filter is the lesson from the delete version, which once deleted a player's whole list unfiltered.
- ⚠️ Function names still say "Logged" (`moveAssignmentToLogged`) from the tab's original name. **UI labels changed, code names didn't** — same rule as when "Repeat" became "Assign again". Don't rename `filed_at` either.
- ⚠️ **These are no longer called from `AssignmentMenu`.** Since the optimistic pass, `CoachAssignmentList` owns the row list and therefore owns the mutation, the optimistic edit, the rollback and the error toast — they have to happen together or the card and the list would disagree about where it is. The menu just reports the tap. See **Navigation & loading feel**.

### ❌ Removed: `clearCompletedAssignments`

Deleted outright, not deprecated. It removed finished assignment rows, and since `logs.assignment_id` is `ON DELETE SET NULL` that silently stripped every log pointing at them of its meaning. Archiving replaces it entirely: nothing is destroyed and any card can be moved back.

---

## Assign again

Live July 27 2026. On any **complete** card's menu. Creates a **new** assignment row copying `exercise_name`, `target`, `unit`, `goal_type`, `side`, `video_url`, `track_makes`, with a fresh `created_at` and the current week's `week_start`.

⚠️ **The original is never touched** — no UPDATE, no DELETE anywhere in the path. It stays finished and keeps its logs, which now carry their own snapshot of what they were. Reopening the original by clearing its logs would have been the smaller change and would have destroyed that history.

Every copied value comes from a **server-side read**; the action takes only an id, so a crafted request can't mint an assignment the coach never chose. That read is player-scoped, which also establishes ownership — the insert previously leaned on the foreign key alone, which proves an assignment exists but not whose it is.

Formerly labelled "Repeat"; renamed for clarity that it creates new work rather than adding reps to the existing card.

---

## Color system

### One green family — emerald, hue 150 (July 27 2026)

Two tokens, one hue. They differ **only** in saturation and lightness, so they read as one colour at two weights rather than as two greens.

| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| `--reps-green` / `reps-green` | `#3ed68a` | 150.0 · 65% · 54% | Makes, every done state, ✓ badges, celebration panel |
| `--reps-green-muted` / `reps-green-muted` | `#247a4f` | 150.0 · 54% · 31% | Attempts fill + ATTEMPTS label/number |
| Bar track (empty) | `#2a2d36` | — | Gray — empty progress track everywhere |

| Role | Token |
|------|-------|
| Bar attempts fill | muted |
| Attempts label + number | muted — **only when `track_makes` is true on a `reps` goal** |
| Reps/Minutes label + number (no makes) | bright — a solo counter takes the bright green outright |
| Makes label + number | bright |
| Done state | bright — bars, pills, checkmarks, roster "Done" group |

⚠️ The muted green on a **label or number** exists only to subordinate attempts to makes. With no makes row on screen there's nothing to rank against, so a reps-only, minutes, makes-goal or streak assignment renders its label and number in the bright token instead. The muted shade is never the "default" text color — it's the *paired* one. (`ATTEMPTS_NUMBER` vs `SOLO_NUMBER` in `LogScreen.tsx`.)

This applies to text only. **Bar fills are unaffected** — an in-progress bar is muted whether or not makes are tracked.

**Rotated from lime on July 27 2026.** Bright `#6bd63d` (H102) → `#3ed68a` (H150); muted `#3d7a24` (H102.6) → `#247a4f` (H150). A pure hue move: the S/L relationship between the two tones shifted by 0.2pp (ΔS −10.7→−10.5, ΔL −22.9→−23.1). Both now sit on **150.0 exactly**, where before they differed by 0.6°.

⚠️ **There is no emerald outlier any more.** The celebrate confetti was `#3dd68c` (H151) — the one hue that disagreed with the family — and now uses the bright token outright. Every green in the app is hue 150.

⚠️ Green-to-blue separation is now **60°** (blue is H210), down from 108°. The two are analogous rather than near-triadic. They remain near-identical in lightness (54 vs 54) so they still read as peers.

**Muted green is a real token as of July 27** — it spent eleven releases as a bare hex in 11 places. Inline styles use `var(--reps-green-muted)`; Tailwind consumers use `text-reps-green-muted`. Both were verified present in the built CSS, since Tailwind drops unknown class names silently.

**Disabled controls** go to `#555` — a visible grey rather than near-invisible opacity, so an inactive `−` still reads in bright sunlight on a court. The locked MAKES label uses the same `#555`; its number renders `#8a8fa8` through `disabled:opacity-40`, landing around `#414552`.

### Other colors
- **Background:** `#080b0f` (`--reps-bg`)
- **Surfaces:** `#1c1f26`
- **Borders:** `#2a2d36`
- **Accent (interactive):** `#378add` (sky blue) — ⚠️ and as of Aug 17 2026 blue also carries a MEANING in the instructor app: plan capacity. See *The blue capacity system* under the over-limit assign gate before tinting anything blue.
- **Labels:** `#c8cdd8` (`--reps-label`)
- **Placeholders:** `#5a5f72` — ⚠️ **the intended token, but NOT what most fields actually render.** See below.
- **Helper text:** `#8a8fa8`

⚠️ **Known inconsistency — the app has two placeholder colours.** This entry read as though `#5a5f72` were applied uniformly; it is not, and never has been. Nine text-field declarations are split roughly down the middle:

| Placeholder | Declarations |
|---|---|
| `#5a5f72` (`placeholder:text-[#5a5f72]`) — the documented token | `SignupUI` (the shared `INPUT`, so every signup screen), `AddPlayerForm`, `ProfileMenu`, the log screen's **note field** |
| `#8a8fa8` (`placeholder:text-reps-dim`) — actually the **helper-text** value | `CustomExerciseScreen` (×2 — its `INPUT` and its inline number field), `CountScreen`, `PlayerManage`, `PlayerOtpFlow` |

**Why it matters:** `#8a8fa8` is `--reps-sub`, the helper-text value used for captions, counters and context lines. As a placeholder it separates from typed white by only **3.19:1**, so example text reads close enough to real input to be mistaken for a filled field. `#5a5f72` roughly doubles that to **6.34:1**. A placeholder's job is to be clearly lighter than what replaces it, and against typed text is the comparison that decides it — not contrast against the field background.

⚠️ The counter-argument, which is why this isn't simply a bug: `#5a5f72` sits at **2.60:1** against the `#1c1f26` field background, **below WCAG AA**. That is defensible for placeholder text — it is decorative, non-essential, and the label above carries the meaning — but it is very likely why someone reached for the brighter value in the first place. Both choices are reasoned; the problem is that both are live.

Only the **note field** has been moved (Aug 1 2026), and deliberately only that one: it was the field under review, and changing the other five as a side effect of a note-field fix would have been a platform-wide visual change nobody had looked at. **Resolving the split needs its own pass** — pick one value, apply it to all nine declarations, and check each on device. Until then this entry documents the reality rather than the intention.

⚠️ Not part of this split: the log screen's **stepper** placeholders (`ATTEMPTS_NUMBER`, `SOLO_NUMBER`, `MAKES_NUMBER`, `MAKES_NUMBER_MUTED`) deliberately use the green tokens with `placeholder:opacity-100`, because the seeded `0` must read as the label's colour rather than as absent input. Those are intentional and unrelated.

### Bar behavior
- Log screen bar: **6px** (`h-1.5`) — deliberately unchanged. One bar on its own screen, not one of a stack.
- Student home cards: **2px** (`h-[2px]`)
- Coach detail cards: **2px** (`h-[2px]`)
- ⚠️ Card bars went 3px → 2px on July 27 2026, all four sites (both screens × two-tone and single). Some of RJ's players now carry 10+ assignments at once, and at 3px a stack of ten read as heavy banding.
- Two-tone: muted attempts fill + bright makes fill overlaid — **`reps` goal only**. On a makes goal the single bar is already measuring makes, so stacking would draw the same figure twice.
- Single-tone (no makes): single muted fill
- Complete: full bright

---

## Deactivation (Active / Inactive students)

Built Aug 17 2026. A **reversible pause** on one student, driven by `players.deactivated_at` and nothing else. Closes the downgrade loophole that made it item 1: a Pro coach could add 30 students, cancel, and keep all 30 active on Free forever.

⚠️ **The migration is NOT applied automatically.** `supabase/migrations/20260817120000_add_deactivated_at_to_players.sql` has to be run by hand in the Supabase SQL editor. Nothing below works until it is.

### What a pause actually stops

⚠️ **Both directions, and each has THREE layers.** Only the last of each is enforcement; the others exist so a coach never walks into a refusal.

| | Coach side | Student side |
|---|---|---|
| Cosmetic | `+ Assign more` / `+ Assign homework` hidden, `Assign again` dropped from the card menu | — |
| Convenience | all six `/assign/*` routes redirect back to the student's screen | `/student/[token]/log/[id]` redirects home |
| **Enforcement** | `saveAssignment()`, `saveCustomAssignment()`, `repeatAssignment()` and `resendPlayerLink()` each refuse | **`saveLog()` refuses** |

⚠️ **`saveLog()` is the one that genuinely matters.** `logs` has **no RLS policy at all** and `saveLog` takes `playerId` as an argument, so the log page's redirect proves nothing — a stale tab or a crafted request reaches the action directly. It reads `deactivated_at` by **player id**, not by token, because that is what the insert is keyed on.

⚠️ Archive, Move back to New, Edit amount and Delete assignment all stay available while paused. They are housekeeping on work that already exists; only the item that *creates* work is withdrawn.

### The seat gate

`activeStudentLimit(subscriptionStatus)` in `entitlement.ts` — Free 3, Pro 30 — asked by **both** gates, because "can I add one?" and "can I bring one back?" are the same question:

| | Counts | Fails closed | Codes |
|---|---|---|---|
| `addPlayer()` | active only | yes | `limit_reached` / `ceiling_reached` |
| `activatePlayer()` | active only | yes | same two |

⚠️ **`deactivatePlayer()` is deliberately UNGATED.** It only ever frees a seat, and it is a coach's escape hatch when a downgrade leaves them over the ceiling — gating the escape hatch would trap them.

⚠️ **The comparison is `count >= limit`, not `>`.** The student being activated is currently inactive and therefore *not* in the count; `>` would land the coach one over.

⚠️ **Two dead ends, not one.** A free coach at 3 sees the paywall with a real Upgrade button (`useUpgrade()`, its **third** consumer). A Pro coach at 30 sees `CeilingBlock` — no button, because there is nothing to sell them — and is told to deactivate someone instead.

### Surfaces

- **Roster** — a fifth group, **Inactive**, last after "Nothing assigned", **collapsed by default** with a count in the header (`Inactive · 2`). ⚠️ `InactiveGroup.tsx` is **the roster's only client component**, and only because the page is an async server component and a tap-to-expand header cannot live in one. Expand state is deliberately not persisted. ⚠️ `playerGroup()` now takes the **player**, not an id — Inactive comes from the player row and **wins over all four completion groups**. ⚠️ The row itself is byte-identical to an active one; only the header and subline (`paused · 4 kept`) differ, because dimming a student's row would make their record look degraded.
- **Coach detail** — a quiet `Inactive` banner above the list. Everything below stays fully readable: reviewing history is the main reason to open a paused student's page.
- **`PlayerManage`** — `Deactivate {name}` above `Delete {name}`, in normal ink against Delete's red. ⚠️ **Delete is reachable directly from the ACTIVE state**; deactivate-first was rejected because making the safe action a step on the way to the destructive one teaches a coach to tap through it.
- **Student** — their token link **still opens**, always. Never a 404: a dead link reads as "you've been removed" to a kid who has simply stopped for the season. They get *"Hey {name} — you're on pause"*, their coach's real name via `coach_name_for_token`, and *"Everything you've logged is saved."* No action, because there is genuinely nothing they can do.

### Delete, now behind a typed confirmation

⚠️ **It was one red button until this build**, and `players` cascades to **both** `assignments` and `logs` — so the app's single most destructive act sat behind its lightest control. The modal now requires typing the student's **first name** (case- and whitespace-insensitive: a proof of attention, not a spelling test). Typing their name rather than "DELETE" is the point — it proves you know *whose* history you are destroying.

⚠️ This does **not** resolve the contradiction in *Product decisions locked* — *"Log history is never deleted"* is still false for a player delete. Deactivation now gives that principle a true path; the cascade itself is unchanged.

### Not done

⚠️ **Never seen on a device.** The three modals, the banner and the collapsed group have only been type-checked and built.

⚠️ **The open questions from pre-launch item 8 that this build did NOT answer:** whether an inactive student should still receive assignment SMS (moot today — they cannot be assigned to), and what a coach already over the limit sees on the roster (nothing special; they simply cannot add or activate until they deactivate someone).

---

## Over-limit assign gate (account-level)

Built Aug 17 2026 (`d1018f7`), immediately after deactivation and **parallel to it, not part of it**. Closes the other half of the downgrade loophole: the add-student gate already stopped a lapsed coach *adding* students, but nothing stopped them *assigning new work* to the ones already on the roster — so a single $10 payment bought unlimited ongoing operation above the free tier. Pro's value is the ongoing ability to operate above 3, not the one-time ability to get there.

### The rule

**`active_count > plan_limit` blocks every assign, account-wide, until the coach is back within their plan.**

⚠️ **Not per-student, and the system does NOT choose who stays operative.** Which students a coach keeps running — who they are mid-season with, who is closest to finishing — is real judgment only they have. Deactivation is the tool for it. The moment they are back under the limit everything unfreezes for whoever is left active.

### ⚠️ `>` here, `>=` in the add gate — and that is not a typo

| | Comparison | Why |
|---|---|---|
| `addPlayer()` | `count >= limit` | adding needs room for **one more** |
| assign gate | `count > limit` | assigning only needs the roster to be **within** the limit |

So a Free coach sitting at **exactly 3** active can still assign to all three; they simply cannot add a fourth. A Pro coach at exactly 30 likewise. The two comparisons sit in adjacent helpers reading the same `activeStudentLimit()`, so they look like one is wrong — both call sites carry a comment saying why they differ. Verified at the boundary: `3/3 → assign allowed, add blocked`; `4/3 → both blocked`.

### ⚠️ Assign-only. `saveLog` is deliberately UNTOUCHED

This is the distinction most likely to be collapsed by a later change, so it is stated twice in the code and once here:

| | blocks assigning | blocks logging | scope |
|---|---|---|---|
| **Deactivation** | yes | **yes** | one student |
| **Over-limit** | yes | **no** | account-wide |

`saveLog()` reads exactly one thing — `players.deactivated_at`, by player id. It never reads the coaches row, `subscription_status`, or any count, so **logging is plan-agnostic by construction** rather than by a rule someone has to remember. Students keep logging work already assigned while their coach is over limit. Nothing is deleted, hidden or degraded.

⚠️ Adding a plan read to `saveLog` would silently turn this into a second, harsher deactivation. Do not.

### ⚠️ It fails OPEN — the reverse of the add gate

`accountOverLimit()` treats an unreadable count as "not over" and lets the assign through. `addPlayer()` treats an unreadable count as a hard block. **Both are deliberate and the asymmetry is the point:**

- The **add** gate guards **new** capacity. Failing open silently gives away paid capacity — the failure nobody notices.
- The **assign** gate freezes work for a coach who **has already paid up to this point**. Wrongly freezing a compliant coach on a transient hiccup is worse than briefly letting an over-limit one assign.

### Where it lives

| Layer | Where | Job |
|---|---|---|
| **Enforcement** | `requireCanAssign()` in `src/lib/active-students.ts`, called by `saveAssignment()`, `saveCustomAssignment()` and `repeatAssignment()` | the gate on the three write paths |
| **Enforcement** | `accountOverLimit()` in `updateAssignmentTarget()` — ⚠️ **a different helper on purpose**, see below | the gate on **Edit amount**, the fourth path |
| Convenience | `redirectUnlessCanAssign()`, shared by all six `/assign/*` routes | stops a coach walking a picker flow that would refuse at the end |
| Presentation | roster banner, the student screen's suppressed CTA, and the hidden **Edit amount** row | says it before they try |

**Three result codes**, mirroring `AddPlayerResult`'s shape:

- **`student_paused`** — this student is deactivated. ⚠️ **Wins when both apply**: it is the more specific fact about the student the coach is looking at, and it stays true after the limit is fixed, so leading with the account message would send them to solve the wrong problem first.
- **`over_limit`** — account over, coach unentitled. Copy offers upgrading.
- **`over_ceiling`** — account over, coach is Pro past `PRO_STUDENT_LIMIT`. **No upgrade offered** — there is no higher plan, so suggesting one would be a lie dressed as a fix. Same split `CeilingBlock` already makes.

⚠️ `requireCanAssign()` runs the per-student check and the account check in **`Promise.all`**. They are mutually independent, so this costs **no extra latency** over the single `requireActivePlayer()` call it replaced — which matters given the cold starts and the iad1/US-West region mismatch recorded under *Navigation & loading feel*.

⚠️ It reuses `countActiveStudents()` rather than folding the count into the player read. Two reads instead of one, on purpose: a JS `filter` beside the existing `.is("deactivated_at", null)` would be a **second expression of "active"**, and this codebase has been bitten by exactly that (`isComplete`'s seven call sites).

### ⚠️ Edit amount is the FOURTH enforcement point, and it uses a different helper

Added Aug 17 2026 (`752907c`), found in testing after the first three shipped.

**Editing an amount IS assigning work.** Raising a target from 25 reps to 200 hands the student genuinely more to do — the same act as a new assignment, routed through an edit instead of a new row. Without this the whole account-level gate is side-stepped by anyone who notices.

⚠️ **It calls `accountOverLimit()`, NOT `requireCanAssign()`, and that is the entire point of this entry.** `requireCanAssign()` would drag the per-student pause in with it, and **item 8 deliberately keeps "Edit amount" usable for a DEACTIVATED student**: a paused student cannot log at all, so changing their target is inert. This block is the opposite case — the student is **active and logging**, so the edit is live and consequential. Same control, two different reasons, and only one of them belongs on this action.

| Account | Student | Edit amount |
|---|---|---|
| within limit | active | **shown** |
| within limit | **deactivated** | **shown** — item 8's rule, the edit is inert |
| **over limit** | active | **hidden + blocked** |
| **over limit** | deactivated | hidden + blocked — because of the ACCOUNT, not the pause |

⚠️ **`canEditAmount` is a separate prop from `canAssign` on `AssignmentMenu`, and merging them would silently reverse item 8.** `canAssign = isActive && !overLimit`; `canEditAmount = !overLimit`. Side by side they look redundant and are not — row two of that table is the whole difference. Both are cosmetic; the action refuses either way.

⚠️ **All-or-nothing, with no increase/decrease distinction**, matching the rest of the gate. "Only block increases" invites a coach to ratchet 25 → 24 → 200 and turns one rule into a puzzle.

⚠️ Both refusals share `overLimitMessage(account, action)` so they cannot drift into describing one account state two different ways — *"…Deactivate someone to **start assigning again**"* against *"…to **make changes**"*, identical otherwise.

⚠️ **This exposed a silent failure and fixed it.** `handleSaveAmount()` in `AssignmentMenu` did **nothing** on `ok: false` — the modal stayed open, unchanged and silent, reading as a dead button. Harmless while the only reachable failure was a DB error nobody hit; not harmless once a block returns a message the coach has to read. The modal now renders the error above its buttons.

### Surfaces

- **Roster** — an "Assigning is on hold" banner above the groups, `OverLimitBanner.tsx`.
  - ⚠️ **RULES, NOT THE SENTENCE. This entry quoted the banner's exact copy and went stale TWICE in one night** — first on "make room" versus "spot", then on the two-part restructure. The wording lives in `OverLimitBanner.tsx`; read it there. What is recorded here is what must stay true of whatever it says:
    - **"spot" is the app's one term for available capacity.** Not "room", not "slot". Also used by the deactivate modal, the activate gate's heading, and the Pro-ceiling refusals in `addPlayer()` and `activatePlayer()`. Changing it means changing all of them.
    - **The shortfall is COMPUTED**, `count − limit`, with the noun following `getActivityLabels()`. It shipped as a hardcoded "one" and was wrong for any coach more than one over — they deactivate a student, are still blocked, and go round again.
    - **The upgrade offer is a 44px BUTTON on its own line, never an inline link.** The rule is 44px minimum with the visible label *as* the target, and an accent phrase mid-sentence can be neither. This is why the sentence ends before the offer rather than running into it. Omitted entirely for `over_ceiling`.
    - It calls `startUpgrade()` from `useUpgrade()` — **the fourth consumer**, after ProfileMenu, the add-student paywall and the reactivate gate.
  - ⚠️ **The banner does NOT name where the fix is.** An earlier draft said "from their profile"; the shipped copy does not, so a coach reads *what* to do without being told the lever lives on each student's own screen. A known gap rather than a decision — it was the main copy constraint identified when this was designed, and it is currently unmet.
  - `PauseCircle` at 16px / stroke 2 in `#8a8fa8` — the overflow-menu icon size, in the sub-text grey. Surface and outline follow *The blue capacity system* below.
  - ⚠️ A **client component**, and only because of the CTA. It still **costs ZERO extra queries** — the page already holds every player row and `requireCoach()` already selected `subscription_status`, so the numbers are passed down rather than re-read.
- **Student detail** — the assign CTA is replaced, **in its own slot**, by a line saying assigning is on hold, plus the same 44px Upgrade button (**the fifth** `useUpgrade()` consumer). Same slot so nothing shifts when the coach comes back under. Both the line and the button read only when the student is active, since the per-student banner wins anyway, and the button is gated on the coach being unentitled — `entitled` rides the same `accountOverLimit()` read, so it costs nothing.
- **`resendPlayerLink()` is deliberately NOT blocked.** It re-sends an existing link and creates no new work. (Deactivation *does* block it, for a different reason: the link leads a paused student to a dead end.)

### The blue capacity system

Established Aug 17 2026. **Blue marks anything touching PLAN CAPACITY. Grey marks a routine action.** Two surfaces carry it, and they carry it *because they are the same state* — over the plan's limit — reached two different ways:

| Surface | Reached by | Treatment |
|---|---|---|
| Roster "Assigning is on hold" banner | trying to assign | `#18222d` fill, `1px solid rgba(55,138,221,0.35)` |
| "No spot for {name}" modal | trying to reactivate | `#1e2633` fill, same outline |
| Deactivate confirm modal | a routine, reversible action | **plain grey**, deliberately |

The fills are the brand blue washed over the surface underneath at 7% — the all-done panel's idiom in blue instead of emerald — then **flattened to a solid**. ⚠️ They were layered gradients first (`linear-gradient(rgba(55,138,221,0.07) ×2), #161a20`). That computes correctly in Chrome, verified, but rendered wrong on device; a solid removes the engine variance and leaves one value to read rather than two to compose in your head.

⚠️ **The outline is load-bearing, not decoration.** At `0.18` alpha the banner read as a colour wash with no edge and lost its shape against the roster. `0.35` at 1px is a light outline that defines it without becoming a saturated blue rule.

⚠️ **This is NOT a warning colour, and there still isn't one.** Yellow was retired platform-wide when it stopped meaning "in progress", and nothing here reintroduces a second status vocabulary — the blue is the existing brand accent, and the icon and both text tones stay the greys already in use. These are states a coach can resolve, not failures.

⚠️ **`#5ba3ea` — the CTA border and label on both surfaces — is a NEW VALUE and is not tokenised.** The palette has `--reps-orange` `#378add` and `--reps-orange-hi` `#4a9ae8`; this is a third step up, chosen because `#378add` measures **4.47:1** as 13px text on the tinted banner (under the 4.5 AA floor — the tint is what pushed it under) where `#5ba3ea` clears at **6.03:1**. It is a literal in two files. See the tokenising item under *Low priority*.

⚠️ **Never use a bare `border` class on a dark surface.** Tailwind 3.4's preflight defaults `border-color` to `#e5e7eb`, a light grey. The activate-gate modal was briefly the app's only bare `border`; an inline colour did override it, but the next edit would have put a white ring round a dark modal.

### Not done

✅ **Verified against a real over-limit account** at the data layer (`canceled`, 5 active, limit 3): active students refused with `over_limit`, the inactive one with `student_paused`, a Pro coach at 5/30 unaffected. The downgrade that produced it was a genuine Stripe test-clock advance — clock → cancel → webhook → `subscription_status` → gate, observed joined end to end.

✅ **Device-tested Aug 17 2026**, and it is where most of this section's copy and colour decisions came from: the hardcoded "one", the missing outline, the em dashes, the flat three-tier modal, the inline upgrade phrase. Every one of those was invisible until it was on a phone.

⚠️ **Still unseen on a device:** the `over_ceiling` variants. Everything above was walked as an unentitled coach over the *free* limit; a Pro coach past 30 — who gets no upgrade button on either surface — has never been rendered.

---

## Roster screen

The coach's home. `src/app/instructor/students/page.tsx`.

Players are grouped by completion — **Done / In progress / Not started / Nothing assigned** — and within each group sorted by **most recent activity, descending** (Aug 1 2026).

⚠️ **This ordering was undocumented until Aug 1, in both directions.** Before that date rows sat in `players.created_at` order — the order a coach added them — which was never written down either. So this is a first description, not a correction: nothing in this file ever claimed the old behaviour.

- Sort key is `lastLoggedByPlayer`, the same `MAX(logged_at)` already computed for the relative timestamp on each row. No extra query, and the order a coach reads now matches the dates they see.
- **Never-logged players sort to the bottom of their own group** rather than being interleaved via a fallback date, which would rank "never" against real activity.
- Ties keep their previous order. `Array.prototype.sort` is stable and the players query is still ordered by `created_at`, so two never-logged players stay in the order they were added.

⚠️ **Only two groups actually move.** *Done* and *In progress* require logs by definition and reorder fully. *Not started* is assignments-with-no-logs and is a guaranteed no-op — if it ever appears to reorder, something is wrong. *Nothing assigned* is usually a no-op too, but not always: a player whose assignments were all deleted keeps their logs (`assignment_id` goes NULL, never the row), and the activity read is player-scoped precisely so that still counts — so they can outrank a genuinely new player.

⚠️ The sort compares with `Date.parse`; the `MAX(logged_at)` fold immediately above it still compares raw strings with `>`. Both work on uniformly-formatted UTC values — the string form quietly depends on every row carrying identical fractional-second precision. Left as-is, noted so the inconsistency isn't mistaken for intent.

## PrivacyFooter — the student and parent link out

Built Aug 17 2026 (`e18b5c2`). `src/components/PrivacyFooter.tsx`. Until then **nothing under `/student` or `/parent` linked to `/privacy`, `/terms` or `/faq`** — every reference lived in `page.tsx` and `/faq`. The gap fell on the people least able to act on it: students on a token link, many of them minors, and the parents whose data the policy describes.

**Where it renders:** the student home (both branches — the assignment list and the paused screen), `/student/login`, and `/parent/[token]`.

⚠️ **NOT on the log screen or `/celebrate`, and that is a decision rather than an oversight.** The log screen's bottom is a `sticky bottom-0` CTA whose spacing and gradient are documented to the pixel in *Student log screen* below — anything added under it either sits beneath a sticky element or fights it, for near-zero gain. Celebrate is one congratulatory beat and is one tap from the home screen that carries this.

⚠️ **One component, not four copies.** The treatment shipped first on the parent view as a hand-rolled `Read-only view · Reps`; it was lifted into a component when three more surfaces needed it. `prefix` is the only prop, and exists solely for that parent line.

### ⚠️ The anchor is load-bearing

The link targets **`/privacy#students-and-minors`**, not the top of the page. `/privacy` spends five sections on coach and billing matters before reaching the one written for parents — a parent who taps this should land on the answer, not on Stripe customer IDs.

⚠️ **`id="students-and-minors"` on that `h2` is therefore a link target, not decoration. Renaming or removing it breaks four links SILENTLY** — no build error, no runtime error, the page just opens at the top. There is nothing in the toolchain that would catch it.

### ⚠️ Two deliberate departures from the pattern it copied

Both measured, both because a **link** is not the decorative label the pattern was invented for:

| | Original line | The link |
|---|---|---|
| Colour | `text-reps-dim/50` → `#494d5c`, **2.35:1** | `text-reps-sub` `#8a8fa8`, **6.17:1** |
| Target | none — 11px text is ~13px tall | `inline-flex min-h-[44px]` |

- The surrounding line keeps `dim/50`. Only the link moved: 2.35:1 is fine for a label nobody has to find, and not fine for the one thing on the screen a person is meant to tap.
- ⚠️ **The 44px floor applies here** — this stopped being decorative text the moment it became the only route to the policy. A ~13px target is the exact dead zone that made seven back links need several taps. A negative margin cancels the added height, so the line looks identical to the one the parent view already shipped.

⚠️ **Never seen on a device.** The specific thing to check is whether `mt-auto` pins the footer where expected on the student home with a LONG assignment list versus a short one — nothing else in that `<main>` grows, which is what the placement relies on.

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
7. Note field — `How'd this one go?` with `optional` beside it, a 3-row textarea, and a right-aligned `{n}/100` counter. **Every goal type**: it sits outside all the branching above, since what a student wants to say isn't a function of how the work is scored
8. `Log progress` button, which **follows the content** rather than anchoring to the bottom (renamed from `Log it` Aug 1 2026 — "Log it" read as a single terminal act, but logs are increments a student adds to across sessions)

**Spacing tightened July 27 2026** — roughly 100px removed. The gap below the progress bar went 96px → 56px (by far the largest on the screen, and the dead zone between "here's where you are" and "here's what you're entering"); header 56 → 48; stepper block to button 56 → 48; button padding `+2rem` → `+1.5rem`.

**Revised again Aug 1 2026, when the note field landed.** Two passes the same day. The first reclaimed slack the July 27 numbers had left behind — those were sized for a screen whose last content was the stepper block, and the note now sits between the steppers and the button. The second **redistributed** it: absolute sizes matter less here than ratios, and the first pass left the screen reading as five evenly spaced rows rather than as groups.

The screen is **two units**: a *counting cluster* (progress bar → goal-type label → hero stepper → hairline → MAKES row) and the *note block* below it. Gaps inside the cluster are tight; the gaps bracketing it are the largest on the screen.

**Current values, top to bottom:**

| Gap | Value | Class |
|---|---|---|
| Header → progress text | 48px | `mb-12` |
| Progress text → bar | 12px | `mb-3` |
| **Bar → goal-type label** | **44px** | `mb-11` |
| Label → hero stepper | 12px | `mt-3` |
| Stepper → hairline | 20px | `mt-5` |
| Hairline → MAKES row | 16px | `mt-4` |
| **Cluster → note block** | **56px** | `mb-14` |
| Note block → button | 32px (+12px `pt-3`) | `mb-8` |

Every gap *inside* the cluster is 20px or less against boundaries of 44px and 56px, so the boundary always wins. The note-side boundary is deliberately the larger of the two — that is what makes the note read as the start of something new rather than the tail of the cluster.

- ⚠️ The bar margin is changed in **both** branches of the `showMakesRow` ternary, which keeps all five goal-type layouts moving together rather than the two-tone bar drifting away from the single one.
- ⚠️ **The four single-stepper layouts were evaluated and left unsplit on purpose** — not overlooked. Makes goal, consecutive, minutes and reps-only all drop the MAKES row, leaving a ~105px cluster against ~192px for attempts+makes, so the same 44px above it is proportionally about **1.8× more prominent** (0.42 vs 0.23 of cluster height). The candidate fix is to split the bar margin by ternary branch — `mb-11` with a MAKES row, `mb-8` without — since the branch already maps exactly to that distinction. Not applied: the grouping still holds arithmetically there (56 > 44), and whether the extra air reads as calm or as empty is a judgment that needs a **real device**. One number across all five until that is seen. Splitting would also reverse the rule in the bullet above, so it is a deliberate trade rather than a free tweak.
- The note block's **32px** to the button is about matching the rest of the app rather than reclaiming slack: `CountScreen`, `CustomExerciseScreen` and `AddPlayerForm` all put **32px** before a full-width primary button, and at `mb-12` this screen sat at **60px** once the sticky wrapper's own `pt-3` is counted — nearly double every other screen. The July 27 figure of 48px is superseded.
  - ⚠️ **32px is the floor, not a free choice.** The sticky wrapper carries a gradient (`h-8`, 32px) anchored above it via `top-0` + `-translate-y-full`, so it occupies the **bottom 32px of this gap**. At `mb-8` the fade spans the gap *exactly*: **0px clear** between the counter and the gradient's top edge, down from 16px at `mb-12`. Tightening further would start the fade over the counter itself.
  - **It abuts the counter; it does not overlap it**, and nothing is dimmed at rest. The gradient runs `from-transparent` at the top edge where it meets the counter, fading to `#080b0f` — which *is* the page background, so on an unscrolled screen the whole thing is invisible. It only does work when content scrolls under the sticky footer.
  - ⚠️ The real consequence: on a screen tall enough to scroll, the counter now begins fading the moment it reaches the footer, where it previously had 16px of travel first. Genuine clearance at this margin would mean shrinking the gradient (`h-6` → 8px clear, `h-5` → 12px), which has **not** been done.
  - Margins do not collapse here — `main` is `flex flex-col`, and flex items never collapse margins — so 32px is exact rather than approximate.

⚠️ **The button lost its `mt-auto`, and that was the load-bearing part.** Auto margin absorbs all remaining vertical slack, so tightening the gaps above would have made the empty band below them *larger* — every pixel saved went straight into that margin. The two problems were one problem. `sticky bottom-0` stays, so it still pins once the screen genuinely fills (long name + side line + makes row on a small phone).

The coach detail CTA **keeps** its `mt-auto` and is untouched. It's free there: that screen's content is a card list long enough to fill the viewport, so the auto margin has nothing to absorb. Same code, opposite result — the difference is content shape.

**Label resolution, in order:**
- `consecutive` → `SETS COMPLETED`
- `makes` goal → `MAKES` (hero)
- `unit === 'minutes'` → `MINUTES` (wins over everything else)
- Shooting / Finishing / Spot shots **with** `track_makes` → `ATTEMPTS`
- Everything else, including a shooting drill with makes off → `REPS`

All render uppercase — these are the goal-type labels, and they stay uppercase and non-question.

⚠️ **One deliberate exception: the note field's `How'd this one go?`** — sentence case, and the only question-form copy on the screen. Validated with RJ and a real student before it shipped, so it is a considered break from the rule above rather than drift. The distinction is what each piece of text is doing: a goal-type label *names the measure* the stepper counts, where a question would be noise; the note field *asks the student for something optional*, which a bare uppercase `NOTE` does not do. Keep new labels uppercase; this exception covers the note field alone.

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

⚠️ Both the write and the read are wrapped in try/catch. Safari private browsing throws on `sessionStorage`, and an uncaught throw on the write would skip the navigation and strand the student on the log screen with a live `Log progress` button — inviting a second tap and a duplicate row.

Confetti fires only when the **last** open assignment closes (`allDone`).

---

## Exercise library (Basketball) — 30 exercises, 6 categories

Source of truth: `src/lib/exercises.ts`. Category keys: `shooting`, `handling`, `finishing`, `footwork`, `conditioning`, `spot-shots`.

**⚠️ INVARIANT:** Every exercise's `default` must appear in its `quick` preset array. If it doesn't, the count screen opens with no preset selected and the number input hidden. Re-check after any edit.

**Shooting** (reps · 25/50/100/200)  
Form shooting 50, Free throws 50, Mid-range jumpers 50, Corner 3s 25, Catch & shoot 50, Elbow jumpers 25, Short corner jumpers 25, Dribble pull-ups 25

**Ball-handling** (minutes · 5/10/15/20)  
Stationary dribbling 10, Two-ball dribbling 10, Crossovers 5, Figure 8s 5, Dribble series 10

**Finishing** (reps · 10/20/50/100)  
Layups 20, Floaters 20, Euro-step 20, Hop-step 20, Spin 20

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

⚠️ That `hasProgress` gate is also what made the July 27 log backfill safe: `target` is the only one of the five snapshot fields that can change after assigning, and it cannot change once a row has logs.

### Overflow menu styling (July 27 2026)

Three of the app's four menus now share one pattern, lifted from `PlayerManage`: raised surface, items flush to the container edges (clipped by `overflow-hidden`), a `border-t` hairline between rows rather than gaps, no inner padding on the panel.

`AssignmentMenu` was the odd one out with a padded `p-1` panel and rounded inner items; it now matches. Each item carries a **lucide** icon at `size 16 / strokeWidth 2` — `RotateCcw` (Assign again), `ArrowRight` / `ArrowLeft` (Archive / Move back to New), `Pencil` (Edit amount), `Trash2` (Delete assignment) — dimmed to `opacity-60` so the glyph supports the label rather than competing with it. Opacity rather than a fixed grey, so the Delete row's icon stays red.

`CustomExerciseMenu` still uses the old padded style — see Low priority.

### Z-index tiers on the coach detail screen

Adding the sticky tab bar broke `PlayerManage`'s dropdown, which sat at `z-10`/`z-20`. Equal z with the bar meant DOM order won and the menu rendered *underneath* it; worse, the `z-10` click-away sat below the bar, so tapping the bar with the menu open switched tabs instead of dismissing.

The screen's tiers, now consistent:

| Layer | z |
|---|---|
| Sticky tab bar | 20 |
| Menu click-aways (both menus) | 40 |
| Menu panels (both menus) | 50 |
| Modals (all four) | 60 |
| Toasts (all three) | 70 |

⚠️ **Any new sticky or pinned element on this screen must stay under z-40**, or it swallows both menus the same way. `PlayerManage`'s toast was also raised 50 → 70 to join the other two; at 50 it sat below the modals, so a "Link copied" raised behind an open dialog was invisible.

The two menu panels tie at z-50, which is unreachable: each menu's full-screen click-away sits at z-40 and neither trigger is elevated, so opening one closes the other.

---

## Navigation & loading feel

Live on prod **July 30 2026** (`874ddfa`). Prompted by roster → player detail and back taking several taps to register.

⚠️ This section was originally dated July 27 in error. Everything else marked July 27 in this file is correct — the Archive model, Assign again, the emerald palette and the log snapshot all landed that day (`ade9e23`…`caedec8`). Only this pass (`4f992ba`…`874ddfa`) is July 30.

⚠️ **The two navigations had different root causes**, which is the useful lesson. Roster → detail was real latency (five sequential round trips) made to *feel* broken by zero feedback. Detail → roster was a hit-target bug wearing a latency costume: the back label was not a link at all.

### Optimistic card actions

Archive, Move back to New, Assign again and Delete update the list on the next frame; the server call runs behind. They previously awaited the mutation and then `router.refresh()`, so nothing moved until a full round trip finished.

⚠️ **This required moving the coach's card list to the client** (`CoachAssignmentList.tsx`). The list used to be built server-side and handed to `AssignmentTabs` as an opaque `ReactNode[]` — a menu sitting *inside* a pre-rendered card cannot remove that card, and the tab wrapper cannot tell one node from another to move it or recount. Nobody on the client owned the list. The server still does the DATA work (the queries and the log aggregation) and passes plain rows down; only rendering and the ownership of "which card is where" moved. This inverts the note in `AssignmentTabs` about keeping cards on the server — that note predates optimistic updates.

Rollback is `useOptimistic`, not hand-written: the optimistic layer is discarded when the transition ends. On failure the handler simply returns — the card snaps back — and toasts the server's error. On success `router.refresh()` runs **inside** the transition, holding it open until fresh data lands, so the optimistic row is *replaced* rather than reverted-then-reapplied, which would flash.

Derived state moved with the list or it would lag a frame behind the card that caused it: tab counts, both empty states, the all-done panel, and the bottom CTA — whose label depends on `allDone`, which an "Assign again" placeholder changes.

"Assign again" inserts a dimmed placeholder with its menu disabled; its id is local-only until the server replies.

`Edit amount` still calls the server directly from `AssignmentMenu` — it changes nothing about which list a card belongs to, so it has no optimistic state to own.

### Loading boundaries

There were **none anywhere in the app**. On a dynamic route that costs twice over: nothing paints between tap and render, *and* Next only prefetches a dynamic route down to its nearest loading boundary — so with none, prefetch was inert app-wide.

| Route | Boundary |
|---|---|
| `/instructor/students` | own |
| `/instructor/student/[id]` | own |
| `/instructor/student/[id]/assign` | own — serves the whole subtree |
| `/student/[token]` | own |
| `/student/[token]/log/[assignmentId]` | own |
| `/student/[token]/celebrate` | own — **renders `null`** |

⚠️ **A wrong shape is worse than no shape.** Before `/assign` had its own, "+ Assign more" inherited the player detail skeleton — avatar, tab bar, progress cards — and then landed on a category picker. The same class of bug put the *student home* skeleton in front of the celebrate screen.

⚠️ **Celebrate's boundary returns `null` deliberately.** It has zero server fetches, so any skeleton is a lie about what it is waiting for. It still needs the file, because `use(params)` suspends — `params` is a Promise in Next 16, so even a fetch-free route hits a boundary for a frame — and celebrate is a *sibling* of `/log/[assignmentId]`, not a child, so the nearest boundary was the student home. Returning null gives the bare page background instead. Do not add a shape: it would reintroduce from outside the exact "asserting an outcome it hasn't read yet" problem celebrate's own three-state loading exists to prevent.

One boundary covers the whole `/assign` subtree because the category picker, exercise list and My exercises are the same shape — back row, heading pair, column of bordered rows. Three leaves under it (`custom`, `[category]/[exercise]`, `mine/[exerciseId]`) are *form* screens inheriting a row-list shape: much closer than the player detail skeleton they had, still not right, and each would want its own if it starts to show.

Primitives live in `src/components/Skeleton.tsx`, one file so the six states can't drift.

- **Fill is `#2a2d36`** — the app's own border/bar-track colour — not white at low opacity, which still reads as a light shape against near-black.
- **Animation is `sk-breathe`** (1 → 0.72 over 1.8s, in `globals.css`) rather than Tailwind's `animate-pulse` (1 → 0.5), which flickered and landed the content swap mid-swing.
- ⚠️ The roster's "ghost rows" empty state uses the same faded-shape idiom. The skeletons **pulse** specifically so a coach with seven players is never briefly told they have none.

### Back links — one pattern, all seven

44×44px (or 44 tall with the label inside), `aria-label`, `WebkitTapHighlightColor: transparent`.

⚠️ **Six of the seven had the label in a `<span>` OUTSIDE the link.** On player detail that label read "Players" — the name of the destination — so the obvious tap did nothing at all, ever. That was the multiple-taps bug, and it was never latency.

Round one left five of them arrow-only, on the grounds that their labels are screen titles ("Shooting", "My exercises") rather than back destinations. Reversed the same day: in daily use they read as "go back" and get tapped as such. The seventh (add-student) was missed in the original sweep because it already carried an `aria-label` and so looked done.

### Tap feedback

`hover:bg-reps-card` on the assign flow's category, exercise and My-exercises rows caused a grey flash. ⚠️ **On iOS the `:hover` state STICKS after a tap**, so the row lit grey and *stayed* lit while the next screen loaded — which read as a glitch, not a response. Replaced with the treatment the roster rows already used: `active:scale-[0.99]` plus a transparent tap highlight, keeping the border hover for desktop. On My exercises only the link half scales; that row is split with a menu beside it, and scaling the whole thing would pull the two visibly apart.

### Diagnosed, NOT fixed

- **Region mismatch.** No `vercel.json`, so functions default to `iad1` (US East) while Supabase is US West — roughly 60–70ms each way, × five sequential calls on player detail. A three-line region pin fixes it, but confirm the Supabase region in the dashboard first rather than trusting this file, and take it through staging.
- **Player detail's waterfall** — five sequential round trips (`getUser` → `coaches` → `players` → `assignments` → `logs`). `players` and `assignments` are independent and could be one `Promise.all`.
- ⚠️ **`getUser()` is a network call on every instructor page load — and must stay one.** It revalidates the JWT; `getSession()` reads the cookie without validating and is explicitly unsafe for server-side authorization. Swapping it would be a security regression, not a perf win. The fix is the waterfall, not the auth call.
- **Four `router.refresh()` sites remain** — `PlayerManage` (edit phone), `ProfileMenu` (edit name), `CustomExerciseMenu` (delete exercise), `AssignmentMenu` (edit amount). All behind modals or menus where the pause doesn't read as broken; deliberately left. `AllDoneActions` (bulk archive) is the one genuine candidate for conversion.
- **Cold starts.** One real coach, so these functions are almost always cold — which is why the first tap after idle is worse than the rest.

---

## Twilio status

- ✅ Toll-free (833) 892-5640 — registered and approved
- ✅ SMS confirmed working end-to-end (July 22 2026)
- Messaging Service SID: `MGe3a0a18bf618d102aae9cb26943cd239`
- Use `MessagingServiceSid` parameter, not `From`
- Old number +15625487985 released

⚠️ **Still pending:** Update `TWILIO_FROM_NUMBER` to `+18338925640` in `.env.local` AND Vercel env vars.

### Two notify paths (July 27 2026)

`src/lib/notify-assignment.ts` exports two functions. They share the recipient lookup and message wording — a repeat reads identically to a first assignment, since "new work landed" is true either way — and differ only in gating.

| | `notifyAssignmentOnce` | `notifyRepeatAssignment` |
|---|---|---|
| Used by | both assign flows (preset + custom) | **Assign again** only |
| Daily gate | **Yes** — at most one per student per LA day | **No** — always sends |
| Writes `last_texted_at` | Yes, only after Twilio confirms | **No** |

The gate exists so one setup session doesn't fire five texts while a coach adds five drills. A repeat is the opposite shape: a single deliberate decision about one piece of work, usually days later. Swallowing it would mean the student is never told the work came back.

⚠️ **The repeat path deliberately neither reads nor writes `last_texted_at`.** Not writing it is what keeps the two independent — a repeat must not consume the day's allowance and silence a genuinely separate assignment made later.

⚠️ Consequence: **`last_texted_at` now means "last *gated* notification", not "last contact."** A repeat leaves no trace on the row, so null there does not prove the student was never texted. Anything wanting a true last-contact timestamp needs its own column.

Both paths always send to `players.phone`. `send_to_parent` is still not consulted — see the parent contact model in Pending.

---

## Resend (auth email)

- ✅ Configured and live — emails from hello@assignreps.com
- Host: `smtp.resend.com` · Port 465 (SSL) · Username `resend`
- SPF/DKIM/MX configured at Porkbun

---

## Stripe status

- ✅ **Test mode** product **Reps** — $10.00/month recurring, created in the dashboard Aug 1 2026
- Test price ID: `price_1U0EVsJoxKRCY55iExnvBMmP`
- ✅ Coupon `COACHRJ` — 100% off, **Forever** duration (not Once, not Repeating — it is lifetime free, so anything else bills RJ from month two). Coupon `OuDvRjjw`, recreated Aug 3 with **no redemption cap** — see finding 3 below for why the original was replaced.
- ✅ Stripe CLI 1.45.0 installed (Homebrew). `stripe listen --forward-to localhost:3000/api/stripe/webhook` is how the webhook is exercised locally.
- Env var names: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` — see `.env.local.example`
- Schema: three columns on `coaches` — see **`coaches` billing columns** and **`coaches` write protection** in Key schema notes

✅ **LIVE MODE EXISTS AS OF Aug 18–19 2026, and PROD RUNS ON IT.** Live keys were deployed to prod at ~11:38pm Aug 18, a live webhook endpoint was registered ~11:32pm at `https://www.assignreps.com/api/stripe/webhook` (same three events), and a real live checkout has since completed end to end — see *Verified end to end — LIVE MODE ON PROD*. ⚠️ **Test and live still share nothing:** every id differs, and the test values listed above are meaningless in live.

⚠️ **The live-mode ids are NOT recorded in this file, deliberately** — the CLI here holds test credentials only, so anything written down would be transcribed rather than verified, which is the class of claim this file has been burned by before. Read them from the live dashboard.

⚠️ **RJ WAS PROVISIONED BY HAND, NOT THROUGH CHECKOUT.** His live subscription was created directly in the Stripe dashboard with a "RJ Free Access, 100% off forever" coupon (first invoice $0.00, Active), and his `coaches` row was then repointed to his live customer and subscription ids by a **direct database write** on Aug 18. ⚠️ So his account has **never exercised the live webhook path** — his working state proves entitlement reads only. Do not cite it as evidence the live pipeline works; the `elliecocoliu@gmail.com` checkout is the only thing that proves that.

✅ **Prod carried all three Stripe env vars in TEST mode first** (Aug 18 2026), and a full checkout plus a portal cancellation were proven against them — see the two Aug 18 verification blocks. ⚠️ **Prod has since moved to LIVE keys**, so those two blocks describe a configuration prod no longer runs. They remain the proof that the CODE path is correct; they are not a description of current prod.

✅ **Test-mode webhook endpoint registered:** `we_1U61rNJoxKRCY55iM5xU8jRB` → `https://www.assignreps.com/api/stripe/webhook`, subscribed to exactly the three events the handler acts on. ⚠️ **`www`, not the apex** — see the prod verification block for why the apex silently fails.

⚠️ **Still pending:** the three Stripe env vars on **STAGING**, which has none — an unsigned POST to its webhook still answers `500 "Webhook not configured"`.

⚠️ **`TWILIO_FROM_NUMBER` is NOT actually pending, and this entry was wrong twice.** No code reads it — `sms.ts` sends via `MessagingServiceSid`, as its own comment says. The var in `.env.local` still holds the **released** number `+15625487985`, so it is dead config carrying a dead value rather than an outstanding task. Delete it or correct it, but nothing is broken by it.

⚠️ **THE SHARED-DATABASE HAZARD IS NOW LIVE, not theoretical.** Local, staging and prod share one Supabase project, so `subscription_status`, `stripe_customer_id` and `stripe_subscription_id` are ONE set of columns for all three. Prod is on `sk_live_`; local is on `sk_test_` and staging has no Stripe vars at all. **A test-mode checkout run locally with card `4242` writes `active` to the same row prod reads** — granting real Pro access on live for a fake payment — and overwrites the coach's live `stripe_customer_id` with a test one, which then breaks their portal on prod with "No such customer". This is the go-live risk from the investigation, now armed. It has no code fix; it needs either separate Supabase projects per environment, or a discipline of never running a local/staging checkout against a coach row that matters in prod.

---

## Billing architecture (Aug 2 2026)

Every piece is built, and the loop is **verified end to end locally** (Aug 3 2026, and again with the gate on Aug 4 — see below). Free tier is 3 students forever, paywall at the 4th, $10/mo. ⚠️ Nothing here has ever run against a live-mode key.

| Piece | Where | What it does |
|---|---|---|
| Schema | `20260801170000` | `stripe_customer_id`, `stripe_subscription_id`, `subscription_status` on `coaches` |
| Write protection | `20260801180000` | Revoke + column grant, **plus a trigger** — see `coaches` write protection in Key schema notes |
| Service-role client | `src/lib/supabase-service.ts` | The only role allowed to write the billing columns |
| Stripe client | `src/lib/stripe.ts` | Lazy `getStripe()`; no `apiVersion` pinned |
| Checkout action | `src/app/instructor/billing/actions.ts` | Create-or-reuse customer, then a Checkout session |
| Entitlement | `src/lib/entitlement.ts` | `isEntitled()`, `FREE_STUDENT_LIMIT`, `PRO_STUDENT_LIMIT`, `activeStudentLimit()` — the single source of truth |
| Active-seat count | `src/lib/active-students.ts` | `countActiveStudents()` + `requireActivePlayer()` — the two reads every gate shares |
| Upgrade handler | `src/lib/use-upgrade.ts` | `useUpgrade()` — shared by both upgrade entry points |
| Upgrade button | `src/components/ProfileMenu.tsx` | First menu item, hidden when `isPro` |
| **Add-student gate** | `add-student/actions.ts` + `page.tsx` + `AddPlayerForm.tsx` | Blocks the 4th player, offers the paywall |
| Webhook | `src/app/api/stripe/webhook/route.ts` | Writes billing state back |

⚠️ **`/api` now exists, and it is a deliberate exception.** Every other server entry point in this app is a server action. Stripe POSTs from its own infrastructure to a URL, which an action cannot receive, so the webhook had to be a route handler. That is the *only* reason — a new route handler for anything reachable from our own UI would be drift.

### `isEntitled()` is the one rule

`active` + `trialing`, an **allowlist**. Asked by the upgrade button today and by the add-student gate when it exists, so the two can never disagree — the `isComplete()` lesson applied before the drift rather than after it.

- ⚠️ Unrecognised statuses **fail closed**. Stripe owns this vocabulary and has extended it before; a denylist would silently admit whatever it invents next.
- ⚠️ `past_due` is **not** entitled. Stripe retries a failed payment for weeks, and treating that window as paid means a coach who never successfully pays keeps access throughout it.
- `COACHRJ` needs no special case: a 100%-off-forever coupon still yields a real subscription reporting `active` at $0.

### The add-student gate (Aug 4 2026)

Blocks a non-entitled coach's **4th** player and offers the paywall instead. Three layers, and **only one of them is enforcement**.

| Layer | Where | Job |
|---|---|---|
| **Enforcement** | `addPlayer()` in `add-student/actions.ts` | The gate. Counts server-side, blocks the insert |
| Convenience | `add-student/page.tsx` | Renders the paywall instead of a form the coach can't submit |
| Presentation | `AddPlayerForm.tsx` | Draws the paywall, in the same screen shell as the form |

✅ **`addPlayer()` is the ONLY INSERT into `players` anywhere in `src/`** — audited across all 15 files that touch the table before building. Signup has no student-creation step in code. So the gate has one enforcement point, not several to keep in sync.

⚠️ **The page check is not protection and must never be mistaken for it.** A stale tab, a second device, or a direct invocation of the action all arrive with no page gate in front of them. This is the `fileFinishedAssignments` lesson and the already-subscribed guard in `createCheckoutSession()`, applied a third time: an action establishes its own preconditions rather than borrowing them from whatever rendered its button.

**Two deliberate asymmetries, both easy to "fix" into bugs:**

- ⚠️ **The action fails CLOSED, the page fails OPEN.** In `addPlayer()`, an unreadable count (`countError`, *or* a `null` count with no error) blocks. `count ?? 0` there would read "we don't know" as "zero players" and wave a coach straight through the paywall on a transient hiccup — the failure nobody would ever notice. The page does use `count ?? 0`, because it only decides whether to draw a form; on a hiccup it shows the form and lets the action have the final word, rather than telling a coach they are out of room when we could not read how much room they have.
- **The blocked result carries `code: "limit_reached"`, separate from its error string.** Hitting a paywall is not a validation failure and must not render as one — a red bordered box reads as "you typed something wrong", which is exactly what the coach did not do. The form swaps the whole screen for the prompt instead.

**Existing students are never touched.** The rule is `count >= FREE_STUDENT_LIMIT` blocks the *add*; a coach already over the limit (RJ at ~10, or a lapsed Pro) keeps everyone they have.

⚠️ **KNOWN AND ACCEPTED: count-then-insert is not atomic.** Two submits racing could land a 4th and 5th player. Closing it properly needs a database trigger, and any migration hits local, staging and prod at once (one shared Supabase project). The cost of the gap is one extra free player for one coach — not a security hole, not meaningful revenue at this scale. Deliberately left; revisit if the free tier ever guards something expensive.

**The paywall is in-place, not a redirect or a modal.** It renders inside the add-student screen's own shell — same back link, same padding — so the back link is reused rather than hand-copied into an eighth version. A redirect would strand the coach on the roster hunting for an upgrade item buried in a dropdown; a modal is ceremony this screen uses nowhere else. Copy is warm before transactional, because reaching the limit means the coach is actually using the product: *"You've got 3 players — nice work."* / *"Pro unlocks unlimited, $10/month."* The noun comes from `getActivityLabels`, so a piano teacher reads "students".

⚠️ The count in that copy is `Math.max(playerCount, FREE_STUDENT_LIMIT)`. A stale page can be told "blocked" by the action while holding an older, lower number — and it must never print a figure below the limit that was just enforced.

### `useUpgrade()` — one handler, two entry points

`src/lib/use-upgrade.ts` owns starting a Checkout session: the pending state, which failures surface, and the fact that leaving for Stripe is a **full navigation** rather than a router push. `ProfileMenu` and the add-student paywall both call it.

⚠️ **A HOOK, not a shared component, deliberately.** The two surfaces render genuinely different controls — a 36px menu row inside a 160px panel, and a full-width primary button on its own screen. A shared component would need a variant prop for every visual difference and would force one shape into a slot it does not fit. What must not drift is the *handler*, so that is what is shared; each surface keeps its own markup. Same reasoning as `isEntitled()` one layer up: that stops the two disagreeing about **who** is entitled, this stops them disagreeing about what pressing Upgrade **does**.

### Webhook contract

| Event | Writes |
|---|---|
| `checkout.session.completed` | `subscription_status`, `stripe_subscription_id`, `stripe_customer_id` |
| `customer.subscription.updated` | `subscription_status` |
| `customer.subscription.deleted` | `subscription_status` (`canceled`) |

`customer.subscription.created` is deliberately **not** handled — checkout covers creation, and both would mean two writes for one thing.

⚠️ **Signature verification is the security boundary of the entire billing system.** The column grant, the trigger and the service-role isolation all exist so a coach cannot set their own `subscription_status`. This route can. Unsigned requests would hand that to anyone who guesses the URL. The body is read with `req.text()` and never `req.json()` — re-serialising changes whitespace and key order and the HMAC stops matching — and nothing from the body is read before `constructEvent`.

⚠️ **Retrieves the subscription fresh on every event** rather than trusting the payload. Stripe delivers at-least-once and in no guaranteed order, so a stale `updated` can land after a newer one and overwrite current status with old. Reading current state at handling time makes ordering irrelevant and duplicates harmless.

⚠️ **Never assume `active` on checkout completion.** A card needing 3DS lands as `incomplete`; writing `active` would grant access to someone who has not paid.

**Three routes home**, priority-ordered — no single one covers every event:

1. `client_reference_id` — checkout sessions only
2. `subscription.metadata.coach_id` — subscription events carry no `client_reference_id`
3. `stripe_customer_id` lookup — catches a subscription created by hand in the dashboard, which has neither

⚠️ If none match it does **not** guess: logs and returns 200. An unmatchable event is not transient, and a 500 would have Stripe retrying it for days.

**Status codes are the retry protocol**, not decoration: `400` bad signature (never retry) · `500` missing secret (we are broken; retry succeeds once fixed, so events aren't lost) · `500` write or retrieve failure (transient) · `200` handled or ignorable. ⚠️ A `200` on a failed write marks the event delivered and loses it permanently.

### ✅ Verified end to end — LIVE MODE ON PROD (Aug 19 2026)

**The real one. Live keys, live webhook endpoint, a real card, through the actual app flow.** Everything above this entry is test mode; this is the first time money-capable infrastructure has carried a checkout from the app to the database.

⚠️ **Dated Aug 19, NOT folded into the Aug 18 session**, though it is the same continuous night. The checkout landed at **07:00:31 UTC = 12:00:31 AM PDT**, so the local date had rolled over. Ranked item 13 exists because a session's self-label was once carried forward over the real date; this is that rule applied rather than repeated.

A fresh coach ("Coach Tone Loc", `elliecocoliu@gmail.com`) signed up on prod, tapped **Upgrade to Pro**, applied a temporary 100%-off code (`TESTLIVE`, capped at 1, now spent), and completed Checkout with a **real card collected and $0.00 charged**.

| | |
|---|---|
| `subscription_status` | `active` |
| `stripe_customer_id` | `cus_V6G0Hwsawp5Lyc` |
| `stripe_subscription_id` | `sub_1U63XPJB7ZL7YlQBLwAFAtbK` |
| `metadata.coach_id` on the live subscription | `4bffbfaa-77c0-45c1-b15a-b84cfac7cad8` — **exact match to the coach row** |

⚠️ **WHY THE DATABASE ROW IS PROOF THE WEBHOOK RAN, and is not circular.** `createCheckoutSession()` writes `stripe_customer_id` itself, so that column alone proves only that checkout *started*. But **`subscription_status` and `stripe_subscription_id` have exactly ONE writer in the whole codebase** — `webhook/route.ts:227-228`, audited across `src/`. Nothing else can populate them. Their presence therefore *is* the evidence that Stripe delivered a signed live event to prod's endpoint and the handler processed it.

⚠️ **THIS IS THE DISTINCTION THAT MATTERS, AND IT IS EASY TO LOSE.** **RJ's live subscription was created BY HAND in the Stripe dashboard** — it never went through Checkout, so it never fired `checkout.session.completed` and never exercised the live webhook path at all. His row was repointed to his live ids by a **direct database write** (Aug 18, below). So RJ's working state proves *entitlement reads*, not *the live write path*. **This coach is the only thing that has ever proven live checkout → live webhook → database.** Do not cite RJ's account as evidence the pipeline works.

✅ **The `coach_id` metadata match is the definitive link**, and it was confirmed **directly in the Stripe dashboard by Tony** — not inferred. It is what would carry future `customer.subscription.*` events home, since those events carry no `client_reference_id`.

⚠️ **PROVENANCE — the Stripe side of this was NOT verified by tooling.** The CLI holds test credentials only (`stripe login` reports live needs re-authenticating), so live mode is entirely unobservable from here. Everything Stripe-side above comes from **Tony reading the live dashboard**. What the CLI *could* establish independently: both ids return `resource_missing` in test mode, and Stripe's id account-segment separates them cleanly — every test subscription carries `JoxKRCY55i`, both live ones carry `JB7ZL7YlQB`. That corroborates; it does not substitute for `livemode: true`.

**Cleanup done and outstanding:**

- ✅ **The `elliecocoliu@gmail.com` coach row was DELETED** after verification (Aug 19). Checked first: zero players, assignments and custom exercises, so nothing cascaded.
- ✅ `TESTLIVE` is spent and capped at 1 — inert, no action.
- ✅ **The live subscription `sub_1U63XPJB7ZL7YlQBLwAFAtbK` was CANCELLED in the live dashboard** (Aug 19 2026) — **Immediately**, no refund, with $0.00 confirmed as ever having been charged. ⚠️ Recorded because deleting the `coaches` row did **not** do this: **deleting a coach row touches nothing at Stripe**, and with the row gone there was no in-app portal route left, so it could only be cancelled dashboard-side. Any future test coach on live needs the same two-step cleanup — cancel at Stripe, then delete the row.
- ⚠️ The deleted row's `auth.users` entry remains, as ever — see the auth user audit under Medium priority.
- ⚠️ **`sub_1U0aJ6JoxKRCY55iGi5HfZ3l`, RJ's OLD test-mode subscription, is now orphaned** — still `active` in test mode, referenced by no row since the Aug 18 repoint. Harmless (test mode, no money) and deliberately left; it belongs to the broader stale-test-data audit, not to this pass.

### ✅ Verified end to end — ON PROD (Aug 18 2026)

**The first time the whole loop has been proven on production rather than locally.** Every earlier entry in this section was localhost with `stripe listen` forwarding; this one is prod's own deployed route receiving a real Stripe-signed event over the internet. ⚠️ **Test mode** — prod carries `sk_test_` keys. This is not a live-mode verification and does not substitute for one.

**The chain, each link observed rather than inferred:** a fresh coach (`tony@liudesign.com`) tapped **Upgrade to Pro** on prod → Checkout completed with card `4242` → the webhook fired to the registered endpoint → the service-role write landed → `ProfileMenu` flipped from "Upgrade to Pro" to "Manage subscription".

| Side | Value |
|---|---|
| Stripe subscription | `sub_1U62CkJoxKRCY55ilnlWJ3Kh`, status **`active`**, `livemode: false` |
| Stripe customer | `cus_V6EWjosSs1ZLHu` |
| Price | `price_1U0EVsJoxKRCY55iExnvBMmP` — $10.00/mo, the correct one |
| `subscription_status` | `active` |
| `stripe_customer_id` | `cus_V6EWjosSs1ZLHu` — **matches Stripe** |
| `stripe_subscription_id` | `sub_1U62CkJoxKRCY55ilnlWJ3Kh` — **matches Stripe** |

✅ **`subscription_data.metadata.coach_id` is populated on the live subscription object** (`48217f54-…`), so the webhook's *second* route home is confirmed working in production, not just the `client_reference_id` one.

✅ **THE AUG 3 REGRESSION WAS RE-CONFIRMED ON PROD, not assumed.** All four coach rows were read after the write: RJ (`riselongbeach@gmail.com`) still `active` and untouched, Coach Tony untouched, the canceled row still `canceled`. The customer-level resolution did not spray.

⚠️ **The webhook endpoint is a DASHBOARD endpoint, and it is registered at the `www` host** — `we_1U61rNJoxKRCY55iM5xU8jRB` → `https://www.assignreps.com/api/stripe/webhook`, subscribed to exactly the three events `HANDLED` contains. **The apex would have failed silently:** `assignreps.com` 308-redirects to `www`, and Stripe does not follow redirects on delivery. Register the live endpoint at `www` too.

⚠️ **A `stripe trigger checkout.session.completed` was run first and proved LESS than it appears.** It delivered (`pending_webhooks: 0`, so prod returned 2xx), which confirms DNS → TLS → routing → `STRIPE_WEBHOOK_SECRET` → HMAC verification. But the fixture creates a **`mode: "payment"`** session, which the handler rejects at its own `session.mode !== "subscription"` guard three steps before coach resolution. **It never touched the database.** Only the real checkout above proves the business logic. Do not treat a passing `stripe trigger` as an end-to-end test.

⚠️ **Dated Aug 18 2026 from the git clock, deliberately.** Stripe's timestamps on all of the above read **Aug 19** because they are UTC and this was a Pacific evening — the exact confusion ranked item 13 exists to correct. Use the local date, as `CHANGELOG.md` does.

### ✅ Verified end to end — CANCELLATION ON PROD (Aug 18 2026)

**The last unverified piece of the billing system, and it is now closed.** Cancel-at-period-end had only ever been proven locally (Aug 17); this is prod's own deployed portal action, prod's Stripe dashboard portal configuration, and prod's webhook. ⚠️ **Still test mode.**

Tony cancelled the throwaway `tony@liudesign.com` subscription through **ProfileMenu → Manage subscription** on prod — the real Customer Portal, not a simulated API call.

| Field | Value |
|---|---|
| `status` | **`active`** — correct; Pro is kept until the period ends |
| `cancel_at` | `1789796303` = **2026-09-19T05:38:23Z** |
| item `current_period_end` | `1789796303` — **EXACT MATCH** |
| `canceled_at` | 2026-08-19T05:42:56Z (when the button was pressed) |
| `ended_at` | `null` |
| `cancel_at_period_end` | **`false`** — the dahlia quirk, reproduced |

✅ **`billing_portal.session.created` (`bps_1U62GtJoxKRCY55igHDwE4Gy`) fired at 05:42:43**, which is independent proof that `createPortalSession()` executed on prod and Stripe minted a real portal session — not merely that the UI row rendered.

✅ **`customer.subscription.updated` delivered**, `pending_webhooks: 0`, so prod's webhook returned 2xx for a genuine cancellation event.

⚠️ **`subscription_status` in the database still reads `active`, and that is the CORRECT result, not a missed write.** Stripe holds the subscription `active` until the period actually ends; `isEntitled()` allows `active`; so the coach keeps Pro until **2026-09-19**, which is exactly what `/faq` promises. The row flips to `canceled` when `customer.subscription.deleted` fires at period end. **Do not "fix" this into an immediate downgrade.**

⚠️ **NEW dahlia finding, and it makes the existing instruction incomplete.** This file and two code comments say *"compare `cancel_at` against `current_period_end`"*. On `2026-07-29.dahlia` the **top-level `subscription.current_period_end` is `null`** — the field has moved onto the subscription **item** (`subscription.items.data[0].current_period_end`). Following the instruction literally compares a real timestamp against `null`, concludes the cancellation was *not* scheduled for period end, and raises a false alarm — the same class of scare `cancel_at_period_end` already caused once. **Read the period end off the ITEM.**

✅ **The app is immune to both quirks by construction, which was checked rather than assumed.** No executable code anywhere in `src/` reads `cancel_at`, `cancel_at_period_end` or `current_period_end` — the only occurrences are comments. The webhook writes `effective.status` and nothing else, so these are **verification traps, not runtime bugs**.

✅ **`/faq`'s cancel answer is now true in production**, not just locally: cancellation is reachable from the coach's own profile, and access genuinely runs to the end of the paid period. ✅ **And it is now true in LIVE mode as well** — the live portal's cancellation setting was read directly from the dashboard on Aug 19 and is already "Cancel at end of billing period". ⚠️ It remains hostage to that setting: flip either mode to Immediately and this answer becomes false with nothing in the code to catch it.

### ✅ Verified end to end — the gate (Aug 4 2026)

Local, real browser, real coach. A third non-Pro coach (`tonyliu34+gate@gmail.com`, "ZZ Test — gate") was blocked at the 4th player; upgrade was started **from the gate screen rather than the ProfileMenu**, confirming the shared `useUpgrade()` handler from both entry points; checkout completed; the webhook wrote `active`; `isPro` flipped; and a 4th player ("Nanna") was then added successfully.

⚠️ **The first attempt of that run failed silently because `stripe listen` was not running** — killed by a reboot. It was restarted with a fresh `STRIPE_WEBHOOK_SECRET` and the run repeated. See the gotcha in *To resume local billing work*; this is the single most likely way to lose time in this area.

### ✅ Verified end to end — the billing loop (Aug 3 2026)

Local, via `stripe listen --forward-to localhost:3000/api/stripe/webhook`. Stripe CLI 1.45.0 installed with Homebrew.

- **The full loop works.** Checkout → webhook → `subscription_status = active` → `isPro` flips → the Upgrade item disappears.
- **Signature verification executes and rejects.** Unsigned → 400 `Missing stripe-signature`. Forged HMAC → 400 `Invalid signature`, including a hand-crafted `checkout.session.completed` naming a coach id, refused **before any part of the body was read**. `GET` → 405. The message text is the proof: `Invalid signature` comes only from the `constructEvent` catch, where previously the missing-secret guard fired first.
- **The webhook wrote to exactly one coach.** RJ's row stayed NULL throughout — the three-routes-home lookup did not spray.
- **One customer across three checkouts** — the idempotency key on customer creation holds.
- ⚠️ **The `?upgraded=1` race is real and was observed.** The Upgrade item was still showing on the redirect back and disappeared after one refresh. That is why the landing is a silent return rather than a "you're Pro" claim.

### Three findings from that test

1. **No already-subscribed guard** *(fixed, `cf04f83`)*. `createCheckoutSession()` created-or-reused the customer but never checked for an existing subscription, so **three active subscriptions** ended up on one customer — $20/mo of real double-billing in live mode. ⚠️ Hiding the menu item is not protection: `isPro` only turns true once the webhook lands, so the redirect-to-webhook window is a live double-subscribe window, and the action can be invoked directly regardless. Same lesson as `fileFinishedAssignments`.
2. **The webhook clobbered state from stray events** *(fixed, `bc24e51`)*. It retrieved the event's own subscription — correct for that subscription, silent about whether it is the coach's current one. Cancelling the two strays fired `customer.subscription.deleted` for each and wrote `canceled` over a coach who still held a live subscription. ⚠️ The real-world shape is cancel-then-resubscribe. Now resolves at the **customer** level: list the customer's subscriptions, any `isEntitled()` one wins, else the most recent. Proven by the failing case — a real event about a canceled stray now leaves the row `active`.
3. ⚠️ **`COACHRJ` was burned by the test.** The coupon had `max_redemptions: 1`, and testing consumed the single redemption, leaving RJ's own code dead. Recreated Aug 3 with **`max_redemptions` unset** (coupon `OuDvRjjw`, code active, 0 redeemed). **The lesson is for live mode, where it is one-way:** a code meant for exactly one person must not be capped at one redemption, or testing it destroys it. Test with a throwaway code instead.

### Open — next session

- ✅ **The add-student gate is built and verified** (Aug 4) — see its own section above. ⚠️ What it leaves open is the RJ conversation: he has ~10 students and no live subscription, so the gate stops his 11th the day it reaches an environment he uses with live billing.
- **Some upgrade UI is still unrendered.** The gate's own paywall was seen and used on Aug 4, and the `Starting…` pending state was exercised on the way to Checkout from that screen. Still unseen: the **ProfileMenu panel's width at its new widest item**, and the **wrapping error line** inside that 160px panel — no upgrade error has been made to occur there.
- **The `?upgraded=1` landing is a silent return.** Now unblocked — `isPro` is trustworthy — so the warm success screen can be designed. Still needs to survive the redirect/webhook race observed above.
- ⚠️ **`STRIPE_WEBHOOK_SECRET` is local-only.** It comes from `stripe listen` and rotates between sessions; staging and prod each need their own endpoint and secret. Nothing is configured in Vercel yet.
- ⚠️ **No `apiVersion` is pinned in `getStripe()`, so the app runs on the account default — currently `2026-07-29.dahlia`.** That is not theoretical drift: on dahlia, `promotion_codes.create` rejects `coupon` as an unknown parameter, and recreating `COACHRJ` only worked pinned to `2024-06-20`. Checkout and the webhook are fine on dahlia, but a dashboard-side version change can alter API shapes underneath us with no code change.
- **Live mode does not exist** — see Stripe status above. Every id changes, and the coupon must be recreated there uncapped.

---

## Activity type system

`src/config/activityTypes.ts` — single source of truth for UI copy that branches on what a coach teaches.

Active: **Basketball** only  
Available (not yet active): Piano · Martial Arts · Tennis · Golf · Guitar · Gymnastics · Soccer · Swimming · Voice

⚠️ **THERE IS NO PICKER ANY MORE, as of Aug 19 2026.** `/instructor/signup/type` was deleted and signup went from three steps to two. Every new coach gets **`instructor_type: "basketball"`**, set as a constant in `SignupProvider` — not chosen on a screen, and not a new value: it was already the provider's default and is already what `getActivityLabels()` falls back to for null.

⚠️ **The COLUMN is untouched and deliberately so.** `coaches.instructor_type` is plain nullable text with no CHECK constraint, so soccer or anything else can be introduced later **without a migration** — the work is restoring a picker (a screen plus a setter on the provider), not changing the schema.

⚠️ **`ACTIVITY_TYPE_ORDER` now has ZERO consumers.** The picker was its only one. Left in place because it is the ordering a restored picker would use; dead code until then.

Adding a new activity type is still a content change — no engineering rework needed. The `instructor_type` field on coaches enables content branching, and every reader goes through `getActivityLabels()`.

---

## Coach auth — email OTP

- `signInWithOtp({ email })` + `verifyOtp({ type: "email" })`
- Both email templates must contain `{{ .Token }}` — renders the 6-digit code
- Neither template should contain `{{ .ConfirmationURL }}`
- OTP length: 6 digits · Expiry: 1 hour

---

## RJ feedback captured

RJ is the first real user and primary product validator.

### July 27 2026 — roster growing, asks clarified

**Two new players added: Mason and Avery.** RJ is now at **7 players**, up from 5.

Three of his open asks were resolved by text and are now scoped in Pending under "Decided, not built":

- ~~**"Minutes & hours"** means weekly / daily aggregated time totals~~ — ⚠️ **this reading was wrong; corrected Aug 1.** He meant hours as a unit on a single drill. See the corrected entry under "Decided, not built".
- **Notes** means one small, capped, optional "anything to tell coach" field on the **student log screen** — the student writing to the coach, not a two-way thread.
- **Parent contact** resolved to the two-contact model: the existing single phone + Player/Parent toggle stays tone-only, plus a separate report-only `parent_phone` that never receives assignment SMS.

### July 26 2026 — first real usage

**It is being used.** First completed assignments came in. One student told RJ she likes the app and how simple it is, and his summary: *"kids are liking it and really using it."* This is the first evidence of the loop closing with real students rather than in testing.

Requests, in his words:

- **Move "Assign more" button to the top** — currently pinned to the bottom of the student detail screen.
- **A notes section for players** — ✅ *Clarified July 27:* the student writing to the coach. One small capped field on the log screen. See "Decided, not built".
- **"Can timeframe be minutes & hours for weekly breakdown"** — verbatim. ⚠️ *Clarified twice.* The July 27 reading (aggregated weekly/daily totals) was **wrong**; on Aug 1 RJ confirmed he means hours as a unit on one drill — "1 hour of jump rope" rather than "60 minutes". The word "weekly" in his original text is what misled the first reading. See "Decided, not built".
- **A repeat-schedule function for when a set is finished** — reassign automatically once a student completes something. ✅ *Partly delivered July 27 2026* as **Assign again**: one tap on a finished card creates fresh work. The automatic/scheduled half is still unbuilt, but it is now safe to build — a weekly reassign cycle would have turned the orphaned-log problem into a recurring loss, and logs now carry their own snapshot.
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

## Open exploration — not yet decided (Jul 31 2026)

From a phone call with RJ, carrying second-hand feedback from **Zach** — another coach in RJ's circle who has been talking with him about Reps but is **not a Reps user himself**.

⚠️ **Nothing in this section is scoped, prioritized or scheduled**, and none of it is in the Priority build list — deliberately. These are open questions with the tension left in them. The point of the section is that they are unresolved. Resolving one means moving it *out* of here: into "Decided, not built" if it earns a design, or deleting it if it doesn't.

### Social sharing (Strava-style)

Students sharing achievements or reps socially.

**The tension identified on the call:** not all reps are equal. 500 reps of a warm-up drill and 500 of something genuinely hard should not carry the same weight — so any version of this likely needs the platform to distinguish a *share-worthy moment* from routine logging, rather than "share anything, anytime."

**Unresolved:** whether this connects to an older goal-setting idea — a student setting their own target versus receiving a coach-assigned one. A goal the student set *and* hit feels more earned, and therefore more shareable, than one they were handed.

⚠️ **Runs against the current product philosophy.** Students have no accounts, and a coach can remove one at any time; the relationship is coach-mediated by design. Any sharing concept has to fit *inside* that, not around it.

**One direction floated in conversation, not decided:** the existing celebrate screen as a possible natural home — it is already the one moment completion gets its own beat — rather than a separate social system.

Worth revisiting once there is more real log data, to see whether usage patterns say anything.

### Reusable / recently-used presets (instructor side)

RJ wants the app to remember what he usually enters for a given exercise. His comparison: MyFitnessPal remembering your usual serving size for a food.

**Current state:** `exercises.ts` holds static defaults, identical for every coach — nothing is personalized. A true "remember what I last assigned" needs per-coach-per-exercise storage that does not exist today.

**Current leaning, not finalized:** additive rather than a swap. Keep the static library defaults as the permanent baseline — what the vanilla app provides — and add a separate "recently used" row of a few recent values, dismissible or clearable by the coach.

**Scoping — resolved (the rest of the entry stays open):** per **player AND exercise**, not per-exercise alone.

Real `rj_logs` data settled it. RJ's players are different ages and levels, and his Layups targets already vary by player — Khloe 350, Caleb and Phoenix 500. That is a genuinely different number per kid, not one number RJ reuses everywhere, so a "recently used" row keyed on the exercise alone would offer him the wrong figure most of the time. It has to be scoped to the player he is assigning to as well.

Note this is narrower than the MyFitnessPal analogy that prompted the idea: that app remembers *your* usual serving, one axis. Here the coach is not the one doing the reps, so the memory belongs to the pairing, not to the coach.

### AAU / org-level licensing

A different business model, not a feature: selling to an organization — multiple coaches, procurement, admin permissions, likely different pricing — rather than to an individual private instructor.

Distant horizon. Not connected to the current beta plan.

### Tight advocate group (~30 coaches)

In tension with the current plan of five hand-picked trainers reached by careful personal outreach. Thirty implies a later phase: testing whether the product holds up with less founder-level personal touch per coach. Not where the product is now.

### Sensor integration (e.g. Dribble Up-style smart equipment)

Interesting but distant. Would mean Reps depends on hardware it does not control, and requires the student to own separate smart equipment. Furthest out of anything in this section.

### Archive at scale — one player's own history

⚠️ **This entry did not previously exist.** It was referred to on Aug 1 as already captured; it wasn't. Written down now so the next reference to it resolves.

The assumed pain point, Tony's own rather than RJ's: one player's archive grows into a long list of visually similar cards over time. Every card is the same shape, the ✓ is on all of them, and nothing separates last week from three months ago. Not yet a felt problem — RJ's oldest archive is days old — but it is the predictable end state of a model where finished work is moved and never destroyed.

⚠️ **RJ's "folder method / group by grade or age" suggestion does NOT fit here.** Grouping by grade makes no sense inside one player's own history — their grade doesn't vary across their own cards. That suggestion belongs to the entry below, which is a different thing entirely. The two were nearly conflated on Aug 1; keeping them apart is the point.

### Roster-level archive — a view that does not exist

⚠️ **New gap, not previously documented.** There is **no cross-student view of archived work anywhere in the app.** Only two archive views exist, and both are scoped to a single player: the coach's player-detail screen, and the student's own home screen.

RJ suggested a "folder method" and grouping by grade or age. That only makes sense **across students** — organising a roster, not one child's history. Which suggests he may have been gesturing at a view that does not exist at all, rather than asking for a filter on one that does.

⚠️ **Unresolved, and a clarifying question needs to go back to RJ before any design.** A roster-level, cross-student archive view is a meaningfully larger scope than tidying one player's list — different screen, different queries, different navigation. Guessing which he meant would risk building the expensive one to answer the cheap question, or the reverse.

### Real-time stats on the landing page

A live stats row on the landing page — the "684 / 18 / 123" pattern other product homepages use — pulling from Reps' own real usage: assignments, logs, reps.

⚠️ **Too early right now, and that is the whole point of the entry.** The real numbers today (~10 students) are too small to be persuasive as raw counts. Publishing them would undercut trust rather than build it.

**Better direction identified in discussion, not decided:** a **rate** rather than a raw count. A rate is honest and compelling regardless of scale — "% of assigned work logged within 24 hours", or a rolling "reps logged this week" that resets and so can never look stale.

The distinction worth keeping: **raw totals** (student count, coach count) are the ones that specifically need time before they are a credible flex. **Rates and current-week figures work now and later** — they do not have to wait for scale.

**Placement, as pictured (Jul 31):** directly **below** the landing page's "Here's how it works" section — the four phone mocks, which item 3 of *Queued for next session* imagines becoming a per-activity carousel. That is the only part of this that had been pinned down; everything above is still open.

⚠️ **That anchor no longer exists.** The "how it works" section and its four phone mocks were removed on Aug 5 2026, so this placement now points at nothing. The page is hero → section 2 (instructor) → section 3 (student) → pricing → footer. A stats row would have to be re-placed against that, and the obvious slot — between section 3 and pricing — has never been considered. Re-decide placement before treating any of this as scoped.

Not connected to any current landing page work. Captured so the idea isn't lost.

### Validation signal

Factual, no interpretation:

- RJ has grown his roster to **~10 students** organically in under three weeks. (The July 27 entry above records 7 — both are accurate at their dates.)
- Asked directly, RJ described the app as having changed his own coaching practice — organization, and a repeatable record he sticks to — rather than as something he is trying out.
- On the same call, RJ described Reps as having become part of his actual coaching workflow: his words were **"streamlined"**, that it helps him **"stick to it"**, and that it has become a **"template"** of his program and a **"record"** of it. Read as pointing to a *second, distinct use case* beyond student accountability — basic business and practice organisation for the instructor himself. ⚠️ This is a separate validation thread from the bullet above, not a restatement of it: that one is about his coaching changing, this one is about the app doing a job the product was not explicitly built for.
- **Parents, second-hand but independent of RJ's own view.** RJ confirmed by text (Aug 1) that parents using the app are "all in on it" and "think it's extremely useful". ⚠️ Worth separating from the bullets above: those are RJ's own enthusiasm, repeatedly recorded. This is a different constituency reacting — the people who pay for the coaching — reported through him.
- **Zach**, a second coach in RJ's circle, engaged with the product enough to generate several of the ideas above without being a user himself.

---

## Queued for next session (end of day, Jul 31 2026)

⚠️ Fast end-of-day capture, not decisions and not a plan. Nothing here is scoped or prioritized, and none of it has been added to the Priority build list. Deliberately short — enough that nothing is lost overnight, no more.

1. **Scale app screens beyond mobile.** The landing page supports desktop/tablet/mobile, but every in-app screen and mock is mobile-only. Consider taking app screens up to at least tablet width for those visitors.

2. **Narrow the signup activity list — revised Jul 31, more conservative than first captured.** The picker should show **only four rows**:

   | Row | State |
   |---|---|
   | Basketball | live |
   | Soccer | "Soon" |
   | Tennis | "Soon" |
   | Create your own | "Soon" |

   ⚠️ **Everything else is removed outright, not tagged.** Piano, Martial Arts, Golf, Guitar, Gymnastics, Swimming and Voice come *out of what a coach sees at signup* — not deprioritized, not left visible under a "Soon" label. The earlier capture said to keep them tagged; that was reversed. Rationale: only tease what is actually intended to be built next — adjacent, structurally similar activities — rather than advertising the full possible list. Stop overpromising.

   Tennis stays because it is the close structural analog: individual instruction, drill/rep structure, and makes-based tracking translates directly.

   Also swap the homepage thumbnail from a piano student to a young female soccer athlete.

   ⚠️ **SUPERSEDED Aug 19 2026 — there is no picker to narrow.** The screen was removed outright and signup is now two steps; every new coach gets `instructor_type: "basketball"` from `SignupProvider`. **This entry is kept for its REASONING, not as a to-do**: if a picker ever returns, the four-row shape and the "only tease what is actually intended next" rule are the decisions to start from. ⚠️ `activityTypes.ts` still carries all ten types and `ACTIVITY_TYPE_ORDER` is now unreferenced — dead today, and exactly what a restored picker would use.

3. **Landing page second section as a carousel.** Currently a static basketball showcase. Consider one slide per activity, each with its own device mocks and content matching that sport.

4. **Real-time stats, placed directly below that section.** Revisit the idea already captured under Open exploration ("% logged within 24 hours", weekly rep counts) — this time thinking through how to frame and select only the positive-reading figures rather than raw counts. Pictured sitting *underneath* the activity carousel / phone-mocks section, not elsewhere on the page.

---

## Pricing (fully resolved — model Jul 31 2026, price point Aug 1 2026)

**Free tier — resolved.** 3 students, full features, no card required, no time limit. **Forever, not a trial.**

⚠️ A 14-day-unlimited trial was considered and **rejected**. It does not solve the problem it was reached for — the "cold roster dump", where a coach adds twenty students on day one and blind-texts them all before feeling the product work. A trial doesn't prevent that; a coach can dump a full roster on day one of a trial just as easily. And it reintroduces a hard deadline, which the free-tier model deliberately does not have.

**Paid tier — resolved in shape.** Monthly only, cancel anytime. No annual plan, no discount tiers, deliberately not built — nothing at this stage requires them.

**Price point — LOCKED at $10/mo (Aug 1 2026).** The $5–$10 range is closed; use **$10** everywhere — the Stripe Price object, any pricing UI copy, and this file. The reasoning that settled it:

- **Cost to serve was never the constraint.** SMS per free user runs pennies to low single-digit dollars a month even in heavy-use edge cases, so this was a positioning decision, not a margin one — which is why the range could stay open as long as it did without blocking anything.
- **$10 still sits well under market.** Comparable products charge substantially more — see the section below. Taking the top of the range costs nothing in competitiveness.
- **$9.99 was considered and set aside in favour of $10.** A round number reads as honest; a charm-priced one reads as optimised extraction, which is the opposite of the voice this pricing is meant to carry.

⚠️ **$10 is the figure, not $10.00 or $9.99.** Stripe stores it as `1000` (cents, USD). Any UI copy should read `$10/mo`.

Promo code `COACHRJ` = lifetime free.

---

## Competitive landscape (Jul 31 2026)

Factual, from real research. Not a reason to change direction — captured so pricing and positioning decisions aren't made blind.

| Product | Free tier | Paid |
|---|---|---|
| **Trainerize** | 1 client — functions more like a trial than a working free tier | from ~$9/mo (2 clients) → $23/mo (5) → $248/mo (500+) |
| **TrueCoach** | none — 14-day trial only, no card | from ~$26/mo (5 clients) → $137/mo (50), annual billing |
| **Utrain** | 100% free for trainers | monetises payment processing, not subscription |

Trainerize and TrueCoach figures are screenshot-confirmed.

**Utrain** (utrainmobileapp.com) is the closest adjacent competitor **by audience** — basketball-specific, aimed directly at private trainers, and apparently well funded (tech incubator cohorts, a Ganon Baker partnership, Yahoo Finance coverage). ⚠️ But its **core function is different**: booking, scheduling and automated payment collection, not practice-homework accountability. Trainers keep 100% of the session price. Worth knowing it sits in the same audience's feed; not competing for the same job.

**Conclusion:** against this set, Reps' free tier — 3 students, forever, full features, no card — is on the **generous** end of this market, not the stingy end.

---

## Product decisions locked

- **Instructor is the customer.** All design decisions flow from instructor pain points.
- **Default exercise libraries are the product experience.** Custom creation is the escape hatch.
- **Makes logging is always optional for students on a reps goal** — never blocks logging.
- **Track_makes defaults:** true for shooting/finishing/spot-shots, false for minutes-based and for the three makeless categories, false for customs.
- **Percentage formula:** makes / attempts, only over logs that recorded makes. Null logs excluded from denominator.
- **Bar language:** muted emerald = attempts/in-progress, bright emerald = makes/complete, gray = empty.
- **No yellow** — removed platform-wide July 23 2026.
- **One green hue** — the whole family is emerald H150 as of July 27 2026. No exceptions, including the confetti.
- **Assignments are not time-bounded** — they persist until manually archived.
- **Finished work is moved, never destroyed.** Archiving replaced deleting; `Delete assignment` is unreachable once anything is complete.
- **Filing is manual and reversible.** Nothing auto-archives, and every move can be undone in one tap — which is why neither move carries a confirm dialog.
- **Log history is never deleted** — `ON DELETE SET NULL` preserves logs forever, and since July 27 each log also carries its own snapshot of what it was.
- **A banked mismatch is never silently rewritten.** Guards live on the controls, not on stored data.
- **UI labels may change without renaming code.** "Repeat" → "Assign again", "Logged" → "Archive", "Remove" → "Delete" all left their functions and columns alone.
- **A tap must acknowledge itself.** Either the UI moves on the next frame (optimistic) or a boundary paints something. A screen that sits unchanged during a round trip reads as broken, not slow — and gets tapped again.
- **44px minimum on every tap target, and the visible label is the target.** A label beside a link rather than inside it is a dead zone, whatever it looks like.
- **A wrong-shaped loading state is worse than none.** It promises one screen and delivers another. Where there is no data to wait for, the boundary renders nothing.

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
- **"Clear finished"** — deleted finished assignments outright and silently orphaned their logs. Replaced by Archive, July 27 2026.
- **The standalone all-done banner** — followed the coach onto the Archive tab and doubled up with the empty-state message. It is now the New tab's own content.
- **A bordered button for the bulk archive action** — a pattern the app uses nowhere else, and it competed with the primary CTA. Quiet text link instead.
- **A dark landing hero** — built Aug 4 2026 and reverted the same day; the warm charcoal read as muddy and brown rather than premium. See the landing page section; the technical groundwork survives in `b739fda` if it is ever revisited.
- **The "Clear finished" confirmation sheet** — existed to slow a coach before an irreversible delete. Archiving is reversible, so the ceremony implied a risk that no longer exists.

---

## Pending / loose ends

### High priority
- **✅ RESOLVED July 27 2026 — orphaned logs.** Kept here as the record; nothing outstanding.

  *Fixed forward:* `saveLog` copies `exercise_name`, `unit`, `goal_type`, `target` and `side` onto every log row at insert time, so a log survives its assignment being deleted. Applies to all logs, all coaches, from that date.

  *Backfilled:* **RJ's 19 pre-existing rows were backfilled and verified safe.** The check that made it safe: `target` is the only one of the five that can ever change after assigning, and "Edit amount" is hidden once anything is logged — so for a row that HAS logs, the current assignment values are necessarily the values it was logged under. The other four (`exercise_name`, `unit`, `goal_type`, `side`) are immutable after insert; the only `.update()` on `assignments` writes `{ target }` and nothing else.

  *Not backfilled:* **Coach Tony's 23 orphaned test rows.** Dev debris whose assignments were already gone, so nothing existed to copy. Irrelevant — no real history there.

  *Implementation:* exactly **one** INSERT site, `saveLog` in `src/app/student/[token]/log/[assignmentId]/actions.ts` (audited repo-wide — no other insert, upsert, route handler or DB trigger writes `logs`). The assignments query the confetti check already needed moved *above* the insert and was widened, so the snapshot costs **no extra round trip**. Server-side only — `saveLog` accepts no snapshot parameters at all, because the student log page is public and token-addressed and a crafted request could otherwise write any exercise name it liked into permanent history. That read is player-scoped, which also establishes ownership. Migration `20260727120000_add_log_snapshot_columns.sql`.

  *Readers are unchanged.* Every screen still joins live to `assignments`. The snapshot is the fallback for an orphan, not the primary source — nothing reads it yet, and a future progress/insights view is what would first consume it. This is what makes longitudinal history possible at all.
- **⚠️ OPEN QUESTION, no design — a parent asked for date + time on completed work.** Connected to the Parent contact model, not part of it.

  A parent receiving assignment texts directly (via the existing Player/Parent toggle) asked for timestamps with dates on completed work. RJ's own suggestion was to show it in the **Archive** section specifically.

  The tension, unresolved:
  - **Date is meaningful either way** — did practice happen on a given day.
  - **Time is only meaningful in one usage mode.** If the student logs live, in the moment (on a parent's phone at the park), the timestamp is real. If a parent logs it for their kid later, or in a batch, the timestamp records when the parent got round to data entry — not when practice happened. So "time" is misleading or honest depending on how a given family actually uses the app, and the app cannot tell which.
  - **Tony's stated preference is clean, simple cards**, resistant to visual clutter.
  - ⚠️ **Relevant data already exists and is not surfaced anywhere:** the app already distinguishes the assigned amount from the logged amount, including partial versus fully complete. That may be more informative to a parent than a raw timestamp, and is worth weighing as part of any eventual design rather than defaulting to a clock.

  No design proposed. The usage-mode question above needs answering before one would mean anything.

- **⚠️ OPEN GAP, no decision — a student who asks "is there an app?" has nowhere to be sent.** Recorded, deliberately without a proposed fix.

  There is **no student-discovery path on the landing page at all**: no "I'm a student" link, nothing pointing at `/student/login`, and the footer carries only Privacy and Terms. Verified against `src/app/page.tsx`, not assumed.

  *It was there once.* A student entry point was restored to the footer on Jul 21 (`ebfea68`), then removed again Jul 27 in favour of a **coach-only landing framing** — the eyebrow narrowed to "For instructors", the hero speaks to the instructor, and the mocks note for that release records the removal explicitly: "The standalone 'I'm a student →' link is gone — students arrive by SMS link or via `/student/login`." That was a deliberate decision, not an oversight.

  *What surfaced it:* a real student texted back **"is there an app??"** and there was no channel to answer them. Today a student can only arrive by their SMS link, or by knowing `/student/login` exists — and nothing anywhere points at that fallback.

  ⚠️ Any future fix has to weigh the coach-only framing it would reopen. Recorded here so that trade-off is visible when the decision is made, rather than rediscovered.
- **Device-test the goal type feature** — shipped to prod July 24 with no real-iPhone pass. Never observed on device: the incomplete-consecutive label `0/1 set · N in a row` (every consecutive row in the DB is already complete).
- **Update `TWILIO_FROM_NUMBER`** to `+18338925640` in `.env.local` AND Vercel env vars
- **Consecutive stepper overshoots its own progress line** — reads `1 of 1 set` while the stepper sits at 2. `progressValue` caps at 1 by design, but the two numbers visibly disagree.
- **Edit `goal_type` / `side` after assigning** — currently quantity only, so a wrong hand means delete and re-assign. `goal_type` should stay behind the `hasProgress` gate (switching a logged reps assignment to makes reinterprets history); `side` is metadata and could be looser.
- **Custom exercises get no goal selector** — they keep the makes toggle but can't take a makes or consecutive goal, since they belong to no category.
- **Retroactive makes gap** — a student who completes an assignment without logging makes cannot add them later. Needs an RLS UPDATE policy + a replace-vs-append decision.
- **"Or type a number" hint** on stepper — students don't know the centre number is tappable. ⚠️ Shipping this makes a latent bug real: typing attempts clamps makes on each intermediate keystroke (retyping "60" passes through "6" and drags makes to ≤6).
- **Hold to accelerate** on stepper buttons
- **Honesty nudge** — when a student logs 0 or very low attempts, a quiet human message
- **Progress bars on roster rows** — also the prerequisite for showing side on the roster, which today has no per-assignment surface at all

### Decided, not built

Design resolved — these need building, not deciding.

⚠️ One exception as of Aug 1: **hours as a unit** sits here because the *requirement* is settled (RJ asked for it, unambiguously), but its *direction* is not — the approach below is a suggestion, not a choice. It stays in this list because the ask is real and won't change; move it once an approach is picked.

- **Parent contact model.** Two contacts, distinct purposes:
  - The **existing single phone + Player/Parent toggle** stays as-is. It is **tone only** — it does not change routing, and every assignment SMS goes to `players.phone` regardless. That is by design, not an oversight.
  - A **separate optional `parent_phone`** becomes a *report-only secondary contact*. It **never** receives assignment SMS — only future digest/report sends. This revives the column, which has been dead since July 17 (present, written as `null` by the only caller, read nowhere).
  - ⚠️ The "Send parent a weekly recap" UI must be **rebuilt from scratch** with new copy. It was fully deleted in commit `c9bb887`, not hidden — the state, the effect and the card all went.
  - **Existing flexibility, previously undocumented (Aug 1).** The single phone + toggle already stretches further than this file recorded. A student with no phone of their own can tap the assignment link on a parent's phone and log directly there; or the parent can forward that same link so the student has it on their own device. And the coach's per-student "..." menu carries **"Share homework link" as a standing action** — always available, not limited to the add-student moment. ⚠️ This may *reduce* the urgency of the report-only `parent_phone` work, since some parent-visibility need is already served. It does **not** change this item's scope or design today — worth having in mind when it is picked up.
  - ⚠️ **A soft commitment exists with a real user.** Tony told RJ by text on Aug 1 that he is "working on some type of automated weekly digest or report for parents" and that "it'll shape up when we have more data." The digest remains undesigned internally and unbuilt. Light expectation, not a promise of a date — but it is out there, and worth knowing next time this area is prioritized.
  - **Open question attached to this work:** timestamps on completed work — see High priority.
- **Hours as well as minutes on a single drill.**

  ⚠️ **CORRECTION (Aug 1 2026) — the July 27 reading of this was wrong.** This file previously recorded RJ's "minutes & hours" ask as *aggregated daily/weekly time totals*, and stated flatly that it was "not a per-assignment unit toggle". That was a misreading of a July 27 text. It is kept visible here rather than quietly overwritten, because it stood as a documented conclusion for five days and shaped Priority #2.

  *What he actually wants*, clarified by text this morning: a single drill's duration expressible in **hours as well as minutes** — being able to set "1 hour of jump rope" instead of "60 minutes of jump rope", with the minutes option kept. It has **nothing to do with aggregation** across days or weeks.

  *One candidate direction, discussed but **NOT** decided — suggestion only, not greenlit:* keep everything stored in **minutes internally**, so there is no schema change and nothing that sums or reports breaks. Add hour-flavoured preset buttons on the assign screen that simply send a larger minutes value (a "1 hr" preset sends `amount: 60, unit: minutes`), and optionally format any round multiple of 60 as "1 hr" on display screens. This is one option among others; Tony has not chosen it.

  No design work started.

### Medium priority
- **Gate stranger signups** — currently open; invite code or waitlist before broader launch
- **Stripe infrastructure** — ✅ **built and verified in TEST MODE** as of Aug 4 2026: schema, webhook, checkout, entitlement, and the add-student gate. See **Billing architecture**. ⚠️ What is left is not code — it is **live mode**, which does not exist: no live product, price or coupon, and no Stripe env vars in Vercel for staging or prod. Every test-mode id changes at launch.
- **Tighten logs RLS** — ⚠️ **corrected Aug 1 2026: there is no RLS policy on `logs` at all.** This entry read "INSERT currently open", which implied SELECT/UPDATE/DELETE were covered and only the insert path was loose. They never were. Confirmed by investigation, not assumed: no policy on `logs` appears in any migration file, and the student home page has always read `logs` straight through the **anon** key with none present. So SELECT has been exactly as open as INSERT this whole time.
  - No column-level grants exist **on `logs`**, so any column added there is readable wherever the others are. That is why `note` needed no policy work to be read back — worth knowing, and worth not mistaking for a policy having permitted it.
    - ⚠️ **This bullet was corrected twice on Aug 1 2026, and the second correction matters more than the first.** It originally claimed no column-level grants existed *anywhere* — wrong, and wrong because of a bad grep rather than a bad reading: the pattern used could not match `grant update (name)`. **One does exist**, in `20260725120000`. It doesn't touch `logs`, so the point above stands on its own; only the blanket version was false.
    - ⚠️ **The first correction then over-claimed in the opposite direction.** It stated that the `coaches` grant was an allowlist making every column on that table unwritable by a coach. It was not — the grant had already been silently overridden by a re-granted table-level privilege, and had been dead for roughly a week. Both errors share one cause: **a claim about live database state inferred from a migration file.** In this repo that is never safe — the base schema, `logs_amount_check`, the dashboard views and the `coaches: own row` policy are all live and in no file.
    - The real account of what protects `coaches`, what failed, and why the fix is a trigger rather than a grant is in **Key schema notes** under `coaches` write protection.
  - ⚠️ `note` raises the practical stakes of the gap without changing its shape. Until Aug 1 `logs` held only numbers and copied assignment metadata; `note` is the first **free-text field a student wrote themselves**. Still their own words on their own token-addressed page, so nothing new is exposed to anyone who wasn't already able to read the row — but the consequence of the gap is qualitatively different from a rep count.
  - Priority is unchanged — still Medium, deliberately. This is a correction to what the entry *says*, not a re-rating of how urgent it is.
- **Demo mode** — "Try as Coach" seeded database with context overlay
- **Account deletion flow** — required by privacy policy
- **Auth user audit** — 8 rows in `auth.users` against 3 in `coaches` (noticed Aug 4 2026 while deleting the gate test account, not investigated). Four carry no email and are *probably* student phone-OTP logins, which is expected — confirm that rather than assume it, since a blank-email row could also be a half-finished coach signup, the "authenticated but no coaches row" case `requireCoach()` exists to catch. One is a typo signup, `tonyliu34@gnail.com` (`gnail`), which can never receive an OTP and should go. Not urgent; nothing is broken by it.
- **hello@assignreps.com Gmail Send as setup**
- **Final legal review of /privacy + /terms** — ⚠️ now has a concrete worklist rather than being a vague standing item: see *Legal pages — Aug 6 audit* for everything found and what is still open.
- **Re-engagement nudge** — Monday email to coaches who haven't assigned anything
- **Landing page product-loop frames are hand-drawn** — `src/app/page.tsx` redraws four miniature phones in JSX, so every design change has to be re-applied here by hand and can silently drift from the real screens. Redrawn July 25 2026 (assign → text → log → student detail); the specific staleness previously listed — retired preset buttons and `#27500a` — is fixed, but the maintenance burden is structural
- **"Consecutive" goal label vs "In a row"** — known drift, not a bug. The landing page's assign frame labels the third goal **In a row**, which is how instructors actually speak; the app's `CountScreen` still shows **Consecutive**. The stored `goal_type` value is `'consecutive'` either way, so this is display copy only — but the app and the marketing page currently name the same goal differently. Renaming the app label is the likely fix; it touches `GOALS` in `CountScreen.tsx` and the `SETS COMPLETED` / streak wording on the log screen

### Low priority / future
- ⚠️ **`#5ba3ea` is a hardcoded literal in three files** — `OverLimitBanner.tsx` and `CoachAssignmentList.tsx` (the CTA border and label) and `AddPlayerForm.tsx` (the "Email us" link in `CeilingBlock`), all part of *The blue capacity system*. ⚠️ It went from two files to three in a single evening, which is the argument for naming it rather than the cost of doing so. Same class of gap as the greens below and worth doing in the same pass; it is a third blue beside `--reps-orange` and `--reps-orange-hi`, so it wants a name before a fourth appears.
- **Finish tokenising the greens** — 4 sites still hardcode `#3ed68a` rather than using the token: the celebrate confetti array, the two `Check` icon `color` props (CountScreen + CustomExerciseScreen), and the roster `GROUP_STYLE` object. The icons are the reason it stopped: lucide passes `color` into an SVG `stroke` attribute, where a CSS var resolves in practice but wants seeing rendered before trusting.
- **`CustomExerciseMenu` is the odd one out** — three of the app's four overflow menus now share the raised/flush/divider style with icons; this one keeps the old padded `p-1` panel with rounded inner items and no icon. Its single item is `Delete exercise`, which pairs naturally with the `Trash2` on `Delete assignment`.
- **Toast is dim** — noted on device, not fixed. All three toasts use `text-reps-sub` on `--reps-raised`.
- **Student / parent progress recap** — "*Khloe's first 8 months*" style longitudinal view. Explicitly backburner, but explicitly *connected*: it is the original founding vision and it is what the July 20 RJ meeting notes on longitudinal tracking were about. Depends entirely on accumulated history, which the July 27 log-snapshot fix now protects going forward. Distinct from the small notes field, which shipped Aug 1 — that is one capped line per log, this is a longitudinal view.
- **Light mode** — after dark mode is validated with RJ
- **Activate more activity types** — content problem, not engineering
- **WhatsApp via Twilio** — international student SMS
- **One-tap coach reaction** — preselected SMS reaction to a student's log
- **One-tap nudge to quiet students**
- **Performance history** — prior metrics when reassigning ("Antony shot 30% last time on corner 3s")

---

## V1 scope

- Coach signup (email OTP) ✅ — **two steps as of Aug 19 2026** (name → email); the activity picker was removed
- Add student (name + phone, optional parent phone) ✅
- Assign exercise (default library or custom) ✅
- Student log screen — stepper ✅
- Makes logging — track_makes toggle, coach sees percentage ✅
- Goal types — attempts / makes / consecutive ✅ (July 24 2026)
- Left/right side on assignments ✅ (July 24 2026)
- Celebration screen ✅
- Coach player detail view + two-tone makes bars ✅
- Coach roster view ✅
- Landing page ✅ — hero, instructor section, student section, pricing (Aug 5–6 2026). ⚠️ The old "product loop" / "how it works" section was **removed** Aug 5, not renamed. ⚠️ The §2 testimonial was **removed Aug 16** pending RJ's sign-off — deferred, not cancelled; see `docs/deferred/section-2-testimonial.md`
- Header nav — Pricing · FAQ · Sign in ✅ (Aug 6 2026, landing page only)
- `/faq` ✅ (Aug 6 2026) — 19 questions, five groups, no accordion, no images. First draft, not signed off. ✅ **Its cancel answer is TRUE as of Aug 17** — the Stripe Customer Portal is built and verified, so the item-5 gate that blocked showing this page to strangers is cleared
- Staging environment ✅
- Resend email delivery ✅
- SMS on assignment ✅
- Log snapshot — logs survive their assignment being deleted ✅ (July 27 2026, backfilled)
- Manual Archive — New/Archive tabs on both screens ✅ (July 27 2026)
- Assign again — re-issue finished work ✅ (July 27 2026)
- Parent read-only web view ⚠️ page exists, but nothing links to it and no digest is sent
- Parent weekly digest ❌ — no cron, no scheduled job, never sent
- Hours as a unit alongside minutes ❌ — asked for, direction not chosen (was mis-recorded as "weekly / daily time totals" until Aug 1)
- Notes field on the log screen ✅ (Aug 1 2026) — optional, 100-char capped; most recent log *with* a note shows on both card lists
- Demo mode ❌
- Account deletion ❌
- Stripe billing ⚠️ — the whole loop (checkout, webhook, entitlement) and the 3-student gate are built and verified **in test mode only** (Aug 3–4 2026). Live mode does not exist yet, so this is not shippable to a paying coach
- Add-student gate — blocks the 4th student, offers the paywall ✅ (Aug 4 2026, verified end to end locally)
- Progress bars on roster rows ❌
- Retroactive makes editing ❌
- Editing goal_type / side after assigning ❌
- ~~Clear finished~~ — **removed July 27 2026**, replaced by Archive. Not deprecated; the action is deleted.

---

## Priority build list (July 27 2026)

The three at the top are the ones RJ has actually asked for and that now have a resolved design.

1. **Parent contact model** — report-only `parent_phone` + rebuild the recap toggle UI (deleted in `c9bb887`, must be written fresh)
   - *Why this matters (supporting context, not a new requirement):* Tony's own multi-year experience paying for private soccer and basketball coaching — wanting visibility into what the coach noticed and what the kid should work on beyond the paid hour. Visible "homework" reads to a parent as tangible proof of value: evidence of getting what you pay for. Does not change the design or the priority above.
2. **Hours as well as minutes on a single drill** — "1 hour of jump rope" rather than "60 minutes". ⚠️ Re-scoped Aug 1: this was previously written as "weekly / daily time totals", which was a misreading. No weekly view is required after all, which makes this materially smaller than it looked.
3. Consecutive stepper overshoot (`1 of 1 set` vs stepper at 2)
4. Edit `goal_type` / `side` after assigning
5. Honesty nudge on 0 attempts
6. "Or type a number" hint — fix the keystroke clamp first
7. Hold to accelerate on stepper buttons
8. Progress bars on roster rows
9. Retroactive makes gap — data model + RLS UPDATE policy
10. Gate signups — invite code or waitlist
11. **First-student onboarding nudge** — a suggestion shown when a coach adds their *first* student, along the lines of starting with one or two players before adding a full roster. ⚠️ Explicitly **not** a gate or a limit: purely a nudge, to reduce the chance a coach blind-texts an existing roster before they have felt the product work. New Jul 31 2026, not designed.
12. **Stripe — LIVE MODE ONLY.** The code is done and verified in test mode (Aug 3–4); what is left is dashboard and configuration work, not engineering: create the live product, price and an uncapped `COACHRJ`, add the three Stripe env vars to Vercel for staging and prod, and provision RJ in live mode before he meets the gate.
13. Activate additional activity types
14. Light mode

**Shipped since the July 24 list:** log snapshot + backfill, manual Archive model, Assign again, layups collapse, emerald palette, device-test of the goal type feature, the navigation/loading pass (optimistic card actions, six loading boundaries, seven back links, tap feedback), the **student notes field** (Aug 1 — schema, write path, read fold and rendering on both card lists), which was item 3 and is removed above rather than struck through, and the **billing loop + add-student gate** (Aug 3–4 — test mode only, which is why item 12 above survives as configuration rather than disappearing).

⚠️ **The following is about the July 30 navigation/loading pass only — not about the notes removal above.** Nothing was removed from the list by *that* pass; there was never a "performance audit" item on it. The work came out of a reported symptom (taps not registering), not a planned entry. What it *added* is the "Diagnosed, NOT fixed" set in **Navigation & loading feel**: the region pin, the player detail waterfall, and `AllDoneActions`. Those are the natural next perf items and are deliberately not slotted into this list, because none of them is user-visible on their own the way the feedback fixes were.

---

## Landing page (current)

*Copy re-audited against the shipped file on Aug 6 2026. Everything below is what `src/app/page.tsx` actually renders tonight — the Aug 5 version of this section had drifted on the hero CTA, both section headings, all three section CTAs, the pricing heading, the footer colour, and it predated the testimonial entirely.*

- **Header nav** (Aug 6 2026). Logo left; **Pricing · FAQ · Sign in** right, in that order. Pricing goes to `/#pricing`, FAQ to `/faq`, Sign in to `/instructor/signup/email`.
  - ⚠️ **The header exists on the LANDING PAGE ONLY.** `/privacy`, `/terms` and `/faq` carry a `← Back` link into a 680px prose shell instead — there is no shared header component and nothing to keep in sync. Do not assume a change here propagates; it reaches exactly one file.
  - Pricing and FAQ are **plain text**, Sign in keeps `.signin-btn`'s outlined chrome — one control per header, two labels beside it. Both new links are `#0f0f10`, the wordmark's own ink, at **15.84:1** on the cream.
  - ⚠️ **Below 768 the Sign-in button drops its chrome too** and all three read as plain text, so they fit one line at 375. Measured at 375×667: logo ends at 118.1px, the nav starts at 205.2px — **87.1px of slack**, three items on one row, 0px document overflow. Sign in returns to a full button at 768 and above (verified 768/1024/1280).
  - ⚠️ The mobile strip is scoped `.signin-btn.header-signin`, **not** `.signin-btn`. That class is also the pricing section's Free-card CTA, and an unscoped rule would silently flatten it on mobile. Verified: at 375 the Free card still measures a 1px border, 12px radius and 16px/14px padding.
  - ⚠️ **`.pricing-section` now carries `id="pricing"`**, which is the target of this link and of one on `/faq`. It is the only change made to that section in this pass. Rename or remove it and two pages break with no build error.
- **Eyebrow:** For coaches & trainers ⚠️ Must stay in step with the page metadata — five strings in total, four in `page.tsx` and the fallback title in `layout.tsx`.
- **Headline:** The work doesn't stop when the session does. ⚠️ **No literal `<br />`** — it carries `text-wrap: balance` instead. A hard break fixes one width and produces a widow at every other; balance evens the lines at whatever width the viewport is. Verified 375 → 1440: two balanced lines at 390 and below and at 1280+, three at 768–1024, no single-word last line anywhere. ⚠️ Removing the break is necessary but **not sufficient** — natural wrapping still strands words, which is what `balance` is for. Measured at 900px: plain wrapping gives "…stop / when the session / **does.**" with a one-word last line; balance gives "The work doesn't / stop when the / session does." ⚠️ It buys **no fold clearance** — at 375×667 the headline is 64px and the CTA clears with or without it. ⚠️ **The clearance figure here has been wrong twice.** `b739fda` claimed ~26px (measured mid-resize); this entry then said 11px. Re-measured on Aug 5: **6.5px**, and **3.5px** after the CTA type went to 19px for AA. It still clears, but treat any number in this file as stale and re-measure.
- **Bullets:** Assign homework to a student / They get a text, tap to log it / You know exactly what got done ⚠️ The middle one reads **"tap to log it"** as of Aug 6, not "log it there" — this entry recorded the older string.
  - **Rewritten Aug 4 2026 to name the mechanism rather than the feeling.** The previous set — "Assign it in seconds" / "Students log it from anywhere" / "You see it happen live" — described outcomes but never said what "it" *was* or why "live" mattered, so a first-time reader could not repeat back what Reps does. This set walks the actual loop — assign → text → log → certainty — so a stranger can explain the product to someone else after one read.
  - ✅ **`white-space: nowrap` was REMOVED from `.bullet-text` (Aug 4 2026) — a bug fix, not a style change.** With nowrap the lines could not break, so the longest bullet set a min-content floor for `.landing-text` (`flex: 1`, default `min-width: auto`) and **the page widened instead of the line breaking** — a horizontal scrollbar in a band around 768px, where the layout goes side-by-side and the type grows to 20px at the same breakpoint, so the column is narrowest exactly when the copy is widest.
    - The overflow was **pre-existing**: the old bullets overflowed 5px at 768 as well, verified by swapping the strings back in place and re-measuring. The current copy is ~20px wider at 20px type, which took it to 25px and widened the band from ~768–772 to ~768–793.
    - After the fix: **0px overflow at 768**, where the three bullets now wrap to two lines each. ⚠️ That wrapping is the visible trade and it is the right one — a wrapped line is a safe failure, a horizontally scrolling document is not.
    - **Verified byte-identical at every width that already passed** — 375, 390, 414, 1024, 1280, 1440 all still render one line per bullet with zero overflow. The rendering changes *only* inside the band that was already broken.
    - Slack on the longest bullet: **27px at 375**, **0px at 768**, comfortable from 820. Treat **~30 characters at 20px** as the practical ceiling for any future bullet — the third one sits exactly on it.
- **Primary CTA:** **"Keep them improving"**, at **19px/700**, with the support line **"Try free. No card, no catch."** below it.
  - ⚠️ **This entry said "Start free" and was stale.** The hero CTA was renamed on Aug 6, and it is part of a larger reversal: **the page's CTAs deliberately no longer all say the same thing.** Each section's button now names that section's own payoff — "Keep them improving" (hero), "Get organized" (section 2), "Send your first assignment" (section 3), "Start free" (both pricing cards). All five still target `/instructor/signup`.
  - ⚠️ **19px/700 remains an accessibility floor, not taste**, and that is unchanged by the renames: white on `#378add` is 3.59:1, which fails AA as normal text and passes only as LARGE text — bold counts as large from 18.66px. Below 19px or under weight 700, **every `.cta-real` on the page fails AA**. (The old note said "all four"; there are five now.)
  - "Try Reps free" was retired on Aug 4 because "Try" implies a trial with an expiry and the free tier is 3 students **forever**. Do not reintroduce trial language anywhere on the page.
  - ⚠️ The support line sits **below** the button and the 375×667 fold behaviour is known and accepted — see the comment at `.cta-support` before re-raising it.
- ✅ **Hero visual — LOCKED Aug 4 2026, no further visual changes.** A **single device mock** of the coach's student-detail screen, replacing the two-circle photo collage. Hand-drawn from the page's shared device primitives — `ScreenHeroDetail` + `.hero-device`, sharing `MiniCard`/`MiniBar2` and the same em-scaling contract with sections 2 and 3.
  - **Student detail rather than the roster, deliberately.** It is the only screen where all three things the hero shows are simultaneously real: progress bars including the two-tone makes bar, a completed assignment, and a student's note. Roster rows carry none of those — no note surface, and progress bars on roster rows are not built — so a roster mock with a note would have been inventing UI.
  - ⚠️ **Every name in it is invented.** Real rosters are real children and this page is public. Do not paste anything from `rj_players`.
  - **Warm two-layer shadow plus a warm radial glow**, never black: black on `#ede9e3` greys the cream and makes the device read as a hole punched in the page. The dark UI inside keeps the shipped colours exactly; the softening is entirely around it.
  - ⚠️ **Sized by aspect ratio, not width, on short screens.** Both the frame height and its contents scale off `--pw`, so width cancels out and only the RATIO decides whether the screen overflows its own frame. Shortening the ratio to fit a 375×667 viewport clipped "+ Assign more" off the bottom; the fix was to shorten only to what the content needs (~9/16.4) and take the remaining height out of the width. The `max-height: 700px` query exists because a 375×812 phone fits comfortably and only genuinely short screens pay.
  - `basketball-hero.webp` and `soccer-hero.webp` are **unreferenced by the app but NOT deleted** — the four July `mocks-*.html` snapshots still load them, exactly as with `piano-hero.webp`. ⚠️ The Aug 5 snapshot does **not**: the landing page now uses zero images, every mock being inline SVG and CSS.
- ⚠️ **A dark hero was built and reverted the same day (Aug 4 2026).** The cream `#ede9e3` was replaced with a warm charcoal `#2e2823` — lighter than the loop band (the dark `#1c1f26` section that existed at the time and was removed on Aug 5), so the page descended into the product — with the full text inversion and the device's glow flipped from absorption to emission. **Reverted on sight: it read as muddy and brown rather than premium.** The cream hero below is the shipped design; this entry exists so the idea is not re-attempted as though it were untried.
  - The two fixes from that pass that were **kept** are the headline's `text-wrap: balance` and the fold clearance it bought. Everything else went back.
  - ⚠️ If it is ever revisited, the groundwork is in commit `b739fda` and is worth reading rather than re-deriving — particularly that the device treatment **inverts**: on cream the device sits at ~17:1 and needs *softening* (warm darkening haze, warm-brown shadows), on a dark hero it sits at ~1.3:1 and needs *separating* (warm light halo, a hairline rim, black shadows, because a warm shadow has nothing to darken). Also recorded there: `#378add` drops to 4.05:1 on that background and fails AA at eyebrow size, the CTA must **not** be brightened to match because its label is white and a lighter fill lowers contrast, and the paper grain is ~an order of magnitude louder proportionally on a dark base and reads as dither.
- ❌ **REMOVED Aug 5 2026 — the "Here's how it works" / product-loop section.** Four phone mocks with an `Example: basketball` caption. Rebuilt that day as numbered steps (`b57a7ee`) and then deleted outright (`5f2faad`): section 2 and the student section cover the same ground between them, at full size and split by audience. ⚠️ Do not reintroduce it; it is redundant, not missing. `ScreenText`, `ScreenLog` and `ScreenDetail` went with it.
- **Section 2 — the instructor.** Heading **"All in one place."**, sub *"Send practice work between sessions, then see who did it and how it went — not scattered across texts and memory."*, CTA **"Get organized"**. Copy left, two upright device mocks right (assign screen + roster) at ≥1024, stacked below. Band `#262a39`.
  - ⚠️ **This entry said *"Your whole program, finally in one place."* and was stale.** The heading was shortened on Aug 6 and the subtext rewritten to name the LOOP — send work, then see who did it — rather than to list nouns, which is what "every assignment, every check-in" was doing. The sub is deliberately **longer** than the one it replaces (113 chars against 73); that is the trade for the shorter heading.
  - ⚠️ The parked entry *"Section 2's copy undersells what RJ actually values"* was written against the OLD heading and its quoted string no longer exists on the page. Its argument — that the claim available is nearer *permanence* than *tidiness* — is untouched by this rewrite and still open.
  - ⚠️ **"See your whole roster" was tried and dropped**, and still must not come back: every person who taps this has zero students.
- ❌ **Section 2's closing testimonial — BUILT Aug 6, REMOVED Aug 16 2026.** ⚠️ **It is no longer on the page.** A centred `<figure>` under the two-column layout, quieter than the CTA at every level. It was pulled because it was placeholder copy never approved by RJ, and because it was the only thing in `page.tsx` blocking the rest of that file from shipping.
  - **Saved verbatim at `docs/deferred/section-2-testimonial.md`** — JSX, CSS, the sign-off list and restore instructions. ⚠️ It was in **no commit** before that file existed, so nothing else recovers it.
  - Three things still need RJ's explicit sign-off before it returns, because each is a claim about a real named person on a public page: **(1)** the quote is a **RECONSTRUCTION** of four fragments reported from a call — "template", "record", "streamlined", "stick to it" — not a verbatim sentence, yet it sat inside quotation marks; **(2)** **"AAU coach and private instructor" is unverified** — "AAU" appears nowhere in anything recorded about him, the only AAU mention in this file being an unrelated org-licensing idea; **(3)** **"RJW Skills & Development"** matched only an internal `ProfileMenu` comment, which is not the same as RJ having checked it.
  - ⚠️ When it goes back, it must sit **outside** `.program-inner` — that container becomes a flex row at ≥1024, so a third child would become a third column instead of a closing line underneath.
- **Section 3 — the student** (Aug 5 2026, recopy Aug 6). Heading **"Your students just show up more."**, sub *"A text, a link, a tap — that's the whole thing. Just enough to keep them accountable. Younger students can log on a parent's phone with the same link."*, CTA **"Send your first assignment"**. Section 2's template **flipped** — screens left, copy right at ≥1024 — so the device side alternates down the page. Two mocks, both Jalen's: the log screen and his own home. Band `#caccd5`.
  - ⚠️ **This entry said *"Nothing for your students to download."* and was stale.** That string now lives on `/faq` as a question instead. The heading moved from a friction claim to a behaviour claim, which is the direction the parked entry *"Section 3's core claim may be the shallow one"* argued for — ⚠️ but that entry is **not** closed: the parent-facing half of it is untouched, and its blocker (any parent line implies parents *receive* something, and nothing is sent) still stands.
  - ⚠️ **"log", not "log in"** — students never authenticate, and the pricing checklist says "No login for students" on the same page.
  - ⚠️ Peer-sized with section 2 on purpose, a deliberate departure from the descending-tier rule; that rule guards a *lesser* later section, not siblings.
- **Pricing** (Aug 5 2026, recopy Aug 6). Eyebrow **"Straightforward pricing"**, heading **"Give it a try."**, sub *"Free to try, no card needed. See if it fits in a few minutes."* Centred, not zig-zagged. Two cards — Free `$0` **"up to 3 students"** / Pro `$10/mo` **"up to 30 students"** — both CTAs reading **"Start free"** because both go to the same signup and no "start Pro" path exists. One shared feature checklist under both, headed *"Everything included, always"*. Band `#f8f7f5`, reused from `/privacy` and `/terms`. ⚠️ Carries `flex: 1 0 auto`. ⚠️ Carries `id="pricing"`.
  - ⚠️ **"Straightforward pricing" is now the EYEBROW, not the heading** — this entry had it as the heading. The heading became an invitation and the eyebrow carries the old words so they are not lost.
  - ⚠️ **"forever" appears NOWHERE on the landing page as of Aug 6.** The hero support line says "Try free. No card, no catch." and this sub says "free to try". The free tier genuinely IS forever (see **Pricing**), so re-adding the word would not be a lie — it is simply no longer claimed. `/faq` **does** say "forever", deliberately, in answer to "is it actually free".
  - ⚠️ **"up to 30 students" is COPY ONLY and appears on THREE unlinked surfaces**: this card, the in-app paywall in `AddPlayerForm.tsx`, and `/faq`. ⚠️ **The cap became REAL on Aug 17 2026** — `PRO_STUDENT_LIMIT = 30` in `entitlement.ts`, enforced by both `addPlayer()` and `activatePlayer()`. `AddPlayerForm` now reads the number from the constant, so **two** hand-written 30s remain: this card and `/faq`. Change one and the other moves by hand.
- **In-app paywall string** (`AddPlayerForm.tsx`, Aug 6 2026): heading *"You've got {n} {studentsLabel} — nice work."*, body **"Pro takes you up to 30 {studentsLabel}, $10/month."** ⚠️ It read *"Pro unlocks unlimited, $10/month"* for part of Aug 6, which contradicted the pricing card. This is the surface a coach sees at the moment they are asked to pay, so it was the more important of the two to correct. `studentsLabel` keeps the noun following the coach's activity.
- **Footer:** `#262a39` — **the same value section 2's band uses**, not the old `#1a1d24`, and with **no top border**.
  - ⚠️ **This entry said `#1a1d24` with a `1px solid #2a2d36` top rule; both are wrong now.** The rule was removed, not forgotten: its documented job was separating the footer from a band it once shared a colour with, the band above is now the near-white `#f8f7f5` (13.32:1 away — emphatic on its own), and the rule measured 1.04:1 against the new background, so it was invisible and merely made the footer 1px taller.
  - ⚠️ **Every ink in the footer MOVED, because the lighter band broke two of them.** On `#1a1d24` the greys were 5.28:1 and the links 4.69:1; on `#262a39` they fell to 4.46:1 and 3.97:1 — both under AA for 12–13px text. Same lesson as `.program-caption`. New values are reused rather than invented: **`#9095ac`** (the ink `.program-caption` already uses on this exact colour) and **`#4a9ae8`** (`--reps-orange-hi`, the brand blue's existing lighter variant). The brand blue itself is untouched everywhere else.

⚠️ **The page ALTERNATES; it no longer descends.** Bands run cream `#ede9e3` → `#262a39` → `#caccd5` → `#f8f7f5` → `#262a39`. Sections 2 and 3 are one blue family two degrees apart at opposite lightnesses, and section 3 is light **specifically** so section 2, section 3 and the footer are not three darks in a row. The rule recorded at `.program-section` is *"do not leave two same-tone bands touching"* — a future gradient pass must not quietly restore a single top-to-bottom descent.

⚠️ **The footer now REUSES section 2's `#262a39`** rather than carrying its own `#1a1d24`. So the page has four distinct band colours across five bands, and the two that repeat are separated by two others — the alternation still holds. Same reuse pattern as the pricing band borrowing `/privacy` and `/terms`' `#f8f7f5`.

⚠️ **`flex: 1 0 auto` sits on whichever band is LAST before the footer**, and moved three times on Aug 5 (`.program-section` → `.student-section` → `.pricing-section`). It is the page's only grower; without it the cream shell shows as a band *below* the footer — measured at 679px on a 2200px viewport.

⚠️ Every device mock on the page is hand-drawn React, not a screenshot — a second surface that has to track the design system by hand. **Five, all on the landing page** (one hero, two in section 2, two in section 3). Nothing keeps them current.

⚠️ **A sixth briefly existed on `/faq` and was removed on Aug 6 2026** — see the `/faq` section. It was a hand-drawn duplicate of this pattern rather than a reuse of it, because the primitives (`T`, `CAST`, `MiniCard`, `MiniBar2`, `MiniStepper`) are module-local to `page.tsx`. **Extracting them into `src/components/` remains the right move** if a mock is ever wanted outside this file; hand-drawing a second copy is not.

---

## `/faq` (Aug 6 2026)

A standalone page at `src/app/faq/page.tsx`, linked from the landing header. **Prerendered static.**

- **It reuses `/privacy` and `/terms`' shell exactly** — `paper-grain` wrapper, `#f8f7f5`, a 680px column, the `← Back` link, a 30px/700 `h1`. It does **not** carry the landing header; see the header-nav entry above for why there is no shared header component.
- **Voice is the landing page's, not the legal pages'.** h1 is **"Frequently asked questions"**, subhead *"Pricing, students, privacy, and everything else coaches ask before getting started."* Five groups in order: **The basics · Pricing · Your students · Privacy and trust · A few more things** — **19 questions**, 1–3 sentences each.
  - ⚠️ **THREE content passes on Aug 6 2026, the day it was built.** Pass one: the fifth group renamed from *"Other setups"*, *"Do I need permission to text a student or parent?"* **removed** (see below), four answers rewritten. Pass two: subhead, five answers (card / cancel / download / friction / message-back), closing line. Pass three: h1, subhead again, a **new question** in The basics, plus the message-back and closing lines again. Question count went 19 → 18 → 19.
  - ⚠️ **The h1 was "Questions" for the first two passes.** *"Frequently asked questions"* is plainer and more searchable; it is also **four times longer**, which matters at 375 — see the wrapping note below.
  - ⚠️ **THE FIRST-PERSON REGISTER EXISTED FOR ONE PASS AND IS NOW GONE.** Pass two put a person in the subhead (*"the questions I get asked most… like I'd tell a friend"*) and the closing line (*"I read every message myself"*), and this file recorded that as the page's register. Pass three reverted both to product voice, and the closing line now says **"Let us know"**. **New answers stay in product voice. Do not reintroduce "I" into one line and leave the rest** — the singular/plural mix is exactly what this resolved.
    - ⚠️ The *questions* still say "I" (*"Do I need a card to start?"*). That is the **reader** speaking, a different thing, and it stays.
    - ✅ A side effect worth noting: the page no longer says "I" without saying who "I" is, so it no longer leans on the deliberately-absent *"who's behind this"* question. And *"I read every message myself"* — a standing commitment that would quietly expire the moment that address routed anywhere but one inbox — is gone with it.
  - **Answers verified against shipped behaviour**, not written to sound good: *"nothing to enter"* (the signup tree contains no billing code), *"no separate login to remember"* (students never authenticate; they arrive on a token-addressed page), and the whole drills answer below.
- ⚠️ **NO ACCORDION, and nothing collapsed behind a click.** Every question and answer is rendered flat. This is the same "surfaced over progressive disclosure" principle already locked for the student note field; do not "improve" it into `<details>`.
- ⚠️ **The headings and links are NOT the brand blue, and that is an accessibility fix rather than a style choice.** `/privacy` and `/terms` set their `h2`s and links in `#378add`, which measures **3.36:1** on this `#f8f7f5` band — under AA for normal text, passing only under the large-text allowance (≥18.66px **and** bold), which 17px/600 headings and 15px links are not. `/faq` uses measured values instead: `#1a1a1a` 16.26:1 (group headings, questions), `#333` 11.80:1 (answers), **`#2a6fb5` 4.86:1** (links — the brand blue darkened until it passes), `#6b6b6b` 4.98:1 (intro and closing lines). **All 48 text elements audited against their actual painted background: zero AA failures, minimum 4.86:1.**
- ⚠️ **`/privacy` and `/terms` still carry that failure.** It was found while building this page and deliberately **not** fixed — those pages were out of scope. It is a real open item, not a false alarm; see the standing *Final legal review of /privacy + /terms* entry.

### ✅ `/faq`'s cancel answer is now TRUE (built and verified Aug 17 2026)

This section carried a 🛑 gate for eleven days. The answer to *"How do I cancel?"* reads:

> **Cancel anytime from your profile. You'll keep everything you already paid for through the end of that period — it just won't renew after.**

**Both claims are now backed by shipped, verified behaviour.** `createPortalSession()` lives in `src/app/instructor/billing/actions.ts` and is reached from the **"Manage subscription"** row in `ProfileMenu` — exactly where the answer says, in the coach's profile.

Verified end to end in test mode on Coach Tony's subscription, not assumed:

| Claim | How it was checked |
|---|---|
| "Cancel anytime from your profile" | The portal opened from the ProfileMenu row and the cancellation registered at Stripe |
| The period-end behaviour | Stripe reported status `active` with `cancel_at` equal to the exact `current_period_end`, and `canceled_at` stamped — the coach keeps Pro until the date they paid through |
| Nothing else broke | Two `customer.subscription.updated` events forwarded, both returned **200**, and **RJ's row was untouched on both sides** — the customer-level resolution held, which is the Aug 3 regression |

✅ **No entitlement or webhook changes were needed**, confirmed rather than assumed: `isEntitled()` allows `active`, Stripe keeps the subscription `active` until the period ends, and the existing handler re-resolves at customer level.

⚠️ **TWO THINGS THAT CAN STILL MAKE THIS ANSWER FALSE, and neither is visible from the code:**

1. **The portal's cancellation mode is a DASHBOARD SETTING.** Stripe Dashboard → Settings → Billing → Customer portal → Cancellation must stay on **"At end of billing period"**. Confirmed set on Aug 17. Switch it to Immediately and the second sentence of the answer becomes false with nothing in the repo to catch it.
2. ✅ **Live mode's own portal configuration is CONFIRMED SET** (Aug 19 2026) — read directly from the live dashboard, already "Cancel at end of billing period". The code is mode-agnostic, so both modes now agree. ⚠️ Still a dashboard setting either mode can silently invalidate.

⚠️ **On API version `2026-07-29.dahlia`, `cancel_at_period_end` reads FALSE even when the cancellation IS correctly scheduled for period end** — the flag effectively moved to `cancel_at`. Compare `cancel_at` against `current_period_end`; do not trust the boolean. This caused a moment of false alarm during verification and will again.

⚠️ The reasoning is duplicated in a block comment above the answer in `src/app/faq/page.tsx` and above `createPortalSession()`. Do not delete either as tidy-up — they are the trail back if the dashboard setting ever changes.

⚠️ **The related over-claims elsewhere are NOT resolved by this.** The pricing checklist's *"Cancel anytime"* and `/terms`' *"can be cancelled anytime"* were vague rather than false, and are now simply true. But `/terms` still has no refund policy and no statement of what happens to time already paid for — that period-end behaviour is a **billing term** and still lives only in marketing copy. See the legal-pages audit.

### The rest of `/faq`

- ⚠️ **NO device mock, and its absence is a decision.** A 128px phone frame drawing the student's incoming SMS sat beside *"Do they need to download anything?"* for one session and was **removed on Aug 6 2026** — the answer is three words long and carries itself, and the frame was a sixth hand-drawn surface nothing keeps in step with the app.
  - ⚠️ **Removing it took the page's ENTIRE stylesheet with it.** Every rule in the old `<style href="faq">` block (`.faq-answer-with-mock`, `.faq-answer-text`, `.faq-mock`, `.faq-phone`, `.faq-mock-caption`, and the 600px media query) existed only to lay the frame out beside the answer. **The block is gone, not emptied** — this page is now pure inline styles exactly like `/privacy` and `/terms`, with no page-level CSS at all.
  - **Verified, not assumed:** zero elements carrying a `faq-*` class, zero `.faq-` rules across every loaded stylesheet, zero `<figure>` elements, zero `aria-hidden` nodes, and no `data-href="faq"` style node in the document. The only remaining `className` on the page is the global `paper-grain`.
  - If a visual is ever wanted here, the right move is the one deliberately not taken: **extract the landing page's primitives into a shared module and import them**, rather than hand-drawing a second copy.
- ⚠️ **REMOVED Aug 6 2026 — *"Do I need permission to text a student or parent?"***, answered *"If you already have that relationship — most coaches do — you're fine. Same trust, just one text instead of many."* Recorded rather than silently dropped, because **consent is not a non-issue here**: `/terms` places the obligation squarely on the coach (*"explicit verbal consent before adding any student or parent phone number"*), `/privacy` says the same, and the Twilio toll-free registration depends on it. The old answer was **softer than both documents it summarised**. Removing it leaves the binding statement in one place instead of two that disagreed. ⚠️ If a consent question ever returns here, it has to match `/terms` rather than reassure.
- ⚠️ **Two claims here are duplicated from other surfaces with nothing linking them**: *"up to 3 students, forever"* and *"$10/month, up to 30 students"* — also on the pricing cards and in `AddPlayerForm.tsx`. ⚠️ Note `/faq` says **"forever"** and the landing page deliberately does **not**; that asymmetry is intentional, since the question here is literally "is it actually free, what's the catch".
- **NEW Aug 6 2026, second in The basics** — *"Do I have to build out all the drills myself?"* → **"No. It comes preloaded with a full basketball library — shooting, ballhandling, conditioning, all ready to assign right away. Want something specific to your program? You can add your own too."**
  - **Every claim checked against `src/lib/exercises.ts`:** 30 exercises across 6 categories, and *shooting / ballhandling / conditioning* are three real category titles (the others being Finishing, Footwork and Spot shots). ⚠️ It names **three of six as a sample** and deliberately does not say "all six" or give a count — so adding or renaming a category does not falsify it.
  - ⚠️ **"ballhandling" is one word here, where the app's category label is "Ball-handling".** Marketing prose reads better unhyphenated. **Do not "fix" either one to match the other.**
  - ⚠️ **The ORDER is the locked product decision, not style** — *"Default exercise libraries are the product experience. Custom creation is the escape hatch."* The library leads and takes two sentences; custom follows as an aside. **Do not flip these.**
  - ⚠️ **One caveat the answer does not state and currently does not need to:** custom exercise creation is only reachable from *inside* the assign flow for a specific player — a standing Pending item. "You can add your own" is true. If this ever grows into implying *manage your library* as a standalone thing, that reachability gap becomes a real overclaim.
- *"Can students message me back?"* answers **"No chat here. But when they log, they leave you a real note — you see how it went, not just a checkbox. Coaching still happens in person; this keeps that thread alive in between sessions."**
  - ⚠️ **One accuracy note, flagged rather than silently edited.** *"When they log, they leave you a real note"* reads as though a note **always** accompanies a log. It does not: `logs.note` is nullable with no default, and most logs genuinely carry none — the card display rule (most recent log **with** a note, not the latest log) exists precisely because of that. The previous wording, *"they **can** leave you a short note"*, matched the data's shape exactly. Not a false claim about capability, but more confident than the data usually is.
  - ⚠️ *"No chat here"* is doing real work and must stay **first** — it is what stops the rest of the answer reading as messaging.
- *"What happens to my data if I stop using Reps?"* answers **"It stays yours — nothing is deleted without you asking."** ⚠️ The old *"Want everything fully removed instead? Email us"* sentence was dropped on purpose — the mechanics of full removal live in `/terms` and `/privacy`, and a third copy here would be a third place to keep in step.
- The fifth group is **"A few more things"** (was *"Other setups"*), and its first question is *"Can other coaches or trainers share my account?"* → **"Not yet — one account per person today."** ⚠️ **"per person", not "per coach"** — the question names coaches *and* trainers, the same pair the landing eyebrow uses, so "per coach" would have excluded half the people just addressed.
- **Closing line:** *"Have an idea, or notice something missing? Let us know at hello@assignreps.com."* On its **fourth** wording in one day — support-of-last-resort → feedback invitation in product voice → first person with a personal reading commitment → this. Same invitation as the second version, in product voice, promising only that someone reads it.
- ⚠️ **`textWrap: pretty` is on the `body` style object, and it is a MEASURED fix rather than a flourish.** The Aug 6 sweep found **four one-word widows**: *"…up to 3 students, / forever."*, *"…only see their own / assignments."* and *"…without you / asking."* at 375, plus *"…I read every message / myself."* on the closing line at **every width from ~736px up**, where the column pins at 680px.
  - ✅ **Verified before applying**: it clears all four and changes the line count of **zero** paragraphs — it moves nothing, it only stops a last line stranding a single word. Where unsupported it degrades to normal wrapping, which is exactly the prior behaviour, so there is no downside case.
  - ⚠️ **Three of the four were PRE-EXISTING**, in answers the copy pass never touched — so this is not a fix for the new copy alone, and it should not be read as one.
  - Same family as the landing page's `text-wrap: balance` headline. ⚠️ It also had a `pretty` testimonial quote until Aug 16, when the testimonial was removed — so that second example now lives only in `docs/deferred/section-2-testimonial.md`. Established on this project, not invented here.
- ⚠️ **There is deliberately NO "who's behind this / who built this" question, and its absence is a decision.** An origin-story answer is planned as a fast-follow once the product settles; a thin placeholder now would read worse than waiting. **Do not add one.**
- **Verified Aug 6 (after all three content passes):** `tsc --noEmit` clean, real `next build` clean, measured sweep at 375/768/1024/1280 — **0px document overflow, 0px element overhang past the 680px column, 0 one-word widows across all 21 paragraphs, and all five group headings on one line** at every width, plus zero AA failures across all 50 text elements.
- ⚠️ **The h1 takes two lines at 375, breaking as "Frequently asked / questions" — a one-word last line, LEFT AS IS deliberately.** All three wrap modes were measured at the 319px mobile column: `normal` and `pretty` both give *"Frequently asked / questions"*; **`balance` gives *"Frequently / asked questions"***, which splits the fixed phrase "frequently asked" and reads worse. The current break is the natural reading break, so the h1 carries **no wrap hint at all** and should not be given one. It is one line at 768 and above.
- ⚠️ Five *question* headings wrap to two lines at 375. Pre-existing, not from any of these passes.
- **Group rhythm is identical across all five groups and unaffected by the new question** — measured: h2 → first question **22px**, question → answer **4px**, answer → next question **22px**, everywhere. The Basics now holds **4** pairs, matching Pricing exactly and sitting inside the 3–5 range the other groups span.
- **No background or texture change** was made in the Aug 6 copy passes — deliberately skipped, not forgotten. The band is still the flat `#f8f7f5` shared with `/privacy` and `/terms`, under the global `paper-grain` overlay.

⚠️ **`/faq` is not in any `mocks-*.html` snapshot.** The Aug 5 capture is the landing page only and predates this page.

---

## SMS consent on the add-student screen

Built Aug 18 2026 (`f3ec235`), then **replaced the same day** (`e684111`) after a design review and four rounds of device testing. The verbal-consent obligation lived only in `/terms` and `/privacy` — documents nothing in the app linked to until the day before — while the one screen where a coach is about to type **another person's** phone number said nothing. ⚠️ This is the clause an outside party actually relies on: **Twilio's toll-free registration rests on it.**

### What is there now

One helper line per tab, each followed by a 16px `i` icon that opens a tooltip:

| Tab | Helper line | Tooltip |
|---|---|---|
| Player | *"They'll get a text when you assign work."* | *"Get their OK before adding this number. If they're younger, ask a parent instead."* |
| Parent | *"They'll get a text to share with {name}."* | *"Get the parent's OK before adding this number."* |

⚠️ **The parent line is a TRIM, not a fix.** It lost *"when you assign work"* and *"Great for younger students"* to reach one line, and an em dash went with them. It already said *"They'll"* — the pronoun was never wrong, and a report that it said *"You'll"* was mistaken.

⚠️ **ONE consent standard, not one per tab.** The two tooltips differ only in **who to ask**, never in whether consent is needed. `/terms` and `/privacy` both say *"student or parent phone number"* in a single breath, and forking the standard by recipient is the divergence the Aug 16 `/faq` removal ended. The minors distinction rides inside the Player variant because this is the only screen where `/privacy`'s "permission from the student **or** their parent" is actionable.

⚠️ **The banned framings**, from that pulled `/faq` answer: no *"if you already"*, no *"most coaches"*, no *"just one text"*. It states an obligation; it does not reassure.

### ⚠️ NO SCRIPT ON THIS SCREEN, deliberately

The first version put a standalone consent sentence plus a **"What to say"** disclosure that quoted `/terms`' scripted line verbatim. **Both were removed after review**: a block of quoted dialogue read as an unfamiliar pattern on a screen whose other copy is a single short line, and nobody wanted a *script* inside a form.

`SMS_CONSENT_SCRIPT` in `src/lib/consent.ts` is therefore down to **one consumer — `/terms` only**. ⚠️ It is kept as a constant rather than inlined back, because the moment a second surface needs that sentence it must be *that* sentence; the `/faq` removal is the precedent for what an independently-worded second telling costs.

### ⚠️ The app's FIRST tooltip — treat it as the template

There is **no popover-with-arrow anywhere** in this codebase and **no library that provides one**: the dependencies are Supabase, Stripe, Next, React and `lucide-react`, which is icons only. Every other "arrow" in the app is a back-link glyph. All of the below is hand-built.

**Dismissal borrows the overflow menus** — a full-screen click-away at `z-40`, panel at `z-50`. **Sizing does not**: those panels are `min-w-[180px]`, tuned for labels like "Archive", and a sentence in that width wraps to a skinny column.

**Surface** is `#2a2d36` with a `#3a3d46` border, `rounded-[10px]`, and the menus' shadow. ⚠️ **NOT `#1c1f26`** — that is what the deactivation modals use, and it is the exact colour of the inputs and the disabled Add button, so a tooltip in it reads as one more form field. Measured against the field colour: `#22252e` 1.08:1, `#2a2d36` 1.20:1. Text is `#c8cdd8`, because `reps-sub` measures **4.31:1** on this lighter surface — under AA.

**Opens upward** (`bottom-full`) so it can never cover *Add player* — verified at 59.5px clearance. There is always more room above: the phone field, its label and the name field. Floating over an input is what an overlay is for; covering the primary action is not.

**Width** is `w-max max-w-[260px]`, ~67% of a 390px phone. ⚠️ A **fixed** cap rather than a `vw` unit, because the instructor shell is `max-w-[390px]` and centred — `68vw` would blow past the column on a desktop window.

### ⚠️ Positioning is MEASURED, and the clamp is the normal path

Centring on the icon is trivial in CSS; keeping the box on screen when centring would push it off is not, because the icon sits at the **end of a sentence** whose length changes with the tab and the student's name. So, in a layout effect on open:

1. centre the box on the icon
2. **clamp the box** to the column
3. **move the caret within the box** to keep pointing at the icon's true position

The box gives up its centring before the caret gives up its target. ⚠️ **The clamp fires on BOTH tabs** — measured at a 342px column, pure centring would place the box at 125→385 and 86→346, both past the edge. This is not a rare edge case; the caret is doing real work every time. The caret is clamped 14px from either end so it can never straddle a rounded corner.

⚠️ `useLayoutEffect` behind the same isomorphic shim `ScrollToTop` uses, since it warns during SSR. Pre-paint timing is what stops the box appearing at `left: 0` before it is measured.

### ⚠️ The caret: two CSS triangles, never a rotated square

A **rotated square was tried first and rejected**. A 45° rotation puts the box's corner radius and both of its borders on the diagonal, so the tip can never be crisp — on device it read as flush and rounded against the icon rather than as a point.

Replaced with the border-triangle technique: a **7px triangle in the border colour behind a 6px triangle in the fill colour**, leaving an even 1px outline along both slanted edges and at the tip. No rotation, no corners, so neither artifact can appear.

⚠️ **Both sit 1px high** (`-6` / `-5`, not `-7` / `-6`) so their flat tops cover the box's own 1px bottom border across the caret's width. Without that a hairline runs straight across the base of the arrow and it reads as a separate shape stuck underneath.

### ⚠️ `type="button"` is still load-bearing

It moved from the removed disclosure to the **icon**, which is still inside the add-player `<form>`. A bare `<button>` defaults to `type="submit"`, so tapping the icon would add the student. Nothing about the markup makes that visible.

### ⚠️ The helper line above it still fails AA

*"They'll get a text when you assign work."* is `#5a5f72` at **3.11:1**. **Pre-existing, not introduced here, deliberately left alone.** Worth a future sweep: `#5a5f72` is the documented placeholder token and may be doing body-text duty elsewhere.

### Not done

✅ Positioning and clamping verified on a phone; the caret shape verified on desktop.

⚠️ **Confirm tapping the icon does not submit the form.** That check transferred from the removed disclosure to the icon and is still the one failure here that would go wrong silently — it would add the student.

⚠️ There is no central untested-on-device list in this file; each section carries its own note.

---

## Legal pages — Aug 6 audit (`/privacy`, `/terms`)

A line-by-line fact-check of both pages **against the code**, not by reading. Both are short — privacy is 8 sections, terms is 7 — and genuinely written, so the problems are staleness and omission rather than filler. ⚠️ **Only the three FALSE statements were fixed. Everything else below is still open**, and this list is the worklist for the standing *Final legal review* item.

### ✅ FIXED Aug 6 2026 — three false statements in `/privacy`

All three lived in the SMS/data-use sections. Each was verified against the code before being touched, and the reasoning is duplicated in block comments at the edit sites.

1. **"To send parents a weekly digest if you've added their number."** — **DELETED OUTRIGHT**, not reworded. No digest has ever been sent: no cron, no scheduled job, no `vercel.json`, and `/src/app/api/` contains only `stripe/`. ⚠️ Before the edit, the **only** occurrence of "digest" or "weekly" anywhere in `src/` was this sentence describing itself. It goes back only when the feature ships — see the parent contact model under *Decided, not built*. **Do not restore it as a statement of intent.**
2. **"Students and parents receive SMS notifications via Twilio."** → **"SMS goes to whichever phone number you add for each student — theirs or a parent's, whichever makes sense for that relationship."** Parents receive nothing: both notify paths send only to `players.phone` (stated in a comment at the send site), and `parent_phone` is written at add-student and **read nowhere**. ⚠️ The replacement deliberately does **not** describe two recipient types — the schema has one phone field per student and the coach chooses whose number goes in it, so the original described a routing split that does not exist.
3. **"Every SMS includes instructions to reply STOP to opt out at any time."** → **"You can reply STOP at any time to stop receiving messages — this happens automatically through our messaging provider, not something written into every text."** The original was a claim about message **content** and no message body contains STOP text: there is exactly one composed body in the app, and `sendSms()` appends nothing. The replacement claims a **capability**, which is true — the number is toll-free and STOP handling is automatic at the Twilio/carrier layer regardless of message content, and cannot be disabled.
   - ⚠️ **The SMS send code was NOT touched and must not be**, as a side effect of this. Adding literal STOP text to `notify-assignment.ts` is a separate compliance-posture decision, explicitly out of scope. Verified after the edit: `src/lib/` is unchanged and contains no `STOP` string anywhere.
   - ⚠️ **The audit's "this claim appears in two places" was WRONG, and the correction matters.** The false content claim appeared **once**, in *SMS consent*. *How we use it* carries a different, shorter line — "Reply STOP to opt out at any time." — which is a bare capability statement, already true, and was deliberately **left alone**. Do not "reconcile" the two; they are saying different things and both are now correct.
   - ⚠️ Dropping "via Twilio" from *How we use it* does **not** undisclose the processor — *Who we share it with* still names Twilio outright.

**Verified after the fix:** `tsc` clean, real `next build` clean, all three false strings absent from the rendered page, both new strings present verbatim, Twilio still disclosed, 0px overflow and no widows at 375, and the AA profile **byte-identical to before** (9 failures of 17, same elements, same two colours — nothing new introduced).

### ⚠️ STILL OPEN — everything else the audit found

**`/privacy`:**
- ✅ **Stripe named as a processor** (Aug 17 2026). The vendor list is now Supabase, Twilio, Resend, Stripe.
- ✅ **"What we collect" now lists student notes and billing fields** (Aug 17 2026). ⚠️ `logs.note` was the important one — the only free text a student writes anywhere in the product, often a minor, and it had been undisclosed since Aug 1. Also adds that card details never reach us, which is true only while checkout stays a hosted Stripe page.
- ✅ **REWRITTEN Aug 17 2026 — was the weakest thing on either page.** It now opens by addressing the parent, says plainly what is held about a child, keeps the coach's consent duty as a clause rather than the whole section, and gives parents a direct deletion route that does not go through the coach. ⚠️ Still deliberately silent on age verification (there is none) and on any retention limit (there is none) — the deletion route covers the latter in practice. The original finding follows, kept as the record of what was wrong:

  🛑 **The minors section is the weakest thing on either page.** It is one sentence — *"You are responsible for having appropriate consent…"* — which is a liability transfer to the coach, not a statement about minors, under a heading that promises otherwise. Grep confirms **zero** occurrences of COPPA, guardian, parental consent or any age threshold on either page. Absent: any age position, what data is held about a minor, a route for a **parent** to request their child's data be deleted (the only deletion path is the coach emailing, and the parent is not a party to anything), and any retention limit. ⚠️ **The student never consents to anything** — they receive a link, there is no account and no acceptance step, so the whole consent chain is coach→student, verbal, off-platform. **This is the area to be conservative about; do not treat one sentence as coverage.**
- ✅ **Player-delete cascade disclosed** (Aug 17 2026), in *Deleting your data*, with deactivation named as the contrast that keeps everything. Over-limit is covered there too: it changes access, never data.
- **"Stopping ≠ deleting" is never stated.** Only `/faq` says it.
- ✅ **`/faq`'s over-claim trimmed** (Aug 17 2026) rather than answered with a new promise on `/privacy`. It said *"never shared with advertisers. The full detail is in the privacy policy"*; privacy made no advertiser statement at all. Now points at the vendor list, which is what actually exists.

**`/terms`:**
- ✅ **"Paid plans… can be cancelled anytime" is now TRUE of the product too**, as of Aug 17 — the Stripe Customer Portal ships and a coach can cancel from their profile. It was the vaguer of the two claims and needed no edit to become accurate. ⚠️ What is STILL missing here is the other half: `/terms` has no refund policy and no statement of what happens to time already paid for. That period-end behaviour is a **billing term** and currently lives only in `/faq` and marketing copy.
- ⏸️ **DEFERRED as a group — three gaps that need NEW terms written, not a claim corrected.** The Aug 17 accuracy pass deliberately skipped all three: every other fix in it made an existing sentence true, where these mean adding coverage the page has never had. Worth doing together, in one pass, since they are all the same kind of writing:
  - **No refund policy, and no statement of what happens to time already paid for.** `/faq` promises period-end access — a **billing term** that belongs here and currently lives only in marketing copy.
  - **No user-termination clause.** Only *"We can suspend accounts that violate these terms."* Nothing grants a coach the right to close their own account, though `/privacy` promises deletion on request.
  - **Silent on the plan limits.** A coach reading Terms gets no notice of the gate that stops them at their 4th student, nor of the Pro ceiling at 30. ⚠️ Terms now describes what happens when you are ALREADY over a limit, but never says the limits exist.
- ✅ **"instructors" → "coaches and trainers"** (Aug 17 2026). The internal `instructor` vocabulary is untouched and still deliberate.

**Both:**
- ✅ **Dated August 17, 2026** on both pages, bumped ONCE at the end of the bundle rather than after each pass. ⚠️ It moves again only when the CONTENT changes, not when styling does.
- ✅ **AA: FIXED on both pages** (Aug 17 2026), audited to **zero failures**. There were two failing colours, not one: `#378add` at **3.36:1** (all `h2`s at 17px/600, the back link and the mailto at 15px) and **`#888888` at 3.31:1** on the "Last updated" line — that second one was missed by the earlier finding, which named only the brand blue. Both pages now use `/faq`'s measured set: `#1a1a1a` (16.26:1), `#2a6fb5` (4.86:1), `#333` (11.80:1), `#6b6b6b` (4.98:1). ⚠️ None of this qualifies for the large-text allowance — 17px/600 is under the 18.66px-**and**-bold threshold — which is why the brand blue could never have stayed.
- ✅ **Voice reconciled** (Aug 17 2026). Privacy's intro said *"built by one person"* against `/faq`'s **"Let us know"**; the headcount claim is gone and *"small"* stays, which is the framing the plain register rests on.
- Neither legal page links to `/faq`; `/faq` links to `/privacy` but not `/terms`.

### ⚠️ Swapping a hero image: the browser will lie to you

**Cost real time on Aug 4 2026.** Replacing a file in `public/` and reloading shows the **old** image, through hard reloads and dev-server restarts. Nothing is wrong with the file.

`next/image` serves optimised copies from a disk cache, and in **Next 16 that cache is `.next/dev/cache/images`** — *not* `.next/cache/images`, which is the path worth guessing and which does nothing. Clearing the wrong one and reloading also repopulates the right one from the running server's memory, so it gets *more* stale, not less.

**The sequence that works:** stop the dev server → `rm -rf .next/dev/cache/images` → start it again. Order matters; clearing while it runs lets it write the old bytes straight back.

⚠️ **Do not verify an image swap by eye.** A screenshot mid-fade shows empty circles, and a cached hit is indistinguishable from a fresh one. Compare bytes instead — `sharp(file).stats()` mean RGB per channel, against three references: the old version out of git (`git show HEAD:public/x.webp`), what the server actually returns (`curl` the `/_next/image?url=…` URL the DOM is using), and the new file on disk. Served must match disk, not HEAD. That is what caught it here after two restarts had "confirmed" the wrong thing.

### Hero image sources — recover them from git, do not re-encode the WebP

⚠️ **Re-cropping the shipped `.webp` stacks a second lossy encode on the first.** Always crop from the original.

The originals are **not in the working tree** — `026b623` deleted them when the heroes were converted to WebP. They are still in history:

| Source | Recover with |
|---|---|
| `basketball-hero.png` (2048×2048) | `git show 626c7f9:public/basketball-hero.png` |
| `piano-hero.png` | in history, same commit range |

⚠️ **The soccer source is GONE and cannot be recovered.** `soccer.png` and `soccer-updated.png` were both untracked when deleted, so no commit holds them — re-cropping soccer means re-supplying the original by hand. Confirm a recovered file is the right one before trusting it: compare its mean RGB against the shipped WebP, which should match to within a fraction of a level.

**Encode quality is chosen by sweeping, not by reusing a number.** The rule from `ad9e14d` is that the output should land beside its siblings in file size. The right quality moves with the pipeline: a 768×768 source encoded 1:1 needed q68, while a 1696×1696 or 2048×2048 source downscaled to the same output needs ~q82, because the downscale removes noise and the same quality number lands 30% smaller.

⚠️ The device mocks are basketball-specific (real exercise names, a real shooting percentage) while the rest of the page is activity-agnostic. The `Example: basketball` caption that used to disclaim this **went with the removed section**, so the page currently carries the specificity with no disclaimer. Basketball is still the only ACTIVE entry in `activityTypes.ts`, so a broader promise would break at the signup picker one screen later — worth deciding whether the disclaimer needs a new home.

### ⚠️ Editing `src/app/page.tsx` — two traps that have each bitten more than once

This file is **~2,200 lines** (it grew by roughly 700 on Aug 5 with the student and pricing sections) with the entire stylesheet inside one `<style>{\`…\`}</style>` template literal and a dozen media queries. Two specific mistakes cost real time on Aug 4 2026, recurred on Aug 5, and will again.

**1. A rule that looks applied because it is applied SOMEWHERE. Four instances in one day.**

A breakpoint-scoped rule can be silently outranked, and the symptom is always the same: the value is right in the source, wrong on screen, and correct at *some* width — so it looks fine wherever you happen to be looking.

| What happened | Why |
|---|---|
| Section-2 devices stayed mobile-sized | The desktop rules went into a `768` block that sits **earlier in the stylesheet** than the base `.program-*` rules. Equal specificity, later wins, so the base overrode them. |
| Hero image column stayed 420px above 1023 | The `768` override was correct; the **`1024` block re-declared `flex`/`width` after it** and put the old value straight back. |
| The section-2 CTA ran the full column width | `display: inline-block` was put in the `768–1023` block **only**, so at 1280 the base `display: block; width: 100%` still applied. |
| The section-2 heading rendered at 48% of the hero instead of 82% | The `clamp()` was put in the `768–1023` block **only**, so at 1280 it fell back to the 27px mobile size. |

Related, same family: the `768` block once held **two** `.landing-layout { gap }` declarations (80px, then a 56px override further down). The value in effect was not the one you would find first.

**How to not lose an hour to it:**
- A rule meant for "desktop and up" belongs in its own `@media (min-width: 768px)` block placed **after** the base rules — not inside a `768–1023` range block, and not duplicated per breakpoint.
- **Check the widest width, not the one you are on.** Three of the four survived a screenshot at the width being worked on.
- **Measure, do not look.** `getComputedStyle` / `getBoundingClientRect` in the console is what caught every one of these; a large bold heading looks fine on its own and only a *ratio* against the hero exposes it.
- Before adding an override, grep the selector — the duplicate is often already there.

**2. Backticks inside the `<style>` template literal terminate the string. Twice.**

Both times it was a CSS *comment* written in prose — `` `.landing-text` `` and `` `pretty` rather than `balance` `` — using backticks the way this file's own markdown does. The build fails with a confusing JSX error (`TS1381: Unexpected token. Did you mean {'}'}`) pointing at a line nowhere near the comment.

Use plain words in CSS comments in that file. `tsc --noEmit` catches it immediately, so run it before assuming an edit landed.

**3. A batch edit that throws part-way writes NOTHING.** The Python helper scripts used for these edits build the whole string and write once at the end, so an `AssertionError` on match 5 of 8 silently discards matches 1–4 — while still having printed `ok:` for them. Verify the file, not the log.

---

## Screen inventory

⚠️ **There are now TWO kinds of snapshot in the project root, and they are not interchangeable.**

**1. `mocks-2026-08-05-2002.html` — the LANDING PAGE, and only the landing page.**
A **real capture**, not a hand-drawn replica: the server-rendered markup of `/` plus the page's own stylesheet and `globals.css`, all inlined verbatim, with every `<script>` stripped. It therefore opens standalone with no server and no network, and — because it carries the real CSS — it is **live and responsive**: resize the window and the actual breakpoints fire, rather than showing a fixed frame.

The landing page uses **zero images** (every mock is inline SVG and CSS), so unlike the July files this one has no asset dependencies and does not care where it sits.

⚠️ **Regenerate it; do not hand-edit it.** Hand-editing is exactly how the July galleries drifted from the app. The build recipe is written into an HTML comment at the top of the file: curl `/`, lift the `<style data-href="landing">` block and the `<div class="paper-grain">` subtree out of the response, inline the linked `globals.css` chunk, concatenate, copy no scripts.

⚠️ It does **not** cover any app screen. For those, see below — which is still stale.

**2. `mocks-2026-07-27-1830.html` — the APP-SCREEN gallery (70 phone frames).**
A static gallery of every app screen and meaningful state, rebuilt from the page code. Opens standalone; image paths are relative, so it must stay at the project root. Current as of the July 27 2026 Archive/emerald release. The older `2026-07-25-1441`, `2026-07-24-1330` and `2026-07-23-1607` snapshots sit beside it as history. It contains one mobile-width landing frame, which the Aug 5 capture supersedes; everything else in it is app screens the Aug 5 file does not touch.

⚠️ The gallery renders through a small **JS macro layer** at the bottom of the file (`%ACARD(...)%`, `%TABS(...)%`, `%ALLDONE(...)%` and friends, expanded into `.main` on load). A macro used but not registered in the expansion pass leaves raw `%NAME(...)%` text on screen; a JS error blanks the whole gallery, because the script replaces `.main.innerHTML` wholesale. Open it in a browser after editing — a syntax check alone won't catch either.

New in this snapshot: New/Archive tabs on both list screens, the all-done panel in both variants, the Archive tab itself, the finished-card menus (Assign again / Archive / Move back to New), emerald tokens, 2px bars, and the divider-style menus with icons. The **Clear finished sheet frame was deleted**, matching the feature.

⚠️ **The app-screen gallery is TWO releases behind** — the July 30 navigation pass and the whole of Aug 1. ⚠️ Aug 5 did **not** add to that backlog: that day was landing-page only and touched no app screen, and its landing changes are captured in the Aug 5 file above. The two items below are still the whole of it.

*From the navigation pass:* the six skeleton states are genuinely new UI and appear in no snapshot — five route shapes (roster, player detail, assign subtree, student home, log screen) plus celebrate's deliberate blank. They are transient, which is exactly why a static gallery is the only place they can be inspected side by side. Also unrepresented: the widened back-link tap targets (invisible in a static frame but a real layout change, since the header row is now 44px tall), and the `active:scale` tap feedback.

*From Aug 1, and this is the larger half:*
- **The entire notes feature** — the log screen's label/textarea/counter block, and the note line on **both** card lists. New UI on three screens with no frame anywhere.
- **Both log screen spacing passes.** Every vertical relationship on that screen moved: bar→label 32→44, label→stepper 20→12, stepper→hairline 24→20, hairline→MAKES 20→16, cluster→note 40→56, note→button 48→32.
- **Log screen typography** — the note label at `#8a8fa8`/500/15px and the placeholder at `#5a5f72`.
- **The button rename.** `Log it` appears **10 times** in the Jul 27 file.
- **The parent helper text**, still shown as two paragraphs on the add-student frame.
- **The roster activity sort** — the roster frames show a fixed order that no longer reflects how rows rank.

⚠️ **This is a regeneration, not a touch-up.** The log screen needs its frames redrawn rather than edited, and the note line touches every card frame in the gallery (70 phone frames total). Deliberately deferred: nothing depends on the gallery, and CLAUDE.md's own warning applies — a JS error in the macro layer blanks the whole page, so it wants a session with time to open it in a browser afterwards, not a late-night edit.

---

## Shipped-feature history

`CHANGELOG.md` at the repo root — a Feature / Why-it-exists table, oldest first, grouped by phase. **This file describes the app as it is now; CHANGELOG.md records how it got there.** Append a row there whenever something ships.

⚠️ It carries roughly **a dozen "Reason not recorded" rows**, nearly all from the Jul 11–15 build days — the email-OTP switch, the original scaffold, per-step signup routes, the landing page, yellow's retirement, side-on-assignments. Those are honest gaps, not placeholders: the reason was never written down anywhere. Worth filling in from memory in a future session while it is still recoverable.

---

## Session checklist

Before each Claude Code session, confirm:
- Which flow are we building today?
- What's the done-state for this session?
- Any design decisions to make before coding?
- Push to: local only / staging / prod?
- Are local, staging, and prod in sync? (`git log --oneline -5`)
