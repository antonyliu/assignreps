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
  const [added, setAdded]   = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const current = Math.min(alreadyLogged + added, target);
  const pct     = target > 0 ? Math.round((current / target) * 100) : 0;
  const done    = current >= target;

  function addReps(n: number) {
    setAdded((prev) => Math.min(prev + n, target - alreadyLogged));
  }

  async function handleSave() {
    if (added < 1) return;
    setSaving(true);
    const result = await saveLog(playerId, assignmentId, added);
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    const remaining = Math.max(0, target - current);
    // Hand the celebration details to the next screen via sessionStorage, not
    // the URL — this keeps the instructor's name (and everything else) out of
    // the address bar and browser history.
    sessionStorage.setItem(
      "reps:celebrate",
      JSON.stringify({ coachName, done, added, remaining, unit })
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
        <div className={`text-[72px] font-light leading-none tracking-[-3px] tabular-nums transition-colors ${done ? "text-reps-green" : "text-reps-orange"}`}>
          {current}
        </div>
        <div className="text-[13px] text-reps-dim mt-1.5">
          of {target} {unit}
        </div>
      </div>

      <div className="h-1.5 bg-reps-line rounded-full overflow-hidden mb-8">
        <div
          className={`h-full rounded-full transition-all duration-300 ${done ? "bg-reps-green" : "bg-reps-orange"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex gap-2 mb-3">
        {[1, 10, 25, 50].map((n) => (
          <button
            key={n}
            onClick={() => addReps(n)}
            disabled={done}
            className="flex-1 bg-reps-card border border-reps-line text-reps-ink font-semibold text-base py-4 rounded-[10px] hover:border-reps-orange hover:text-reps-orange active:bg-reps-orange/10 active:scale-[0.97] transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            +{n}
          </button>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={added < 1 || saving}
        className="mt-auto w-full bg-reps-orange text-white font-semibold text-[15px] py-[14px] rounded-[10px] hover:bg-reps-orange-hi active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </main>
  );
}
