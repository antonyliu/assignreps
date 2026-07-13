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
}: Props) {
  const router = useRouter();
  const [added, setAdded] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const current = Math.min(alreadyLogged + added, target);
  const pct = target > 0 ? Math.round((current / target) * 100) : 0;
  const done = current >= target;

  function addReps(n: number) {
    setAdded((prev) => {
      const next = prev + n;
      // Cap so total doesn't exceed target
      return Math.min(next, target - alreadyLogged);
    });
  }

  async function handleSave() {
    if (added < 1) return;
    setSaving(true);
    const result = await saveLog(playerId, assignmentId, added);
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    const remaining = Math.max(0, target - current);
    router.push(
      `/player/${token}/celebrate?coach=${encodeURIComponent(coachName)}&done=${done ? "1" : "0"}&added=${added}&remaining=${remaining}&unit=${encodeURIComponent(unit)}`
    );
  }

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      {/* Back header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/player/${token}`}
          className="text-[#8a8a8e] text-lg px-2 hover:text-[#e8e8ea] transition-colors"
        >
          ←
        </Link>
        <span className="text-[14px] font-medium text-[#8a8a8e]">Log reps</span>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-[10px] px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Counter display */}
      <div className="text-center mb-8">
        <div className="text-[13px] text-[#8a8a8e] mb-2">{exerciseName}</div>
        <div
          className={`text-[72px] font-light leading-none tracking-[-3px] tabular-nums transition-colors ${done ? "text-[#4ade80]" : "text-[#ff7a3d]"}`}
        >
          {current}
        </div>
        <div className="text-[13px] text-[#5a5a5e] mt-1.5">
          of {target} {unit}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#2a2a2c] rounded-full overflow-hidden mb-8">
        <div
          className={`h-full rounded-full transition-all duration-300 ${done ? "bg-[#4ade80]" : "bg-[#ff7a3d]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Counter buttons */}
      <div className="flex gap-2 mb-3">
        {[1, 10, 25, 50].map((n) => (
          <button
            key={n}
            onClick={() => addReps(n)}
            disabled={done}
            className="flex-1 bg-[#1a1a1c] border border-[#2a2a2c] text-[#e8e8ea] font-semibold text-base py-4 rounded-[10px] hover:border-[#ff7a3d] hover:text-[#ff7a3d] active:bg-[rgba(255,122,61,0.12)] active:scale-[0.97] transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            +{n}
          </button>
        ))}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={added < 1 || saving}
        className="mt-auto w-full bg-[#ff7a3d] text-[#0f0f10] font-semibold text-[15px] py-[14px] rounded-[10px] hover:bg-[#ff8a52] active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </main>
  );
}
