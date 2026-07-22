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

// The screen's hero line. Phrased for the drill: shooting categories count shots,
// finishing counts attempts at the rim, everything else is generic. Minutes win
// over all of it — you don't take shots for ten minutes' worth of dribbling.
function primaryQuestion(unit: string, trackMakes: boolean, categoryKey?: string): string {
  if (unit === "minutes") return "How many minutes did you do today?";
  if (trackMakes) {
    if (categoryKey === "shooting" || categoryKey === "spot-shots") {
      return "How many shots did you take today?";
    }
    if (categoryKey === "finishing") return "How many did you try today?";
  }
  return "How many did you do today?";
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

  const question = primaryQuestion(unit, trackMakes, categoryKey);

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
      <div className="h-1.5 bg-reps-line rounded-full overflow-hidden mb-8">
        <div
          className={`h-full rounded-full transition-all duration-300 ${done ? "bg-reps-green" : "bg-[#f0b429]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* The hero: one question, then the field that answers it. */}
      <label
        htmlFor="amount"
        className="block text-[22px] font-semibold tracking-[-0.3px] leading-snug text-reps-ink mb-4"
      >
        {question}
      </label>
      <input
        id="amount"
        type="number"
        inputMode="numeric"
        min={0}
        value={amountInput}
        onChange={(e) => setAmountInput(e.target.value)}
        onFocus={(e) => e.target.select()}
        disabled={!trackMakes && done && added < 1}
        className="w-full bg-reps-card border border-reps-line rounded-[12px] px-[14px] py-5 text-[38px] font-light text-center text-reps-ink outline-none focus:border-reps-orange transition-colors disabled:opacity-40"
      />

      {trackMakes && (
        <div className="mt-6">
          <label htmlFor="makes" className="block text-[14px] text-reps-sub mb-2">
            How many did you make? <span className="text-reps-dim">(optional)</span>
          </label>
          <input
            id="makes"
            type="number"
            inputMode="numeric"
            min={0}
            value={makesInput}
            onChange={(e) => setMakesInput(e.target.value)}
            placeholder="—"
            className="w-full bg-reps-card border border-reps-line rounded-[12px] px-[14px] py-4 text-[24px] font-light text-center text-reps-ink outline-none focus:border-reps-orange transition-colors placeholder:text-reps-dim"
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
