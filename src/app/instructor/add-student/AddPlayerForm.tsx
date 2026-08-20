"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addPlayer } from "./actions";
import { useUpgrade } from "@/lib/use-upgrade";
import { PRO_STUDENT_LIMIT } from "@/lib/entitlement";

const INPUT =
  "w-full rounded-[10px] border border-[#2a2d36] bg-[#1c1f26] px-[14px] py-[13px] text-base text-white outline-none transition-colors placeholder:text-[#5a5f72] focus:border-[#378add]";

type Recipient = "player" | "parent";

type Props = {
  studentLabel: string;
  studentsLabel: string;
  /** Coach already at their plan's ACTIVE-student limit — show the block, not
   *  the form. */
  atLimit: boolean;
  /** Whether the block has an upgrade to offer. False for a Pro coach at 30,
   *  who has no higher plan to sell and needs different copy. */
  canUpgrade: boolean;
  /** ACTIVE students, not total — a deactivated student consumes no seat. */
  playerCount: number;
  /** This coach's plan ceiling: FREE_STUDENT_LIMIT or PRO_STUDENT_LIMIT. */
  limit: number;
};

// The free-tier paywall, rendered in place of the form inside the SAME screen
// shell — same back link, same padding — rather than as a redirect or a modal.
// A redirect would strand the coach on the roster and leave them hunting for an
// upgrade item buried in a dropdown; a modal is ceremony this screen uses
// nowhere else. Standing still and explaining is the cheapest correct answer.
//
// Warm before transactional, deliberately: reaching the limit means the coach
// is actually using the product, and the first line says so before the second
// one asks for money.
function UpgradeBlock({
  shownCount,
  studentsLabel,
  onUpgrade,
  upgrading,
  upgradeError,
}: {
  shownCount: number;
  studentsLabel: string;
  onUpgrade: () => void;
  upgrading: boolean;
  upgradeError: string;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-[17px] font-semibold leading-snug text-white">
        You&apos;ve got {shownCount} {studentsLabel} — nice work.
      </h1>
      {/* ⚠️ NO LONGER COPY ONLY. entitlement.ts now defines PRO_STUDENT_LIMIT
          and addPlayer() enforces it, so this number is read from the constant
          rather than typed — the string a coach reads and the number the gate
          computes cannot drift. The landing pricing card and /faq still hold
          hand-written 30s; those two are unlinked and move by hand.

          ⚠️ It previously read "Pro unlocks unlimited, $10/month", which
          contradicted the landing page's pricing card once that changed to
          "up to 30 students". This is the surface a coach sees at the moment
          they are asked to pay, so it was the more important of the two to
          correct. Reuses studentsLabel so the noun still follows the coach's
          activity, exactly as the heading above does. */}
      <p className="mt-2 text-[14px] leading-relaxed text-[#8a8fa8]">
        Pro takes you up to {PRO_STUDENT_LIMIT} {studentsLabel}, $10/month.
      </p>

      {/* 32px above a full-width primary button, matching CountScreen,
          CustomExerciseScreen and the add form's own submit. */}
      <button
        type="button"
        onClick={onUpgrade}
        disabled={upgrading}
        className="mt-8 w-full rounded-[10px] bg-[#378add] py-[14px] text-[15px] font-semibold text-white transition-all hover:bg-[#4a9ae8] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
      >
        {upgrading ? "Starting…" : "Upgrade to Pro"}
      </button>

      {/* Inline and quiet. The failures reachable here are configuration
          problems a coach cannot act on beyond retrying, so they get a line
          rather than the red bordered box the form uses for input they can
          actually fix. */}
      {upgradeError && (
        <p className="mt-3 text-[13px] leading-snug text-red-400">{upgradeError}</p>
      )}
    </div>
  );
}

