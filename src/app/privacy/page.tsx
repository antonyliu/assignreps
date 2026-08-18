import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy — Reps" };

/* ⚠️ #1a1a1a, NOT the brand blue #378add this used to be — an ACCESSIBILITY
   FIX, not a restyle. Measured on this page's own #f8f7f5 background:

     #378add  3.36:1   FAILS AA (normal text needs 4.5:1)
     #1a1a1a  16.26:1  passes comfortably

   The blue passes only under the WCAG large-text allowance, which requires
   >=18.66px AND bold. These headings are 17px/600 — neither. So the old value
   was failing at every heading on the page.

   Brought in line with /faq, which was built with measured values from the
   start and is the deliberate choice on this site. Size, weight and spacing are
   deliberately UNCHANGED — only the colour moved, because only the colour was
   the defect.

   ⚠️ /terms carried the same failure and was fixed the same way on Aug 17
   2026, finishing the pair. Both legal pages now match /faq. */
const heading: React.CSSProperties = { fontSize: "17px", fontWeight: 600, letterSpacing: "-0.2px", color: "#1a1a1a", marginTop: "22px", marginBottom: "5px" };
const body: React.CSSProperties = { fontSize: "15px", lineHeight: 1.55, color: "#333" };
const intro: React.CSSProperties = { ...body, marginTop: "18px", fontStyle: "italic", color: "#6b6b6b" };

