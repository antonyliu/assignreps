"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

type Celebration = {
  coachName: string;
  done: boolean;
  added: number;
  remaining: number;
  unit: string;
};

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
  const added = data?.added ?? 0;
  const remaining = data?.remaining ?? 0;
  const unit = data?.unit ?? "reps";

  return (
    <main className="flex flex-col flex-1 min-h-screen items-center justify-center text-center px-6">
      <div className="text-[64px] mb-6">🔥</div>

      <h1 className="text-[26px] font-semibold tracking-[-0.5px] mb-2">
        {done ? "Done." : `+${added} ${unit} logged.`}
      </h1>

      <p className="text-[14px] text-reps-sub mb-10 max-w-[260px]">
        {done
          ? `${coachName} will see this.`
          : `${remaining} ${unit} to go. ${coachName} will see this.`}
      </p>

      <Link
        href={`/student/${token}`}
        className="w-full max-w-[240px] bg-reps-orange text-white font-semibold text-[15px] py-[14px] rounded-[10px] hover:bg-reps-orange-hi transition-colors"
      >
        Back to my week
      </Link>
    </main>
  );
}