// The PRO CEILING, which is a different dead end from the paywall above and must
// not read like one. A Pro coach at 30 has already paid; there is no higher plan
// to sell them, so offering an upgrade button here would be a lie dressed as a
// solution. It names the move that actually works instead — deactivate someone —
// which is exactly what deactivation exists for.
//
// Same shell, same warm-before-transactional order as UpgradeBlock, no CTA.
function CeilingBlock({
  shownCount,
  studentsLabel,
}: {
  shownCount: number;
  studentsLabel: string;
}) {
  return (
    <div className="flex flex-1 flex-col">
      {/* ⚠️ THE BLUE CAPACITY SURFACE. This screen is the third member of that
          family — the roster's "Assigning is on hold" banner and the "No spot"
          modal are the other two — and until now it was the only one still
          rendering as bare copy on the page background, which read as a wall of
          black. Blue marks plan capacity; a coach should recognise what this is
          about before reading a word of it.

          Same fill and outline as the roster banner, deliberately identical
          rather than merely similar. */}
      <div
        className="rounded-[10px] px-[14px] py-4"
        style={{ background: "#18222d", border: "1px solid rgba(55,138,221,0.35)" }}
      >
        {/* ⚠️ The count and noun stay dynamic — this reads "30 active players"
            for a basketball coach and "30 active students" for a piano teacher,
            the same way every other gate string follows getActivityLabels().

            Framing matters here: reaching 30 is not an error, it is a coach who
            has built something. The headline names the achievement before the
            body names the constraint.

            ⚠️ TWO SENTENCES, no em dash. The source always had a proper space
            around it (verified at byte level), but the h1 wraps at exactly that
            space on a phone, which puts the dash at the head of the next line
            and reads as though the space is missing. A period cannot do that,
            and it matches the em-dash removal applied across the modals. */}
        <h1 className="text-[17px] font-semibold leading-snug text-white">
          {shownCount} active {studentsLabel}. You&apos;ve maxed out Pro.
        </h1>
        {/* Two short lines rather than one paragraph: the first is the action
            available right now, the second is the way out if 30 genuinely is not
            enough. Run together they read as one wall and neither lands. */}
        <p className="mt-2 text-[14px] leading-relaxed text-[#8a8fa8]">
          Deactivate someone you&apos;re not working with right now to free up a
          spot. Nothing of theirs is lost, bring them back anytime.
        </p>
        {/* ⚠️ "Need more than 30?" is deliberately the SAME opening as the note on
            the landing page's Pro card. A coach who hit this screen and later goes
            looking for what they half-remember should find the same promise in the
            same words, not a near-miss that makes them wonder if it changed.

            The number comes from the constant; the landing page's copy of it is
            still a hand-written string. */}
        <p className="mt-3 text-[14px] leading-relaxed text-[#8a8fa8]">
          Need more than {PRO_STUDENT_LIMIT}?{" "}
          {/* ⚠️ #5ba3ea, not #378add, and the tint above is why. The brand blue
              measures 4.47:1 as body text on #18222d — under the 4.5 AA floor —
              where #5ba3ea clears at 6.03:1. Exactly the regression adding this
              tint caused on the roster banner's CTA; same fix, same reason. */}
          <a
            href="mailto:hello@assignreps.com"
            className="underline underline-offset-2 transition-colors"
            style={{ color: "#5ba3ea" }}
          >
            Email us
          </a>{" "}
          and we&apos;ll set you up.
        </p>
      </div>
    </div>
  );
}

