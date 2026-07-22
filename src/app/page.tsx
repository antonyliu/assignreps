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
  { icon: CheckCircle, text: "Students log it from anywhere" },
  { icon: Layers,      text: "The work doesn't stop" },
];

/* ---------- The product-loop section ----------------------------------------
   Four miniature phones showing the real screens. Everything inside a phone is
   sized in `em` against the frame's own font-size, which is derived from its
   width (see .loop-phone in the stylesheet) — so one set of numbers renders
   correctly at 160px on desktop and at 80vw on mobile without a second scale.
   Colours are the shipped tokens from globals.css, not approximations.        */

const T = {
  bg: "#111318",
  card: "#1c1f26",
  raised: "#22252e",
  line: "#2a2d36",
  ink: "#e8eaf0",
  sub: "#8a8fa8",
  label: "#c8cdd8",
  blue: "#378add",
  green: "#3dd68c",
  // Was yellow; the app dropped yellow for in-progress, so the mock follows with
  // muted green. Named `progress` now — it's a bar fill, not a text/number colour
  // (the log counter, which needs legibility, uses `ink` instead).
  progress: "#27500a",
};

function MiniLogo() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3em" }}>
      <span
        style={{
          width: "0.85em",
          height: "0.85em",
          borderRadius: "0.22em",
          background: "#252830",
          display: "inline-block",
        }}
      />
      <span style={{ fontSize: "0.62em", fontWeight: 600, color: "#6a6a72" }}>Reps</span>
    </span>
  );
}

/* A progress bar. `pct` is 0-100, `color` a token. */
function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: "0.28em", borderRadius: "999px", background: T.line, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "999px" }} />
    </div>
  );
}

