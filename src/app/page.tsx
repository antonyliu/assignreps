import type { Metadata } from "next";
import Link from "next/link";
import { Send, CheckCircle, Layers, Check } from "lucide-react";

export const metadata: Metadata = {
  // Resolves the relative og:image below to an absolute (canonical) URL.
  metadataBase: new URL("https://assignreps.com"),
  // ⚠️ "Trainers", not "Instructors" (Aug 5 2026). This pairing has to stay in
  // step with the hero eyebrow, which reads "For coaches & trainers" — the two
  // were briefly divergent and it is not a difference worth carrying.
  // ⚠️ The same title is duplicated in src/app/layout.tsx as the fallback for
  // routes that set none. Change both or neither.
  title: "Reps — Practice Homework App for Coaches & Trainers",
  description:
    "Assign practice homework to your students, they log it on their phone. Built for coaches and trainers.",
  openGraph: {
    title: "Reps — Practice Homework App for Coaches & Trainers",
    description:
      "Assign practice homework to your students, they log it on their phone. Built for coaches and trainers.",
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
// Slack on the longest of the three ("You know exactly what got done"):
//   375px  270px text in a 297px box — 27px spare
//   768px  295px text in a 295px box — 0px spare
//   820px+ comfortable
//
// ⚠️ 768px is the tight one: the layout goes side-by-side there AND the type
// grows to 20px at the same breakpoint, so the text column is at its narrowest
// exactly when the copy is at its widest. `.bullet-text` no longer carries
// `white-space: nowrap` (see the rule in the stylesheet) so a bullet that
// outgrows the column wraps instead of widening the page. Keep new bullets
// near or under ~30 characters anyway — wrapping is a safe failure, not a
// good look.
const bullets = [
  { icon: Send,        text: "Assign homework to a student" },
  { icon: CheckCircle, text: "They get a text, tap to log it" },
  { icon: Layers,      text: "You know exactly what got done" },
];

/* ---------- Device-mock primitives ------------------------------------------
   The shared parts of every phone drawn on this page. Everything inside a frame
   is sized in `em` against the frame's own font-size, which is derived from its
   width (see .hero-device and .program-phone in the stylesheet) — so one set of
   numbers renders correctly at every breakpoint without a second scale.
   Colours are the shipped tokens from globals.css, not approximations.

   ⚠️ These also fed a four-frame "how it works" row, removed Aug 5 2026 as
   redundant against section 2 and the student section. The only consumers left
   are the hero device and section 2's two screens.                           */

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
  // point of the hero device: two shades stacked, meaning two different figures.
  //
  // Read from the tokens rather than copied as hex, so these mocks follow the
  // app's greens automatically. Every consumer here is an inline style, so the
  // var() resolves normally. One less surface to re-match by hand — the standing
  // hazard with hand-drawn frames.
  attempts: "var(--reps-green-muted)",
  green: "var(--reps-green)",
};

/* ---------- The cast --------------------------------------------------------
   ⚠️ ONE source of truth for every invented person and number on this page,
   because there used to be three and they drifted. The hero was a byte-identical
   clone of the product loop's fourth frame — same three exercises, same three
   figures, same three states — with only the student's name swapped, so the page
   read as two disconnected mock sets rather than one coach's roster. Those four
   frames are gone; the rule they taught is not.

   ⚠️ EVERY NAME HERE IS INVENTED and must stay that way. This page is public and
   real rosters are real children. Checked against both live rosters; do not
   paste from `rj_players` or the dashboard views, and do not reach for a
   "realistic" name by looking one up. A realistic SHAPE — mixed completion
   states, a plausible spread of activity — is the thing worth copying from real
   data. The names are not part of the shape.                                  */
const CAST = {
  coach: "Coach Mike",

  /* The product loop, as one CHAINED set of figures: Corner 3s assigned at 50
     attempts with makes tracked, texted to Jalen, logged as 50 attempts / 28
     makes, read back as 28 of 50 at 56%. 28/50 = 56%, so moving one figure
     means moving the rest — which is the whole reason they live in one object.

     ⚠️ Only `exercise` and `student` are READ today, both by section 2's assign
     screen. The rest carried the four-frame "how it works" row removed on Aug 5
     2026, and are kept deliberately rather than left stranded: the student
     section replacing it covers the texted-and-logged half of this same loop
     and needs these exact figures. They stay so it inherits the chain instead
     of inventing a second set of numbers. */
  loop: {
    student: "Jalen",
    exercise: "Corner 3s",
    target: 50,
    makes: 28,
    get pct() { return Math.round((this.makes / this.target) * 100); },
  },

  /* The hero. A DIFFERENT student on the SAME coach's roster, deliberately —
     see the note above. Her drills and figures share nothing with Jalen's, so
     the two screens read as two students rather than one screen relabelled.
     She keeps what the hero actually needs to show: a two-tone makes bar, a
     finished assignment, and a note in the student's own words. */
  hero: {
    student: "Maya",
    note: "Felt way better today.",
  },

  /* Jalen's other two assignments, for the student section's own screens.
     ⚠️ The count is NOT free. The roster in section 2 already says "Jalen —
     1 of 3 done", so his student screens have to show exactly three, exactly
     one of them finished. The finished one is Corner 3s and carries the loop
     figures above; these two are what make up the rest of that claim.

     `inProgress` is what the log screen draws, deliberately NOT Corner 3s:
     showing the chained drill mid-log on one screen and finished on the other
     would put two different states on one page for one assignment, which reads
     as a mistake even though a log screen is a moment and a card is a result.
     Its makes/attempts give 12/18 = 67%. */
  student: {
    inProgress: { exercise: "Free throws", target: 25, done: 18, makes: 12,
                  note: "Left elbow felt off today." },
    notStarted: { exercise: "Dribble series", target: 10, unit: "min" },
  },

  /* The roster shown in the "one place" section — Coach Mike's whole roster,
     which is why Jalen and Maya are both in it. */
  roster: ["Jalen", "Maya", "Tariq", "Sofia", "Nico"],
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
   assign screen that decides whether a percentage is ever available to report. */
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
        <span style={{ fontSize: "0.64em", fontWeight: 500, color: T.ink }}>{CAST.loop.exercise}</span>
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
          a shooting percentage possible at all. */}
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
          Send to {CAST.loop.student}
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
   would be inventing UI, which is the one thing a mock on this page must never
   do — every frame here draws only what the app actually renders.

   It is also the payoff screen, which is what the third bullet now promises:
   "You see it happen live."

   ⚠️ Every name here is invented. Real rosters are real children, and this page
   is public. Do not paste in anything from `rj_players`.

   Shares section 2's primitives and their em-scaling: every size is in `em`
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
          {CAST.hero.student.charAt(0)}
        </span>
        <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span style={{ fontSize: "1.05em", fontWeight: 600, letterSpacing: "-0.3px", color: T.ink }}>{CAST.hero.student}</span>
          <span style={{ fontSize: "0.56em", color: T.sub }}>Last logged 2h ago</span>
        </span>
      </div>

      <div style={{ fontSize: "0.58em", fontWeight: 600, letterSpacing: "1px", color: T.sub, marginBottom: "0.7em" }}>
        ASSIGNMENTS
      </div>

      {/* Three states on purpose: finished with makes recorded, underway with a
          note, and untouched. A hero showing three green ✓ would be claiming a
          product nobody's students ever fall behind in.

          ⚠️ These are MAYA's drills and figures and they deliberately share
          nothing with Jalen's loop story — different exercises, different
          numbers. This screen used to be the product loop's fourth frame
          byte-for-byte with the name swapped, which made the page read as two
          disconnected mock sets instead of one coach with a roster. Keep them
          distinct. */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.45em" }}>
        <MiniCard name="Catch &amp; shoot" right="✓ Done" made="made 34/50 · 68%" pct={100} makesPct={68} done />
        <MiniCard name="Layups · Right" right="12/20" pct={60} note={CAST.hero.note} />
        <MiniCard name="Elbow jumpers" right="0/25" pct={0} />
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

/* ---------- The roster overview -------------------------------------------
   Coach Mike's whole roster, for the "one place" section. Drawn from the real
   screen (src/app/instructor/students/page.tsx) rather than invented:

   - grouped by completion, in the real order — Done, In progress, Not started,
     Nothing assigned — each with a dot in its own colour, and dot and label
     always share that colour
   - ⚠️ green is Done and NOTHING else here. "In progress" is neutral grey; it
     is active but unearned, and colouring it would imply an outcome it has not
     reached
   - within a group, most recent activity first, which is why Jalen (20m) sits
     above Maya (2h)
   - timestamps take the accent blue under 24h and go grey after
   - ⚠️ NO progress bars and NO notes on these rows. Neither exists on the real
     roster — bars on roster rows are unbuilt, and notes live on the student
     detail and student home screens. Drawing either here would be inventing UI.

   Jalen and Maya carry the same state they show elsewhere on the page: one of
   three done apiece, which is exactly what the hero device renders for Maya. */
const ROSTER_GROUPS = [
  { label: "Done",             color: "var(--reps-green)", rows: [
    { name: "Tariq", sub: "2 of 2 done", ago: "1d ago", recent: false } ] },
  { label: "In progress",      color: T.sub,               rows: [
    { name: "Jalen", sub: "1 of 3 done", ago: "20m ago", recent: true },
    { name: "Maya",  sub: "1 of 3 done", ago: "2h ago",  recent: true } ] },
  { label: "Not started",      color: "#6b7080",           rows: [
    { name: "Sofia", sub: "2 waiting",   ago: "",        recent: false } ] },
  { label: "Nothing assigned", color: "#6b7080",           rows: [
    { name: "Nico",  sub: "no assignments", ago: "",     recent: false } ] },
];

function ScreenRoster() {
  return (
    <>
      {/* App chrome: wordmark and profile control, with the hairline that
          separates chrome from the page title on the real screen. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    paddingBottom: "0.6em", borderBottom: `1px solid ${T.line}`, marginBottom: "0.8em" }}>
        <span style={{ fontSize: "0.6em", fontWeight: 600, color: T.blue }}>Reps</span>
        <span style={{ width: "1.15em", height: "1.15em", borderRadius: "999px",
                       background: T.raised, border: `1px solid ${T.line}` }} />
      </div>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.8em" }}>
        <span style={{ fontSize: "0.92em", fontWeight: 600, letterSpacing: "-0.3px", color: T.ink }}>
          Your players
        </span>
        <span style={{ fontSize: "0.55em", fontWeight: 500, color: T.ink,
                       border: `1px solid ${T.line}`, borderRadius: "0.4em", padding: "0.25em 0.5em" }}>
          + Add
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.85em" }}>
        {ROSTER_GROUPS.map((g) => (
          <div key={g.label}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35em", marginBottom: "0.4em" }}>
              <span style={{ width: "0.32em", height: "0.32em", borderRadius: "999px", background: g.color, flexShrink: 0 }} />
              <span style={{ fontSize: "0.55em", fontWeight: 600, color: g.color }}>{g.label}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3em" }}>
              {g.rows.map((r) => (
                <div key={r.name} style={{ display: "flex", alignItems: "center", gap: "0.5em",
                                           background: "#111620", borderRadius: "0.5em", padding: "0.38em 0.5em" }}>
                  <span style={{ width: "1.55em", height: "1.55em", borderRadius: "999px", background: T.raised,
                                 border: `1px solid ${T.line}`, color: T.sub, fontSize: "0.6em", fontWeight: 600,
                                 display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {r.name.charAt(0)}
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: "0.66em", fontWeight: 500, color: T.ink }}>{r.name}</span>
                    <span style={{ fontSize: "0.53em", color: "#7d8494" }}>{r.sub}</span>
                  </span>
                  {r.ago && (
                    <span style={{ fontSize: "0.53em", color: r.recent ? T.blue : "#7d8494", flexShrink: 0 }}>
                      {r.ago}
                    </span>
                  )}
                  <span style={{ fontSize: "0.7em", color: "#6b7080", flexShrink: 0 }}>›</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- The student section's two screens -------------------------------
   The student's OWN surfaces, which appear nowhere else on the page: everything
   above is the coach's side. Same primitives and the same em-scaling contract
   as section 2's screens, since they share .program-phone's frame.

   ⚠️ Both draw JALEN, and his state is fixed by section 2's roster, which
   already says "Jalen — 1 of 3 done". Three assignments, one finished. Changing
   either screen means changing ROSTER_GROUPS with it.                        */

/* The log screen: a stepper, not the +10/+25/+50 presets that were retired.
   ATTEMPTS takes the MUTED green precisely because a MAKES row is on screen
   with it — a solo counter would take the bright green outright, which is the
   pairing rule in the colour system.

   Draws Free throws rather than Corner 3s on purpose — see CAST.student. */
function ScreenStudentLog() {
  const s = CAST.student.inProgress;
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5em", marginBottom: "1em" }}>
        <span style={{ fontSize: "0.8em", color: T.sub }}>←</span>
        <span style={{ fontSize: "0.64em", fontWeight: 500, color: T.ink }}>{s.exercise}</span>
      </div>

      <div style={{ fontSize: "0.58em", color: T.label, marginBottom: "0.45em" }}>
        {s.done} of {s.target} done
      </div>
      <div style={{ marginBottom: "1.5em" }}>
        {/* Two-tone: muted attempts underneath, bright makes over it. 18/25
            attempts and 12/25 of the target made. */}
        <MiniBar2 pct={Math.round((s.done / s.target) * 100)} makesPct={Math.round((s.makes / s.target) * 100)} />
      </div>

      <div style={{ textAlign: "center", marginBottom: "1em" }}>
        <MiniStepper label="ATTEMPTS" value={String(s.done)} size="2.1em" numberColor={T.attempts} />
      </div>

      <div style={{ height: "1px", background: T.line, marginBottom: "0.8em" }} />
      <div style={{ textAlign: "center" }}>
        <MiniStepper label="MAKES" value={String(s.makes)} size="1.1em" numberColor={T.green} />
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

/* The student's home: their own list, split by the same New / Archive tabs the
   coach sees. Read-only on the tabs — only the coach files and unfiles — so no
   affordance here suggests otherwise.

   The three cards ARE Jalen's "1 of 3 done": Corner 3s finished and carrying
   the loop chain's figures, Free throws part-way with the note he left on it,
   Dribble series untouched. */
function ScreenStudentHome() {
  const p = CAST.student.inProgress;
  const n = CAST.student.notStarted;
  const madePct = Math.round((p.makes / p.done) * 100);
  return (
    <>
      <div style={{ marginBottom: "0.9em" }}>
        <div style={{ fontSize: "0.92em", fontWeight: 600, letterSpacing: "-0.3px", color: T.ink }}>
          Hey {CAST.loop.student}
        </div>
        <div style={{ fontSize: "0.58em", color: T.sub, marginTop: "0.15em" }}>From {CAST.coach}</div>
      </div>

      {/* The tab bar. New is active, which is where unfiled work lives — a
          finished card stays here until the COACH archives it, so a done card
          sitting in New is correct, not a bug. */}
      <div style={{ display: "flex", gap: "0.9em", borderBottom: `1px solid ${T.line}`, marginBottom: "0.75em" }}>
        <span style={{ fontSize: "0.6em", fontWeight: 600, color: T.ink, paddingBottom: "0.45em", borderBottom: `1.5px solid ${T.ink}`, marginBottom: "-1px" }}>
          New
        </span>
        <span style={{ fontSize: "0.6em", fontWeight: 500, color: T.sub, paddingBottom: "0.45em" }}>Archive</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.45em" }}>
        <MiniCard
          name={CAST.loop.exercise}
          right="✓ Done"
          made={`made ${CAST.loop.makes}/${CAST.loop.target} · ${CAST.loop.pct}%`}
          pct={100}
          makesPct={CAST.loop.pct}
          done
        />
        <MiniCard
          name={p.exercise}
          right={`${p.done}/${p.target}`}
          made={`made ${p.makes}/${p.done} · ${madePct}%`}
          pct={Math.round((p.done / p.target) * 100)}
          makesPct={Math.round((p.makes / p.target) * 100)}
          note={p.note}
        />
        <MiniCard name={n.exercise} right={`0/${n.target} ${n.unit}`} pct={0} />
      </div>
    </>
  );
}

/* ---------- Pricing --------------------------------------------------------
   ⚠️ EVERY feature here belongs to BOTH plans, and the section is built to say
   so. The only difference between Free and Pro is the student count — that is
   the actual product rule (FREE_STUDENT_LIMIT gates the 4th student and nothing
   else), and the free tier is 3 students FOREVER with full features, no card
   and no clock.

   ⚠️ So this must never become a per-column comparison table. A tick-per-tier
   grid implies Pro unlocks capability, which would be a straightforward lie
   about what the app does — and it would undercut the free tier, which is
   deliberately generous positioning rather than a trial. One shared list under
   both cards is the honest shape.

   ⚠️ Terse LABELS, not sentences. Anything long enough to wrap breaks the two
   column grid, and the longest of these ("Attempts, makes, or streaks") is the
   one that sets the column width — check it first if the list is ever edited. */
const PRICING_FEATURES = [
  /* ⚠️ Plain, literal feature NAMES — the register is TeuxDeux's ("Week view",
     "Undo delete"), not marketing copy. An earlier set tried to interpret each
     one ("Notes in their own words", "Every log, kept") and read as a pitch;
     naming the thing and stopping is more confident and ages better.

     Each verified against shipped behaviour, not the roadmap:
       Custom drills          custom_exercises, live
       Attempts/makes/streaks the three goal_type values
       No login for students  token link, no signup required
       Student notes          logs.note, live since Aug 1
       Full roster view       the instructor roster screen
       Log history            logs are kept; NO trend or analysis claim
       Parent phone option    the shipped Player/Parent toggle
       Cancel anytime         monthly, no contract
     ⚠️ "Log history" deliberately does not promise progress-over-time views.
     Nothing reads logs longitudinally yet. */
  "Custom drills",
  "Attempts, makes, or streaks",
  "No login for students",
  "Student notes",
  "Full roster view",
  "Log history",
  "Parent phone option",
  "Cancel anytime",
];

export default function LandingPage() {
  return (
    <div className="paper-grain" style={{ backgroundColor: "#ede9e3", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <header className="page-header">
        <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <TallyMark />
            <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px", color: "#0f0f10" }}>
              Reps
            </span>
          </div>
          <Link
            href="/instructor/signup/email"
            className="signin-btn"
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
          style={{ maxWidth: "var(--page-max)", margin: "0 auto", width: "100%" }}
          className="landing-inner"
        >

          {/* Mobile: stacked. Desktop: side by side */}
          <div className="landing-layout">

            {/* Image — left on desktop, top on mobile. A single device showing
                the coach's student-detail screen, replacing the two-circle photo
                collage. Hand-drawn from the shared device primitives rather
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
                {/* ⚠️ "Coaches & trainers", not "instructors" (Aug 5 2026, in
                    two steps: instructors -> coaches -> coaches & trainers).
                    "Instructor" was a neutral umbrella chosen when the audience
                    was still abstract, and it reads as institutional to the
                    people actually being addressed. The pair is deliberate:
                    the near-term audience is private basketball, soccer and
                    tennis coaching, and the two words are not reliably the same
                    person — naming only one silently excludes the other.

                    ⚠️ The page metadata now MATCHES this — title, description
                    and og tags all pair "Coaches & Trainers", as does the
                    fallback title in layout.tsx. They diverged for part of
                    Aug 5 and were reconciled the same day. Change this line and
                    all five of those strings move with it, or the page starts
                    calling itself two things again.

                    ⚠️ Deliberately NOT propagated into the app. Its vocabulary
                    is still instructor — `instructor_type` on coaches, the
                    whole /instructor route tree, getActivityLabels — and this
                    is a marketing-copy change, not a rename. Same rule the app
                    already follows for "Repeat" -> "Assign again": UI labels
                    may change without renaming code. */}
                For coaches &amp; trainers
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
                  className="cta-real cta-primary hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  Start free
                </Link>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* "One place" — zig-zag against the hero: copy LEFT, screens RIGHT,
          where the hero puts its device on the left. A warm mid-tone band, so
          the page steps cream -> warm -> dark rather than jumping straight from
          the hero into the product loop. */}
      <section className="program-section">
        <div className="program-inner">
          <div className="program-copy">
            <h2 className="program-heading">Your whole program, finally in one place.</h2>
            <p className="program-sub">
              Every assignment, every check-in — not scattered across texts and memory.
            </p>
            {/* Same destination as the hero's button, deliberately different
                words. The hero's stays the literal "Start free" because it is
                the first thing a stranger meets and has to be unambiguous; by
                here they know what the product does, so the CTA can echo the
                heading above it.

                ⚠️ NOT "See your whole roster", which was tried and dropped: it
                promises a roster the signup does not have yet. Every person who
                taps this has zero students. "Start your program" describes the
                action they are actually taking. */}
            <Link href="/instructor/signup" className="cta-real program-cta">
              Start your program
            </Link>
          </div>
          {/* Two screens: the moment work is created, and the roster it lands
              on. Decorative — the heading and subtext carry the meaning. */}
          <div className="program-screens">
            <div className="program-screen-item">
              {/* The frame is illustration; the caption below carries the
                  meaning, so screen readers get the label and skip the
                  duplicated UI — the same split the hero device and the
                  student section's screens use. */}
              <div className="program-phone" aria-hidden="true"><ScreenAssign /></div>
              <p className="program-caption">Assigning work</p>
            </div>
            <div className="program-screen-item">
              <div className="program-phone" aria-hidden="true"><ScreenRoster /></div>
              <p className="program-caption">Your roster</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — the student side. Section 2's template, flipped: copy and
          screens swap sides at desktop so the two read as a matched pair rather
          than a repeat.

          ⚠️ A LIGHT band, and that is structural rather than decorative —
          without it the page runs section 2, this, and the footer as three dark
          bands in a row. See .student-section for why it is not the hero's own
          cream. */}
      <section className="student-section">
        <div className="student-inner">
          <div className="student-copy">
            <h2 className="student-heading">Nothing for your students to download.</h2>
            <p className="student-sub">
              A text, a link, a stepper — that&apos;s the whole thing. Younger students can
              log on a parent&apos;s phone with the same link.
            </p>
            {/* Third CTA, third wording, same destination. The hero stays the
                literal "Start free" for a stranger; section 2 echoes its own
                heading; this one names what actually happens first after
                signing up, which is the thing this section is about.

                ⚠️ NOT "Get your students started" — the coach is the one
                signing up, and every reader here has zero students. Same trap
                section 2's CTA note records for "See your whole roster". */}
            <Link href="/instructor/signup" className="cta-real student-cta">
              Send your first assignment
            </Link>
          </div>
          {/* The two screens a student actually touches. Decorative — the
              heading and subtext carry the meaning, so screen readers get the
              captions and skip the duplicated UI. */}
          <div className="student-screens">
            <div className="student-screen-item">
              <div className="student-phone" aria-hidden="true"><ScreenStudentLog /></div>
              <p className="student-caption">Logging a set</p>
            </div>
            <div className="student-screen-item">
              <div className="student-phone" aria-hidden="true"><ScreenStudentHome /></div>
              <p className="student-caption">Their own progress</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing — the last band before the footer.

          ⚠️ CENTRED, not zig-zagged. Sections 2 and 3 alternate sides because
          they are a directional story being told about two audiences. Pricing
          is a fair comparison between two options, and putting one of them on
          a side would weight it. */}
      <section className="pricing-section">
        <div className="pricing-inner">
          <h2 className="pricing-heading">Straightforward pricing.</h2>
          {/* ⚠️ "STUDENTS" is load-bearing — without the noun this reads as
              "free for your first three" and leaves a stranger guessing three
              of what: months, drills, sessions. Three students is the free
              tier's actual rule (FREE_STUDENT_LIMIT = 3).

              ⚠️ "forever" is a real claim and it is true: the free tier has no
              time limit and is explicitly not a trial — a 14-day unlimited
              trial was considered and rejected. If that ever changes, this word
              is the first thing that has to go.

              ⚠️ The price is deliberately NOT restated here. The Pro card two
              rows down carries $10/mo, and saying it twice made the heading's
              promise of straightforwardness do the opposite. This also absorbs
              the standalone "no card to start" line that used to sit under the
              Free CTA — note that absorption is IMPLICIT: "free forever" is
              read as no-payment, but the words card and payment now appear
              nowhere in this section. */}
          <p className="pricing-sub">
            Free forever with your first three students.
          </p>

          <div className="pricing-cards">
            <div className="pricing-card pricing-card-free">
              <p className="pricing-plan">Free</p>
              <p className="pricing-price">$0</p>
              <p className="pricing-limit">up to 3 students</p>
              {/* Quiet rather than filled, reusing the outlined treatment the
                  hero's sign-in button already establishes. ⚠️ NOT a second
                  blue — the rule is one brand blue everywhere, and hierarchy
                  between two real CTAs comes from fill and elevation.

                  ⚠️ BOTH cards say "Start free", and that identical wording is
                  the point rather than an oversight. Both buttons target
                  /instructor/signup — there is no "start Pro" path anywhere in
                  the app, because Pro is only reachable AFTER signup via the
                  add-student gate or the profile menu. Wording them
                  differently implied a commitment distinction that does not
                  exist at the moment of the click. The light-card/dark-card
                  contrast already tells the two-tier story; the labels must not
                  claim something the routing does not do. */}
              <Link href="/instructor/signup" className="signin-btn pricing-cta">
                Start free
              </Link>
              {/* ⚠️ A "No card to start" line lived here and was removed once
                  the subtext became "Free forever with your first three
                  students" — the two were making the same promise a few rows
                  apart. Removing it also re-levels the cards: it was the only
                  content either card had below its button, so the Pro card was
                  carrying an equivalent slug of empty space to stay the same
                  height. Both cards now end on their CTA. */}
            </div>

            <div className="pricing-card pricing-card-pro">
              <p className="pricing-plan">Pro</p>
              <p className="pricing-price">
                $10<span className="pricing-per">/mo</span>
              </p>
              <p className="pricing-limit">unlimited students</p>
              <Link href="/instructor/signup" className="cta-real pricing-cta">
                Start free
              </Link>
            </div>
          </div>

          {/* ⚠️ NO container — deliberately open on the band. A white panel was
              tried here and removed: housing the list gave it presence but made
              it a boxed unit sitting after two boxed units, which is the exact
              third-object problem the panel's own width was supposed to avoid.
              Presence comes from the type and the marks now, not from a box.

              ⚠️ This statement is doing real work — it is what stops the list
              being read as Pro's feature set, so it sits above BOTH cards'
              worth of features and belongs to neither card. */}
          <p className="pricing-included">Everything included, always</p>
          <ul className="pricing-features">
            {PRICING_FEATURES.map((f) => (
              <li className="pricing-feature" key={f}>
                {/* ⚠️ A filled badge, NOT a bare glyph, and this supersedes the
                    earlier "quiet icon, no coloured blocks" direction — the
                    thin check read as a bullet point rather than as assurance.
                    The circle is the brand blue and the check inside it is
                    white, so the mark carries weight without introducing a
                    colour. */}
                <span className="pricing-badge" aria-hidden>
                  <Check size={15} strokeWidth={3} color="#378add" />
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Footer */}
      {/* Its own band: #1a1d24, darker than section 2's #262a39, with a
          1px rule on top. It once shared a colour with the band above it, so
          the rule was carrying the separation alone and the footer read as the
          tail of that section. A tonal step separates without a hard edge.
          Greys and links are the dark-background set: #555 / #2d7bc4 were tuned
          for cream and go muddy here. */}
      <footer style={{ backgroundColor: "#1a1d24", borderTop: "1px solid #2a2d36", padding: "20px var(--page-pad) 28px" }}>
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
        /* ---- The page shell ------------------------------------------------
           ⚠️ ONE definition of how wide the page is and how far its content sits
           from the edge. Every band referenced these as literals — 1100/22/40
           repeated across the header, hero, this section, the loop and the
           footer — which is how the footer quietly ended up on 28px while
           everything else used 22px. Change the shell here, not per section. */
        .paper-grain { --page-max: 960px; --page-pad: 22px; }

        .page-header { padding: 20px var(--page-pad) 0; }
        .page-main   { padding: 48px var(--page-pad) 24px; }
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
           Same em-scaling contract as .program-phone: font-size is derived from the
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
          /* Centred while the hero is STACKED — the device sits above the copy
             and centring is right there. Left-aligned once it becomes a column
             (see the 768 block), because a 268px device centred in a 420px
             column sat 76px inside the page's left edge while the header logo,
             this section's heading and the footer all sat on it.
             That was the "hero looks indented" — not a padding difference. */
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
        /* ⚠️ NO white-space: nowrap, and its removal was a bug fix rather than
           a style choice. With nowrap these lines could not break, so the
           longest one set a min-content floor for .landing-text (flex: 1,
           default min-width: auto) and the PAGE widened instead of the line
           breaking — a horizontal scrollbar in a band around 768px, where the
           layout goes side-by-side and the type grows to 20px at the same time.
           Wrapping is the correct failure mode for a text line; widening the
           document is not. Verified byte-identical at 375/390/414/1024/1280/1440
           — at every width with room, these still render on one line. */
        .bullet-text {
          font-size: 18px;
          line-height: 1.4;
          color: #1a1a1a;
          font-weight: 600;
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
          .paper-grain { --page-pad: 40px; }
          .page-header { padding: 24px var(--page-pad) 0; }
          .page-main   { padding: 80px var(--page-pad) 60px; }
          .landing-layout {
            flex-direction: row;
            /* ⚠️ This is now the WHOLE device-to-copy gap, because the image
               column hugs the device rather than padding it out to --hero-w.
               So it is the only number to change if that gap needs tuning, and
               it is declared ONCE — an earlier pass left a second
               .landing-layout gap further down this same block quietly
               overriding it. Checked: the 1024 block does not touch
               .landing-layout at all. */
            gap: 96px;
            align-items: center;
          }
          .landing-image-wrap {
            --hero-w: 340px;
            flex: 0 0 var(--hero-w);
            width: var(--hero-w);
          }
          /* ⚠️ The image column HUGS the device from here up, instead of
             holding a fixed --hero-w. It was 420px wide around a 268px device,
             so 152px of it was empty and the copy column started 152px further
             right than it needed to — that dead space, plus the 80px flex gap,
             was the whole 232px hero gap. The device itself does not move: it
             is left-aligned on the page edge either way, and --pw is untouched.
             Only the copy moves left, which is exactly widening the copy column.
             --hero-w still drives the STACKED layout below 768. */
          .landing-image-wrap { flex: 0 0 auto; width: auto; }

          /* ⚠️ Left-aligned once the hero is a ROW. Centred, a 268px device in a
             420px column sat 76px inside the page's left edge, while the header
             logo, the "one place" heading and the footer all sat on it — which
             is what read as "the hero is indented". It is not a
             padding difference; the padding was always identical. */
          .hero-device-wrap { justify-content: flex-start; }
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
        /* ---- "One place" band ---------------------------------------------
           ⚠️ A warm step DOWN from the cream hero, not a mid-grey. A true
           mid-tone between #ede9e3 and the loop band's #1c1f26 lands around
           L 0.35, which is the muddy brown territory the dark-hero experiment
           was rejected for. This stays light enough to read as paper while
           being unmistakably its own band, so the page reads cream -> warm ->
           dark as three deliberate steps. */
        .program-section {
          /* ⚠️ #1f2740, not the old neutral #252932 (changed Aug 5 2026).
             Saturating it into real blue widens the hue gap from the cream
             hero — 226 degrees against the hero's 36 — so it reads as a
             deliberate counterpart rather than as generic dark chrome, and it
             puts this band in the SAME family as the student section's paper.
             The two are siblings at opposite lightnesses: hsl(227, 20%, 18.6%)
             here, hsl(229, 12%, 81.4%) there.

             ⚠️ Desaturated on Aug 5 2026 from hsl(226, 35%) / #1f2740, a drop
             of 14.7 points at identical hue and lightness. The saturated
             version read as a colour choice; this reads as a tinted neutral,
             which is what a background should do. 8-bit quantisation at 18.6%
             lightness is coarse — #262a39 is the closest reachable value, and
             it lands at exactly 20.0%.

             The devices stay the darkest objects on it.

             ⚠️ The page no longer runs one long descent, and that changed on
             Aug 5 2026. It ALTERNATES: cream hero -> this dark band -> the
             student section's lighter paper -> dark footer. Section 3 is
             deliberately light because three dark bands in a row (here, there,
             footer) read as one undifferentiated block. So the rule for a new
             section is no longer "take the next value down" — it is "do not
             leave two same-tone bands touching". */
          background: #262a39;
          padding: 56px var(--page-pad) 60px;
          /* ⚠️ No flex-grow here any more. It moved to .student-section on
             Aug 5 2026, because the slack-absorbing grower has to be whichever
             band sits LAST before the footer, and that is no longer this one. */
        }
        .program-inner {
          max-width: var(--page-max);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 34px;
          align-items: center;
        }
        .program-copy { width: 100%; }
        .program-heading {
          font-size: 27px;
          line-height: 1.1;
          font-weight: 700;
          letter-spacing: -0.8px;
          color: #eef0f4;
          margin: 0 0 14px;
          /* ⚠️ Wrapping is FINE here and is not what is being guarded against.
             An earlier pass forced one line with a clamp() tuned to the widest
             string, which meant the type size was decided by the copy's length
             rather than by the design — and it could not hold a line below 414
             at any readable size anyway. The only rule is no single word
             stranded on the last line, which is exactly what balance prevents:
             it evens the lines instead of leaving a runt. */
          text-wrap: balance;
        }
        .program-sub {
          font-size: 16px;
          line-height: 1.55;
          color: #a2a8b4;
          margin: 0;
          /* No max-width and no forced break — it wraps to whatever the column
             is. text-wrap: pretty rather than balance, because this is a
             sentence: only the LAST line needs protecting from a stranded word,
             where balance would even every line and pull the measure in for no
             reason. Browsers without it wrap normally, which is the same shape
             minus the widow guard. */
          text-wrap: pretty;
        }
        /* The two screens overlap slightly so they read as one object rather
           than two unrelated frames — the roster in front, since it is the one
           the heading is actually about. */
        .program-screens {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 14px;
          width: 100%;
        }
        /* ---- REAL, clickable calls to action ------------------------------
           ⚠️ These must never be mistakable for a button drawn INSIDE a phone
           mock. What separates them is SHAPE, not hue:

             - real elevation. Mock buttons are flat because they sit on a
               screen; these lift off the page, and this does most of the work
             - a larger type size and radius than anything inside a frame

           ⚠️ The colour is the brand token and must stay that way. A separate
           deeper blue (#1f66b8) was tried here and reverted: a near-miss of the
           brand colour reads as off-brand rather than as deliberately distinct,
           which is worse than not differentiating at all. If these ever need to
           separate further, take it out of size or elevation — not hue.

           Every future marketing CTA should take this class rather than
           restating the values. */
        .cta-real {
          display: inline-block;
          background-color: var(--reps-orange);
          color: #fff;
          font-weight: 700;
          /* ⚠️ 19px is an ACCESSIBILITY floor, not a size preference, and it is
             load-bearing with the weight above it. White on the brand blue is
             3.59:1 — under the 4.5:1 AA needs for normal text, which is what
             this was at 17px, and comfortably over the 3:1 it needs as LARGE
             text. WCAG counts bold type as large from 18.66px, so 19px/700 is
             the first step that clears it.

             Drop this below 18.66px, or the weight below 700, and all four
             CTAs on this page silently fail AA again. Fixing it by darkening
             the fill instead was considered and rejected: the brand blue is
             fixed, and distinctness here comes from size and elevation rather
             than hue. */
          font-size: 19px;
          letter-spacing: -0.2px;
          padding: 16px 38px;
          border-radius: 12px;
          text-decoration: none;
          text-align: center;
          /* Tinted from the button's own colour rather than neutral black, so
             the lift reads as the button glowing rather than as a drop shadow
             sitting under it. */
          box-shadow:
            0 10px 22px -8px rgba(55, 138, 221, 0.55),
            0 1px 2px rgba(0, 0, 0, 0.16);
        }
        /* Outlined, not plain text — it sat as a bare underlined link next to
           buttons that have since grown, which read as unfinished. Same radius
           as .cta-real so the two are obviously a pair at different weights. */
        .signin-btn {
          display: inline-block;
          font-size: 14px;
          font-weight: 600;
          color: #0f0f10;
          border: 1px solid rgba(15, 15, 16, 0.22);
          border-radius: 12px;
          padding: 9px 18px;
          text-decoration: none;
          transition: border-color 0.15s, background-color 0.15s;
        }
        .signin-btn:hover {
          border-color: rgba(15, 15, 16, 0.42);
          background-color: rgba(15, 15, 16, 0.04);
        }

        .program-cta {
          display: block;
          width: 100%;
          margin-top: 26px;
        }
        /* ⚠️ ONE rule for every width at or above 768, not a copy inside each
           breakpoint block. The first attempt put this in the 768-1023 block
           alone, so at 1280 the base display:block/width:100% still applied and
           the button ran the full width of the copy column. Same shape as the
           bugs this file has already had twice: a rule that looks applied
           because it is applied SOMEWHERE. */
        @media (min-width: 768px) {
          .program-cta { display: inline-block; width: auto; }

          /* ⚠️ The SIZE HIERARCHY rule, expressed as a ratio rather than as
             fixed numbers, so it holds at every width instead of at the two
             where it was checked. The hero headline is clamp(38px, 4.5vw, 56px);
             this is the same curve at ~0.82 of it — clamp(32px, 3.7vw, 46px) —
             which keeps section 2 in the 80-85% band across the whole range:
             46/56 at 1280, 37.9/46.1 at 1024, 32/38 at 768.

             ⚠️ It lives in a min-width:768 block on purpose. Put in the
             768-1023 block, as it first was, it silently stopped applying at
             1024 and the heading fell back to the 27px mobile size — 48% of the
             hero rather than 82%. That is the fourth time in this file a
             breakpoint-scoped rule has looked applied because it applied
             somewhere; check the widest width, not just the one you are on. */
          .program-heading { font-size: clamp(32px, 3.7vw, 46px); }
        }

        .program-screen-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 0;
        }
        /* Identifying labels, not steps — deliberately not numbered, and in a
           quiet register well under the heading they sit beneath. */
        .program-caption {
          margin: 12px 0 0;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.4;
          /* ⚠️ #8a8fa8 until Aug 5 2026, and it had to move. Desaturating the
             band lifted its luminance from 0.02113 to 0.02363, which dropped
             this caption from 4.62:1 to 4.46:1 — under AA for 13px text. Same
             hue and saturation, 2 points lighter, back to 4.81:1.

             It is deliberately NOT the app's --reps-sub token any more. That
             value is tuned against the app's own dark surfaces, not against
             this band, and matching it by eye is what put it under AA here. */
          color: #9095ac;
          text-align: center;
        }
        .program-phone {
          /* ⚠️ Two side by side, so the ceiling is (container - gap) / 2, not
             taste. At 375 the content box is 331px: 150 + 14 + 150 = 314 fits,
             184 would overflow by 51. Hence the extra step at 480 rather than
             one mobile size. */
          /* ⚠️ Sized from the HERO's device, not from the space available.
             The hero's is 172px below 768, so at 205 these were 19% LARGER
             than the hero's — the hierarchy inverted, which is the thing the
             ratio exists to stop. 146 is ~85% of 172 and still clears the
             two-up bound with room. */
          --pw: 146px;
          width: var(--pw);
          font-size: calc(var(--pw) / 13);
          /* ⚠️ 9/19.5, not 9/18. Both the frame height and its contents scale
             off --pw, so width cancels out and only the RATIO decides whether a
             screen overflows its own frame — the same trap the hero device hit.
             The roster is the taller of the two (five rows across four groups)
             and needs ~19 to clear; at 9/18 it clipped Nico's row off the
             bottom. The assign screen simply gets slack, which its bottom CTA
             absorbs. */
          aspect-ratio: 9 / 19.5;
          flex-shrink: 0;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          padding: 1em 0.85em;
          background: #111318;
          border: 1px solid #2a2d36;
          border-radius: 22px;
          overflow: hidden;
          /* ⚠️ COOL and genuinely darker than the band, replacing a warm
             brown pair on Aug 5 2026. The rule this page follows is that a
             shadow is tinted from the surface it sits ON — warm on the cream
             hero, so blue here. The old rgba(90,70,45) was LIGHTER than the
             band in red and green, so it composited to rgb(45,46,59) over a
             rgb(31,39,64) surround: a brown haze that lightened rather than
             shadowed. Barely readable on the old neutral #252932, obvious
             against blue. This composites to rgb(23,26,36) — darker than the
             band, which is what a shadow is supposed to do.

             ⚠️ Retinted with the band on Aug 5 2026, from rgba(6,10,22) at 57%
             saturation to rgba(10,12,18) at 30%. The tint is DERIVED from the
             surface, so desaturating the band without desaturating this would
             leave a more saturated shadow than the thing casting it. */
          box-shadow:
            0 2px 6px rgba(10, 12, 18, 0.35),
            0 16px 40px -12px rgba(10, 12, 18, 0.55);
        }
        /* Upright and side by side — no rotation, no negative margin. The
           tilt-and-overlap version cut controls off the back screen and made it
           read as broken rather than layered; two plain frames with a gap say
           "two screens" without any of that. */

        /* Stacked but bigger: at 768 the copy column has the full width, so the
           headline can hold one line at a proper size. */
        /* ⚠️ At 375 the content box is 331px and two 158px frames plus the
           base 14px gap come to exactly 331 — it fits with ZERO slack, which is
           one rounding difference from overflowing. Buying the margin out of the
           gap rather than the frames keeps the devices at the size that made
           them legible. */
        @media (max-width: 479px) {
          .program-screens { gap: 10px; }
        }

        @media (min-width: 480px) and (max-width: 767px) {
          /* Same 146 as below 480 now — the old 205 made these bigger than the
             hero's own 172px device. The two-up bound that used to decide this
             number is no longer the binding constraint; the hierarchy is. */
          .program-phone { --pw: 146px; }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .program-section { padding: 72px var(--page-pad) 76px; }
          .program-heading { margin: 0 0 16px; }
          .program-sub     { font-size: 18px; }
          .program-phone   { --pw: 196px; border-radius: 26px; }
          .program-screens { gap: 18px; }
        }

        @media (min-width: 1024px) {
          /* Zig-zag against the hero: it puts the device left and copy right,
             so this reverses to copy left, screens right.
             ⚠️ 1024, NOT 768. Going side-by-side at 768 left the copy column
             270px wide against two 156px phones — narrow enough that the
             headline wrapped to three lines. The row needs real width to exist
             at all.
             ⚠️ This block must stay AFTER the base .program-* rules. It first
             lived in the earlier 768 media query further up the stylesheet,
             where the base rules — declared later at equal specificity — simply
             overrode it, so the devices silently stayed at their mobile size. */
          .program-section { padding: 84px 40px 88px; }
          .program-inner {
            flex-direction: row;
            gap: 72px;
            align-items: center;
          }
          .program-copy    { flex: 1; }
          /* ⚠️ width: auto is load-bearing. The mobile rule sets width: 100% so
             the screens centre under the copy when stacked; carried into the
             row layout that made the screens claim the FULL inner width and
             squeezed the copy column to 148px, wrapping the heading into five
             short lines. flex: 0 0 auto alone does not undo it — the basis is
             auto, so the declared width still wins. */
          .program-screens { flex: 0 0 auto; width: auto; }
          /* ⚠️ FLUID, and the ceiling is set by the one-line rule rather than
             taste. The copy column is ~526px at 1024 and ~682px at 1280; this
             headline needs 668px at 38px, so a fixed 38 wraps everywhere below
             ~1270. Scaling with the viewport keeps it on one line across the
             whole range and only reaches 38px where there is room for it. */
          .program-heading { letter-spacing: -1.2px; margin: 0 0 18px; }
          .program-sub     { font-size: 18px; }
          .program-phone   { --pw: 222px; border-radius: 28px; }
          .program-screens { gap: 18px; }
        }

        /* ---- Section 3: the student side ---------------------------------
           Section 2's template, flipped. Same sizes, same frame, same copy
           register — the difference is the audience and the side each half
           sits on.

           ⚠️ PEER-SIZED with section 2, which is a deliberate departure from
           the descending-tier rule the hero and section 2 follow. That rule
           exists to stop a LATER, lesser section outgrowing an earlier one. It
           does not apply between siblings: these two are the same kind of thing
           about two audiences, and shrinking this one to 82% would say the
           student half matters less. Heading clamp, device widths and aspect
           ratio are all identical to section 2's on purpose. */
        .student-section {
          /* The page needs a LIGHT band here, or section 2, this and the
             footer stack as three darks and read as one undifferentiated
             block. That requirement is structural; which light is the question
             this value answers.

             ⚠️ #c5c9da as of Aug 5 2026, replacing a warm #e6e1d8. That first
             version was the hero's own paper one tone deeper, which made this
             band a sibling of the HERO and left section 2 as the odd one out.
             This is the blue family instead — hsl(229, 12%, 81.4%) against
             section 2's hsl(227, 20%, 18.6%), two degrees apart — so the two
             middle bands are one system at opposite lightnesses, and the cream
             hero stands alone as the entry rather than being echoed halfway
             down the page.

             ⚠️ Desaturated on Aug 5 2026 from hsl(229, 22%) / #c5c9da, a drop
             of 10.5 points at identical hue and lightness. The drop is smaller
             than section 2's 14.7 because 8-bit quantisation at 81.4%
             lightness is coarse: the next reachable step down (#cbcdd4, 9.5%)
             undershoots the target band and swings the hue to 227.

             Deep enough to read crisp rather than washed out, light enough to
             be unambiguously the light band between two dark neighbours: 81.4%
             lightness against section 2's 18.6% and the footer's 8%.

             ⚠️ Its text is COOL. The warm greys an earlier #e6e1d8 version
             used read as brown smudges on this, and its caption failed AA
             outright at 3.78:1 — see each colour below. */
          background: #caccd5;
          padding: 56px var(--page-pad) 60px;
          /* ⚠️ No flex-grow here any more. It moved on to .pricing-section
             when that landed below this one (Aug 5 2026) — the slack-absorbing
             grower has to be whichever band sits LAST before the footer. */
        }
        .student-inner {
          max-width: var(--page-max);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 34px;
          align-items: center;
        }
        .student-copy { width: 100%; }
        .student-heading {
          font-size: 27px;
          line-height: 1.1;
          font-weight: 700;
          letter-spacing: -0.8px;
          /* A COOL near-black, not the hero's warm #0f0f10 — this band is
             blue paper now, and warm ink on it reads dirty. 11.9:1. */
          color: #121620;
          margin: 0 0 14px;
          /* Same rule as section 2: wrapping is fine, a stranded last word is
             not. balance evens the lines instead of leaving a runt. */
          text-wrap: balance;
        }
        .student-sub {
          font-size: 16px;
          line-height: 1.55;
          /* Cool slate, in the band's own hue family. The warm #54504a this
             replaces still cleared AA here (4.86:1) but read brown against the
             blue. 5.7:1, comfortably clear as body text. */
          color: #3f465a;
          margin: 0;
          /* A sentence, so only the LAST line needs a widow guard — pretty,
             not balance. Same call as .program-sub. */
          text-wrap: pretty;
        }
        .student-screens {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 14px;
          width: 100%;
        }
        .student-screen-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 0;
        }
        .student-caption {
          margin: 12px 0 0;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.4;
          /* ⚠️ Darkened as well as cooled. The warm #65605a this replaces
             measured 4.78:1 on the old #e6e1d8 and dropped to 3.78:1 on this
             darker band — a real AA FAILURE at 13px, not a near miss. 5.1:1
             now. */
          color: #474d60;
          text-align: center;
        }
        .student-cta {
          display: block;
          width: 100%;
          margin-top: 26px;
        }
        .student-phone {
          /* Section 2's numbers exactly — see the peer-sizing note above. The
             two-up bound at 375 is the same one, and so is the 9/19.5 ratio:
             the home screen carries three cards and a tab bar, which is the
             taller of this pair, and the log screen takes the slack in its
             bottom button the way the assign screen does. */
          --pw: 146px;
          width: var(--pw);
          font-size: calc(var(--pw) / 13);
          aspect-ratio: 9 / 19.5;
          flex-shrink: 0;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          padding: 1em 0.85em;
          background: #111318;
          border: 1px solid #2a2d36;
          border-radius: 22px;
          overflow: hidden;
          /* ⚠️ Tinted from THIS band, never black — the hero's two-layer
             treatment with the hue swapped to follow the surface, which is the
             actual rule (the hero is warm because the hero's paper is warm).
             A warm brown haze on blue paper reads as a stain; black greys it
             and makes the device look like a hole punched in the page.
             Composites to rgb(155,158,170) on #caccd5 — same family, clearly
             darker.

             ⚠️ Retinted with the band on Aug 5 2026, from rgba(35,45,80) at
             39% saturation to rgba(46,50,69) at 20%, so the shadow stays about
             as saturated as the surface it is derived from. */
          box-shadow:
            0 2px 6px rgba(46, 50, 69, 0.10),
            0 18px 50px -12px rgba(46, 50, 69, 0.30);
        }

        /* Same 375 two-up squeeze section 2 has: two 146px frames plus a 14px
           gap come to 306 in a 331px box, and the smaller gap buys the margin
           out of the space between rather than out of the devices. */
        @media (max-width: 479px) {
          .student-screens { gap: 10px; }
        }

        /* ⚠️ ONE min-width:768 block for the heading curve, placed AFTER every
           base rule above. Section 2's equivalent was put in a 768-1023 range
           block first and silently stopped applying at 1024, dropping the
           heading back to its 27px mobile size. Same curve as section 2's, as
           peers: clamp(32px, 3.7vw, 46px). */
        @media (min-width: 768px) {
          .student-cta { display: inline-block; width: auto; }
          .student-heading { font-size: clamp(32px, 3.7vw, 46px); }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .student-section { padding: 72px var(--page-pad) 76px; }
          .student-heading { margin: 0 0 16px; }
          .student-sub     { font-size: 18px; }
          .student-phone   { --pw: 196px; border-radius: 26px; }
          .student-screens { gap: 18px; }
        }

        @media (min-width: 1024px) {
          /* ⚠️ THE FLIP, and it is the only structural difference from section
             2. Section 2 runs copy-left / screens-right; row-reverse puts the
             screens left and the copy right here.

             That keeps the page zig-zagging on which side the DEVICES sit:
             hero left, section 2 right, here left again. Two identical layouts
             back to back would read as one long section instead of two.

             ⚠️ DOM order stays copy-first so the stacked mobile layout reads
             heading -> subtext -> CTA -> screens. Only the desktop row is
             reversed, visually. */
          .student-section { padding: 84px 40px 88px; }
          .student-inner {
            flex-direction: row-reverse;
            gap: 72px;
            align-items: center;
          }
          .student-copy    { flex: 1; }
          /* ⚠️ width: auto is load-bearing, exactly as in section 2. The mobile
             rule sets width: 100% so the screens centre when stacked; carried
             into the row it makes them claim the full inner width and crush the
             copy column. flex: 0 0 auto alone does not undo it — the basis is
             auto, so the declared width still wins. */
          .student-screens { flex: 0 0 auto; width: auto; gap: 18px; }
          .student-heading { letter-spacing: -1.2px; margin: 0 0 18px; }
          .student-sub     { font-size: 18px; }
          .student-phone   { --pw: 222px; border-radius: 28px; }
        }

        /* ---- Pricing ------------------------------------------------------
           The resting, decided moment after two look-closer sections, and the
           colour says so: its own calm neutral rather than a fourth voice in
           either of the page's two colour conversations. */
        .pricing-section {
          /* ⚠️ REUSED, not invented — #f8f7f5 is already the page background on
             /privacy and /terms, so this is the site's existing near-white
             rather than a new value. Deliberately outside both families: the
             hero's cream is warm (hue 36) and sections 2 and 3 are blue (227
             and 229). This is effectively neutral, which is what makes it read
             as a resting point instead of another step in a sequence. */
          background: #f8f7f5;
          padding: 56px var(--page-pad) 64px;
          /* ⚠️ MOVED HERE from .student-section (Aug 5 2026). The page is a
             100vh flex column and this is its only grower, so it absorbs the
             slack when the content is shorter than the viewport — without it
             the shell colour shows as a band BELOW the footer. It belongs to
             whichever band is LAST before the footer, so it moves again if any
             section ever lands under this one. */
          flex: 1 0 auto;
        }
        /* Centred throughout — see the note on the section element for why this
           one does not zig-zag. */
        .pricing-inner {
          max-width: var(--page-max);
          margin: 0 auto;
          text-align: center;
        }
        .pricing-heading {
          font-size: 27px;
          line-height: 1.1;
          font-weight: 700;
          letter-spacing: -0.8px;
          color: #0f0f10;
          margin: 0 0 14px;
          text-wrap: balance;
        }
        .pricing-sub {
          font-size: 16px;
          line-height: 1.55;
          color: #55555c;
          margin: 0 auto;
          /* A measure, so the sentence does not run the full 960px shell when
             everything under it is a centred column. */
          max-width: 460px;
          text-wrap: pretty;
        }

        /* STACKED below 768, side by side above.

           ⚠️ The ORIGINAL reason no longer applies, and this note says so
           rather than quietly keeping a number whose justification has gone.
           The Pro CTA used to read "Start your program", which needed about
           160px of text plus padding — more than the roughly 170px of inner
           card width two cards get inside a 480px viewport, so the button
           would have wrapped. Both buttons now read "Start free" (about 85px),
           which clears that bound easily.

           768 stays anyway, on card PROPORTION rather than on the button: two
           cards at 480 are about 210px wide each, which is cramped for a price,
           a limit and a CTA no matter how short the label. That is a judgment,
           not a measurement — so if this is ever revisited, it is now a real
           choice rather than a constraint. */
        .pricing-cards {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          margin: 32px 0 0;
        }
        .pricing-card {
          box-sizing: border-box;
          width: 100%;
          max-width: 380px;
          border-radius: 16px;
          padding: 26px 24px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          /* Neutral-tinted, because this band is neutral — the same
             tint-from-the-surface rule the warm hero and the blue sections
             follow, which here resolves to a plain grey rather than a hue. */
          box-shadow:
            0 1px 3px rgba(20, 20, 24, 0.05),
            0 12px 32px -10px rgba(20, 20, 24, 0.14);
        }
        /* White on near-white: subtle on purpose. The card is defined by its
           hairline and shadow, and its job is to be the quiet half of a pair
           whose other half is nearly black. */
        .pricing-card-free {
          background: #ffffff;
          border: 1px solid rgba(15, 15, 16, 0.10);
        }
        /* ⚠️ #262a39 — section 2's band colour, so the paid tier is visibly
           part of the product's own palette rather than a fifth colour.
           It must be kept in step with .program-section if that ever moves. */
        .pricing-card-pro {
          background: #262a39;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .pricing-plan {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }
        .pricing-card-free .pricing-plan { color: #6b6b73; }
        .pricing-card-pro  .pricing-plan { color: #9095ac; }
        .pricing-price {
          margin: 10px 0 0;
          font-size: 40px;
          font-weight: 700;
          letter-spacing: -1.5px;
          line-height: 1;
        }
        .pricing-card-free .pricing-price { color: #0f0f10; }
        .pricing-card-pro  .pricing-price { color: #ffffff; }
        /* Rides with the number rather than sitting beside it at full size. */
        .pricing-per {
          font-size: 17px;
          font-weight: 600;
          letter-spacing: -0.3px;
        }
        .pricing-limit {
          margin: 10px 0 0;
          font-size: 15px;
          line-height: 1.4;
        }
        .pricing-card-free .pricing-limit { color: #55555c; }
        .pricing-card-pro  .pricing-limit { color: #a2a8b4; }
        /* ⚠️ Full width inside the card and with its own horizontal padding.
           .cta-real ships 38px of side padding for a button sitting free on a
           page; inside a card that is what pushes the label past the edge. The
           card decides the width here, not the text.

           ⚠️ This block also NORMALISES the two buttons to one size, and it has
           to restate every metric that differs. .cta-real and .signin-btn were
           built for different jobs elsewhere on the page — a page-level primary
           and a small header link — so inheriting them here rendered 57.5px
           against 41px, a 16.5px mismatch from three separate sources at once:
           17px/700 against 14px/600, 16px against 9px of vertical padding, and
           a border on one but not the other.

           Two buttons offering a straight either/or must be the same object at
           two weights. The ONLY difference is the fill.

           ⚠️ This is why the accessibility fix on .cta-real has to be repeated
           here. This rule OVERRIDES .cta-real's font-size for the Pro button,
           so leaving it at 17px would have quietly kept the failing size on the
           one CTA that sits next to a price. Restating it also keeps the pair
           identical: .pricing-cta is on BOTH buttons, so they grow together and
           the size parity above survives. The Free button does not need 19px
           for its own contrast — its ink is 19.16:1 on white — it needs it to
           stay the same object as its neighbour. */
        .pricing-cta {
          display: block;
          width: 100%;
          box-sizing: border-box;
          margin-top: 22px;
          /* See the AA note on .cta-real. >= 18.66px AND bold, or it fails. */
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -0.2px;
          line-height: 1.5;
          padding: 16px 14px;
          border-radius: 12px;
          text-align: center;
          /* ⚠️ A transparent border on BOTH, so the outlined one does not end
             up 2px taller than the filled one. box-sizing is border-box, so
             this costs no height — it just makes the two boxes identical. */
          border: 1px solid transparent;
        }
        /* Two classes, so it beats the transparent border above regardless of
           source order — the outline is the whole point of the quiet variant. */
        .pricing-card-free .pricing-cta { border-color: rgba(15, 15, 16, 0.22); }

        /* ---- The included-features block -----------------------------------
           ⚠️ NO container. A white panel lived here briefly and came out: it
           bought presence at the cost of becoming a third boxed object on a
           band that already has two. This sits open on the background, and its
           weight comes from type size and the badges instead.

           So there is deliberately no background, border, radius or shadow on
           any of these rules. Adding one puts the third-object problem back. */

        /* ⚠️ A short confident STATEMENT, not a section label — that is the
           whole point of this treatment. It was 13px, then 15px/600 with +0.4px
           tracking, and the tracking was what made it read as legal fine print:
           letterspaced small caps-ish text is the visual language of terms and
           conditions. Now 20px/700 with NEGATIVE tracking, which is the
           page's own headline idiom.

           ⚠️ The brand blue is only legible here because of its SIZE. White-ish
           backgrounds put #378add at 3.36:1, which fails AA for normal text and
           passes only under the large-text allowance — that needs >= 18.66px AND
           bold. Drop this below 20px, or to weight 600, and it silently fails.
           If it ever needs to be smaller, it has to stop being blue. */
        .pricing-included {
          margin: 52px 0 0;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.3px;
          color: #378add;
        }
        /* ⚠️ ONE column below 768, two above, and NO white-space: nowrap
           anywhere near it. Pinning these open is exactly the bug .bullet-text
           already had: an unbreakable line sets a min-content floor, and the
           PAGE widens instead of the line breaking. The columns change instead,
           so a long label can never push the document sideways.

           minmax(0, max-content) lets each column size to its longest label but
           still shrink rather than overflow. */
        .pricing-features {
          list-style: none;
          margin: 22px 0 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(1, minmax(0, max-content));
          justify-content: center;
          /* ⚠️ Row gap was 11px against a 48px column gap, which packed the
             rows into a dense block while holding the columns far apart — the
             single biggest reason this read as small print rather than as eight
             separate things. The two gaps are now in a sane relationship. */
          gap: 18px 48px;
          text-align: left;
        }
        .pricing-feature {
          display: flex;
          align-items: center;
          gap: 13px;
          /* ⚠️ 16px was BELOW this section's own subtext (18px), which is what
             made it read as secondary regardless of anything else. 17px sits
             just under the subtext rather than beneath it. */
          font-size: 17px;
          line-height: 1.45;
          color: #2e2e33;
        }
        /* ⚠️ A TINTED disc, not a solid one, and the distinction is about
           repetition rather than any single badge. A solid brand-blue fill at
           this size looked right once and read as a wall of blue dots eight
           times over — the marks stopped supporting the labels and started
           competing with them, and with the CTAs.

           ⚠️ It also must not fall back to the thin glyph this replaced, which
           read as a bullet. The landing point between the two is: keep the
           SCALE (24px, 1.4x the label) and the chunky stroke, drop only the
           colour weight. Size carries the presence, tint carries the calm.

           ⚠️ #e8effa is a NEW value, despite looking like a token — it appears
           nowhere else in src/. It is a pale wash of the brand blue and exists
           only to seat these checks. Do not reach for it as a general surface
           without deciding that separately. */
        .pricing-badge {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: #e8effa;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        @media (min-width: 768px) {
          .pricing-section  { padding: 76px var(--page-pad) 84px; }
          /* Peer with sections 2 and 3 — the same curve, for the same reason
             they are peers with each other: these are co-equal sections, not a
             descending hierarchy. */
          .pricing-heading  { font-size: clamp(32px, 3.7vw, 46px); margin: 0 0 16px; }
          .pricing-sub      { font-size: 18px; max-width: 520px; }
          .pricing-cards    { flex-direction: row; align-items: stretch; justify-content: center; gap: 20px; margin-top: 40px; }
          .pricing-card     { max-width: 330px; flex: 1 1 0; }
          /* Stays >= 18.66px and bold at every width — see the AA note on the
             base rule, which is load-bearing for the blue. */
          .pricing-included { margin-top: 68px; font-size: 22px; }
          .pricing-features { grid-template-columns: repeat(2, minmax(0, max-content)); gap: 22px 64px; margin-top: 26px; }
          .pricing-feature  { font-size: 17px; }
          .pricing-badge    { width: 26px; height: 26px; }
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
            max-width: var(--page-max);
            margin: 0 auto;
          }
          .footer-desktop a, .footer-desktop span {
            font-size: 12px !important;
            white-space: nowrap;
          }
        }
        @media (min-width: 1024px) {
          /* ⚠️ Still hugs the device here. This block used to re-declare
             flex/width from --hero-w AFTER the 768 override, which quietly put
             the 420px column back and left 152px of dead space between the
             device and the copy — the override at 768 looked like it worked and
             did nothing above 1023. --hero-w stays defined for the stacked
             layout below 768 and is deliberately not used at this width. */
          .landing-image-wrap {
            --hero-w: 420px;
            flex: 0 0 auto;
            width: auto;
          }
          .hero-device { --pw: 268px; }
        }
      `}</style>
    </div>
  );
}
