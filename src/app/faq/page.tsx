import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — Reps",
  description: "Common questions about Reps — what it does, what it costs, and what your students have to do.",
};

/* ---------- Shell, borrowed wholesale from /privacy and /terms ---------------
   Same paper-grain wrapper, same #f8f7f5 band, same 680px column, same back
   link and the same 30px/700 h1. Deliberately NOT a new layout: this page is
   the third member of that set structurally, even though its VOICE is closer to
   the landing page than to the legal pages — it is doing selling-adjacent work,
   so the answers are written the way a coach would be told them out loud.

   ⚠️ ONE deliberate departure from those two pages, and it is an accessibility
   fix rather than a style preference. /privacy and /terms set their headings
   and links in the brand blue #378add, which measures 3.36:1 on this #f8f7f5
   band — under the 4.5:1 AA needs for normal text, and passing only under the
   large-text allowance (>=18.66px AND bold), which 17px/600 headings and 15px
   links are not. Every value below is measured on this exact background:

     #1a1a1a  16.26:1   group headings, questions
     #333333  11.80:1   answers
     #2a6fb5   4.86:1   links (the brand blue darkened until it passes)
     #6b6b6b   4.98:1   the intro line and the closing line

   ⚠️ The existing failure on /privacy and /terms is NOT fixed here — those
   pages are explicitly out of scope for this pass. It is a real finding about
   them and is reported separately.                                          */

const heading: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "-0.3px",
  color: "#1a1a1a",
  marginTop: "44px",
  marginBottom: "6px",
  paddingBottom: "8px",
  borderBottom: "1px solid #e4e2de",
};
/* ⚠️ marginTop is the ONLY thing separating one Q/A pair from the next, and it
   is the same number that separates a group heading from its first question —
   both come from this one rule, which is what keeps the rhythm identical across
   all five groups.

   Raised 22px -> 32px on Aug 16 2026. At 22px the gap BETWEEN pairs was only
   5.5x the 4px gap INSIDE a pair, so the page read as one undifferentiated
   column of text rather than as discrete question/answer units. At 32px that
   ratio is 8x and the pairing is legible at a glance.

   ⚠️ Deliberately spacing, NOT a divider. A hairline above each question would
   compete with the borderBottom the group headings already carry, giving the
   page two competing horizontal rules at different strengths. */
const question: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 600,
  letterSpacing: "-0.1px",
  color: "#1a1a1a",
  marginTop: "32px",
  marginBottom: "4px",
};
/* ⚠️ `textWrap: pretty` is a measured fix applied page-wide, not a flourish.
   Sweeping 375/768/1024/1280 after the Aug 6 copy pass found FOUR one-word
   widows — "…up to 3 students, / forever.", "…only see their own / assignments.",
   "…without you / asking." at 375, and "…I read every message / myself." on the
   closing line at every width from ~736px up, where the column pins at 680px.

   ⚠️ Verified before applying: it clears all four and changes the line count of
   ZERO paragraphs. So it moves nothing — it only stops a last line stranding a
   single word. Where unsupported it degrades to normal wrapping, which is
   exactly the current behaviour, so there is no downside case.

   ⚠️ Three of the four are PRE-EXISTING, not caused by the copy pass: they sit
   in answers that pass did not touch. Worth knowing so this is not read as a
   fix for the new copy alone.

   Same family as the landing page's `text-wrap: balance` headline and its
   `pretty` testimonial quote — established here, not invented. */
const body: React.CSSProperties = { fontSize: "15px", lineHeight: 1.55, color: "#333", textWrap: "pretty" };
const link: React.CSSProperties = { color: "#2a6fb5", textDecoration: "underline", textUnderlineOffset: "3px" };
/* The page's two first-person lines — the subhead under the h1 and the closing
   line. Inherits `textWrap: pretty` from `body` above, which is what stops the
   closing line stranding "myself." on a line of its own at 768 and up. */
const intro: React.CSSProperties = { ...body, marginTop: "18px", color: "#6b6b6b" };

