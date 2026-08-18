"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addPlayer } from "./actions";
import { useUpgrade } from "@/lib/use-upgrade";
import { PRO_STUDENT_LIMIT } from "@/lib/entitlement";
import { SMS_CONSENT_SCRIPT } from "@/lib/consent";

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

// The "what to say" disclosure, collapsed by default.
//
// ⚠️ Reuses InactiveGroup's shape rather than inventing chrome — it is the app's
// only content expand/collapse (the other three aria-expanded controls are
// dropdown menus). Same 44px target with a negative margin cancelling the added
// height, same rotating chevron so the control reads as one thing in two states.
//
// ⚠️ type="button" is LOAD-BEARING. This sits inside the add-player <form>, and
// a bare <button> defaults to type="submit" — tapping "What to say" would
// submit the form and add the student.
function ConsentScript() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="-my-2 flex h-11 items-center gap-1.5 text-[13px] text-[#8a8fa8] transition-colors hover:text-white"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        What to say
        <span
          aria-hidden="true"
          className="text-[10px] transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "none" }}
        >
          ▶
        </span>
      </button>
      {/* Verbatim from /terms via one shared constant. This is the first place
          that script is reachable at the moment a coach needs it. */}
      {open && (
        <p className="mt-2 text-[13px] italic leading-relaxed text-[#8a8fa8]">
          &ldquo;{SMS_CONSENT_SCRIPT}&rdquo;
        </p>
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
        {isParent ? (
          // One paragraph, not two. The second line used to be its own <p> with
          // mt-0.5 — 2px, too small to read as a deliberate paragraph break and
          // too large to read as continuous text, so it landed as neither.
          <p className="mt-2 text-[13px] text-[#5a5f72]">
            They&apos;ll get a text when you assign work — to share with{" "}
            {firstName || "them"}. Great for younger students.
          </p>
        ) : (
          <p className="mt-2 text-[13px] text-[#5a5f72]">
            They&apos;ll get a text when you assign work.
          </p>
        )}

        {/* ⚠️ THE CONSENT REQUIREMENT, stated where a coach can act on it. It
            lived only in /terms and /privacy — documents nothing in the app
            linked to until Aug 17 — while this screen, the one place someone is
            about to type another person's number, said nothing.

            ⚠️ SHARED ACROSS BOTH TOGGLE STATES on purpose. /terms and /privacy
            both say "student or parent phone number" in one breath; two consent
            standards is precisely the divergence the Aug 16 /faq removal ended.
            The parenthetical carries the minors distinction /privacy's minors
            section establishes — permission from the student OR their parent —
            because this is the only screen where that is actionable.

            ⚠️ It STATES an obligation, it does not reassure. The pulled /faq
            answer read "if you already have that relationship, most coaches do,
            you're fine... just one text instead of many" and was removed for
            being softer than the documents it summarised. None of that framing
            comes back: no "if you already", no "most coaches", no "just one
            text".

            ⚠️ #8a8fa8, not the #5a5f72 the line above uses. That value measures
            3.11:1 on this background and already fails AA — a pre-existing
            defect, not introduced here, and left alone as out of scope. This
            line is a legal obligation and gets 6.17:1. The side effect is that
            it reads one step brighter than the informational line above it,
            which is the correct ranking anyway. */}
        <p className="mt-2 text-[13px] text-[#8a8fa8]">
          Get their OK first (or a parent&apos;s, if they&apos;re younger) before adding this number.
        </p>
        <ConsentScript />

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
