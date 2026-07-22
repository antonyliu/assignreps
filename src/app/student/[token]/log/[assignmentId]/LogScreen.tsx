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
  coachName: string;
  trackMakes: boolean;
  /** Undefined for custom exercises, which belong to no category. */
  categoryKey?: string;
};

// The screen's hero line. Kept short enough to hold one line on a 390px phone.
// Only shooting-type drills get their own noun — finishing and plain rep work
// share the generic wording, so neither needs a branch. Minutes win over all of
// it: you don't take shots for ten minutes' worth of dribbling.
// One contained control: −, an editable number, +, all inside a single card so
// the two steppers on this screen read as the same component at two weights.
function StepperBox({
  id,
  value,
  onValue,
  onStep,
  numberSize,
  minusDisabled,
  plusDisabled,
  inputDisabled,
  label,
}: {
  id: string;
  value: string;
  onValue: (v: string) => void;
  onStep: (delta: number) => void;
  numberSize: string;
  minusDisabled: boolean;
  plusDisabled: boolean;
  inputDisabled: boolean;
  label: string;
}) {
  const parsed = parseInt(value, 10);
  const hasValue = !Number.isNaN(parsed) && parsed > 0;
  const btn =
    "shrink-0 w-9 h-9 rounded-full bg-[#2a2d36] text-reps-ink text-[20px] leading-none flex items-center justify-center active:scale-[0.92] transition-all disabled:opacity-25 disabled:pointer-events-none";

  return (
    <div className="flex items-center gap-3 bg-reps-card border border-reps-line rounded-[12px] px-3 py-3">
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
        className={`flex-1 min-w-0 bg-transparent border-0 font-light leading-none text-center tabular-nums outline-none disabled:opacity-40 placeholder:text-reps-dim placeholder:opacity-50 ${numberSize} ${
          hasValue ? "text-reps-ink" : "text-reps-dim"
        }`}
      />
      <button type="button" aria-label={`Increase ${label}`} onClick={() => onStep(1)} disabled={plusDisabled} className={btn}>
        +
      </button>
    </div>
  );
}

// The hero line. Uniform across rep categories now — the makes stepper appearing
// below is what tells a shooter this is attempts-and-makes, so the question
// itself no longer needs to name shots. Minutes is the only variant.
function primaryQuestion(unit: string): string {
  return unit === "minutes" ? "How many minutes today?" : "How many today?";
}

export default function LogScreen({
  token,
  playerId,
  assignmentId,
  exerciseName,
  target,
  unit,
  alreadyLogged,
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

  const question = primaryQuestion(unit);

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

  // Makes stepper is revealed, not just enabled, once there's an attempt for the
  // makes to be a subset of.
  const showMakes = trackMakes && added > 0;

  // Two-layer bar for makes drills: attempts fill in muted green, makes overlay
  // in bright green, both against a near-black-green track. The single-colour bar
  // (yellow in progress / green done) is untouched for everything else.
  const makesPct = target > 0 ? Math.min(100, Math.round((makesValue / target) * 100)) : 0;

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
        <span className="text-[14px] font-medium text-reps-sub">Log reps</span>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-[10px] px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Reference, not hero: what's already banked, with the bar under it. */}
      <div className="text-[13px] text-reps-sub mb-1">{exerciseName}</div>
      <div className="text-[13px] text-reps-dim mb-2 tabular-nums">
        {current} of {target} done
      </div>
      {trackMakes ? (
        // attempts (muted green) with makes (bright green) stacked on top.
        <div className="relative h-1.5 rounded-full overflow-hidden mb-8" style={{ background: "#1a2e1a" }}>
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
        <div className="h-1.5 bg-reps-line rounded-full overflow-hidden mb-8">
          <div
            className={`h-full rounded-full transition-all duration-300 ${done ? "bg-reps-green" : "bg-[#f0b429]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* The hero: one question, then the field that answers it. */}
      <label
        htmlFor="amount"
        className="block text-[22px] font-semibold tracking-[-0.3px] leading-snug text-reps-ink mb-4"
      >
        {question}
      </label>
      {/* Tap to nudge, or tap the number to type it outright. */}
      <StepperBox
        id="amount"
        label="amount"
        value={amountInput}
        onValue={setAmountInput}
        onStep={step}
        numberSize="text-[36px] py-2"
        minusDisabled={inputLocked || added < 1}
        plusDisabled={inputLocked || added >= stepCeiling}
        inputDisabled={inputLocked}
      />

      {/* Progressive disclosure: nothing here until there's an attempt, then this
          mounts and the reps-reveal keyframe fades/slides it in (pure CSS — the
          pane throttles rAF, so no JS-timed transition). */}
      {showMakes && (
        <div className="reps-reveal mt-6">
          <label htmlFor="makes" className="block text-[14px] text-reps-sub mb-2">
            How many did you make?
          </label>
          {/* Secondary by weight, identical in mechanism. */}
          <StepperBox
            id="makes"
            label="makes"
            value={makesInput}
            onValue={setMakesInput}
            onStep={stepMakes}
            numberSize="text-[24px] py-1"
            minusDisabled={makesValue < 1}
            plusDisabled={false}
            inputDisabled={false}
          />
        </div>
      )}

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
