import Link from "next/link";
import Image from "next/image";
import { Send, CheckCircle, TrendingUp } from "lucide-react";

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
  { icon: Send,        text: "Send assignments in seconds" },
  { icon: CheckCircle, text: "Students log their progress" },
  { icon: TrendingUp,  text: "See their progress anytime" },
];

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: "#ede9e3", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

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
            href="/coach"
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
                    src="/basketball-hero.png?v=2"
                    alt="Coach training a basketball player"
                    width={500}
                    height={500}
                    priority
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                  />
                </div>
                <div className="hero-circle hero-circle-sm">
                  <Image
                    src="/piano-hero.png?v=2"
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
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#2d7bc4",
                marginBottom: "24px",
              }}>
                For instructors &amp; coaches
              </p>

              {/* Headline */}
              <h1 className="headline" style={{
                fontSize: "clamp(48px, 7vw, 72px)",
                fontWeight: 600,
                letterSpacing: "-0.5px",
                lineHeight: 1.1,
                color: "#0f0f10",
                marginBottom: "20px",
              }}>
                Practice homework<br />for your students.
              </h1>

              {/* Bullets */}
              <ul className="bullets" style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {bullets.map(({ icon: Icon, text }) => (
                  <li key={text} style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                    <Icon size={18} color="#378add" style={{ flexShrink: 0 }} aria-hidden />
                    <span style={{ fontSize: "17px", lineHeight: 1.4, color: "#1a1a1a", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTAs */}
              <div className="cta-section" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                <Link
                  href="/coach"
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
                  href="/player/login"
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
        .page-header { padding: 20px 28px 0; }
        .page-main   { padding: 16px 28px 32px; }
        .landing-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
        }
        .landing-image-wrap {
          width: 260px;
          flex-shrink: 0;
        }
        .hero-duo {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 0.82;
        }
        .hero-circle {
          position: absolute;
          border-radius: 50%;
          overflow: hidden;
          box-sizing: border-box;
          border: 5px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .hero-circle-lg {
          width: 68%;
          aspect-ratio: 1 / 1;
          left: 0;
          top: 0;
        }
        .hero-circle-sm {
          width: 46%;
          aspect-ratio: 1 / 1;
          right: 0;
          bottom: 0;
          z-index: 2;
        }
        .landing-text { width: 100%; }
        .cta-primary  { width: 100%; }
        .eyebrow  { margin-bottom: 8px !important; }
        .headline { font-size: 32px !important; letter-spacing: -0.5px !important; line-height: 1.15 !important; margin-bottom: 20px !important; }
        .bullets  { margin-bottom: 36px !important; gap: 8px !important; }
        @media (min-width: 768px) {
          .page-header { padding: 24px 40px 0; }
          .page-main   { padding: 24px 40px 48px; }
          .landing-layout {
            flex-direction: row;
            gap: 80px;
            align-items: center;
          }
          .landing-image-wrap {
            flex: 0 0 340px;
            width: 340px;
          }
          .landing-text { flex: 1; }
          .cta-primary  { width: auto; }
          .cta-section  { align-items: flex-start !important; }
          .eyebrow  { margin-bottom: 8px !important; }
          .headline { font-size: clamp(38px, 4.5vw, 56px) !important; letter-spacing: -0.5px !important; line-height: 1.1 !important; margin-bottom: 22px !important; }
          .bullets  { margin-bottom: 36px !important; gap: 12px !important; }
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
            flex: 0 0 420px;
            width: 420px;
          }
        }
      `}</style>
    </div>
  );
}
