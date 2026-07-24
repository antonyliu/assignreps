"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { GoalType, Side } from "@/lib/exercises";
import { isComplete } from "@/lib/exercises";
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
  /** What `target` measures. 'consecutive' reads target as a streak length and
   *  completes at one logged set — see isComplete(). */
  goalType: GoalType;
  side: Side | null;
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
  goalType,
  side,
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
  // Which measure the assignment is actually scored on. Only 'reps' keeps the
  // original attempts-are-everything shape; the other two rearrange the screen.
  const isMakesGoal = goalType === "makes";
  const isStreakGoal = goalType === "consecutive";

  // Attempts are capped at target only when they ARE the goal and no makes are
  // recorded. Under a makes or streak goal attempts are context, not the score,
  // so trimming them would corrupt the coach's percentage.
  const amountCeiling = trackMakes || goalType !== "reps" ? Infinity : target;
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

  // One rule for completion across the whole app, so this screen can't disagree
  // with the roster about whether the work is finished.
  const done = isComplete(goalType, target, current, makesTotal);

  // The bar tracks whatever the goal is scored on. A streak collapses to a
  // single set: one completion fills it.
  const shownTarget = isStreakGoal ? 1 : target;
  const shownCurrent = isStreakGoal
    ? Math.min(current, 1)
    : isMakesGoal
      ? makesTotal
      : current;
  const pct =
    shownTarget > 0 ? Math.min(100, Math.round((shownCurrent / shownTarget) * 100)) : 0;

  const label = isStreakGoal
    ? "SETS COMPLETED"
    : isMakesGoal
      ? "MAKES"
      : primaryLabel(unit, trackMakes, categoryKey);

  // Attempts stay available under a makes goal, but only as optional context —
  // makes is the hero there, so the two swap roles.
  const showSecondaryAttempts = isMakesGoal;
  // The original inline makes row belongs to a reps goal alone. A makes goal has
  // promoted makes to the hero; a streak has no makes at all.
  const showMakesRow = trackMakes && goalType === "reps";

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
  //
  // Only meaningful when attempts are the goal. Under a makes goal attempts are
  // optional context and may legitimately be left at zero while makes climb, so
  // capping makes to them would make the field unusable.
  function settleMakes() {
    setMakesInput((prev) => {
      const p = parseInt(prev, 10);
      if (Number.isNaN(p)) return String(alreadyMakes);
      const capped = goalType === "reps" ? Math.min(p, current) : p;
      return String(Math.max(capped, alreadyMakes));
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
    if (goalType !== "reps") return;
    setMakesInput((prev) => {
      const p = parseInt(prev, 10);
      if (Number.isNaN(p)) return prev;
      const capped = Math.max(Math.min(p, current), alreadyMakes);
      return capped === p ? prev : String(capped);
    });
  }, [current, alreadyMakes, goalType]);

  // The whole control is inert only when there is genuinely nothing to log:
  // a completed assignment that doesn't track makes.
  const inputLocked = !trackMakes && done && added < 1;

  // Makes need an attempt to be a subset of. At zero attempts there is nothing
  // for them to belong to — and nothing saveable either, since "Log it" already
  // requires added >= 1 — so the whole makes row goes inert rather than inviting
  // a number that could never be recorded.
  //
  // Under a makes goal that dependency runs the other way: makes ARE the entry,
  // and attempts are the optional extra, so the field is never locked.
  const makesLocked = goalType === "reps" && current < 1;

  // Bar layers read the same totals the steppers show. Only the reps goal stacks
  // two measures; the others fill a single bar from `shownCurrent`.
  const makesPct = target > 0 ? Math.min(100, Math.round((makesTotal / target) * 100)) : 0;

  // What this save actually adds. A makes goal is satisfied by new makes even
  // when attempts weren't touched; everything else counts attempts.
  const primaryAdded = isMakesGoal ? makesAdded : added;

  async function handleSave() {
    if (primaryAdded < 1) return;
    setSaving(true);
    // Both figures are deltas — this row records only what was added now. Makes
    // left untouched stay null ("logged the reps, didn't say"), never 0. A streak
    // logs sets, which aren't makes, so it stays null there too.
    const makes = isStreakGoal || !trackMakes || makesAdded < 1 ? null : makesAdded;
    // ⚠️ `logs_amount_check` requires amount > 0. Under a makes goal the student
    // can legitimately record makes without touching attempts, which would send
    // 0 and lose the whole row — so the makes delta stands in as the attempt
    // count. It is the honest floor: you cannot make a shot without taking it.
    const amount = isMakesGoal && added < 1 ? makesAdded : added;
    const result = await saveLog(playerId, assignmentId, amount, makes);
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    const remaining = Math.max(0, shownTarget - shownCurrent);
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
          added: primaryAdded,
          remaining,
          unit,
          // The noun celebrate counts in ("12 attempts to go"). Derived from the
          // same label the stepper above shows, so the two screens can't drift —
          // `unit` alone would say "reps" on an ATTEMPTS assignment. `unit` stays
          // in the payload as celebrate's fallback for a stale write.
          noun: label.toLowerCase(),
          goalType,
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

      {/* Which hand the coach asked for. Quiet context under the title rather
          than part of it, so a long exercise name still truncates cleanly. */}
      {side && (
        <div className="text-[13px] text-reps-sub -mt-12 mb-12">
          {side === "left" ? "Left hand" : "Right hand"}
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-[10px] px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Reference: what's already banked, with the bar under it. A streak reads
          as sets rather than a bare count, since "0 of 1" says nothing. */}
      <div className="text-[14px] text-reps-dim mb-3 tabular-nums">
        {isStreakGoal
          ? `${shownCurrent} of 1 set · ${target} in a row`
          : `${shownCurrent} of ${shownTarget} done`}
      </div>
      {showMakesRow ? (
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
        {/* The hero stepper is whatever the assignment is scored on. Under a
            makes goal that is MAKES, so it takes the large control and the
            bright green, and attempts drop to the quiet row below. */}
        <FieldLabel
          htmlFor={isMakesGoal ? "makes" : "amount"}
          text={label}
          color={trackMakes && goalType === "reps" ? ATTEMPTS_GREEN : MAKES_GREEN}
          sizeClass="text-[17px]"
        />
        <div className="mt-5">
          {isMakesGoal ? (
            <StepperRow
              id="makes"
              label="makes"
              value={makesInput}
              onValue={setMakesInput}
              onStep={stepMakes}
              onBlur={settleMakes}
              buttonClass="w-[67px] h-[67px] text-[38px]"
              numberClass={SOLO_NUMBER}
              inputWidthClass="flex-1 min-w-0"
              gapClass="gap-5"
              minusDisabled={makesTotal <= alreadyMakes}
              plusDisabled={false}
              inputDisabled={false}
            />
          ) : (
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
              numberClass={trackMakes && goalType === "reps" ? ATTEMPTS_NUMBER : SOLO_NUMBER}
              inputWidthClass="flex-1 min-w-0"
              gapClass="gap-5"
              minusDisabled={inputLocked || current <= alreadyLogged}
              plusDisabled={inputLocked || current >= amountCeiling}
              inputDisabled={inputLocked}
            />
          )}
        </div>

        {/* Under a makes goal, attempts become the optional context — same quiet
            inline row the makes field occupies on a reps assignment, so the
            hierarchy reads the same way round whichever measure is the goal. */}
        {showSecondaryAttempts && (
          <>
            <div className="mt-6 border-t border-reps-line-hi" />
            <div className="mt-5 flex items-center justify-between gap-4">
              <FieldLabel
                htmlFor="amount"
                text="ATTEMPTS"
                color={ATTEMPTS_GREEN}
                sizeClass="text-[15px]"
              />
              <StepperRow
                id="amount"
                label="amount"
                value={amountInput}
                onValue={setAmountInput}
                onStep={step}
                buttonClass="w-[50px] h-[50px] text-[28px]"
                numberClass="text-[31px] font-semibold text-[#3d7a24] placeholder:text-[#3d7a24] placeholder:opacity-100"
                inputWidthClass="w-[60px] shrink-0"
                gapClass="gap-2"
                minusDisabled={current <= alreadyLogged}
                plusDisabled={false}
                inputDisabled={false}
              />
            </div>
          </>
        )}

        {/* Makes is the quiet counterpart — one inline row, label left, mini
            stepper right, under a hairline, on the same edges as attempts. */}
        {showMakesRow && (
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
          disabled={primaryAdded < 1 || saving}
          className="w-full bg-reps-orange text-white font-semibold text-[15px] py-[14px] rounded-[10px] hover:bg-reps-orange-hi active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          {saving ? "Logging…" : "Log it"}
        </button>
      </div>
    </main>
  );
}
