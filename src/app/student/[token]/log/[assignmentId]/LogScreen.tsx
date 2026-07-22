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
};

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

  // With makes being tracked, "reps" is ambiguous — the number the student is
  // logging is attempts, and makes are the subset that went in. Minutes are
  // never attempts, so they keep their own label.
  const targetLabel = trackMakes && unit === "reps" ? "attempts" : unit;

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

      <div className="text-center mb-8">
        <div className="text-[13px] text-reps-sub mb-2">{exerciseName}</div>
        <div className={`text-[72px] font-light leading-none tracking-[-3px] tabular-nums transition-colors ${done ? "text-[#3dd68c]" : "text-[#f0b429]"}`}>
          {current}
        </div>
        <div className="text-[13px] text-reps-dim mt-1.5">
          of {target} {targetLabel}
        </div>
      </div>

      <div className="h-1.5 bg-reps-line rounded-full overflow-hidden mb-8">
        <div
          className={`h-full rounded-full transition-all duration-300 ${done ? "bg-reps-green" : "bg-[#f0b429]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-[12px] text-reps-sub mb-1.5">
          How many {targetLabel} did you do?
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
          placeholder="0"
          className="w-full bg-reps-card border border-reps-line rounded-[10px] px-[14px] py-4 text-[32px] font-light text-center text-reps-ink outline-none focus:border-reps-orange transition-colors placeholder:text-reps-dim disabled:opacity-40"
        />
      </div>

      {trackMakes && (
        <div className="mt-3">
          <label htmlFor="makes" className="block text-[12px] text-reps-sub mb-1.5">
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
            className="w-full bg-reps-card border border-reps-line rounded-[10px] px-[14px] py-3 text-base text-center text-reps-ink outline-none focus:border-reps-orange transition-colors placeholder:text-reps-dim"
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
