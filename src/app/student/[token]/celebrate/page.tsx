"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Celebration = {
  coachName: string;
  done: boolean;
  added: number;
  remaining: number;
  unit: string;
  /** What to count in — "attempts" | "reps" | "minutes". Mirrors the stepper's
   *  own label, so a makes-tracked drill doesn't get counted in "reps" here.
   *  Absent from payloads written before this field existed; `unit` covers those. */
  noun?: string;
  /** Absent on payloads written before goal types existed; `noun` covers those. */
  goalType?: "reps" | "makes" | "consecutive";
  allDone: boolean;
};

// Three distinct outcomes, not two. The payload is read once and deleted, so
// "haven't looked yet" and "looked, found nothing" are genuinely different
// situations and collapsing them is what made a refresh claim "Done."
type Status =
  | { phase: "loading" }
  | { phase: "ready"; data: Celebration }
  | { phase: "missing" };

const STORAGE_KEY = "reps:celebrate";

const CONFETTI_COLORS = ["#378add", "#3dd68c", "#f0b429", "#e8eaf0"];

// Singular/plural count label ("1 minute" / "8 minutes", "1 attempt" / "5 attempts").
function unitWord(count: number, unit: string): string {
  if (count === 1) {
    if (unit === "reps") return "rep";
    if (unit === "minutes") return "minute";
    if (unit === "attempts") return "attempt";
    if (unit === "makes") return "make";
    if (unit === "sets completed") return "set";
  }
  if (unit === "sets completed") return "sets";
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
  const [status, setStatus] = useState<Status>({ phase: "loading" });

  // The log screen stashes the details here right before navigating; read them
  // once and clear them. Nothing sensitive travels in the URL.
  //
  // Clearing on read is deliberate — a celebration should not replay — which is
  // exactly why a refresh lands on `missing` rather than on the real result.
  // Reads are wrapped because storage can be unavailable outright (Safari private
  // browsing): that has to resolve to `missing` too, not throw and leave the
  // screen stuck mid-load.
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable — treated as no payload.
    }

    if (!raw) {
      setStatus({ phase: "missing" });
      return;
    }

    try {
      setStatus({ phase: "ready", data: JSON.parse(raw) as Celebration });
    } catch {
      setStatus({ phase: "missing" });
    }
  }, []);

  const shell = "flex flex-col flex-1 min-h-screen items-center justify-center text-center px-6";

  // Nothing renders until the payload has been read. The defaults used to double
  // as the loading state, so every visit asserted "Done." for a frame before
  // correcting itself — visible as a headline that changed size mid-load.
  if (status.phase === "loading") {
    return <main className={shell} aria-busy="true" />;
  }

  const data = status.phase === "ready" ? status.data : null;

  // No payload means the outcome is genuinely unknown (refresh, direct visit, or
  // storage that refused the write). Defaults must therefore be the modest ones:
  // claiming completion here is how a student who logged 10 of 50 got told they
  // had finished.
  const known     = data !== null;
  const done      = data?.done ?? false;
  const allDone   = data?.allDone ?? false;
  const remaining = data?.remaining ?? 0;
  const coachName = data?.coachName?.trim() || "Your instructor";
  const noun      = data?.noun || data?.unit || "reps";

  const headline = done ? "Done." : "Logged.";
  const subline = !known
    ? "Your progress is saved."
    : done
      ? `${coachName} will see this.`
      : `${remaining} ${unitWord(remaining, noun)} to go. ${coachName} will see this.`;

  return (
    <main className={shell}>
      {allDone && <Confetti />}

      <div className="text-[64px] mb-6">🔥</div>

      <h1 className={`font-semibold tracking-[-0.5px] mb-2 ${done ? "text-[40px]" : "text-[26px]"}`}>
        {headline}
      </h1>

      <p className="text-[14px] text-reps-sub mb-10 max-w-[300px]">{subline}</p>

      <Link
        href={`/student/${token}`}
        className="w-full max-w-[240px] bg-reps-orange text-white font-semibold text-[15px] py-[14px] rounded-[10px] hover:bg-reps-orange-hi transition-colors"
      >
        Back to my assignments
      </Link>
    </main>
  );
}
