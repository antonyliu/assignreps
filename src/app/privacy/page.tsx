import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy — Reps" };

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: "#f8f7f5", minHeight: "100vh" }}>
      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 28px 80px", color: "#1a1a1a", fontFamily: "system-ui, sans-serif" }}>
        <Link href="/" style={{ fontSize: "15px", color: "#378add", textDecoration: "none" }}>← Back</Link>
        <h1 style={{ fontSize: "30px", fontWeight: 700, letterSpacing: "-0.5px", marginTop: "24px", marginBottom: "8px" }}>Privacy Policy</h1>
        <p style={{ fontSize: "14px", color: "#888", marginBottom: "32px" }}>Last updated: January 2026</p>
        <p style={{ fontSize: "18px", lineHeight: 1.75, color: "#333" }}>
          This is a placeholder. A full privacy policy will be published before Reps launches publicly.
        </p>
        <p style={{ fontSize: "18px", lineHeight: 1.75, color: "#333", marginTop: "16px" }}>
          Questions? Email <a href="mailto:hello@assignreps.com" style={{ color: "#378add" }}>hello@assignreps.com</a>.
        </p>
      </main>
    </div>
  );
}
