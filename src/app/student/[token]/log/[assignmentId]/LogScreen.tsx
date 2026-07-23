"use client";

import { useState } from "react";
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

// Written out in full rather than composed, so Tailwind sees each class literally.
// A reps-only assignment has no second field to rank against, so it takes the
// bright green outright instead of the muted attempts shade.
const ATTEMPTS_NUMBER =
  "text-[76px] font-semibold text-[#3d7a24] placeholder:text-[#3d7a24] placeholder:opacity-100";
const SOLO_NUMBER =
  "text-[76px] font-semibold text-[#6bd63d] placeholder:text-[#6bd63d] placeholder:opacity-100";

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

  // Makes are never clamped against attempts — a mismatch is the coach's signal
  // that something went wrong, not something to silently correct here.
  function stepMakes(delta: number) {
    setMakesInput((prev) => {
      const p = parseInt(prev, 10);
      const base = Number.isNaN(p) ? alreadyMakes : p;
      return String(Math.max(base + delta, alreadyMakes));
    });
  }

  // The whole control is inert only when there is genuinely nothing to log:
  // a completed assignment that doesn't track makes.
  const inputLocked = !trackMakes && done && added < 1;

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
    sessionStorage.setItem(
      "reps:celebrate",
      JSON.stringify({ coachName, done, added, remaining, unit, allDone: result.allDone })
    );
    router.push(`/student/${token}/celebrate`);
  }

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      <div className="flex items-center gap-3 mb-12">
        <Link
          href={`/student/${token}`}
          className="text-reps-sub text-lg -ml-1 px-1 hover:text-reps-ink transition-colors"
        >
          ←
        </Link>
        <span className="text-[15px] font-medium text-reps-ink truncate">{exerciseName}</span>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-[10px] px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Reference: what's already banked, with the bar under it. */}
      <div className="text-[14px] text-reps-dim mb-2 tabular-nums">
        {current} of {target} done
      </div>
      {trackMakes ? (
        // attempts (muted green) with makes (bright green) stacked on top.
        <div
          className="relative h-2.5 rounded-full overflow-hidden mb-[84px]"
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
          className="h-2.5 rounded-full overflow-hidden mb-[84px]"
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
              <FieldLabel htmlFor="makes" text="MAKES" color={MAKES_GREEN} sizeClass="text-[15px]" />
              <StepperRow
                id="makes"
                label="makes"
                value={makesInput}
                onValue={setMakesInput}
                onStep={stepMakes}
                buttonClass="w-[50px] h-[50px] text-[28px]"
                numberClass="text-[31px] font-semibold text-[#6bd63d] placeholder:text-[#6bd63d] placeholder:opacity-100"
                inputWidthClass="w-[60px] shrink-0"
                gapClass="gap-2"
                minusDisabled={makesTotal <= alreadyMakes}
                plusDisabled={false}
                inputDisabled={false}
              />
            </div>
          </>
        )}
      </div>

      <div
        className="sticky bottom-0 mt-auto -mx-[1.25rem] px-[1.25rem] pt-3 bg-reps-bg relative"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
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
