import Link from "next/link";
import Image from "next/image";

function TallyMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#ff7a3d" />
      <line x1="9"  y1="8" x2="9"  y2="24" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="14" y1="8" x2="14" y2="24" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="19" y1="8" x2="19" y2="24" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="24" y1="8" x2="24" y2="24" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="6"  y1="23" x2="27" y2="9"  stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

const bullets = [
  "Assign drills to any player in seconds",
  "Players log reps on their own phone",
  "You see exactly what got done",
];

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: "#f8f7f5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

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
            style={{ fontSize: "14px", fontWeight: 500, color: "#666", textDecoration: "none" }}
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

            {/* Image — left on desktop, top on mobile */}
            <div className="landing-image-wrap">
              <div
                style={{
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "5px solid #ede9e3",
                  width: "100%",
                  maxWidth: "400px",
                  aspectRatio: "1",
                  margin: "0 auto",
                }}
              >
                <Image
                  src="/hero.png"
                  alt="Basketball player training"
                  width={400}
                  height={400}
                  priority
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                />
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
                color: "#ff7a3d",
                marginBottom: "24px",
              }}>
                For basketball coaches
              </p>

              {/* Headline */}
              <h1 className="headline" style={{
                fontSize: "clamp(48px, 7vw, 72px)",
                fontWeight: 800,
                letterSpacing: "-3px",
                lineHeight: 0.97,
                color: "#0f0f10",
                marginBottom: "20px",
              }}>
                Basketball<br/>homework.
              </h1>

              {/* Bullets */}
              <ul className="bullets" style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {bullets.map((b) => (
                  <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: "13px" }}>
                    <span style={{
                      flexShrink: 0,
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      backgroundColor: "#ff7a3d",
                      marginTop: "7px",
                    }} />
                    <span style={{ fontSize: "16px", lineHeight: 1.5, color: "#1a1a1a", fontWeight: 600 }}>
                      {b}
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
                    backgroundColor: "#e86e2e",
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
                  Get started
                </Link>
                <Link
                  href="/player/login"
                  style={{ fontSize: "15px", color: "#b35510", fontWeight: 500, textDecoration: "underline", textUnderlineOffset: "3px" }}
                  className="hover:opacity-80 transition-opacity"
                >
                  I&apos;m a player →
                </Link>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e8e4df", padding: "20px 28px 28px" }}>
        <div className="footer-inner">
          <span style={{ color: "#aaa", fontSize: "12px" }}>© 2026 Reps</span>
          <Link href="/privacy" style={{ color: "#aaa", fontSize: "12px", textDecoration: "none" }} className="hover:text-[#555] transition-colors">Privacy Policy</Link>
          <Link href="/terms"   style={{ color: "#aaa", fontSize: "12px", textDecoration: "none" }} className="hover:text-[#555] transition-colors">Terms of Service</Link>
          <a href="mailto:hello@assignreps.com" style={{ color: "#aaa", fontSize: "12px", textDecoration: "none" }} className="hover:text-[#555] transition-colors">hello@assignreps.com</a>
        </div>
      </footer>

      <style>{`
        .page-header { padding: 20px 28px 0; }
        .page-main   { padding: 16px 28px 32px; }
        .landing-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
        }
        .landing-image-wrap {
          width: 220px;
          flex-shrink: 0;
        }
        .landing-text { width: 100%; }
        .cta-primary  { width: 100%; }
        .eyebrow  { margin-bottom: 8px !important; }
        .headline { font-size: 52px !important; margin-bottom: 20px !important; }
        .bullets  { margin-bottom: 36px !important; gap: 13px !important; }
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
          .headline { font-size: clamp(48px, 7vw, 72px) !important; margin-bottom: 22px !important; }
          .bullets  { margin-bottom: 40px !important; gap: 14px !important; }
        }
        .footer-inner {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          max-width: 1100px;
          margin: 0 auto;
        }
        @media (min-width: 768px) {
          .footer-inner {
            flex-direction: row;
            align-items: center;
            gap: 28px;
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
