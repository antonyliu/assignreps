import Link from "next/link";
import type { Metadata } from "next";
import { SMS_CONSENT_SCRIPT } from "@/lib/consent";

export const metadata: Metadata = { title: "Terms of Service — Reps" };

/* ⚠️ #1a1a1a, NOT the brand blue #378add this used to be — an ACCESSIBILITY
   FIX, not a restyle. Measured on this page's own #f8f7f5 background:

     #378add  3.36:1   FAILS AA (normal text needs 4.5:1)
     #1a1a1a  16.26:1  passes comfortably

   The blue passes only under the WCAG large-text allowance, which needs
   >=18.66px AND bold. These headings are 17px/600 — neither. So the old value
   was failing at every heading on the page.

   /privacy was fixed first (f92097c) and this is the same change, finishing the
   pair. Both now match /faq, which was built with measured values from the
   start. Size, weight and spacing are deliberately UNCHANGED — only the colour
   moved, because only the colour was the defect. */
const heading: React.CSSProperties = { fontSize: "17px", fontWeight: 600, letterSpacing: "-0.2px", color: "#1a1a1a", marginTop: "22px", marginBottom: "5px" };
const body: React.CSSProperties = { fontSize: "15px", lineHeight: 1.55, color: "#333" };

export default function TermsPage() {
  return (
    <div className="paper-grain" style={{ backgroundColor: "#f8f7f5", minHeight: "100vh" }}>
      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 28px 80px", color: "#1a1a1a", fontFamily: "system-ui, sans-serif" }}>
        {/* ⚠️ #2a6fb5, the brand blue darkened until it passes — 4.86:1 here,
            against #378add's 3.36:1. Same value /faq and /privacy use. */}
        <Link href="/" style={{ fontSize: "15px", color: "#2a6fb5", textDecoration: "underline", textUnderlineOffset: "3px" }}>← Back</Link>
        <h1 style={{ fontSize: "30px", fontWeight: 700, letterSpacing: "-0.5px", marginTop: "24px", marginBottom: "8px" }}>Terms of Service</h1>
        {/* ⚠️ #6b6b6b, not #888. The old value measured 3.31:1 here — a FAIL, and
            the one contrast defect /privacy still carried after its headings
            were fixed. #6b6b6b is 4.98:1 and is what /faq uses for its own
            muted lines.

            The DATE was bumped once, last, on Aug 17 2026 — after the accuracy
            fixes, the minors rewrite and the contrast pass had all landed.
            ⚠️ It moves again only when the CONTENT changes, not when styling
            does. */}
        <p style={{ fontSize: "14px", color: "#6b6b6b", marginBottom: "8px" }}>Last updated: August 17, 2026</p>

        <h2 style={heading}>What Reps is</h2>
        <p style={body}>
          Reps is a tool for coaches and trainers to assign practice homework, and for students to log their progress.
        </p>

        <h2 style={heading}>Your responsibilities</h2>
        <p style={{ ...body, marginBottom: "10px" }}>
          You are responsible for obtaining explicit verbal consent before adding any student or parent phone number to Reps.
        </p>
        <p style={{ ...body, marginBottom: "10px" }}>
          Before entering a phone number you must confirm with the recipient: &ldquo;{SMS_CONSENT_SCRIPT}&rdquo;
        </p>
        <p style={body}>
          You agree not to add phone numbers of anyone who has not verbally agreed to receive messages. Recipients can reply STOP at any time to opt out.
        </p>

        {/* ⚠️ The over-limit sentence lives HERE rather than in /privacy, and the
            split is deliberate: terms covers what you can DO, privacy covers
            what happens to your DATA. /privacy carries the matching "nothing is
            deleted" reassurance, so neither page repeats the other. */}
        <h2 style={heading}>Payments</h2>
        <p style={body}>
          Reps offers a free tier. Paid plans are billed monthly and can be cancelled anytime. If you have more active students than your plan allows, you can&apos;t assign new work until you&apos;re back within it.
        </p>

        <h2 style={heading}>Availability</h2>
        <p style={body}>
          We do our best to keep Reps running reliably. We&apos;re not liable for outages or data loss.
        </p>

        <h2 style={heading}>Termination</h2>
        <p style={body}>
          We can suspend accounts that violate these terms.
        </p>

        <h2 style={heading}>Questions?</h2>
        <p style={body}>
          Email <a href="mailto:hello@assignreps.com" style={{ color: "#2a6fb5", textDecoration: "underline" }}>hello@assignreps.com</a>.
        </p>
      </main>
    </div>
  );
}
