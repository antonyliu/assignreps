import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Send, CheckCircle, Layers } from "lucide-react";

export const metadata: Metadata = {
  // Resolves the relative og:image below to an absolute (canonical) URL.
  metadataBase: new URL("https://assignreps.com"),
  title: "Reps — Practice Homework App for Coaches & Instructors",
  description:
    "Assign practice homework to your students, they log it on their phone. Built for coaches and instructors.",
  openGraph: {
    title: "Reps — Practice Homework App for Coaches & Instructors",
    description:
      "Assign practice homework to your students, they log it on their phone. Built for coaches and instructors.",
    images: [
      {
        url: "/og-basketball.jpg",
        width: 1200,
        height: 630,
        alt: "A basketball player dribbling through cones on an outdoor court",
      },
    ],
  },
};

function TallyMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#378add" />
      <line x1="9"  y1="8" x2="9"  y2="24" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="14" y1="8" x2="14" y2="24" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="19" y1="8" x2="19" y2="24" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="24" y1="8" x2="24" y2="24" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="6"  y1="23" x2="27" y2="9"  stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

const bullets = [
  { icon: Send,        text: "Assign work in seconds" },
  { icon: CheckCircle, text: "Students log their progress" },
  { icon: Layers,      text: "Everything in one place" },
];

