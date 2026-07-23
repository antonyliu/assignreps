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
function FieldLabel({ htmlFor, text, color }: { htmlFor: string; text: string; color: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[12px] font-semibold uppercase tracking-[1.5px]"
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
        className={`bg-transparent border-0 font-light leading-none text-center tabular-nums outline-none disabled:opacity-40 ${inputWidthClass} ${numberClass}`}
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

// Two shades of the same warm yellow-green: attempts muted, makes a brighter
// version of it — same hue family, so makes reads as "more" rather than other.
// (#3dd68c/#4ade80 sit toward emerald and read bluish next to #5aa22f.)
const ATTEMPTS_GREEN = "#5aa22f";
const MAKES_GREEN = "#7ed957";

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
  // Both kept as strings so an empty field stays empty rather than reading as 0.
  const [amountInput, setAmountInput] = useState("");
  const [makesInput, setMakesInput]   = useState("");

  // What the student typed this session.
  //
  // Normal assignments clamp to what's outstanding — the "counter caps at the
  // target, no inflating" rule. Makes assignments do NOT: attempts are the
  // denominator of a shooting percentage, so a real 60-attempt session against a
  // 50 target has to survive intact. Silently trimming it to 50 would distort
  // the number the whole feature exists to produce.
  const remainingToTarget = Math.max(0, target - alreadyLogged);
  const parsedAmount = parseInt(amountInput, 10);
  const typed = Number.isNaN(parsedAmount) ? 0 : Math.max(0, parsedAmount);
  const added = trackMakes ? typed : Math.min(typed, remainingToTarget);

  // Likewise the readout: capped for normal work, honest for makes, so a student
  // logging 60 sees 60 rather than watching it silently become 50.
  const current = trackMakes ? alreadyLogged + added : Math.min(alreadyLogged + added, target);
  const pct     = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const done    = current >= target;

  const label = primaryLabel(unit, trackMakes, categoryKey);

  // Stepper. Clamps the stored value itself — not just what gets saved — so the
  // number on screen is always the number that will be logged. Typing is left
  // alone; only the buttons are bounded.
  const stepCeiling = trackMakes ? Infinity : remainingToTarget;
  function step(delta: number) {
    // Functional update, not the closed-over value: taps fired faster than React
    // re-renders would otherwise all read the same stale number and collapse into
    // a single increment.
    setAmountInput((prev) => {
      const p = parseInt(prev, 10);
      const base = Number.isNaN(p) ? 0 : Math.max(0, p);
      return String(Math.min(Math.max(0, base + delta), stepCeiling));
    });
  }

  // Makes are never clamped against the amount — a mismatch is the coach's
  // signal that something went wrong, not something to silently correct here.
  const parsedMakes = parseInt(makesInput, 10);
  const makesValue = Number.isNaN(parsedMakes) ? 0 : Math.max(0, parsedMakes);
  function stepMakes(delta: number) {
    setMakesInput((prev) => {
      const p = parseInt(prev, 10);
      const base = Number.isNaN(p) ? 0 : Math.max(0, p);
      return String(Math.max(0, base + delta));
    });
  }

  // The whole control is inert only when there is genuinely nothing to log:
  // a completed assignment that doesn't track makes.
  const inputLocked = !trackMakes && done && added < 1;

  // Two-layer bar for makes drills: attempts fill in muted green, makes overlay
  // in bright green, both against a near-black-green track. Both layers count
  // banked totals plus this session — the attempts layer via `current` (which
  // already folds in alreadyLogged), the makes layer via alreadyMakes here — so
  // reopening a partly-logged assignment shows real progress, not an empty bar.
  const makesTotal = alreadyMakes + makesValue;
  const makesPct = target > 0 ? Math.min(100, Math.round((makesTotal / target) * 100)) : 0;

  async function handleSave() {
    if (added < 1) return;
    setSaving(true);
    const parsed = parseInt(makesInput, 10);
    const makes =
      !trackMakes || makesInput.trim() === "" || Number.isNaN(parsed) ? null : parsed;
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

      <div className="flex items-center gap-3 mb-8">
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
      <div className="text-[13px] text-reps-dim mb-2 tabular-nums">
        {current} of {target} done
      </div>
      {trackMakes ? (
        // attempts (muted green) with makes (bright green) stacked on top.
        <div className="relative h-1.5 bg-reps-line rounded-full overflow-hidden mb-12">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, background: "#27500a" }}
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
            style={{ width: `${makesPct}%`, background: "#3dd68c" }}
          />
        </div>
      ) : (
        <div className="h-1.5 bg-reps-line rounded-full overflow-hidden mb-12">
          <div
            className={`h-full rounded-full transition-all duration-300 ${done ? "bg-reps-green" : "bg-[#27500a]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Full-content-width lockup: ATTEMPTS label, the big stepper, the divider
          and the MAKES row share the same edges as the bar and title above —
          the page padding supplies the breathing room. */}
      <div>
        <FieldLabel htmlFor="amount" text={label} color={ATTEMPTS_GREEN} />
        <div className="mt-5">
          <StepperRow
            id="amount"
            label="amount"
            value={amountInput}
            onValue={setAmountInput}
            onStep={step}
            buttonClass="w-12 h-12 text-[27px]"
            numberClass="text-[54px] text-[#5aa22f] placeholder:text-[#5aa22f]"
            inputWidthClass="flex-1 min-w-0"
            gapClass="gap-5"
            minusDisabled={inputLocked || added < 1}
            plusDisabled={inputLocked || added >= stepCeiling}
            inputDisabled={inputLocked}
          />
        </div>

        {/* Makes is the quiet counterpart — one inline row, label left, mini
            stepper right, under a hairline, on the same edges as attempts. */}
        {trackMakes && (
          <>
            <div className="mt-11 border-t border-reps-line-hi" />
            <div className="mt-9 flex items-center justify-between gap-4">
              <FieldLabel htmlFor="makes" text="MAKES" color={MAKES_GREEN} />
              <StepperRow
                id="makes"
                label="makes"
                value={makesInput}
                onValue={setMakesInput}
                onStep={stepMakes}
                buttonClass="w-10 h-10 text-[22px]"
                numberClass="text-[25px] text-[#7ed957] placeholder:text-[#7ed957]"
                inputWidthClass="w-12 shrink-0"
                gapClass="gap-2"
                minusDisabled={makesValue < 1}
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