/* ⚠️ There is NO device mock on this page, and its absence is a decision.
   A 128px phone frame drawing the student's incoming SMS sat beside "Do they
   need to download anything?" for one session and was removed on Aug 6 2026:
   the answer is three words long and carries itself, and the frame was a sixth
   hand-drawn surface that nothing keeps in step with the app.

   ⚠️ Removing it took the page's ENTIRE stylesheet with it — every rule in the
   old <style href="faq"> block (.faq-answer-with-mock, .faq-answer-text,
   .faq-mock, .faq-phone, .faq-mock-caption and the 600px media query) existed
   only to lay the frame out beside the answer. The block is gone, not emptied,
   so this page is now pure inline styles exactly like /privacy and /terms.

   If a visual is ever wanted here, the right move is the one deliberately NOT
   taken: extract the landing page's primitives (T, CAST, MiniCard, MiniBar2,
   MiniStepper) out of page.tsx into a shared module and import them, rather
   than hand-drawing a second copy.                                          */

export default function FaqPage() {
  return (
    <div className="paper-grain" style={{ backgroundColor: "#f8f7f5", minHeight: "100vh" }}>
      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 28px 80px", color: "#1a1a1a", fontFamily: "system-ui, sans-serif" }}>
        <Link href="/" style={{ ...link, fontSize: "15px" }}>&larr; Back</Link>
        {/* ⚠️ Both values here are MEASURED, not taste.

            fontSize: at a flat 30px this wrapped to "Frequently asked /
            questions" at 375 — a one-word last line. Swept the mobile column
            (319px): 25px is the exact threshold, fitting on ONE line, and 26px
            is the first size that breaks. 6.6vw resolves to 24.75px at 375,
            just under it with margin to spare, and the 30px ceiling means every
            width from 768 up is unchanged.
            ⚠️ A clamp() rather than a media query on purpose — this page has no
            stylesheet at all (it was removed with the phone mock), and inline
            styles cannot express a breakpoint. Reintroducing a <style> block
            for one heading is not worth it.

            lineHeight: was inheriting 1.5 from the app's body rule — 45px for a
            30px heading, so the two-line h1 stood 90px tall. 1.2 is a heading
            line-height; body copy elsewhere on the page keeps 1.55. */}
        <h1 style={{ fontSize: "clamp(22px, 6.6vw, 30px)", lineHeight: 1.2, fontWeight: 700, letterSpacing: "-0.5px", marginTop: "24px", marginBottom: "8px" }}>
          Frequently asked questions
        </h1>

        {/* ⚠️ THE FIRST-PERSON REGISTER IS GONE as of this pass, and that is a
            reversal rather than a drift — worth knowing before writing any new
            copy here.

            For one pass this line read "The questions I get asked most… like
            I'd tell a friend" and the closing line read "I read every message
            myself". Those were the only two places a PERSON spoke, and the note
            that lived here recorded them as the page's register. Both are now
            product voice — this line names what the page covers, and the
            closing line says "Let us know".

            ⚠️ So: new answers stay in product voice. Do not reintroduce "I"
            into one line and leave the rest — the page reads consistently now
            and the singular/plural mix ("I read every message" vs "Let us
            know") is exactly what this resolved.

            ⚠️ The questions themselves still say "I" — "Do I need a card to
            start?", "How do I cancel?". That is the READER speaking and is a
            different thing entirely. It stays. */}
        <p style={intro}>
          Pricing, students, privacy, and everything else coaches ask before getting started.
        </p>

        {/* ---- The basics ------------------------------------------------- */}
        <h2 style={heading}>The basics</h2>

        <h3 style={question}>What sport does this work for?</h3>
        <p style={body}>
          Basketball today. Other sports are coming, but if you coach something else, Reps isn&apos;t built for you yet.
        </p>

        {/* ⚠️ Every claim here was checked against src/lib/exercises.ts, not
            written to sound generous:
              - "a full basketball library" — 30 exercises across 6 categories.
              - "shooting, ballhandling, conditioning" — all three are REAL
                category titles (Shooting, Ball-handling, Conditioning). The
                other three are Finishing, Footwork and Spot shots. Naming three
                of six is a sample, not a complete list, which is why the
                sentence does not say "all six" or count them.
              - "ready to assign right away" — true; the library is static and
                needs no setup of any kind before a coach can assign from it.
              - "You can add your own too" — true; custom_exercises is a real
                table with a real creation flow.

            ⚠️ "ballhandling" here is deliberately one word, where the app's own
            category label is "Ball-handling". This is marketing prose and reads
            better unhyphenated; do NOT "fix" it to match the app label, and do
            not change the app label to match this.

            ⚠️ ONE CAVEAT the answer does not state, and does not need to:
            custom exercise creation is currently only reachable from INSIDE the
            assign flow for a specific player — it is a standing Pending item
            that a coach cannot add to their library from anywhere else. The
            answer says a coach can add their own, which is true. If it ever
            grows into implying "manage your library" as a standalone thing,
            that reachability gap becomes a real overclaim.

            ⚠️ The ORDER is the locked product decision, not a stylistic choice:
            "Default exercise libraries are the product experience. Custom
            creation is the escape hatch." The default library leads and takes
            two sentences; custom follows as an aside. Do not flip these. */}
        <h3 style={question}>Do I have to build out all the drills myself?</h3>
        <p style={body}>
          No. It comes preloaded with a full basketball library — shooting, ballhandling, conditioning, all ready to assign right away. Want something specific to your program? You can add your own too.
        </p>

        <h3 style={question}>Do I need to already be tracking things some other way?</h3>
        <p style={body}>
          No. Most coaches get by however they can — a text, a note, a printed page. Reps replaces that with one place.
        </p>

        <h3 style={question}>How much time does this add to my week?</h3>
        <p style={body}>
          A few minutes to assign work. After that it runs itself — students log on their own, you check in when you want to.
        </p>

        {/* ---- Pricing ------------------------------------------------------
            ⚠️ Every figure here has to match the landing page's pricing cards
            and the in-app paywall in AddPlayerForm.tsx. Three surfaces, one
            promise, nothing linking them — change one and the other two move by
            hand. Today: free covers 3, Pro is $10/mo up to 30.

            ⚠️ "up to 30 students" is COPY ONLY. entitlement.ts defines
            FREE_STUDENT_LIMIT = 3 and no Pro ceiling of any kind, so nothing
            enforces 30 yet. This page repeats the claim the other two already
            make rather than inventing a new one. */}
        <h2 style={heading}>Pricing</h2>

        <h3 style={question}>Is it actually free, what&apos;s the catch?</h3>
        <p style={body}>
          No catch. Free covers up to 3 students, forever.
        </p>

        <h3 style={question}>What happens when I add a 4th student?</h3>
        <p style={body}>
          You&apos;re prompted to upgrade — $10/month, up to 30 students. See{" "}
          <Link href="/#pricing" style={link}>pricing</Link>.
        </p>

        {/* ⚠️ "nothing to enter" is VERIFIED, not assumed: signup is name ->
            instructor type -> email + 6-digit code, and that whole tree contains
            no billing code. Checkout is reachable only after signup, from the
            add-student gate or the profile menu. If a card ever enters the
            signup flow, this answer comes out. Same check the landing page's
            pricing sub carries. */}
        <h3 style={question}>Do I need a card to start?</h3>
        <p style={body}>
          No. Try it free and see for yourself if it&apos;s actually useful — nothing to enter, nothing to cancel if it&apos;s not for you.
        </p>

        {/* ⚠️⚠️ PENDING — THIS ANSWER DESCRIBES A FEATURE THAT DOES NOT EXIST.
            IT MUST NOT REACH REAL STRANGERS UNTIL THE FEATURE IS LIVE. ⚠️⚠️

            Treat this with the same seriousness as the landing page's
            unapproved testimonial: both are text that makes a claim the product
            cannot currently back up, and this one is a PROMISE ABOUT MONEY.

            Written deliberately ahead of the build, on Aug 6 2026, and REWORDED
            the same day — the flag stays because nothing about the build
            changed. The Stripe Customer Portal self-cancel flow is NOT built:

              - No portal session is created anywhere in src/. `billingPortal`
                and `createPortalSession` appear nowhere in the codebase.
              - The ProfileMenu offers Sign out, an editable name and a Pro
                badge. There is no billing row of any kind once a coach is Pro.
              - So there is nothing in "your profile" to cancel from. A coach
                who reads this answer today, goes looking, and finds nothing is
                a worse outcome than the honest version this replaced, which
                said "no button yet, just a real person, fast" and pointed at
                hello@assignreps.com.

            ⚠️ The current wording makes TWO claims, and the second one is new
            as of the reword — it now describes what happens to the time already
            paid for ("you'll keep everything you already paid for through the
            end of that period — it just won't renew after").

              1. "Cancel anytime from your profile" — UNBUILT, as above.
              2. The period-end behaviour — TRUE OF STRIPE BY DEFAULT, but only
                 if the eventual implementation cancels at period end
                 (`cancel_at_period_end: true`) rather than immediately. An
                 immediate cancellation would end access on the spot and make
                 this sentence false.

            ⚠️ So the copy now CONSTRAINS the build, not just anticipates it.
            Whoever wires up the portal has to configure it to cancel at period
            end, or change this sentence. Note the entitlement side already
            behaves correctly for (2): isEntitled() allows `active`, and Stripe
            keeps a subscription `active` until the period actually ends when
            cancel_at_period_end is set — so a coach who cancels keeps Pro until
            the date they paid through with no extra code. Nothing enforces the
            configuration, though.

            ⚠️ This is pre-launch checklist item 5, and item 5 is already flagged
            as "the item most likely to burn a stranger". Shipping this answer
            before the portal turns that from a missing feature into a broken
            promise.

            TWO WAYS TO CLEAR THIS, and one must happen before /faq is shown to
            anyone who is not RJ:
              (a) build the portal, cancelling at period end — then delete this
                  comment, not the answer;
              (b) revert the answer to the email version until (a) lands.

            ⚠️ Do NOT quietly resolve this by deciding the copy is "close
            enough". The pricing checklist already says "Cancel anytime" and
            /terms already says paid plans "can be cancelled anytime" — both are
            true of the Stripe subscription and neither is achievable through
            the product. This answer would be the third surface making that
            claim and the first one to name a specific place to do it. */}
        <h3 style={question}>How do I cancel?</h3>
        <p style={body}>
          Cancel anytime from your profile. You&apos;ll keep everything you already paid for through the end of that period — it just won&apos;t renew after.
        </p>

        {/* ---- Your students ---------------------------------------------- */}
        <h2 style={heading}>Your students</h2>

        {/* ⚠️ Text only. This answer briefly carried a phone mock beside it in
            a two-column flex wrapper; both the wrapper and the frame are gone —
            see the note at the top of this file. It is now an ordinary h3/p
            pair like every other answer on the page. */}
        <h3 style={question}>Do they need to download anything?</h3>
        <p style={body}>
          No. They get a text with a link. Tapping it opens their assignment right there — no app to install, nothing to set up first.
        </p>

        <h3 style={question}>What do they have to share?</h3>
        <p style={body}>
          Just a phone number. No account, no email.
        </p>

        {/* ⚠️ "no separate login to remember" is literally true and load-bearing
            — students never authenticate at all. They arrive on a token-
            addressed page; the pricing checklist says "No login for students"
            outright and section 3 of the landing page says the same. Do not
            soften this into anything that implies an optional account. */}
        <h3 style={question}>Will it feel like extra homework, more friction?</h3>
        <p style={body}>
          No. When you assign something, they get a text, tap it, and log what they did — that&apos;s the whole process. No new app, no separate login to remember.
        </p>

        {/* The feature behind this is logs.note — one OPTIONAL 100-char line
            per log, written on INSERT only. It is the single thing a student
            writes in the app. ⚠️ Do not let this answer drift into anything
            that sounds like messaging; "No chat here" is doing that work and
            has to stay first.

            ⚠️ ONE ACCURACY NOTE, flagged rather than silently edited because
            the wording was specified. "When they log, they leave you a real
            note" reads as though a note ALWAYS accompanies a log. It does not:
            `note` is nullable with no default, most logs genuinely carry none,
            and the card display rule exists precisely because of that — it
            shows the most recent log WITH a note rather than the latest log,
            so an earlier note is not blanked when a student logs again in
            silence. The previous wording ("they CAN leave you a short note")
            matched that shape exactly.

            Not a false claim about what the product does — the capability is
            real and unrestricted — but it is more confident than the data
            usually is. If a coach ever reads this and expects a note on every
            log, this sentence is why. */}
        <h3 style={question}>Can students message me back?</h3>
        <p style={body}>
          No chat here. But when they log, they leave you a real note — you see how it went, not just a checkbox. Coaching still happens in person; this keeps that thread alive in between sessions.
        </p>

        <h3 style={question}>What if a student doesn&apos;t have their own phone?</h3>
        <p style={body}>
          A parent&apos;s phone works, same link.
        </p>

        {/* ⚠️ REMOVED Aug 6 2026 — "Do I need permission to text a student or
            parent?", answered "If you already have that relationship — most
            coaches do — you're fine. Same trust, just one text instead of many."

            Recorded rather than silently dropped, because consent is NOT a
            non-issue here: /terms places the obligation squarely on the coach
            ("explicit verbal consent before adding any student or parent phone
            number"), /privacy says the same, and the Twilio toll-free
            registration depends on it. The old answer was softer than both
            documents it summarised. Removing it leaves the binding statement in
            one place instead of two that disagreed. If a consent question ever
            comes back here, it has to match /terms rather than reassure. */}

        {/* ---- Privacy and trust ------------------------------------------- */}
        <h2 style={heading}>Privacy and trust</h2>

        <h3 style={question}>Who sees my roster?</h3>
        <p style={body}>
          Only you. Students only see their own assignments.
        </p>

        {/* ⚠️ The "Want everything fully removed instead? Email us" sentence was
            dropped on purpose — the mechanics of full removal belong in /terms
            and /privacy, which both already carry them, not in a one-line FAQ
            answer that would become a third place to keep in step. */}
        <h3 style={question}>What happens to my data if I stop using Reps?</h3>
        <p style={body}>
          It stays yours — nothing is deleted without you asking.
        </p>

        <h3 style={question}>Do you sell or share data?</h3>
        <p style={body}>
          No. Never sold, never shared with advertisers. The full detail is in the{" "}
          <Link href="/privacy" style={link}>privacy policy</Link>.
        </p>

        {/* ---- A few more things ------------------------------------------- */}
        <h2 style={heading}>A few more things</h2>

        {/* ⚠️ "per person", not "per coach". The question now names coaches AND
            trainers — the same pair the landing eyebrow uses — so answering
            "one account per coach" would have quietly excluded half the people
            the question just addressed. */}
        <h3 style={question}>Can other coaches or trainers share my account?</h3>
        <p style={body}>
          Not yet — one account per person today.
        </p>

        <h3 style={question}>Does this replace texting my students?</h3>
        <p style={body}>
          No — just the homework-assignment part. You&apos;ll still text however you already do.
        </p>

        <h3 style={question}>Does it work on iPhone and Android?</h3>
        <p style={body}>
          Yes — it&apos;s just a link, works on any phone.
        </p>

        {/* ⚠️ There is deliberately NO "who's behind this / who built this"
            question here, and its absence is a decision rather than a gap. An
            origin-story answer is planned as a fast-follow once the product
            settles; a thin placeholder now would read worse than waiting. Do
            not add one. */}

        {/* Closing line, on its third wording. "Still stuck? … a real person
            reads it." framed the address as support of last resort; then an
            invitation for feedback in product voice; then a first-person
            version ending "I read every message myself".

            ⚠️ Back to product voice, and "us" rather than "I" — see the note
            under the h1. That earlier version made a standing commitment to a
            human answering personally, which is a promise that quietly expires
            the moment this address routes anywhere but one inbox. This wording
            invites the same thing and promises only that someone reads it. */}
        <p style={{ ...intro, marginTop: "44px" }}>
          Have an idea, or notice something missing? Let us know at <a href="mailto:hello@assignreps.com" style={link}>hello@assignreps.com</a>.
        </p>
      </main>
      {/* ⚠️ NO <style> block, and that is now correct rather than an omission.
          This page carried one solely to lay the removed phone mock out beside
          its answer; every rule in it was mock-specific and all of them went
          with the frame. The page is pure inline styles again, exactly like
          /privacy and /terms, and there is no page-level CSS to keep in step. */}
    </div>
  );
}