export default function LandingPage() {
  return (
    <div className="paper-grain" style={{ backgroundColor: "#ede9e3", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <header className="page-header">
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <TallyMark />
            <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px", color: "#0f0f10" }}>
              Reps
            </span>
          </div>
          <Link
            href="/instructor/signup/email"
            style={{ fontSize: "14px", fontWeight: 500, color: "#666", textDecoration: "underline", textUnderlineOffset: "3px" }}
            className="hover:text-[#0f0f10] transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="page-main" style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <div
          style={{ maxWidth: "1100px", margin: "0 auto", width: "100%" }}
          className="landing-inner"
        >

          {/* Mobile: stacked. Desktop: side by side */}
          <div className="landing-layout">

            {/* Image — left on desktop, top on mobile. Two overlapping circles. */}
            <div className="landing-image-wrap">
              <div className="hero-duo">
                <div className="hero-circle hero-circle-lg">
                  <Image
                    src="/basketball-hero.webp"
                    alt="Coach training a basketball player"
                    width={500}
                    height={500}
                    priority
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                  />
                </div>
                <div className="hero-circle hero-circle-sm">
                  <Image
                    src="/piano-hero.webp"
                    alt="Student practicing piano"
                    width={360}
                    height={360}
                    priority
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                  />
                </div>
              </div>
            </div>

            {/* Text — right on desktop */}
            <div className="landing-text">

              {/* Eyebrow */}
              <p className="eyebrow" style={{
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#2d7bc4",
              }}>
                For instructors &amp; coaches
              </p>

              {/* Headline */}
              <h1 className="headline" style={{
                fontWeight: 600,
                letterSpacing: "-0.5px",
                color: "#0f0f10",
              }}>
                The work continues<br />between sessions.
              </h1>

              {/* Bullets */}
              <ul className="bullets" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {bullets.map(({ icon: Icon, text }) => (
                  <li key={text} className="bullet-row">
                    <span className="bullet-icon-wrap" aria-hidden>
                      <Icon className="bullet-icon" color="#378add" />
                    </span>
                    <span className="bullet-text">{text}</span>
                  </li>
                ))}
              </ul>

              {/* CTAs */}
              <div className="cta-section" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                <Link
                  href="/instructor/signup"
                  style={{
                    display: "block",
                    backgroundColor: "#2d7bc4",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "16px",
                    letterSpacing: "-0.2px",
                    padding: "15px 36px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                  className="cta-primary hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  Get started free
                </Link>
                <Link
                  href="/student/login"
                  style={{ fontSize: "15px", fontWeight: 500, textDecoration: "underline", textUnderlineOffset: "3px" }}
                  className="student-link hover:opacity-80 transition-opacity"
                >
                  I&apos;m a student →
                </Link>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: "#e0dbd3", padding: "20px 28px 28px" }}>
        {/* Desktop: single line */}
        <div className="footer-desktop">
          <span style={{ color: "#555" }}>© 2026 Reps</span>
          <Link href="/privacy" style={{ color: "#378add", textDecoration: "underline" }}>Privacy Policy</Link>
          <Link href="/terms"   style={{ color: "#378add", textDecoration: "underline" }}>Terms of Service</Link>
          <span style={{ color: "#555" }}>Questions? <a href="mailto:hello@assignreps.com" style={{ color: "#378add", textDecoration: "underline" }}>hello@assignreps.com</a></span>
        </div>
        {/* Mobile: two lines */}
        <div className="footer-mobile">
          <div className="footer-line">
            <Link href="/privacy" style={{ color: "#378add", textDecoration: "underline" }}>Privacy Policy</Link>
            <span style={{ color: "#8a857c" }}>·</span>
            <Link href="/terms" style={{ color: "#378add", textDecoration: "underline" }}>Terms of Service</Link>
          </div>
          <div className="footer-line">
            <span style={{ color: "#555" }}>© 2026 Reps</span>
            <span style={{ color: "#8a857c" }}>·</span>
            <span style={{ color: "#555" }}>Questions? <a href="mailto:hello@assignreps.com" style={{ color: "#378add", textDecoration: "underline" }}>hello@assignreps.com</a></span>
          </div>
        </div>
      </footer>

      <style>{`
        .student-link, .student-link:visited { color: #378add; }
        .page-header { padding: 20px 22px 0; }
        .page-main   { padding: 6px 22px 20px; }
        .landing-layout {
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-items: center;
        }
        /* The whole hero cluster is derived from one explicit width. Sizing the
           circles with a percentage width + aspect-ratio (the obvious way) made
           them render as ovals on iOS Safari: they are absolutely positioned
           inside a parent whose own height also came from aspect-ratio, and
           Safari does not reliably resolve the missing axis for an abspos box
           in that case — the height fell back to stretch. Giving every circle an
           explicit, equal width AND height in px removes the inference entirely.
           aspect-ratio is kept only as a belt-and-braces guard. */
        .landing-image-wrap {
          --hero-w: 258px; /* 224 + 15%, mobile only */
          width: var(--hero-w);
          flex-shrink: 0;
        }
        .hero-duo {
          position: relative;
          width: var(--hero-w);
          height: calc(var(--hero-w) * 0.82);
        }
        .hero-circle {
          position: absolute;
          border-radius: 50%;
          overflow: hidden;
          box-sizing: border-box;
          border: 5px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .hero-circle > img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .hero-circle-lg {
          width:  calc(var(--hero-w) * 0.68);
          height: calc(var(--hero-w) * 0.68);
          aspect-ratio: 1;
          left: 0;
          top: 0;
        }
        .hero-circle-sm {
          width:  calc(var(--hero-w) * 0.46);
          height: calc(var(--hero-w) * 0.46);
          aspect-ratio: 1;
          right: 0;
          bottom: 0;
          z-index: 2;
        }
        .landing-text { width: 100%; }
        .cta-primary  { width: 100%; }

        /* Mobile type scale. Eyebrow, headline and bullet rows share the
           same left edge — no extra indent on any of them. */
        .eyebrow  { font-size: 13px; margin: 0 0 10px; }
        .headline { font-size: 37px; line-height: 1.14; margin: 0 0 18px; }
        .bullets  { margin-bottom: 24px !important; }
        .bullet-row {
          display: grid;
          grid-template-columns: 22px 1fr;
          column-gap: 12px;
          align-items: center;
          padding: 3px 0;
        }
        .bullet-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 25px; /* matches bullet-text line box, so icon centers on it */
        }
        .bullet-icon { width: 20px; height: 20px; }
        .bullet-text {
          font-size: 18px;
          line-height: 1.4;
          color: #1a1a1a;
          font-weight: 600;
          white-space: nowrap;
        }

        @media (min-width: 768px) {
          .page-header { padding: 24px 40px 0; }
          .page-main   { padding: 24px 40px 48px; }
          .landing-layout {
            flex-direction: row;
            gap: 80px;
            align-items: center;
          }
          .landing-image-wrap {
            --hero-w: 340px;
            flex: 0 0 var(--hero-w);
            width: var(--hero-w);
          }
          .landing-text { flex: 1; }
          .cta-primary  { width: auto; }
          .cta-section  { align-items: flex-start !important; }
          .eyebrow  { font-size: 14px; margin: 0 0 10px; }
          .headline { font-size: clamp(38px, 4.5vw, 56px); line-height: 1.1; margin: 0 0 24px; }
          .bullets  { margin-bottom: 36px !important; }
          .bullet-row {
            grid-template-columns: 24px 1fr;
            column-gap: 14px;
            padding: 5px 0;
          }
          .bullet-icon-wrap { height: 28px; }
          .bullet-icon { width: 22px; height: 22px; }
          .bullet-text  { font-size: 20px; }
        }
        .footer-desktop { display: none; }
        .footer-mobile {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .footer-line {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .footer-mobile a, .footer-mobile span {
          font-size: 13px !important;
          white-space: nowrap;
        }
        @media (min-width: 768px) {
          .footer-mobile { display: none; }
          .footer-desktop {
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            align-items: center;
            justify-content: center;
            gap: 12px;
            max-width: 1100px;
            margin: 0 auto;
          }
          .footer-desktop a, .footer-desktop span {
            font-size: 12px !important;
            white-space: nowrap;
          }
        }
        @media (min-width: 1024px) {
          .landing-image-wrap {
            --hero-w: 420px;
            flex: 0 0 var(--hero-w);
            width: var(--hero-w);
          }
        }
      `}</style>
    </div>
  );
}
