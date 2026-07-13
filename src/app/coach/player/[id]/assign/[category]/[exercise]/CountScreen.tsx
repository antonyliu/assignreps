"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Unit } from "@/lib/exercises";
import { saveAssignment } from "./actions";

type Props = {
  playerId: string;
  playerName: string;
  categorySlug: string;
  exerciseName: string;
  defaultTarget: number;
  unit: Unit;
  quickCounts: number[];
};

export default function CountScreen({
  playerId,
  playerName,
  categorySlug,
  exerciseName,
  defaultTarget,
  unit,
  quickCounts,
}: Props) {
  const router = useRouter();
  const [target, setTarget] = useState(defaultTarget);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setError("");
    if (!target || target < 1) { setError("Enter a target greater than 0."); return; }
    setLoading(true);
    const result = await saveAssignment(playerId, exerciseName, target, unit);
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    router.push(`/coach/player/${playerId}`);
  }

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/coach/player/${playerId}/assign/${categorySlug}`}
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

      <span className="text-[13px] text-reps-sub mb-1">Exercise</span>
      <h2 className="text-2xl font-semibold tracking-[-0.5px] mb-8">{exerciseName}</h2>

      <label className="text-[13px] text-reps-sub block mb-2">How many?</label>
      <div className="flex gap-2 mb-3 flex-wrap">
        {quickCounts.map((n) => (
          <button
            key={n}
            onClick={() => setTarget(n)}
            className={`flex-1 py-3 rounded-[10px] text-[14px] font-medium border transition-all ${
              target === n
                ? "bg-reps-orange/10 border-reps-orange/30 text-reps-orange"
                : "bg-reps-card border-reps-line text-reps-ink hover:border-reps-line-hi"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <input
        type="number"
        min={1}
        value={target}
        onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
        className="bg-reps-card border border-reps-line rounded-[10px] px-[14px] py-[14px] text-lg text-center text-reps-ink outline-none focus:border-reps-orange transition-colors w-full placeholder:text-reps-dim mb-1"
      />
      <p className="text-[12px] text-reps-dim text-center mb-8">{unit}</p>

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full bg-reps-orange text-reps-bg font-semibold text-[15px] py-[14px] rounded-[10px] hover:bg-reps-orange-hi active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? "Saving…" : `Send to ${playerName}`}
      </button>
    </main>
  );
}
