import type { Metadata } from "next";
import Link from "next/link";
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

// ⚠️ These name the MECHANISM, not the feeling, and that is the point of the
// wording. The previous set — "Assign it in seconds" / "Students log it from
// anywhere" / "You see it happen live" — described outcomes but never said what
// "it" was or why "live" mattered, so a first-time reader could not repeat back
// what Reps does. This set walks the actual loop: assign -> text -> log ->
// certainty, so a stranger can explain the product to someone else after one
// read.
//
// ⚠️ `.bullet-text` is `white-space: nowrap`, so these never wrap — they widen
// the layout instead. `.landing-text` is `flex: 1` with the default
// `min-width: auto`, so the longest bullet sets a MIN-CONTENT FLOOR for the
// whole text column: it cannot shrink below that, and the page scrolls
// sideways rather than the line breaking.
//
// Measured slack on the longest ("You know exactly what got done"):
//   375px  270px text in a 297px box — 27px spare
//   768px  295px text in a 295px box — 0px spare, and the page overflows 25px
//   820px+ comfortable
//
// ⚠️ The 768px overflow is PRE-EXISTING, not introduced here: the old copy
// overflowed 5px at that width too. This copy is ~20px wider at 20px type, so
// it deepens 5px -> 25px and widens the affected band from ~768-772 to
// ~768-793. Everything at 790px+ and every mobile width is clean.
//
// The fix, if it is ever wanted, is to drop `white-space: nowrap` — the bullets
// would then wrap only in the pinched band and render identically everywhere
// else. Not done here because the hero is locked against visual changes.
const bullets = [
  { icon: Send,        text: "Assign homework to a student" },
  { icon: CheckCircle, text: "They get a text, log it there" },
  { icon: Layers,      text: "You know exactly what got done" },
];

/* ---------- The product-loop section ----------------------------------------
   Four miniature phones showing the real screens. Everything inside a phone is
   sized in `em` against the frame's own font-size, which is derived from its
   width (see .loop-phone in the stylesheet) — so one set of numbers renders
   correctly at 160px on desktop and at 80vw on mobile without a second scale.
   Colours are the shipped tokens from globals.css, not approximations.        */

const T = {
  // ⚠️ These two are NOT the app's tokens and must not be "corrected" into them.
  // The app's real background is --reps-bg #080b0f and its ink is --reps-ink
  // #ffffff. A phone frame on this page sits on cream, where true near-black
  // reads as a hole punched in the page, and pure-white 12px text on it glares.
  // #111318 and #e8eaf0 are deliberate landing-page values — see the loop band
  // note in CLAUDE.md, which sets #1c1f26 lighter than these frames on purpose.
  bg: "#111318",
  ink: "#e8eaf0",
  // The rest DO match the app exactly, so they read from the tokens instead of
  // being copied as hex — the same call already made for the greens below, and
  // one less surface to re-match by hand when the palette moves.
  card: "var(--reps-card)",
  raised: "var(--reps-raised)",
  line: "var(--reps-line)",
  sub: "var(--reps-sub)",
  label: "var(--reps-label)",
  blue: "var(--reps-orange)",
  // The app's two greens, and they are not interchangeable. `attempts` fills the
  // muted layer of a two-tone bar and colours the ATTEMPTS label and number;
  // `green` (makes/done) fills the bright layer and every completion state.
  // These were a single #27500a, which the app retired — see the colour system
  // in CLAUDE.md. Matching them matters because the two-tone bar is the whole
  // point of frames 3 and 4: two shades stacked, meaning two different figures.
  //
  // Read from the tokens rather than copied as hex, so these mocks follow the
  // app's greens automatically. Every consumer here is an inline style, so the
  // var() resolves normally. One less surface to re-match by hand — the standing
  // hazard with hand-drawn frames.
  attempts: "var(--reps-green-muted)",
  green: "var(--reps-green)",
};

/* A progress bar. `pct` is 0-100, `color` a token. */
function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: "0.28em", borderRadius: "999px", background: T.line, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "999px" }} />
    </div>
  );
}

/* The two-tone bar, and the reason this section exists: muted attempts
   underneath, bright makes on top, so one bar carries two figures. The app
   stacks these as absolutely-positioned layers on a `reps` goal with makes
   tracked; here they are nested, which renders identically at this size.
   `makesPct` is always <= `pct` — you cannot make more than you take. */