export default function PrivacyPage() {
  return (
    <div className="paper-grain" style={{ backgroundColor: "#f8f7f5", minHeight: "100vh" }}>
      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 28px 80px", color: "#1a1a1a", fontFamily: "system-ui, sans-serif" }}>
        {/* ⚠️ #2a6fb5, the brand blue darkened until it passes — 4.86:1 here,
            against #378add's 3.36:1. Same value /faq uses for every link. */}
        <Link href="/" style={{ fontSize: "15px", color: "#2a6fb5", textDecoration: "underline", textUnderlineOffset: "3px" }}>← Back</Link>
        <h1 style={{ fontSize: "30px", fontWeight: 700, letterSpacing: "-0.5px", marginTop: "24px", marginBottom: "8px" }}>Privacy Policy</h1>
        {/* ⚠️ #6b6b6b, not #888. The old value measured 3.31:1 here — a FAIL, and
            the one contrast defect /privacy still carried after its headings
            were fixed. #6b6b6b is 4.98:1 and is what /faq uses for its own
            muted lines.

            ⚠️ The DATE is deliberately untouched by this pass. It bumps once,
            last, after every content change has landed — bumping it twice in a
            week is noise. */}
        <p style={{ fontSize: "14px", color: "#6b6b6b", marginBottom: "8px" }}>Last updated: July 17, 2026</p>

        <p style={intro}>
          Reps is a small product, built by one person. Here&apos;s exactly what we collect and why.
        </p>

        {/* ⚠️ Two omissions fixed here, both verified against the schema:

            1. `logs.note` — the short optional message a student writes with a
               log. Shipped Aug 1 and never disclosed. It is the ONLY free text a
               student writes anywhere in the product, and the student is often a
               minor, which makes it the most sensitive thing collected and the
               worst thing to have left off this list.

            2. The three billing columns on `coaches` — stripe_customer_id,
               stripe_subscription_id, subscription_status — added Aug 1.

            ⚠️ The card sentence is a real claim, not reassurance for its own
            sake: checkout is a hosted Stripe page, so card details never reach
            our servers or database. If that ever changes to an embedded form,
            this sentence has to go. */}
        <h2 style={heading}>What we collect</h2>
        <p style={body}>
          We collect your name, email address, and any student or parent phone numbers you add. We store the practice assignments you create, the rep logs your students submit, and the short note a student can leave with a log. If you subscribe, we store your Stripe customer and subscription IDs and whether your plan is active. Card details go straight to Stripe — we never see or store them.
        </p>

        {/* ⚠️ Two false statements were REMOVED from this paragraph on Aug 6
            2026, both verified against the code rather than assumed:

            1. "To send parents a weekly digest if you've added their number."
               DELETED OUTRIGHT, not reworded. No digest has ever been sent:
               there is no cron, no scheduled job, no vercel.json, and
               /src/app/api contains only stripe/. Before this edit, the ONLY
               occurrence of "digest" or "weekly" anywhere in src/ was this
               sentence describing itself.
               ⚠️ It goes back only when the feature actually ships — see the
               parent contact model in CLAUDE.md, which is still Decided-not-
               built. Do not restore it as an intention.

            2. "Students and parents receive SMS notifications via Twilio."
               Parents receive nothing. Both notify paths send only to
               players.phone — notify-assignment.ts says so in a comment at the
               send site — and parent_phone is written at add-student and read
               NOWHERE in the codebase.
               ⚠️ The replacement deliberately does NOT frame this as two
               recipient types. The schema has ONE phone field per student and
               the coach chooses whose number goes in it, so "students and
               parents" described a routing split that does not exist.

            ⚠️ "Reply STOP to opt out at any time." below is KEPT and is not the
            claim that was wrong. It states a capability, which is true. The
            false version — "Every SMS INCLUDES INSTRUCTIONS to reply STOP" —
            was a claim about message CONTENT and lived only in the SMS consent
            section, where it has been replaced.

            ⚠️ Dropping "via Twilio" here does not undisclose the processor:
            "Who we share it with" below still names Twilio explicitly, and the
            new SMS consent wording refers to "our messaging provider". */}
        <h2 style={heading}>How we use it</h2>
        <p style={body}>
          To send you a sign-in code. To send your students their assignment link via SMS. To show you your students&apos; progress. SMS goes to whichever phone number you add for each student — theirs or a parent&apos;s, whichever makes sense for that relationship. Reply STOP to opt out at any time. Message and data rates may apply.
        </p>

        {/* ⚠️ The STOP sentence here was FALSE and is the third fix of Aug 6
            2026. It read "Every SMS includes instructions to reply STOP to opt
            out at any time" — a claim about message CONTENT, and no message
            body contains STOP text.

            Verified, not assumed: there is exactly one composed body in the
            app — "Hey {name} — {coach} assigned you {activity} homework. Tap
            here: {link}" in notify-assignment.ts — and sendSms() appends
            nothing, posting only MessagingServiceSid, To and Body.

            The new wording claims a CAPABILITY instead, which is true: the
            number is toll-free and STOP handling is automatic at the
            Twilio/carrier layer regardless of what a message says. It cannot be
            disabled, so the claim does not depend on our copy staying in step.

            ⚠️ DO NOT "fix" this by adding literal STOP text to the SMS body in
            notify-assignment.ts. That is a separate compliance-posture decision
            and was explicitly out of scope for this pass. If it is ever done,
            this sentence can go back to describing content — but the capability
            wording stays true either way, so there is no need.

            ⚠️ "our messaging provider" rather than "Twilio" is deliberate — it
            keeps the sentence about the mechanism rather than the vendor, and
            "Who we share it with" already names Twilio outright. */}
        <h2 style={heading}>SMS consent</h2>
        <p style={body}>
          Before a coach adds any student or parent phone number to Reps, they must obtain verbal consent. The recipient must agree to receive SMS messages before their number is entered. You can reply STOP at any time to stop receiving messages — this happens automatically through our messaging provider, not something written into every text. Message and data rates may apply.
        </p>

        <h2 style={heading}>Who we share it with</h2>
        <p style={body}>
          We don&apos;t sell your data. We use Supabase (database), Twilio (SMS), Resend (email), and Stripe (payments) to operate the product.
        </p>

        {/* ⚠️ REWRITTEN Aug 17 2026. This section was one sentence — "You are
            responsible for having appropriate consent…" — which is a liability
            transfer to the COACH under a heading that promises minors. It never
            once addressed a parent, never said what is held about a child, and
            gave a parent nothing to do.

            ⚠️ It also leaned on an agreement that does not exist. Nothing in the
            signup flow links to or accepts /terms — no link, no checkbox — so
            "you are responsible" was addressed to someone who has never been
            shown the document making them responsible. That is a signup-flow
            problem, recorded separately in CLAUDE.md; the fix here is simply not
            to rest this section on it.

            Opens by addressing the parent, because they are who the heading
            implies and who most needs it. The coach's duty is still stated —
            demoted from being the whole section to a clause inside the sentence
            that explains how a number gets here.

            ⚠️ "their name", NOT "first name". The form's placeholder suggests a
            first name but the label is just "Name" and players.name is free
            text that takes whatever is typed. "First name" would be a claim
            about coach behaviour, not about the field.

            ⚠️ The parent deletion route is a REAL COMMITMENT, and the only new
            protection here rather than a rewording. Like the coach-facing
            promise above it, it is manual — and it is offered to people who have
            no other relationship with us, so it has to be honoured on request
            without asking who the coach is.

            Deliberately silent on age verification. There is none, and saying so
            invites a question rather than answering one; nothing here implies
            otherwise. Retention is covered by the deletion route above. */}
        <h2 style={heading}>Students and minors</h2>
        <p style={{ ...body, marginBottom: "10px" }}>
          If your child uses Reps, here&apos;s what that means.
        </p>
        <p style={{ ...body, marginBottom: "10px" }}>
          They don&apos;t have an account. A coach adds their name and one phone number — theirs or a parent&apos;s — after getting permission in person. We store the practice they&apos;re assigned, what they log, and any note they write with it.
        </p>
        <p style={body}>
          Parents: email <a href="mailto:hello@assignreps.com" style={{ color: "#2a6fb5", textDecoration: "underline" }}>hello@assignreps.com</a>{" "}to have your child&apos;s data removed. You don&apos;t need to go through the coach.
        </p>

        {/* ⚠️ Three separate accuracy fixes in this section.

            1. THE CASCADE, which no public page disclosed. players.assignments
               and players.logs are both ON DELETE CASCADE, so removing a student
               destroys every rep they ever logged. The in-app modal has always
               been honest about it; this page was silent, which glossed it by
               omission rather than by a false statement.

            2. DEACTIVATION as the deliberate contrast. It is the safe path in
               front of that destructive one, and saying so here is the whole
               reason a coach would choose it.

            3. THE PROMISE IS NOW HONEST ABOUT BEING MANUAL. It read "we'll
               remove your account and all associated data", which reads as an
               automated flow. There isn't one — account deletion is an unbuilt
               item and Tony does it by hand today. The claim was true only
               because someone would go and do it.
               ⚠️ If a real deletion flow ships, this qualifier comes out. */}
        <h2 style={heading}>Deleting your data</h2>
        <p style={{ ...body, marginBottom: "10px" }}>
          Email <a href="mailto:hello@assignreps.com" style={{ color: "#2a6fb5", textDecoration: "underline" }}>hello@assignreps.com</a>{" "}and we&apos;ll remove your account and everything in it. We do this by hand, so give us a few days.
        </p>
        <p style={{ ...body, marginBottom: "10px" }}>
          Removing a student from your roster deletes their assignments and logs too. That can&apos;t be undone.
        </p>
        <p style={body}>
          Deactivating a student is different: it pauses them and keeps everything. Going over your plan&apos;s limit only changes what you can do in the app — it never deletes anything.
        </p>
      </main>
    </div>
  );
}
