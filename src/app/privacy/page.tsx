import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy — Reps" };

const heading: React.CSSProperties = { fontSize: "17px", fontWeight: 600, letterSpacing: "-0.2px", color: "#378add", marginTop: "22px", marginBottom: "5px" };
const body: React.CSSProperties = { fontSize: "15px", lineHeight: 1.55, color: "#333" };
const intro: React.CSSProperties = { ...body, marginTop: "18px", fontStyle: "italic", color: "#6b6b6b" };

export default function PrivacyPage() {
  return (
    <div className="paper-grain" style={{ backgroundColor: "#f8f7f5", minHeight: "100vh" }}>
      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 28px 80px", color: "#1a1a1a", fontFamily: "system-ui, sans-serif" }}>
        <Link href="/" style={{ fontSize: "15px", color: "#378add", textDecoration: "underline", textUnderlineOffset: "3px" }}>← Back</Link>
        <h1 style={{ fontSize: "30px", fontWeight: 700, letterSpacing: "-0.5px", marginTop: "24px", marginBottom: "8px" }}>Privacy Policy</h1>
        <p style={{ fontSize: "14px", color: "#888", marginBottom: "8px" }}>Last updated: July 17, 2026</p>

        <p style={intro}>
          Reps is a small product, built by one person. Here&apos;s exactly what we collect and why.
        </p>

        <h2 style={heading}>What we collect</h2>
        <p style={body}>
          We collect your name, email address, and any student or parent phone numbers you add. We also store the practice assignments you create and the rep logs your students submit.
        </p>

        <h2 style={heading}>How we use it</h2>
        <p style={body}>
          To send you a sign-in code. To send your students their assignment link via SMS. To send parents a weekly digest if you&apos;ve added their number. To show you your students&apos; progress. Students and parents receive SMS notifications via Twilio. Reply STOP to opt out at any time. Message and data rates may apply.
        </p>

        <h2 style={heading}>SMS consent</h2>
        <p style={body}>
          Before a coach adds any student or parent phone number to Reps, they must obtain verbal consent. The recipient must agree to receive SMS messages before their number is entered. Every SMS includes instructions to reply STOP to opt out at any time. Message and data rates may apply.
        </p>

        <h2 style={heading}>Who we share it with</h2>
        <p style={body}>
          We don&apos;t sell your data. We use Supabase (database), Twilio (SMS), and Resend (email) to operate the product.
        </p>

        <h2 style={heading}>Students and minors</h2>
        <p style={body}>
          You are responsible for having appropriate consent before adding any student or parent contact information to Reps.
        </p>

        <h2 style={heading}>Deleting your data</h2>
        <p style={body}>
          Email <a href="mailto:hello@assignreps.com" style={{ color: "#378add", textDecoration: "underline" }}>hello@assignreps.com</a>{" "}and we&apos;ll remove your account and all associated data.
        </p>
      </main>
    </div>
  );
}
