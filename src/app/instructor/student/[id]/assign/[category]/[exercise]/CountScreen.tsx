"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import type { GoalType, Side, Unit } from "@/lib/exercises";
import { GOAL_PRESETS, supportsSide, supportsGoalTypes } from "@/lib/exercises";
import { saveAssignment } from "./actions";

type Props = {
  playerId: string;
  playerName: string;
  categorySlug: string;
  exerciseName: string;
  defaultTarget: number;
  unit: Unit;
  quickCounts: number[];
  defaultTrackMakes: boolean;
};

const GOAL_OPTIONS: { id: GoalType; label: string }[] = [
  { id: "reps", label: "Attempts" },
  { id: "makes", label: "Makes" },
  { id: "consecutive", label: "Consecutive" },
];

// The "How many?" label has to name what it is counting — the number means
// something different under each goal.
const TARGET_LABEL: Record<GoalType, string> = {
  reps: "How many?",
  makes: "How many makes?",
  consecutive: "Hit how many in a row?",
};

const SIDE_OPTIONS: { id: Side; label: string }[] = [
  { id: "left", label: "Left" },
  { id: "right", label: "Right" },
];

// Shared pill styling for the preset / segmented rows on this screen.
const PILL_BASE =
  "flex-1 py-3 rounded-[10px] text-[14px] font-medium border transition-all";
const PILL_ON = "bg-reps-orange/10 border-reps-orange/30 text-reps-orange";
const PILL_OFF = "bg-reps-card border-reps-line text-reps-ink hover:border-reps-line-hi";

