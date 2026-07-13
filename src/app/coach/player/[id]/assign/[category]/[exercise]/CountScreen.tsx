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
  const [error, setError] = useState("");
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

  const inputClass =
    "bg-[#1a1a1c] border border-[#2a2a2c] rounded-[10px] px-[14px] py-[14px] text-lg text-center text-[#e8e8ea] outline-none focus:border-[#ff7a3d] transition-colors w-full placeholder:text-[#5a5a5e]";

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      {/* Back header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/coach/player/${playerId}/assign/${categorySlug}`}
          className="text-[#8a8a8e] text-lg px-2 hover:text-[#e8e8ea] transition-colors"
        >
          ←
        </Link>
        <span className="text-[14px] font-medium text-[#e8e8ea]">Assign to {playerName}</span>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-[10px] px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Exercise name */}
      <span className="text-[13px] text-[#8a8a8e] mb-1">Exercise</span>
      <h2 className="text-2xl font-medium tracking-[-0.3px] mb-8">{exerciseName}</h2>

      {/* Quick-count buttons */}
      <label className="text-[13px] text-[#8a8a8e] block mb-2">How many?</label>
      <div className="flex gap-2 mb-3 flex-wrap">
        {quickCounts.map((n) => (
          <button
            key={n}
            onClick={() => setTarget(n)}
            className={`flex-1 py-3 rounded-[10px] text-[14px] font-medium border transition-all
              ${target === n
                ? "bg-[rgba(255,122,61,0.12)] border-[rgba(255,122,61,0.35)] text-[#ff7a3d]"
                : "bg-[#1a1a1c] border-[#2a2a2c] text-[#e8e8ea] hover:border-[#3a3a3c]"
              }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Manual input */}
      <input
        type="number"
        min={1}
        value={target}
        onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
        className={`${inputClass} mb-1`}
      />
      <p className="text-[12px] text-[#5a5a5e] text-center mb-8">{unit}</p>

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full bg-[#ff7a3d] text-[#0f0f10] font-semibold text-[15px] py-[14px] rounded-[10px] hover:bg-[#ff8a52] active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? "Saving…" : `Send to ${playerName}`}
      </button>
    </main>
  );
}