/* Student-home assignment card — mirrors the real tappable card. */
function MiniCard({
  name,
  right,
  pct,
  color,
  done,
}: {
  name: string;
  right: string;
  pct: number;
  color: string;
  done?: boolean;
}) {
  return (
    <div
      style={{
        background: "#161a20",
        border: `1px solid ${T.line}`,
        borderRadius: "0.62em",
        padding: "0.55em 0.62em",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.45em", gap: "0.4em" }}>
        <span style={{ fontSize: "0.74em", fontWeight: 500, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {name}
        </span>
        <span style={{ fontSize: "0.64em", color: done ? T.green : T.label, whiteSpace: "nowrap", flexShrink: 0 }}>
          {right}
        </span>
      </div>
      <MiniBar pct={pct} color={color} />
    </div>
  );
}

/* Roster row — avatar initial, name, status subline. Sits on its own card
   surface so the rows separate from the frame background. */
function MiniRow({ initial, name, sub }: { initial: string; name: string; sub: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.45em",
        padding: "0.4em 0.5em",
        background: T.card,
        border: `1px solid ${T.line}`,
        borderRadius: "0.55em",
      }}
    >
      <span
        style={{
          width: "1.35em",
          height: "1.35em",
          borderRadius: "999px",
          background: T.raised,
          color: T.label,
          fontSize: "0.62em",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {initial}
      </span>
      <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span style={{ fontSize: "0.74em", fontWeight: 500, color: T.ink }}>{name}</span>
        <span style={{ fontSize: "0.6em", color: T.label }}>{sub}</span>
      </span>
    </div>
  );
}

function MiniPill({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3em",
        background: bg,
        color,
        fontSize: "0.6em",
        fontWeight: 600,
        padding: "0.25em 0.55em",
        borderRadius: "999px",
      }}
    >
      <span style={{ width: "0.4em", height: "0.4em", borderRadius: "999px", background: color }} />
      {text}
    </span>
  );
}

/* 1 — the SMS. Copy is the real body from src/lib/notify-assignment.ts. */
function ScreenText() {
  return (
    <>
      {/* Opens like a real thread: who it's from, when it landed, the message,
          and a delivery receipt. Deliberately one-sided — Reps sends outbound
          SMS only and processes no replies, so no outgoing bubble. */}
      <div style={{ textAlign: "center", marginBottom: "1em" }}>
        <div
          style={{
            width: "2em",
            height: "2em",
            borderRadius: "999px",
            background: T.raised,
            color: T.label,
            fontSize: "0.7em",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 0.45em",
          }}
        >
          RJ
        </div>
        <div style={{ fontSize: "0.66em", fontWeight: 500, color: T.ink }}>Coach RJ</div>
      </div>
      <div style={{ fontSize: "0.54em", color: T.sub, textAlign: "center", marginBottom: "0.9em" }}>
        Today 4:12 PM
      </div>
      <div
        style={{
          alignSelf: "flex-start",
          maxWidth: "96%",
          background: T.raised,
          borderRadius: "1.15em",
          padding: "0.7em 0.85em",
          fontSize: "0.82em",
          lineHeight: 1.45,
          color: T.ink,
        }}
      >
        Hey Neo — Coach RJ assigned you basketball homework. Tap here:{" "}
        <span style={{ color: T.blue }}>assignreps.com/student/…</span>
      </div>
      <div style={{ alignSelf: "flex-start", fontSize: "0.5em", color: T.sub, margin: "0.45em 0 0 0.4em" }}>
        Delivered
      </div>
    </>
  );
}

/* 2 — student home, mid-week. */
function ScreenHome() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.4em" }}>
        <MiniLogo />
      </div>
      <div style={{ marginBottom: "1.1em" }}>
        <div style={{ fontSize: "1.4em", fontWeight: 600, letterSpacing: "-0.5px", color: T.ink }}>Neo</div>
        <div style={{ fontSize: "0.64em", color: T.label, marginTop: "0.15em" }}>Coach RJ&apos;s assignments</div>
      </div>
      <div style={{ fontSize: "0.58em", fontWeight: 600, letterSpacing: "1px", color: T.sub, marginBottom: "0.7em" }}>
        ASSIGNMENTS
      </div>
      {/* One of each state, top to bottom: finished, underway, untouched. */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.45em" }}>
        <MiniCard name="Form shooting" right="✓ Done"  pct={100} color={T.green} done />
        <MiniCard name="Crossovers"    right="3/5 min" pct={60}  color={T.progress} />
        <MiniCard name="Box-outs"      right="0/20"    pct={0}   color={T.line} />
      </div>
    </>
  );
}

/* 3 — the counter. Presets are the real ones for a 50-rep target. */
function ScreenLog() {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5em", marginBottom: "1.6em" }}>
        <span style={{ fontSize: "0.8em", color: T.sub }}>←</span>
        <span style={{ fontSize: "0.64em", fontWeight: 500, color: T.sub }}>Log reps</span>
      </div>
      <div style={{ textAlign: "center", marginBottom: "1.4em" }}>
        <div style={{ fontSize: "0.7em", color: T.label, marginBottom: "0.5em" }}>Form shooting</div>
        <div style={{ fontSize: "3em", fontWeight: 600, letterSpacing: "-1px", lineHeight: 1, color: T.ink }}>30</div>
        <div style={{ fontSize: "0.64em", color: T.label, marginTop: "0.45em" }}>of 50 reps</div>
      </div>
      <div style={{ marginBottom: "1.4em" }}>
        <MiniBar pct={60} color={T.progress} />
      </div>
      <div style={{ display: "flex", gap: "0.4em" }}>
        {["+10", "+25", "+50"].map((p) => (
          <span
            key={p}
            style={{
              flex: 1,
              textAlign: "center",
              background: T.card,
              border: `1px solid ${T.line}`,
              borderRadius: "0.5em",
              padding: "0.45em 0",
              fontSize: "0.66em",
              fontWeight: 500,
              color: T.ink,
            }}
          >
            {p}
          </span>
        ))}
      </div>
      <div style={{ marginTop: "auto" }}>
        <div
          style={{
            background: T.blue,
            color: "#fff",
            textAlign: "center",
            borderRadius: "0.5em",
            padding: "0.55em 0",
            fontSize: "0.72em",
            fontWeight: 600,
          }}
        >
          Log it
        </div>
      </div>
    </>
  );
}

