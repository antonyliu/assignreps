"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveLog } from "./actions";

type Props = {
  token: string;
  playerId: string;
  assignmentId: string;
  exerciseName: string;
  target: number;
  unit: string;
  alreadyLogged: number;
  /** Sum of makes across this assignment's prior logs. Seeds the bright bar layer
   *  on return so it reflects banked makes, not just this session's. */
  alreadyMakes: number;
  coachName: string;
  trackMakes: boolean;
  /** Undefined for custom exercises, which belong to no category. */
  categoryKey?: string;
};

// The screen's hero line. Kept short enough to hold one line on a 390px phone.
// Only shooting-type drills get their own noun — finishing and plain rep work
// share the generic wording, so neither needs a branch. Minutes win over all of
// it: you don't take shots for ten minutes' worth of dribbling.
// Small uppercase section label. Colour carries the attempts/makes distinction.
function FieldLabel({
  htmlFor,
  text,
  color,
  sizeClass,
}: {
  htmlFor: string;
  text: string;
  color: string;
  sizeClass: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block font-semibold uppercase tracking-[1.5px] ${sizeClass}`}
      style={{ color }}
    >
      {text}
    </label>
  );
}

// One stepper row: −, a bare editable number, +. The number carries no box —
// it floats between the buttons. Sized by the caller so the same control can be
// the hero (48px buttons, full width) or the inline mini row (32px, compact).
function StepperRow({
  id,
  value,
  onValue,
  onStep,
  onBlur,
  buttonClass,
  numberClass,
  inputWidthClass,
  gapClass,
  minusDisabled,
  plusDisabled,
  inputDisabled,
  label,
}: {
  id: string;
  value: string;
  onValue: (v: string) => void;
  onStep: (delta: number) => void;
  /** Settle a typed value once the field is left. Optional — the attempts
   *  stepper needs no correction, since its own ceiling already bounds it. */
  onBlur?: () => void;
  buttonClass: string;
  numberClass: string;
  inputWidthClass: string;
  gapClass: string;
  minusDisabled: boolean;
  plusDisabled: boolean;
  inputDisabled: boolean;
  label: string;
}) {
  // Disabled goes to a visible grey (#555) rather than near-invisible opacity, so
  // an inactive − still reads in bright light.
  const btn = `shrink-0 rounded-full bg-[#2a2d36] text-reps-ink leading-none flex items-center justify-center active:scale-[0.92] transition-all disabled:text-[#555] disabled:pointer-events-none ${buttonClass}`;

  return (
    <div className={`flex items-center ${gapClass}`}>
      <button type="button" aria-label={`Decrease ${label}`} onClick={() => onStep(-1)} disabled={minusDisabled} className={btn}>
        −
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => onValue(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={onBlur}
        disabled={inputDisabled}
        placeholder="0"
        className={`bg-transparent border-0 leading-none text-center tabular-nums outline-none disabled:opacity-40 ${inputWidthClass} ${numberClass}`}
      />
      <button type="button" aria-label={`Increase ${label}`} onClick={() => onStep(1)} disabled={plusDisabled} className={btn}>
        +
      </button>
    </div>
  );
}

// Label for the hero stepper. Shooting-type drills that track makes are counting
// attempts — the number logged there is what went up, makes are the subset that
// went in. Every other rep drill is just reps; timed drills count minutes.
// A shooting drill with makes turned off is plain reps too: without a makes
// field, "attempts" has nothing to contrast against.
const ATTEMPTS_CATEGORIES = new Set(["shooting", "finishing", "spot-shots"]);
function primaryLabel(unit: string, trackMakes: boolean, categoryKey?: string): string {
  if (unit === "minutes") return "MINUTES";
  if (trackMakes && categoryKey !== undefined && ATTEMPTS_CATEGORIES.has(categoryKey)) {
    return "ATTEMPTS";
  }
  return "REPS";
}

// Two greens on a grey track, one standard pair app-wide. Each measure owns
// exactly one shade — attempts is #3d7a24 for its bar fill, label and number
// alike (and for the coach detail bars); makes is #6bd63d for the same three —
// so label and number read as one colour unit rather than two weights of the
// same idea. Both sit near hue 100°, so nothing slides between lime and teal.
//
// Makes was specified as #3dd68c; that measures hue 151° (emerald), ~50° off
// the rest. #6bd63d is the same colour rotated back into the family — identical
// saturation 65% and lightness 54%.
const BAR_TRACK = "#2a2d36";
const BAR_ATTEMPTS = "#3d7a24";
const ATTEMPTS_GREEN = "#3d7a24";
const MAKES_GREEN = "#6bd63d";
// Locked makes row. Green at any weight still reads as live, so the label and
// number drop out of the family entirely rather than just fading. This is the
// same #555 the disabled stepper buttons use: --reps-sub at full strength sat
// brighter than both them and the number — which the input's disabled:opacity-40
// lands at roughly #414552 — leaving the label the one part of an inert row that
// still looked available.
const MUTED_GREY = "#555";

// Written out in full rather than composed, so Tailwind sees each class literally.
// A reps-only assignment has no second field to rank against, so it takes the
// bright green outright instead of the muted attempts shade.
const ATTEMPTS_NUMBER =
  "text-[76px] font-semibold text-[#3d7a24] placeholder:text-[#3d7a24] placeholder:opacity-100";
const SOLO_NUMBER =
  "text-[76px] font-semibold text-[#6bd63d] placeholder:text-[#6bd63d] placeholder:opacity-100";
const MAKES_NUMBER =
  "text-[31px] font-semibold text-[#6bd63d] placeholder:text-[#6bd63d] placeholder:opacity-100";
const MAKES_NUMBER_MUTED =
  "text-[31px] font-semibold text-[#8a8fa8] placeholder:text-[#8a8fa8] placeholder:opacity-100";

export default function LogScreen({
  token,
  playerId,
  assignmentId,
  exerciseName,
  target,
  unit,
  alreadyLogged,
  alreadyMakes,
  coachName,
  trackMakes,
  categoryKey,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  // The steppers show running TOTALS, seeded from what's already banked, so
  // reopening a part-logged assignment picks up where the student left off
  // instead of at zero — matching the bar, which already seeded this way.
  const [amountInput, setAmountInput] = useState(String(alreadyLogged));
  const [makesInput, setMakesInput]   = useState(String(alreadyMakes));

  // ⚠️ `logs` rows are increments, not snapshots: each save appends one row and
  // the totals are summed at read time. So what's persisted is the DELTA between
  // the displayed total and what was already banked — writing the total itself
  // would re-log every prior session.
  //
  // A total can't fall below what's banked (there's no un-logging). Only
  // non-makes work is capped at target: attempts are the denominator of a
  // shooting percentage, so a real 60-attempt session against a 50 target has to
  // survive intact rather than being trimmed to 50.
  const amountCeiling = trackMakes ? Infinity : target;
  const parsedAmount = parseInt(amountInput, 10);
  const current = Number.isNaN(parsedAmount)
    ? alreadyLogged
    : Math.min(Math.max(parsedAmount, alreadyLogged), amountCeiling);
  const added = current - alreadyLogged;

  const parsedMakes = parseInt(makesInput, 10);
  const makesTotal = Number.isNaN(parsedMakes)
    ? alreadyMakes
    : Math.max(parsedMakes, alreadyMakes);
  const makesAdded = makesTotal - alreadyMakes;

  const pct  = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const done = current >= target;

  const label = primaryLabel(unit, trackMakes, categoryKey);

  // Steppers move the displayed total, floored at what's banked and ceilinged as
  // above. Functional updates, not the closed-over value: taps fired faster than
  // React re-renders would otherwise all read the same stale number and collapse
  // into a single increment.
  function step(delta: number) {
    setAmountInput((prev) => {
      const p = parseInt(prev, 10);
      const base = Number.isNaN(p) ? alreadyLogged : p;
      return String(Math.min(Math.max(base + delta, alreadyLogged), amountCeiling));
    });
  }

  // Makes are never clamped against attempts in the DATA — a mismatch that is
  // already banked is the coach's signal that something went wrong, not something
  // to silently rewrite here. The guard lives on the controls instead (see
  // makesLocked and the makes plusDisabled below), which stops a new mismatch
  // being entered without correcting an old one.
  function stepMakes(delta: number) {
    setMakesInput((prev) => {
      const p = parseInt(prev, 10);
      const base = Number.isNaN(p) ? alreadyMakes : p;
      return String(Math.max(base + delta, alreadyMakes));
    });
  }

  // The + stops at parity, but nothing stops a student typing straight past it.
  // Settle the field on blur rather than while they type: clamping mid-keystroke
  // makes "50" unreachable via "5" -> "50" on an assignment with 40 attempts.
  // Snaps silently — an over-count is a slip, not something worth an error.
  // The banked floor still wins over the cap, so a legacy row whose makes already
  // exceed its attempts is left alone rather than being retroactively trimmed.
  function settleMakes() {
    setMakesInput((prev) => {
      const p = parseInt(prev, 10);
      if (Number.isNaN(p)) return String(alreadyMakes);
      return String(Math.max(Math.min(p, current), alreadyMakes));
    });
  }

  // The + stopping at parity only holds the ceiling still; it does nothing when
  // the ceiling itself drops. Tapping − on attempts past the makes total has to
  // drag makes down with it, live, or the row is left showing more makes than
  // attempts — the exact state the + guard exists to prevent.
  //
  // Keyed on `current` alone, so it fires only when attempts actually move: it
  // never runs while the makes field is being edited, and so can't fight a number
  // mid-typing or pre-empt the blur settle above. Returning `prev` untouched when
  // nothing needs clamping stops it looping. The banked floor still wins, so a
  // legacy row whose makes already exceed its attempts is left alone.
  useEffect(() => {
    setMakesInput((prev) => {
      const p = parseInt(prev, 10);
      if (Number.isNaN(p)) return prev;
      const capped = Math.max(Math.min(p, current), alreadyMakes);
      return capped === p ? prev : String(capped);
    });
  }, [current, alreadyMakes]);

  // The whole control is inert only when there is genuinely nothing to log:
  // a completed assignment that doesn't track makes.
  const inputLocked = !trackMakes && done && added < 1;

  // Makes need an attempt to be a subset of. At zero attempts there is nothing
  // for them to belong to — and nothing saveable either, since "Log it" already
  // requires added >= 1 — so the whole makes row goes inert rather than inviting
  // a number that could never be recorded.
  const makesLocked = current < 1;

  // Bar layers read the same totals the steppers show.
  const makesPct = target > 0 ? Math.min(100, Math.round((makesTotal / target) * 100)) : 0;

  async function handleSave() {
    if (added < 1) return;
    setSaving(true);
    // Both figures are deltas — this row records only what was added now. Makes
    // left untouched stay null ("logged the reps, didn't say"), never 0.
    const makes = !trackMakes || makesAdded < 1 ? null : makesAdded;
    const result = await saveLog(playerId, assignmentId, added, makes);
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    const remaining = Math.max(0, target - current);
    // Hand the celebration details to the next screen via sessionStorage, not
    // the URL — this keeps the instructor's name (and everything else) out of
    // the address bar and browser history.
    //
    // ⚠️ The log is ALREADY committed by this point. Storage is best-effort from
    // here on: Safari private browsing throws on setItem, and an uncaught throw
    // here would skip the navigation below and strand the student on this screen
    // with a live "Log it" button — inviting a second tap and a duplicate row for
    // reps they already banked. So swallow it and navigate regardless; celebrate
    // reads a missing payload as "unknown" and shows its neutral fallback rather
    // than claiming anything about completion.
    try {
      sessionStorage.setItem(
        "reps:celebrate",
        JSON.stringify({
          coachName,
          done,
          added,
          remaining,
          unit,
          // The noun celebrate counts in ("12 attempts to go"). Derived from the
          // same label the stepper above shows, so the two screens can't drift —
          // `unit` alone would say "reps" on an ATTEMPTS assignment. `unit` stays
          // in the payload as celebrate's fallback for a stale write.
          noun: label.toLowerCase(),
          allDone: result.allDone,
        })
      );
    } catch {
      // Storage unavailable — proceed to celebrate without the details.
    }
    router.push(`/student/${token}/celebrate`);
  }

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      {/* 44px tap target on the arrow — the old 18px glyph with 4px of padding
          was well under the comfortable minimum for a thumb. The negative margin
          keeps the glyph optically on the same left edge as the content below it
          while the target itself extends toward the screen edge. */}
      {/* The arrow's 44px box centres an ~11px glyph, so ~16px of it is empty
          space to the right of the glyph. The title reclaims that instead of
          adding a flex gap on top of it — no gap, and a negative margin that
          pulls the text back over the dead half of the box, so arrow and title
          read as one unit. The glyph itself does not move. */}
      <div className="flex items-center mb-14">
        <Link
          href={`/student/${token}`}
          aria-label="Back"
          className="-ml-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-reps-sub hover:text-reps-ink transition-colors"
        >
          ←
        </Link>
        <span className="-ml-2 text-[17px] font-medium text-reps-ink truncate">{exerciseName}</span>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-[10px] px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Reference: what's already banked, with the bar under it. */}
      <div className="text-[14px] text-reps-dim mb-3 tabular-nums">
        {current} of {target} done
      </div>
      {trackMakes ? (
        // attempts (muted green) with makes (bright green) stacked on top.
        <div
          className="relative h-1.5 rounded-full overflow-hidden mb-[96px]"
          style={{ background: BAR_TRACK }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, background: BAR_ATTEMPTS }}
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
            style={{ width: `${makesPct}%`, background: MAKES_GREEN }}
          />
        </div>
      ) : (
        <div
          className="h-1.5 rounded-full overflow-hidden mb-[96px]"
          style={{ background: BAR_TRACK }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, background: done ? MAKES_GREEN : BAR_ATTEMPTS }}
          />
        </div>
      )}

      {/* Full-content-width lockup: ATTEMPTS label, the big stepper, the divider
          and the MAKES row share the same edges as the bar and title above —
          the page padding supplies the breathing room. */}
      <div className="mb-14">
        <FieldLabel
          htmlFor="amount"
          text={label}
          color={trackMakes ? ATTEMPTS_GREEN : MAKES_GREEN}
          sizeClass="text-[17px]"
        />
        <div className="mt-5">
          <StepperRow
            id="amount"
            label="amount"
            value={amountInput}
            onValue={setAmountInput}
            onStep={step}
            buttonClass="w-[67px] h-[67px] text-[38px]"
            // placeholder:opacity-100 defeats the browser default that renders
            // placeholders dimmed — the seeded 0 must be the label's colour,
            // not a lighter shade of it.
            numberClass={trackMakes ? ATTEMPTS_NUMBER : SOLO_NUMBER}
            inputWidthClass="flex-1 min-w-0"
            gapClass="gap-5"
            minusDisabled={inputLocked || current <= alreadyLogged}
            plusDisabled={inputLocked || current >= amountCeiling}
            inputDisabled={inputLocked}
          />
        </div>

        {/* Makes is the quiet counterpart — one inline row, label left, mini
            stepper right, under a hairline, on the same edges as attempts. */}
        {trackMakes && (
          <>
            {/* Tight around the rule so attempts + makes read as one counting
                section; the air lives outside it, not between the two. */}
            <div className="mt-6 border-t border-reps-line-hi" />
            <div className="mt-5 flex items-center justify-between gap-4">
              <FieldLabel
                htmlFor="makes"
                text="MAKES"
                color={makesLocked ? MUTED_GREY : MAKES_GREEN}
                sizeClass="text-[15px]"
              />
              <StepperRow
                id="makes"
                label="makes"
                value={makesInput}
                onValue={setMakesInput}
                onStep={stepMakes}
                onBlur={settleMakes}
                buttonClass="w-[50px] h-[50px] text-[28px]"
                numberClass={makesLocked ? MAKES_NUMBER_MUTED : MAKES_NUMBER}
                inputWidthClass="w-[60px] shrink-0"
                gapClass="gap-2"
                minusDisabled={makesLocked || makesTotal <= alreadyMakes}
                // You can't make more than you took. Purely a control guard —
                // stepMakes still does no clamping, so an assignment whose banked
                // makes already exceed its attempts just freezes here instead of
                // having its history quietly rewritten.
                plusDisabled={makesLocked || makesTotal >= current}
                inputDisabled={makesLocked}
              />
            </div>
          </>
        )}
      </div>

      <div
        className="sticky bottom-0 mt-auto -mx-[1.25rem] px-[1.25rem] pt-3 bg-reps-bg relative"
        // env()'s second argument is used when the inset can't be resolved (a
        // browser without safe-area support), so the button keeps a 16px floor
        // instead of collapsing to the 2rem base alone. On iOS Safari, where
        // env is supported, the real inset still drives the clearance.
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 16px) + 2rem)" }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 -translate-y-full h-8 bg-gradient-to-b from-transparent to-[#111318]" />
        <button
          onClick={handleSave}
          disabled={added < 1 || saving}
          className="w-full bg-reps-orange text-white font-semibold text-[15px] py-[14px] rounded-[10px] hover:bg-reps-orange-hi active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          {saving ? "Logging…" : "Log it"}
        </button>
      </div>
    </main>
  );
}
