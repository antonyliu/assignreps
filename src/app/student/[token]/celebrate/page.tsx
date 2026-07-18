"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Celebration = {
  coachName: string;
  done: boolean;
  added: number;
  remaining: number;
  unit: string;
  allDone: boolean;
};

const CONFETTI_COLORS = ["#378add", "#3dd68c", "#f0b429", "#e8eaf0"];

// Singular/plural unit label ("1 minute" / "8 minutes", "1 rep" / "5 reps").
function unitWord(count: number, unit: string): string {
  if (count === 1) {
    if (unit === "reps") return "rep";
    if (unit === "minutes") return "minute";
  }
  return unit;
}

// Lightweight CSS confetti — a burst of colored pieces falling once. Rendered
// only on the client (after the celebration payload loads), so the random
// layout never causes a hydration mismatch. Keyframe lives in globals.css.
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 44 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 6,
      })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 rounded-[2px]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animation: `reps-confetti-fall ${p.duration}s linear ${p.delay}s both`,
          }}
        />
      ))}
    </div>
  );
}

export default function CelebratePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<Celebration | null>(null);

  // The log screen stashes the details here right before navigating; read them
  // once and clear them. Nothing sensitive travels in the URL.
  useEffect(() => {
    const raw = sessionStorage.getItem("reps:celebrate");
    if (raw) {
      try {
        setData(JSON.parse(raw) as Celebration);
      } catch {
        // ignore malformed payload — fall back to defaults below
      }
      sessionStorage.removeItem("reps:celebrate");
    }
  }, []);

  const coachName = data?.coachName || "Your instructor";
  const done = data?.done ?? true;
  const remaining = data?.remaining ?? 0;
  const unit = data?.unit ?? "reps";
  const allDone = data?.allDone ?? false;

  return (
    <main className="flex flex-col flex-1 min-h-screen items-center justify-center text-center px-6">
      {allDone && <Confetti />}

      <div className="text-[64px] mb-6">🔥</div>

      <h1 className={`font-semibold tracking-[-0.5px] mb-2 ${done ? "text-[40px]" : "text-[26px]"}`}>
        {done ? "Done." : "Logged."}
      </h1>

      <p className="text-[14px] text-reps-sub mb-10 max-w-[300px]">
        {done
          ? `${coachName} will see this.`
          : `${remaining} ${unitWord(remaining, unit)} to go. ${coachName} will see this.`}
      </p>

      <Link
        href={`/student/${token}`}
        className="w-full max-w-[240px] bg-reps-orange text-white font-semibold text-[15px] py-[14px] rounded-[10px] hover:bg-reps-orange-hi transition-colors"
      >
        Back to my assignments
      </Link>
    </main>
  );
}