/* 4 — the coach's roster, grouped by completion. */
function ScreenRoster() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9em" }}>
        <MiniLogo />
        <span style={{ fontSize: "0.62em", fontWeight: 500, color: T.sub }}>Coach RJ</span>
      </div>
      <div style={{ fontSize: "1.4em", fontWeight: 600, letterSpacing: "-0.5px", color: T.ink, marginBottom: "0.65em" }}>
        Your players
      </div>
      {/* One student per state. Spacing is tight because three groups plus their
          pills only just clear the 9/16 mobile frame. */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.55em" }}>
        <div>
          <div style={{ marginBottom: "0.3em" }}>
            <MiniPill text="Done" color={T.green} bg="rgba(61,214,140,0.12)" />
          </div>
          <MiniRow initial="N" name="Neo" sub="3 of 3 done" />
        </div>
        <div>
          <div style={{ marginBottom: "0.3em" }}>
            {/* Readable mid-green, mirroring the real roster's in-progress pill. */}
            <MiniPill text="In progress" color="#5aa22f" bg="rgba(39,80,10,0.18)" />
          </div>
          <MiniRow initial="J" name="Jordan" sub="1 of 3 done" />
        </div>
        <div>
          <div style={{ marginBottom: "0.3em" }}>
            <MiniPill text="Not started" color={T.sub} bg="rgba(90,95,114,0.1)" />
          </div>
          <MiniRow initial="S" name="Sofia" sub="2 assignments waiting" />
        </div>
      </div>
    </>
  );
}

