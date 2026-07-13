import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service — Reps" };

export default function TermsPage() {
  return (
    <main style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 28px 80px", color: "#1a1a1a", fontFamily: "system-ui, sans-serif" }}>
      <Link href="/" style={{ fontSize: "13px", color: "#888", textDecoration: "none" }}>← Back</Link>
      <h1 style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.5px", marginTop: "24px", marginBottom: "8px" }}>Terms of Service</h1>
      <p style={{ fontSize: "13px", color: "#999", marginBottom: "32px" }}>Last updated: January 2026</p>
      <p style={{ fontSize: "16px", lineHeight: 1.7, color: "#444" }}>
        This is a placeholder. Full terms of service will be published before Reps launches publicly.
      </p>
      <p style={{ fontSize: "16px", lineHeight: 1.7, color: "#444", marginTop: "16px" }}>
        Questions? Email <a href="mailto:hello@assignreps.com" style={{ color: "#b35510" }}>hello@assignreps.com</a>.
      </p>
    </main>
  );
}
