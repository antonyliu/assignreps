import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service — Reps" };

const heading: React.CSSProperties = { fontSize: "20px", fontWeight: 600, letterSpacing: "-0.3px", color: "#1a1a1a", marginTop: "32px", marginBottom: "8px" };
const body: React.CSSProperties = { fontSize: "18px", lineHeight: 1.75, color: "#333" };

export default function TermsPage() {
  return (
    <div style={{ backgroundColor: "#f8f7f5", minHeight: "100vh" }}>
      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 28px 80px", color: "#1a1a1a", fontFamily: "system-ui, sans-serif" }}>
        <Link href="/" style={{ fontSize: "15px", color: "#378add", textDecoration: "none" }}>← Back</Link>
        <h1 style={{ fontSize: "30px", fontWeight: 700, letterSpacing: "-0.5px", marginTop: "24px", marginBottom: "8px" }}>Terms of Service</h1>
        <p style={{ fontSize: "14px", color: "#888", marginBottom: "8px" }}>Last updated: July 14, 2026</p>

        <h2 style={heading}>What Reps is</h2>
        <p style={body}>
          Reps is a tool for instructors to assign practice homework and for students to log their progress.
        </p>

        <h2 style={heading}>Your responsibilities</h2>
        <p style={body}>
          You are responsible for getting consent before adding any student or parent contact information. You agree not to use Reps to contact people who haven&apos;t agreed to receive messages from you.
        </p>

        <h2 style={heading}>Payments</h2>
        <p style={body}>
          Reps offers a free tier. Paid plans are billed monthly and can be cancelled anytime.
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
          Email <a href="mailto:hello@assignreps.com" style={{ color: "#378add" }}>hello@assignreps.com</a>.
        </p>
      </main>
    </div>
  );
}