// useLayoutEffect warns when a client component is server-rendered, and this one
// is. Same shim ScrollToTop uses: fall back on the server, keep pre-paint timing
// in the browser — which is what stops the tooltip flashing at left:0 before it
// is measured and moved.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// The consent affordance: a 16px "i" beside the helper line, revealing the
// requirement on tap.
//
// ⚠️ REPLACED a standalone consent sentence plus a "What to say" disclosure that
// quoted the script from /terms verbatim. That was pulled after a design review:
// the script read as an unfamiliar pattern on a screen whose other copy is one
// short line. The REQUIREMENT survives; the script does not appear here.
//
// ⚠️ A FLEX ROW, not an inline button inside the <p>. The first attempt put a
// 44px inline-flex button in the paragraph with -my-[14px] to cancel the height.
// THAT DOES NOT WORK: vertical margins on an INLINE-level box are ignored when
// the line box is measured, so the 44px button inflated the whole line to 44px —
// which is what made the gap under the phone field look wrong and the icon look
// like it was drifting away from the text. In a flex row the same negative
// margin DOES reduce the item's outer size, which is why the identical trick is
// correct in InactiveGroup and was wrong here.
//
// ⚠️ NO TOOLTIP PATTERN EXISTS IN THIS APP. The dismissal borrows what the four
// overflow menus use — a full-screen click-away at z-40, panel at z-50 — but the
// SIZING is its own. Those panels are min-w-[180px] and were tuned for labels
// like "Archive"; a sentence in that width wraps to a skinny column.
//
// ⚠️ type="button" is LOAD-BEARING. This sits inside the add-player <form>, and
// a bare <button> defaults to type="submit" — tapping the icon would add the
// student.
function ConsentInfo({ isParent, children }: { isParent: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  // null until measured, so the box never paints at its unpositioned default.
  const [pos, setPos] = useState<{ left: number; caret: number } | null>(null);

  // ⚠️ MEASURED, not CSS. Centring on the icon is trivial in CSS; keeping the
  // box on screen when centring would push it off is not, because the icon sits
  // at the END of a sentence whose length changes with the student's name and
  // the tab. So: centre on the icon, clamp the BOX to the column, then move the
  // CARET within the box to keep pointing at the icon's real position. The box
  // gives up its centring before the caret gives up its target.
  useIsoLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    const wrap = wrapRef.current, icon = iconRef.current, box = boxRef.current;
    if (!wrap || !icon || !box) return;
    const w = wrap.getBoundingClientRect();
    const ic = icon.getBoundingClientRect();
    const bw = box.offsetWidth;
    const iconCentre = ic.left + ic.width / 2 - w.left;
    const left = Math.max(0, Math.min(iconCentre - bw / 2, w.width - bw));
    // Kept off the rounded corners so the caret never straddles one.
    const caret = Math.min(Math.max(iconCentre - left, 14), bw - 14);
    setPos({ left, caret });
  }, [open, isParent, children]);

  return (
    // Owns the row's top margin so the text-to-field gap matches the 8px the
    // label above the field uses. The paragraph itself carries none.
    <div ref={wrapRef} className="relative mt-2">
      <p className="flex items-center gap-1.5 text-[13px] text-[#5a5f72]">
        <span>{children}</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Why we ask"
          // 44px target around a 16px glyph. As a FLEX ITEM the negative margin
          // genuinely cancels the extra, so the row stays 16px tall.
          className="-m-[14px] flex h-11 w-11 shrink-0 items-center justify-center"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <span
            ref={iconRef}
            aria-hidden="true"
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold leading-none"
            style={{ border: "1px solid #5a5f72", color: "#5a5f72" }}
          >
            i
          </span>
        </button>
      </p>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* ⚠️ IT HAS TO READ AS FLOATING, and the first attempt did not. It was
              full-bleed (left-0 right-0) on #22252e, which is 1.08:1 against the
              #1c1f26 the inputs and the disabled Add button use — a full-width
              rectangle in near-identical grey reads as one more form field, and
              it landed on top of the submit button.

              Four changes, each doing one job:

              1. AUTO WIDTH, capped. w-max sizes to the sentence; max-w-[260px]
                 is ~67% of a 390px phone. A FIXED cap rather than a vw unit
                 because the instructor shell is max-w-[390px] and centred — on
                 a desktop window, 68vw would blow well past the column.

              2. #2a2d36 SURFACE, not #22252e and not #1c1f26. ⚠️ The
                 deactivation modals use #1c1f26 — the exact colour of the
                 disabled button and the inputs — so copying them would have
                 made this worse. #2a2d36 is the app's own line colour used as a
                 surface, the lightest step that still belongs to the palette.

              3. OPENS UPWARD (bottom-full), so it can never cover "Add player".
                 There is always more room above here: the phone field, the
                 label and the name field are all above it, and floating over an
                 input is what an overlay is FOR. Covering the primary action is
                 not.

              4. rounded-[10px] and a #3a3d46 border, the app's dominant radius
                 and its brightest line, plus the shadow the menus already use.

              ⚠️ Text is #c8cdd8, NOT the #8a8fa8 used elsewhere. On this lighter
              surface reps-sub measures 4.31:1 — under AA. reps-label is 8.63:1.

              ⚠️ Copy states the requirement and must not soften it. The Aug 16
              /faq removal pulled an answer reading "if you already have that
              relationship, most coaches do, you're fine" for being weaker than
              /terms and /privacy. None of that framing returns.

              ⚠️ The two variants differ only in WHO to ask, never in whether
              consent is needed. Forking the standard by recipient is the
              divergence that removal fixed. */}
          <div
            ref={boxRef}
            role="tooltip"
            className="absolute bottom-full z-50 mb-3 w-max max-w-[260px] rounded-[10px] px-3 py-2.5 text-[12px] leading-relaxed shadow-xl"
            style={{
              background: "#2a2d36",
              border: "1px solid #3a3d46",
              color: "#c8cdd8",
              left: pos ? pos.left : 0,
              // Hidden for the frame before measurement. useIsoLayoutEffect runs
              // pre-paint so this should never be seen, but it costs nothing and
              // removes any chance of a jump from left:0.
              visibility: pos ? "visible" : "hidden",
            }}
          >
            {isParent
              ? "Get the parent's OK before adding this number."
              : "Get their OK before adding this number. If they're younger, ask a parent instead."}
            {/* ⚠️ HAND-BUILT, and this is the app's FIRST tooltip — treat it as
                the template for any future info affordance. There is no
                popover-with-arrow anywhere in this codebase and no library that
                provides one: the dependencies are Supabase, Stripe, Next, React
                and lucide, which is icons only. Every other "arrow" in the app
                is a back-link glyph.

                ⚠️ TWO STACKED CSS TRIANGLES, not one rotated square. The square
                version shipped first and read as flush and rounded against the
                icon rather than as a point — a 45deg rotation puts the box's
                corner radius and its two borders on the diagonal, so the tip is
                never crisp. The border-trick triangle has no rotation and no
                corners, so it cannot pick up either artifact.

                The outline is faked by layering: a 7px triangle in the border
                colour behind a 6px triangle in the fill colour, which leaves a
                1px sliver of border showing along both slanted edges and at the
                tip.

                ⚠️ BOTH sit 1px higher than the box's outer edge (-6 / -5 rather
                than -7 / -6) so their flat tops cover the box's own 1px bottom
                border across the caret's width. Without that, a hairline runs
                straight across the base of the arrow and it reads as a separate
                shape stuck underneath the box.

                translateX(-50%) means `left` is the caret's CENTRE, which is
                what the measurement above computes. Positioning and clamping are
                untouched — only the shape changed. */}
            <span
              aria-hidden="true"
              className="absolute"
              style={{
                bottom: -6,
                left: pos ? pos.caret : 0,
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "7px solid transparent",
                borderRight: "7px solid transparent",
                borderTop: "7px solid #3a3d46",
              }}
            />
            <span
              aria-hidden="true"
              className="absolute"
              style={{
                bottom: -5,
                left: pos ? pos.caret : 0,
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid #2a2d36",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default function AddPlayerForm({
  studentLabel,
  studentsLabel,
  atLimit,
  canUpgrade,
  playerCount,
  limit,
}: Props) {
  const router = useRouter();

  const [name, setName]           = useState("");
  const [phone, setPhone]         = useState("");
  const [recipient, setRecipient] = useState<Recipient>("player");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  // Which block to show, or null for the form. Seeded from the server's read but
  // able to flip on its own: the action is the real gate, so a coach whose page
  // loaded under the limit (stale tab, second device, the race the action
  // documents) gets the right block on submit rather than a red validation box.
  //
  // ⚠️ The KIND is tracked, not just a boolean, and it is re-set from the
  // action's own code rather than from the page prop. A coach who upgraded in
  // another tab would otherwise be shown the free paywall while the action was
  // blocking them on the Pro ceiling — the action knows which dead end it just
  // enforced, so it decides.
  const [blockKind, setBlockKind] = useState<null | "upgrade" | "ceiling">(
    atLimit ? (canUpgrade ? "upgrade" : "ceiling") : null,
  );

  // Same handler the ProfileMenu's "Upgrade to Pro" item uses.
  const { startUpgrade, upgrading, upgradeError } = useUpgrade();

  const isParent = recipient === "parent";

  // CTA is active only with a name and a full 10-digit phone number.
  const firstName  = name.trim().split(/\s+/)[0];
  const phoneValid = phone.replace(/\D/g, "").length === 10;
  const formValid  = name.trim().length > 0 && phoneValid;

  function toE164(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
    if (digits.length === 10) return `+1${digits}`;
    return `+${digits}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim())  { setError(`Enter the ${studentLabel}'s name.`); return; }
    if (!phone.trim()) { setError("Enter a phone number."); return; }

    setLoading(true);
    const result = await addPlayer(
      name.trim(),
      toE164(phone),
      null,
      isParent
    );
    setLoading(false);

    if (!result.ok) {
      // A seat limit is not a validation failure and must not read as one —
      // swap the whole screen for the matching block instead of reddening the
      // form the coach filled in correctly.
      if (result.code === "limit_reached")   { setBlockKind("upgrade"); return; }
      if (result.code === "ceiling_reached") { setBlockKind("ceiling"); return; }
      setError(result.error);
      return;
    }
    router.push("/instructor/students");
  }

  // What the block claims the coach has. Normally the server's count, but a
  // stale page can arrive here reporting fewer than the limit — the action
  // blocked on a fresher number than this component was rendered with. Never
  // print a figure lower than the limit that was just enforced.
  const shownCount = Math.max(playerCount, limit);

  return (
    <main className="flex min-h-screen flex-col bg-[#080b0f] px-6 pb-10 pt-9">

      {/* Header — the seventh back link, brought in line with the other six.
          It had the same two faults they did: a 36px target (under the 44px
          minimum) and the label sitting in a <span> beside the link rather than
          inside it, so tapping the words did nothing.

          Structure is lifted verbatim from CountScreen/CustomExerciseScreen:
          arrow AND label inside one 44px-tall Link, -ml-4/pl-4 putting the
          glyph optically on the content edge while the target reaches toward
          the screen edge, and gap-2 rather than the parent's old gap-3 so the
          spacing reads the same as everywhere else.

          The colours are unchanged, only re-expressed as tokens: the literal
          #8a8fa8 was --reps-sub and text-white was --reps-ink all along. */}
      <div className="mb-10 flex items-center">
        <Link
          href="/instructor/students"
          aria-label="Back"
          className="group -ml-4 flex h-11 shrink-0 items-center gap-2 rounded-full pl-4 pr-3 transition-colors"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <span className="text-lg leading-none text-reps-sub group-hover:text-reps-ink transition-colors">←</span>
          <span className="text-[14px] font-medium text-reps-ink">Add {studentLabel}</span>
        </Link>
      </div>

      {blockKind ? (
        blockKind === "upgrade" ? (
          <UpgradeBlock
            shownCount={shownCount}
            studentsLabel={studentsLabel}
            onUpgrade={startUpgrade}
            upgrading={upgrading}
            upgradeError={upgradeError}
          />
        ) : (
          <CeilingBlock shownCount={shownCount} studentsLabel={studentsLabel} />
        )
      ) : (
      <>
      {error && (
        <div className="mb-6 rounded-[10px] border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">

        {/* Name */}
        <label className="mb-2 block text-[13px] font-medium text-[var(--reps-label)]">Name</label>
        <input
          type="text"
          placeholder="First name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className={`${INPUT} mb-8`}
        />

        {/* Phone — label with an inline mini-segment for whose number this is */}
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-[13px] font-medium text-[var(--reps-label)]">Send homework to</label>
          <div className="flex items-center gap-[2px] rounded-[7px] bg-[#1c1f26] p-[3px]">
            {([
              ["player", studentLabel.charAt(0).toUpperCase() + studentLabel.slice(1)],
              ["parent", "Parent"],
            ] as [Recipient, string][]).map(([value, label]) => {
              const active = recipient === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setRecipient(value)}
                  className={`rounded-[5px] px-[10px] py-[3px] text-[11px] transition-colors ${
                    active ? "bg-[#378add] text-white" : "text-[#8a8fa8] hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <input
          type="tel"
          placeholder="(555) 000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={INPUT}
        />
        {/* One line per tab. ConsentInfo owns the paragraph and its spacing, so
            the icon sits in the same flex row as the text rather than inside it.
            ⚠️ The parent line lost "when you assign work" and "Great for younger
            students" to get to one line. "They" was already correct — it is the
            recipient, not the coach — and the em dash went with the trim. */}
        <ConsentInfo isParent={isParent}>
          {isParent
            ? `They'll get a text to share with ${firstName || "them"}.`
            : "They'll get a text when you assign work."}
        </ConsentInfo>


        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !formValid}
          className={`mt-8 w-full rounded-[10px] py-[14px] text-[15px] font-semibold transition-all disabled:pointer-events-none ${
            formValid
              ? "bg-[#378add] text-white hover:bg-[#4a9ae8] active:scale-[0.99]"
              : "bg-[#1c1f26] text-[#3d4252]"
          }`}
        >
          {loading ? "Adding…" : formValid ? `Add ${firstName}` : `Add ${studentLabel}`}
        </button>
      </form>
      </>
      )}
    </main>
  );
}