const loopSteps = [
  { caption: "They get a link",     screen: <ScreenText /> },
  { caption: "They see their work", screen: <ScreenHome /> },
  { caption: "They log it",         screen: <ScreenLog /> },
  { caption: "You see it's done",   screen: <ScreenRoster /> },
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
      {/* No flex:1 — the hero is content-height now. minHeight:100vh stays on the
          page wrapper so a short viewport still shows the warm background rather
          than the dark body colour below the footer; it no longer stretches the
          hero, because this element doesn't grow into that space. */}
      <main className="page-main" style={{ display: "flex", alignItems: "center" }}>
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
                Keep students working<br />between sessions.
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
                  Try Reps free
                </Link>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Product loop — four miniature screens, dark band under the hero */}
      <section className="loop-section">
        <h2 className="loop-heading">Here&apos;s how it works.</h2>
        <p className="loop-subline">Students get a link. They log it. You see it.</p>
        <div className="loop-track">
          {loopSteps.map(({ caption, screen }) => (
            <div className="loop-item" key={caption}>
              {/* The frames are illustration — the caption carries the meaning,
                  so screen-readers get the caption and skip the duplicated UI. */}
              <div className="loop-phone" aria-hidden="true">
                {screen}
              </div>
              <p className="loop-caption">{caption}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      {/* Shares #1a1d24 with the loop section, so a 1px rule is what separates
          them — without it the two bands merge and the footer reads as part of
          the section. Greys and links are the dark-background set: #555 /
          #2d7bc4 were tuned for cream and go muddy here. */}
      <footer style={{ backgroundColor: "#1a1d24", borderTop: "1px solid #2a2d36", padding: "20px 28px 28px" }}>
        {/* Desktop: single line */}
        <div className="footer-desktop">
          <span style={{ color: "#8a8fa8" }}>© 2026 Reps</span>
          <Link href="/privacy" style={{ color: "#378add", textDecoration: "underline" }}>Privacy Policy</Link>
          <Link href="/terms"   style={{ color: "#378add", textDecoration: "underline" }}>Terms of Service</Link>
          <span style={{ color: "#8a8fa8" }}>Questions? <a href="mailto:hello@assignreps.com" style={{ color: "#378add", textDecoration: "underline" }}>hello@assignreps.com</a></span>
        </div>
        {/* Mobile: two lines */}
        <div className="footer-mobile">
          <div className="footer-line">
            <Link href="/privacy" style={{ color: "#378add", textDecoration: "underline" }}>Privacy Policy</Link>
            <span style={{ color: "#52576a" }}>·</span>
            <Link href="/terms" style={{ color: "#378add", textDecoration: "underline" }}>Terms of Service</Link>
          </div>
          <div className="footer-line">
            <span style={{ color: "#8a8fa8" }}>© 2026 Reps</span>
            <span style={{ color: "#52576a" }}>·</span>
            <span style={{ color: "#8a8fa8" }}>Questions? <a href="mailto:hello@assignreps.com" style={{ color: "#378add", textDecoration: "underline" }}>hello@assignreps.com</a></span>
          </div>
        </div>
      </footer>

      {/* href + precedence make React 19 hoist this into <head> as a managed,
          render-blocking stylesheet — so the landing's own styles apply on
          first paint (fixing Safari's unstyled flash) instead of loading late
          from the end of <body>. Rules are unchanged. */}
      <style href="landing" precedence="default">{`
        .page-header { padding: 20px 22px 0; }
        .page-main   { padding: 48px 22px 24px; }
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
        .headline { font-size: 32px; line-height: 1.14; margin: 0 0 18px; }
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
          .page-main   { padding: 80px 40px 60px; }
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
        /* ---- Product loop ---- */
        /* Mobile runs tight — the hero, the heading and the row sit close
           together; desktop reopens the spacing further down. */
        .loop-section {
          background: #1a1d24;
          padding: 40px 0 44px;
        }
        .loop-heading {
          margin: 0 auto 10px;
          padding: 0 22px;
          text-align: center;
          color: #ffffff;
          /* Stays under the hero headline (32px on mobile) so the hero keeps
             the page's largest type; desktop reopens to 32px. */
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }
        .loop-subline {
          margin: 0 auto 40px;
          padding: 0 22px;
          text-align: center;
          font-size: 18px;
          line-height: 1.4;
          color: #a8adc0;
        }
        .loop-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        /* One width drives everything: the frame, and — via font-size — every
           type and spacing value inside it, which are all authored in em. */
        .loop-phone {
          --pw: 160px;
          width: var(--pw);
          font-size: calc(var(--pw) / 13);
          aspect-ratio: 9 / 19;
          flex-shrink: 0;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          padding: 1.1em 0.9em;
          background: #111318;
          border: 1px solid #2a2d36;
          border-radius: 28px;
          overflow: hidden;
        }
        .loop-caption {
          margin: 14px 0 0;
          text-align: center;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.4;
          color: #c8cdd8;
          white-space: nowrap;
        }

        /* Mobile: one phone per screen, snapped. */
        .loop-track {
          display: flex;
          gap: 24px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 0 22px 4px;
          /* Without this a snapped frame sits flush to the screen edge and
             loses the 22px gutter the first one has. */
          scroll-padding-left: 22px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .loop-track::-webkit-scrollbar { display: none; }
        .loop-item { scroll-snap-align: start; flex: 0 0 auto; }
        /* Capped so a frame doesn't swallow the viewport — at 390px this is
           240px, leaving the next frame peeking in to signal the row scrolls. */
        .loop-phone { --pw: min(80vw, 240px); }

        /* Desktop: the row spans the hero's container exactly. Rather than
           spreading four fixed frames apart (which would open ~100px gaps), the
           frames themselves grow to absorb the width, so the row stays tight at
           16px while its outer edges land on the hero's. The width has to be an
           explicit length — not a flex basis — because each phone's em scale is
           derived from it, hence the calc rather than flex: 1.
             container = min(1100, 100vw - 80)   [hero content box]
             frame     = (container - 3 * 16px gaps) / 4                      */
        @media (min-width: 768px) {
          .loop-section { padding: 80px 0; }
          .loop-heading { font-size: 32px; }
          .loop-track {
            max-width: 1180px;
            margin: 0 auto;
            justify-content: center;
            gap: 16px;
            overflow-x: visible;
            scroll-snap-type: none;
            padding: 0 40px;
          }
          .loop-phone { --pw: calc((min(1100px, 100vw - 80px) - 48px) / 4); }
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