export default function CountScreen({
  playerId,
  playerName,
  categorySlug,
  exerciseName,
  defaultTarget,
  unit,
  quickCounts,
  defaultTrackMakes,
}: Props) {
  const router = useRouter();
  const [target, setTarget] = useState(defaultTarget);
  // The toggle is always offered — a coach may well score a timed drill by makes
  // — but a minutes assignment doesn't default to it, since "makes out of 10
  // minutes" is not what most timed drills mean. Category default applies to
  // rep-based work only; timed work is opt-in.
  const [trackMakes, setTrackMakes] = useState(unit !== "minutes" && defaultTrackMakes);
  // A makes or streak goal only parses against a countable rep, so timed drills
  // stay on the original attempts shape and never see the control.
  const [goalType, setGoalType] = useState<GoalType>("reps");
  const [side, setSide] = useState<Side | null>(null);
  // No presets (e.g. a saved custom exercise) → show the input directly.
  const [showCustom, setShowCustom] = useState(quickCounts.length === 0);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [sentIn, setSentIn] = useState(false);

  // Two independent gates. The category decides whether "makes" and "in a row"
  // mean anything for this drill at all; the unit rules out timed work even
  // inside a shooting category (a 10-minute drill has no rep to make).
  const goalPickable = unit !== "minutes" && supportsGoalTypes(categorySlug);
  const sidePickable = supportsSide(exerciseName);

  // Each goal counts a different thing, so it brings its own preset row and its
  // own sensible starting target rather than carrying the previous goal's number
  // across — "50" makes sense as attempts and not as a streak.
  const presets = goalType === "reps" ? quickCounts : GOAL_PRESETS[goalType];

  function pickGoal(next: GoalType) {
    if (next === goalType) return;
    setGoalType(next);
    const nextPresets = next === "reps" ? quickCounts : GOAL_PRESETS[next];
    // Returning to attempts restores the library default; the other two open on
    // the middle preset, which reads as the common ask rather than the extreme.
    setTarget(next === "reps" ? defaultTarget : nextPresets[1] ?? nextPresets[0]);
    setShowCustom(nextPresets.length === 0);
  }

  // On success: land a brief confirmation (scale/fade in), hold a beat, then
  // navigate back to the student detail screen — a moment, not a flash.
  useEffect(() => {
    if (!sent) return;
    const raf = requestAnimationFrame(() => setSentIn(true));
    const nav = setTimeout(() => router.push(`/instructor/student/${playerId}`), 1300);
    return () => { cancelAnimationFrame(raf); clearTimeout(nav); };
  }, [sent, playerId, router]);

  async function handleConfirm() {
    setError("");
    if (!target || target < 1) { setError("Enter a target greater than 0."); return; }
    setLoading(true);
    const result = await saveAssignment(
      playerId,
      exerciseName,
      target,
      unit,
      trackMakes,
      // A timed drill never showed the control, so it can only ever be attempts.
      goalPickable ? goalType : "reps",
      sidePickable ? side : null,
    );
    if (!result.ok) { setLoading(false); setError(result.error); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <main className="flex flex-col min-h-screen items-center justify-center text-center px-6">
        <div
          className={`w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-300 ease-out ${
            sentIn ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
          style={{ background: "rgba(107,214,61,0.12)" }}
        >
          <Check size={34} color="#6bd63d" strokeWidth={2.5} />
        </div>
        <p
          className={`text-[17px] font-semibold text-reps-ink mt-5 transition-opacity duration-300 ${
            sentIn ? "opacity-100" : "opacity-0"
          }`}
        >
          Sent to {playerName} 🏀
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/instructor/student/${playerId}/assign/${categorySlug}`}
          className="text-reps-sub text-lg -ml-1 px-1 hover:text-reps-ink transition-colors"
        >
          ←
        </Link>
        <span className="text-[14px] font-medium text-reps-ink">Assign to {playerName}</span>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-[10px] px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <h2 className="text-2xl font-semibold tracking-[-0.5px] mb-8">{exerciseName}</h2>

      {/* Goal first: it decides what the number below it means, so choosing it
          after picking a count would silently reinterpret that count. Timed
          drills skip it — minutes can't be made or hit in a row. */}
      {goalPickable && (
        <>
          <label className="text-[13px] text-[var(--reps-label)] block mb-2">Goal</label>
          <div className="flex gap-2 mb-7">
            {GOAL_OPTIONS.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={goalType === g.id}
                onClick={() => pickGoal(g.id)}
                className={`${PILL_BASE} ${goalType === g.id ? PILL_ON : PILL_OFF}`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </>
      )}

      <label className="text-[13px] text-[var(--reps-label)] block mb-2">
        {TARGET_LABEL[goalPickable ? goalType : "reps"]}
      </label>
      {presets.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {presets.map((n) => (
            <button
              key={n}
              onClick={() => setTarget(n)}
              className={`${PILL_BASE} ${target === n ? PILL_ON : PILL_OFF}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {/* The presets are bare numbers, so timed exercises need the unit spelled
          out — "5" reads as reps otherwise. Rep-based exercises stay unlabelled. */}
      {unit === "minutes" && (
        <p className="text-[12px] text-reps-dim mb-3">minutes</p>
      )}

      {showCustom ? (
        <input
          type="number"
          min={1}
          value={target}
          onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
          onFocus={(e) => e.target.select()}
          autoFocus
          className="bg-reps-card border border-reps-line rounded-[10px] px-[14px] py-[14px] text-lg text-center text-reps-ink outline-none focus:border-reps-orange transition-colors w-full placeholder:text-reps-dim mb-8"
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className="self-start text-[13px] text-reps-sub hover:text-reps-ink transition-colors mb-8"
        >
          + enter your own
        </button>
      )}

      {/* Explains the one goal whose logging shape isn't self-evident: the
          target is a streak to reach, not a pile to accumulate. */}
      {goalPickable && goalType === "consecutive" && (
        <p className="text-[12px] text-reps-sub -mt-4 mb-8">
          Student shoots until they hit the goal, then logs 1 completion.
        </p>
      )}

      {/* Makes are the measure under the other two goals, so the toggle would be
          asking a question already answered. Attempts keeps it. */}
      {(!goalPickable || goalType === "reps") && (
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="min-w-0">
            <div className="text-[14px] font-medium text-reps-ink">Track makes?</div>
            <div className="text-[12px] text-reps-sub mt-0.5">
              Lets {playerName} log how many they made.
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={trackMakes}
            aria-label="Track makes"
            onClick={() => setTrackMakes((v) => !v)}
            className={`relative shrink-0 w-[46px] h-[26px] rounded-full transition-colors ${
              trackMakes ? "bg-reps-orange" : "bg-reps-line"
            }`}
          >
            <span
              className={`absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white transition-transform ${
                trackMakes ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
      )}

      {/* Optional by design — most work isn't side-specific, so nothing is
          selected until the coach says so, and tapping the active option clears
          it back to unspecified. */}
      {sidePickable && (
        <div className="mb-8">
          <label className="text-[13px] text-[var(--reps-label)] block mb-2">Side</label>
          <div className="flex gap-2">
            {SIDE_OPTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={side === s.id}
                onClick={() => setSide((prev) => (prev === s.id ? null : s.id))}
                className={`${PILL_BASE} ${side === s.id ? PILL_ON : PILL_OFF}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full bg-reps-orange text-white font-semibold text-[15px] py-[14px] rounded-[10px] hover:bg-reps-orange-hi active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? "Saving…" : `Send to ${playerName}`}
      </button>
    </main>
  );
}