function MiniBar2({ pct, makesPct }: { pct: number; makesPct: number }) {
  return (
    <div style={{ height: "0.28em", borderRadius: "999px", background: T.line, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: T.attempts, borderRadius: "999px" }}>
        <div
          style={{
            width: pct > 0 ? `${(makesPct / pct) * 100}%` : "0%",
            height: "100%",
            background: T.green,
            borderRadius: "999px",
          }}
        />
      </div>
    </div>
  );
}

/* One stepper control: the round −/+ buttons flanking a number, as on the log
   screen. `numberColor` carries the label/number pairing rule — attempts go
   muted only when a MAKES row shares the screen. */
function MiniStepper({
  label,
  value,
  size,
  numberColor,
}: {
  label: string;
  value: string;
  size: string;
  numberColor: string;
}) {
  const btn = {
    width: "1.5em",
    height: "1.5em",
    borderRadius: "999px",
    background: T.line,
    color: T.ink,
    fontSize: "0.7em",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as const;
  return (
    <div>
      <div style={{ fontSize: "0.56em", fontWeight: 600, letterSpacing: "1px", color: numberColor, marginBottom: "0.3em" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6em" }}>
        <span style={btn}>−</span>
        <span style={{ fontSize: size, fontWeight: 600, lineHeight: 1, color: numberColor, minWidth: "1.6em", textAlign: "center" }}>
          {value}
        </span>
        <span style={btn}>+</span>
      </div>
    </div>
  );
}

/* The "Track makes?" switch. Its own control because it is the one thing on the
   assign screen that decides whether frame 4 ever gets a percentage. */
function MiniToggle({ on }: { on?: boolean }) {
  return (
    <span
      style={{
        width: "1.7em",
        height: "1em",
        borderRadius: "999px",
        background: on ? T.blue : T.line,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: on ? "flex-end" : "flex-start",
        padding: "0.11em",
        flexShrink: 0,
      }}
    >
      <span style={{ width: "0.78em", height: "0.78em", borderRadius: "999px", background: "#fff" }} />
    </span>
  );
}

/* A selectable chip — the goal selector and the preset row on the assign
   screen. Selected takes the blue accent; the rest stay on the card surface. */
function MiniChip({ text, on }: { text: string; on?: boolean }) {
  return (
    <span
      style={{
        flex: 1,
        textAlign: "center",
        background: on ? "rgba(55,138,221,0.14)" : T.card,
        border: `1px solid ${on ? T.blue : T.line}`,
        borderRadius: "0.5em",
        padding: "0.4em 0",
        fontSize: "0.6em",
        fontWeight: on ? 600 : 500,
        color: on ? T.blue : T.label,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

/* Assignment card — the same shape on the coach's student detail and the
   student's home. `made` renders the "made X/Y · Z%" line the coach reads as
   the receipt; supplying it also switches the bar to two-tone, because the two
   always travel together in the app. */
function MiniCard({
  name,
  right,
  pct,
  color,
  made,
  makesPct,
  done,
  note,
}: {
  name: string;
  right: string;
  pct: number;
  color?: string;
  made?: string;
  makesPct?: number;
  done?: boolean;
  /** The student's own line to the coach. Renders last, under the bar. */
  note?: string;
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: made ? "0.25em" : "0.45em", gap: "0.4em" }}>
        <span style={{ fontSize: "0.74em", fontWeight: 500, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {name}
        </span>
        <span style={{ fontSize: "0.64em", color: done ? T.green : T.label, whiteSpace: "nowrap", flexShrink: 0 }}>
          {right}
        </span>
      </div>
      {made && (
        <div style={{ fontSize: "0.58em", color: T.green, marginBottom: "0.4em" }}>{made}</div>
      )}
      {makesPct === undefined ? (
        <MiniBar pct={pct} color={color ?? T.attempts} />
      ) : (
        <MiniBar2 pct={pct} makesPct={makesPct} />
      )}
      {/* The note sits LAST, below the bar, exactly as the real card builds it —
          a hairline, then the student's words in dim italic inside curly quotes.
          No label and no icon: the quotes say who is speaking, where a "NOTE:"
          prefix would make the card read as a form. A card without one is
          byte-identical to before, which is why adding it changes no layout. */}
      {note && (
        <div
          style={{
            borderTop: `1px solid ${T.line}`,
            marginTop: "0.45em",
            paddingTop: "0.4em",
            fontSize: "0.56em",
            fontStyle: "italic",
            lineHeight: 1.35,
            color: T.sub,
          }}
        >
          &ldquo;{note}&rdquo;
        </div>
      )}
    </div>
  );
}

/* 1 — the coach assigning, with a MAKES goal. Mirrors CountScreen: goal first,
   because it decides what the number under it means. "How many makes?" is the
   real label for that goal; the presets are the real GOAL_PRESETS for makes
   (10/25/50/100), not the category's rep counts. */
function ScreenAssign() {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5em", marginBottom: "1.1em" }}>
        <span style={{ fontSize: "0.8em", color: T.sub }}>←</span>
        <span style={{ fontSize: "0.64em", fontWeight: 500, color: T.ink }}>Corner 3s</span>
      </div>

      <div style={{ fontSize: "0.6em", fontWeight: 500, color: T.label, marginBottom: "0.4em" }}>Goal</div>
      <div style={{ display: "flex", gap: "0.35em", marginBottom: "0.95em" }}>
        <MiniChip text="Attempts" on />
        <MiniChip text="Makes" />
        <MiniChip text="In a row" />
      </div>

      <div style={{ fontSize: "0.6em", fontWeight: 500, color: T.label, marginBottom: "0.4em" }}>How many?</div>
      <div style={{ display: "flex", gap: "0.35em", marginBottom: "0.95em" }}>
        <MiniChip text="25" />
        <MiniChip text="50" on />
        <MiniChip text="100" />
        <MiniChip text="200" />
      </div>

      {/* The toggle only renders on an attempts goal, and only where the
          category has something to make — shooting qualifies. It is what makes
          frame 4's percentage possible. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5em",
          marginBottom: "0.95em",
        }}
      >
        <span style={{ fontSize: "0.6em", fontWeight: 500, color: T.ink }}>Track makes?</span>
        <MiniToggle on />
      </div>

      {/* Side is offered for every library exercise except a short list — Corner
          3s qualifies, Free throws would not. Nothing is selected by default. */}
      <div style={{ fontSize: "0.6em", fontWeight: 500, color: T.label, marginBottom: "0.4em" }}>Side</div>
      <div style={{ display: "flex", gap: "0.35em" }}>
        <MiniChip text="Left" />
        <MiniChip text="Right" />
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
          Send to Jalen
        </div>
      </div>
    </>
  );
}

/* 2 — the SMS thread. Both bodies are real, verbatim from the code:
     yesterday  src/app/instructor/student/[id]/actions.ts  (Resend link)
     today      src/lib/notify-assignment.ts                (assignment sent)
   The null-instructor_type branch is used for today's, so no sport is named.

   ⚠️ The two differ by one word — "work" vs "homework" — because NEITHER
   template names the exercise. There is no body in this codebase that says what
   was assigned, so a thread cannot show "Free throws yesterday, Corner 3s
   today" without inventing a message the app never sends. If the frame needs
   visibly distinct messages, the fix is upstream: put the exercise in the SMS.

   The thread fills from the bottom, the way a messages app stacks off its input
   bar, and there is no inbound bubble — Reps sends outbound SMS only, with no
   webhook or handler for replies anywhere in the codebase. */
function ScreenText() {
  const bubble = {
    maxWidth: "96%",
    background: T.raised,
    borderRadius: "1.15em",
    padding: "0.62em 0.8em",
    fontSize: "0.72em",
    lineHeight: 1.45,
    color: T.ink,
  } as const;
  const receipt = { fontSize: "0.48em", color: T.sub, margin: "0.35em 0 0 0.4em" } as const;
  const stamp = { fontSize: "0.52em", color: T.sub, textAlign: "center", marginBottom: "0.7em" } as const;
  return (
    <>
      <div style={{ textAlign: "center" }}>
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
          CM
        </div>
        <div style={{ fontSize: "0.66em", fontWeight: 500, color: T.ink }}>Coach Mike</div>
      </div>

      {/* Top-aligned, not pushed to the foot. These frames draw no compose
          bar, so bottom-anchored bubbles sit against a bare edge with nothing
          to rest on and read as unmoored — the stack needs the header above it
          to anchor to instead. */}
      <div>
        <div style={{ ...stamp, marginTop: "1em" }}>Yesterday 5:02 PM</div>
        <div style={bubble}>
          Hey Jalen — Coach Mike assigned you work. Tap here:{" "}
          <span style={{ color: T.blue }}>assignreps.com/student/…</span>
        </div>
        <div style={receipt}>Delivered</div>

        <div style={{ ...stamp, marginTop: "0.9em" }}>Today 4:12 PM</div>
        <div style={bubble}>
          Hey Jalen — Coach Mike assigned you homework. Tap here:{" "}
          <span style={{ color: T.blue }}>assignreps.com/student/…</span>
        </div>
        <div style={receipt}>Delivered</div>
      </div>
    </>
  );
}

/* 3 — the log screen as it ships today: a stepper, not the +10/+25/+50 presets
   that were retired. ATTEMPTS is the muted green precisely because a MAKES row is
   on screen with it — a solo counter would take the bright green outright. */
function ScreenLog() {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5em", marginBottom: "1em" }}>
        <span style={{ fontSize: "0.8em", color: T.sub }}>←</span>
        <span style={{ fontSize: "0.64em", fontWeight: 500, color: T.ink }}>Corner 3s</span>
      </div>

      <div style={{ fontSize: "0.58em", color: T.label, marginBottom: "0.45em" }}>50 of 50 done</div>
      <div style={{ marginBottom: "1.5em" }}>
        <MiniBar2 pct={100} makesPct={56} />
      </div>

      <div style={{ textAlign: "center", marginBottom: "1em" }}>
        <MiniStepper label="ATTEMPTS" value="50" size="2.1em" numberColor={T.attempts} />
      </div>

      <div style={{ height: "1px", background: T.line, marginBottom: "0.8em" }} />
      <div style={{ textAlign: "center" }}>
        <MiniStepper label="MAKES" value="28" size="1.1em" numberColor={T.green} />
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
          Log progress
        </div>
      </div>
    </>
  );
}

/* 4 — the coach's student detail, which is where "made X/Y · Z%" actually
   lives. The roster shows status groups but carries no percentage and no bar
   (progress bars on roster rows are still unbuilt), so this is the only screen
   that can honestly show the coach receiving the makes figure. */
function ScreenDetail() {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5em", marginBottom: "1.1em" }}>
        <span style={{ fontSize: "0.8em", color: T.sub }}>←</span>
        <span style={{ fontSize: "0.62em", fontWeight: 500, color: T.sub }}>Players</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5em", marginBottom: "1.2em" }}>
        <span
          style={{
            width: "1.9em",
            height: "1.9em",
            borderRadius: "999px",
            background: T.raised,
            color: T.label,
            fontSize: "0.7em",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          J
        </span>
        <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span style={{ fontSize: "1.05em", fontWeight: 600, letterSpacing: "-0.3px", color: T.ink }}>Jalen</span>
          <span style={{ fontSize: "0.56em", color: T.sub }}>Joined 1 month ago</span>
        </span>
      </div>

      <div style={{ fontSize: "0.58em", fontWeight: 600, letterSpacing: "1px", color: T.sub, marginBottom: "0.7em" }}>
        ASSIGNMENTS
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.45em" }}>
        {/* The receipt: attempts full, makes at 90%, and the line that names it. */}
        <MiniCard name="Corner 3s" right="✓ Done" made="made 28/50 · 56%" pct={100} makesPct={56} done />
        <MiniCard name="Mid-range jumpers" right="18/50" pct={36} />
        <MiniCard name="Free throws" right="0/50" pct={0} />
      </div>

      {/* The real screen pins this to the bottom and swaps the label on state:
          filled "+ Assign new work" once everything is done, outlined
          "+ Assign more" while anything is outstanding — which is the case here,
          with two of the three unfinished. */}
      <div style={{ marginTop: "auto" }}>
        <div
          style={{
            border: `1px solid ${T.blue}`,
            color: T.blue,
            textAlign: "center",
            borderRadius: "0.5em",
            padding: "0.5em 0",
            fontSize: "0.68em",
            fontWeight: 600,
          }}
        >
          + Assign more
        </div>
      </div>
    </>
  );
}

/* ---------- The hero device ------------------------------------------------
   The coach's student-detail screen, and deliberately that one rather than the
   roster. It is the only screen in the app where all three things the hero
   claims are simultaneously true and REAL: progress bars including the two-tone
   makes bar, a completed assignment, and a student's own note. The roster shows
   none of those — its rows are avatar, first name, subline, timestamp, chevron,
   and progress bars on roster rows are not built. Drawing a note on a roster row
   would be inventing UI, which is precisely what the "Example: basketball"
   caption further down this page exists to avoid.

   It is also the payoff screen, which is what the third bullet now promises:
   "You see it happen live."

   ⚠️ Every name here is invented. Real rosters are real children, and this page
   is public. Do not paste in anything from `rj_players`.

   Shares the loop section's primitives and its em-scaling: every size is in `em`
   against the frame's own font-size, which is derived from its width, so one set
   of numbers renders at 178px on mobile and 280px on desktop.               */
function ScreenHeroDetail() {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5em", marginBottom: "1em" }}>
        <span style={{ fontSize: "0.8em", color: T.sub }}>←</span>
        <span style={{ fontSize: "0.62em", fontWeight: 500, color: T.sub }}>Players</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5em", marginBottom: "1.05em" }}>
        <span
          style={{
            width: "1.9em",
            height: "1.9em",
            borderRadius: "999px",
            background: T.raised,
            color: T.label,
            fontSize: "0.7em",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          M
        </span>
        <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span style={{ fontSize: "1.05em", fontWeight: 600, letterSpacing: "-0.3px", color: T.ink }}>Maya</span>
          <span style={{ fontSize: "0.56em", color: T.sub }}>Last logged 2h ago</span>
        </span>
      </div>

      <div style={{ fontSize: "0.58em", fontWeight: 600, letterSpacing: "1px", color: T.sub, marginBottom: "0.7em" }}>
        ASSIGNMENTS
      </div>

      {/* Three states on purpose: finished with makes recorded, underway with a
          note, and untouched. A hero showing three green ✓ would be claiming a
          product nobody's students ever fall behind in. */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.45em" }}>
        <MiniCard name="Corner 3s · Left" right="✓ Done" made="made 28/50 · 56%" pct={100} makesPct={56} done />
        <MiniCard name="Mid-range jumpers" right="18/50" pct={36} note="Felt way better today." />
        <MiniCard name="Free throws" right="0/50" pct={0} />
      </div>

      <div style={{ marginTop: "auto" }}>
        <div
          style={{
            border: `1px solid ${T.blue}`,
            color: T.blue,
            textAlign: "center",
            borderRadius: "0.5em",
            padding: "0.5em 0",
            fontSize: "0.68em",
            fontWeight: 600,
          }}
        >
          + Assign more
        </div>
      </div>
    </>
  );
}

const loopSteps = [
  { caption: "You assign it",   screen: <ScreenAssign /> },
  { caption: "They get a text", screen: <ScreenText /> },
  { caption: "They log it",     screen: <ScreenLog /> },
  { caption: "You see it",      screen: <ScreenDetail /> },
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

            {/* Image — left on desktop, top on mobile. A single device showing
                the coach's student-detail screen, replacing the two-circle photo
                collage. Hand-drawn from the loop section's own primitives rather
                than a screenshot: a screenshot of the real app would put real
                students' names on a public page, and would need 2x/3x assets to
                stay crisp where drawn text is sharp at any density. */}
            <div className="landing-image-wrap">
              <div className="hero-device-wrap">
                {/* Warm ambient glow. Sits BEHIND the device and is pure
                    decoration, so the dark UI itself stays exactly the shipped
                    colour — the softening happens around it, never on it. */}
                <div className="hero-glow" aria-hidden="true" />
                <div className="hero-device" aria-hidden="true">
                  <ScreenHeroDetail />
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
                For instructors
              </p>

              {/* Headline */}
              <h1 className="headline" style={{
                fontWeight: 600,
                letterSpacing: "-0.5px",
                color: "#0f0f10",
              }}>
                The work doesn&apos;t stop when the session does.
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
                  Start free
                </Link>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Product loop — four miniature screens, dark band under the hero */}
      <section className="loop-section">
        <h2 className="loop-heading">Here&apos;s how it works.</h2>
        {/* The rest of the page is activity-agnostic — the hero photographs span
            a court and a piano, and the SMS says "homework" with no sport — but
            these four frames are unavoidably basketball: real exercise names,
            real shooting percentages. This says so, rather than letting the
            section quietly narrow the product to one sport.

            Deliberately no claim about other activities. `activityTypes.ts` has
            Basketball as the only ACTIVE entry; the other nine are listed but
            not selectable, so "works for any sport" would break at the signup
            picker one screen later. */}
        <p className="loop-example">Example: basketball</p>
        <div className="loop-track">
          {loopSteps.map(({ caption, screen }, i) => (
            <div className="loop-item" key={caption}>
              {/* The frames are illustration — the caption carries the meaning,
                  so screen-readers get the caption and skip the duplicated UI. */}
              <div className="loop-phone" aria-hidden="true">
                {screen}
              </div>
              <p className="loop-caption">{i + 1}. {caption}</p>
            </div>
          ))}
        </div>

      </section>

      {/* Footer */}
      {/* Its own band now: #1a1d24 sits a step lighter than the loop section's
          #111318, with a 1px rule on top. The two used to share one colour, so
          the rule was carrying the separation alone and the footer read as the
          tail of the section. Lighter-on-darker separates without a hard edge.
          Greys and links are the dark-background set: #555 / #2d7bc4 were tuned
          for cream and go muddy here. */}
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
        /* ---- Hero device ---------------------------------------------------
           Same em-scaling contract as .loop-phone: font-size is derived from the
           frame's own width, and everything inside ScreenHeroDetail is sized in
           em, so one set of numbers renders correctly at every breakpoint
           without a second scale or a transform.

           ⚠️ The device is capped by WIDTH at each breakpoint rather than being
           a percentage of --hero-w. A 9/18 frame is far taller than the circle
           cluster it replaces, and on mobile — where the hero stacks — every
           pixel of device height pushes "Start free" further past the fold.
           Mobile therefore gets both a narrower frame and a shorter ratio. */
        .hero-device-wrap {
          position: relative;
          display: flex;
          justify-content: center;
        }
        /* Warm ambient glow, behind the device and purely decorative.
           ⚠️ Deliberately NOT a black shadow. Black on #ede9e3 greys the cream
           and makes the device read as a hole punched in the page. This is the
           background's own family pushed darker and warmer, so the device sits
           ON the page rather than in front of it. The dark UI inside is
           untouched — the softening happens entirely around it. */
        .hero-glow {
          position: absolute;
          inset: -12% -22%;
          z-index: 0;
          pointer-events: none;
          background: radial-gradient(
            ellipse at 50% 48%,
            rgba(150, 118, 82, 0.30) 0%,
            rgba(150, 118, 82, 0.13) 42%,
            rgba(150, 118, 82, 0) 72%
          );
          filter: blur(16px);
        }
        .hero-device {
          --pw: 172px;
          position: relative;
          z-index: 1;
          width: var(--pw);
          font-size: calc(var(--pw) / 13);
          aspect-ratio: 9 / 17.5;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          padding: 1.1em 0.9em;
          background: #111318;
          border: 1px solid #2a2d36;
          border-radius: 26px;
          overflow: hidden;
          /* Two layers, both warm-tinted rather than black: a tight contact
             shadow that seats the device, and a wide soft ambient one. */
          box-shadow:
            0 2px 6px rgba(60, 45, 30, 0.07),
            0 18px 50px -12px rgba(90, 70, 45, 0.24);
        }
        .landing-text { width: 100%; }
        .cta-primary  { width: 100%; }

        /* Mobile type scale. Eyebrow, headline and bullet rows share the
           same left edge — no extra indent on any of them. */
        .eyebrow  { font-size: 13px; margin: 0 0 10px; }
        /* ⚠️ text-wrap: balance replaces the literal <br /> this headline used
           to carry. A hard break fixes one width and produces a widow at every
           other; balance evens the lines out at whatever width the viewport
           happens to be. Browsers without support fall back to ordinary
           wrapping, which is what removing the <br /> gives anyway.

           Removing the break is necessary but NOT sufficient — natural wrapping
           still strands words. Measured at 900px: plain wrapping gives
           "The work doesn't stop / when the session / does." with "does." alone
           on the last line; balance gives "The work doesn't / stop when the /
           session does." with no widow. */
        .headline { font-size: 32px; line-height: 1.14; margin: 0 0 18px; text-wrap: balance; }
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

        /* ⚠️ SHORT viewports, not narrow ones. A 375x812 phone fits the hero
           comfortably; a 375x667 (SE-class) does not, because the device is
           ~120px taller than the circle cluster it replaced and that pushed
           "Start free" 81px below the fold. Keyed on max-height so tall
           phones keep the full-size device and only genuinely short screens
           pay. The headline and the stack gap give up a little as well, so the
           device does not absorb the whole deficit and shrink past legibility. */
        @media (max-width: 767px) and (max-height: 700px) {
          /* ⚠️ Narrowing the frame does NOT stop the screen inside overflowing
             it. Both the frame height and the content scale off --pw, so width
             cancels out: fitting is purely a question of the ASPECT RATIO
             against the content's height in em. Shortening 9/17.5 to 9/15 at
             the same width clipped "+ Assign more" straight off the bottom.
             So the ratio only shortens to what the content actually needs
             (~9/16.4 with the trimmed padding below), and the height comes down
             by narrowing instead. */
          .hero-device {
            --pw: 140px;
            aspect-ratio: 9 / 16.4;
            padding: 0.85em 0.8em;
            border-radius: 22px;
          }
          .headline { font-size: 28px; }
          .landing-layout { gap: 10px; }
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
          /* Side-by-side from here, so the device's height stops competing with
             the CTA and it can take its full ratio. */
          .hero-device {
            --pw: 236px;
            aspect-ratio: 9 / 19;
            border-radius: 30px;
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
          /* --reps-card (#1c1f26), the app's surface token — the colour cards
             sit ON in the product. Used here for the same reason: the band is
             the surface, the phones are the objects on it, so the surface has to
             be the lighter of the two. It previously matched the frames' own
             #111318 exactly, which left a 1px border doing all the separating
             and made the frames sink into the band. Inverting it mirrors the
             hero, where dark photographs sit on cream. */
          background: #1c1f26;
          padding: 40px 0 44px;
          /* The page is a 100vh flex column. When the content is shorter than the
             viewport the slack used to fall through to the cream body colour
             below the footer; growing this band absorbs it, so the dark runs to
             the bottom edge. No effect once the content is taller than 100vh. */
          flex: 1 0 auto;
        }
        .loop-heading {
          /* The example caption below now carries the bulk of the gap down to
             the frames; this is just the tight lead into it. */
          margin: 0 auto 8px;
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
        /* The old subline is gone — it restated the four captions word for word,
           so the section said the same thing twice. What sits here now is a
           different thing: a caption naming what the frames depict, not a
           restatement of them. */
        /* A caption, not a subhead: --reps-sub (#8a8fa8), the app's muted-text
           token, at 13px against the heading's 24px. It sits tight under the
           heading and owns the remaining space down to the frames, so the total
           heading-to-frames distance stays where it was before the line existed. */
        .loop-example {
          margin: 0 auto 30px;
          padding: 0 22px;
          text-align: center;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.4;
          color: #8a8fa8;
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
        /* The captions carry the section's meaning now that the subline is gone,
           so they read as labels rather than footnotes: white instead of the
           muted #c8cdd8, 17px instead of 15px (19px on desktop, below the 32px
           heading so the hierarchy still holds), and numbered so the four frames
           read as an ordered sequence rather than four unrelated screens.
           There is no type scale in this file — every size here is a literal px
           with a desktop bump — so these follow the same pattern. */
        .loop-caption {
          margin: 14px 0 0;
          text-align: center;
          font-size: 17px;
          font-weight: 600;
          line-height: 1.4;
          color: #ffffff;
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
          .loop-caption { font-size: 19px; }
          .loop-heading { margin: 0 auto 10px; }
          .loop-example { margin: 0 auto 34px; font-size: 14px; }
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
          .hero-device { --pw: 268px; }
        }
      `}</style>
    </div>
  );
}
