"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import type { Unit } from "@/lib/exercises";
import { saveCustomAssignment } from "./actions";

const INPUT = "bg-reps-card border border-reps-line rounded-[10px] px-[14px] py-[14px] text-base text-reps-ink outline-none focus:border-reps-orange transition-colors w-full placeholder:text-reps-dim";

const UNITS: { id: Unit; label: string }[] = [
  { id: "reps",    label: "Reps" },
  { id: "minutes", label: "Minutes" },
];

type Props = {
  playerId: string;
  playerName: string;
};

export default function CustomExerciseScreen({ playerId, playerName }: Props) {
  const router = useRouter();
  const [name, setName]     = useState("");
  const [unit, setUnit]     = useState<Unit>("reps");
  const [target, setTarget] = useState(25);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [sentIn, setSentIn] = useState(false);

  // On success: land a brief confirmation (scale/fade in), hold a beat, then
  // navigate back to the student detail screen — same as the preset flow.
  useEffect(() => {
    if (!sent) return;
    const raf = requestAnimationFrame(() => setSentIn(true));
    const nav = setTimeout(() => router.push(`/instructor/student/${playerId}`), 1300);
    return () => { cancelAnimationFrame(raf); clearTimeout(nav); };
  }, [sent, playerId, router]);

  async function handleConfirm() {
    setError("");
    if (!name.trim()) { setError("Name the exercise."); return; }
    if (!target || target < 1) { setError("Enter an amount greater than 0."); return; }
    setLoading(true);
    const result = await saveCustomAssignment(playerId, name.trim(), target, unit);
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
          href={`/instructor/student/${playerId}/assign`}
          className="text-reps-sub text-lg -ml-1 px-1 hover:text-reps-ink transition-colors"
        >
          ←
        </Link>
        <span className="text-[14px] font-medium text-reps-ink">Assign to {playerName}</span>
      </div>

      <h2 className="text-2xl font-semibold tracking-[-0.5px] mb-6">Create your own</h2>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-[10px] px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <label className="text-[13px] text-[var(--reps-label)] block mb-2">Exercise name</label>
      <input
        type="text"
        placeholder="e.g. Wall sits"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        className={`${INPUT} mb-7`}
      />

      <label className="text-[13px] text-[var(--reps-label)] block mb-2">Track by</label>
      <div className="flex gap-2 mb-7">
        {UNITS.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => setUnit(u.id)}
            className={`flex-1 py-3 rounded-[10px] text-[14px] font-medium border transition-all ${
              unit === u.id
                ? "bg-reps-orange/10 border-reps-orange/30 text-reps-orange"
                : "bg-reps-card border-reps-line text-reps-ink hover:border-reps-line-hi"
            }`}
          >
            {u.label}
          </button>
        ))}
      </div>

      <label className="text-[13px] text-[var(--reps-label)] block mb-2">How many?</label>
      <input
        type="number"
        min={1}
        value={target}
        onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
        onFocus={(e) => e.target.select()}
        className="bg-reps-card border border-reps-line rounded-[10px] px-[14px] py-[14px] text-lg text-center text-reps-ink outline-none focus:border-reps-orange transition-colors w-full placeholder:text-reps-dim mb-8"
      />

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
