"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CelebratePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const searchParams = useSearchParams();

  const coachName = searchParams.get("coach") ?? "Coach";
  const done = searchParams.get("done") === "1";
  const added = parseInt(searchParams.get("added") ?? "0");
  const remaining = parseInt(searchParams.get("remaining") ?? "0");
  const unit = searchParams.get("unit") ?? "reps";

  return (
    <main className="flex flex-col flex-1 min-h-screen items-center justify-center text-center px-6">
      <div className="text-[64px] mb-6">🔥</div>

      <h1 className="text-[26px] font-medium tracking-[-0.3px] mb-2">
        {done ? "Done." : `+${added} ${unit} logged.`}
      </h1>

      <p className="text-[14px] text-[#8a8a8e] mb-10 max-w-[260px]">
        {done
          ? `${coachName} will see this.`
          : `${remaining} ${unit} to go. ${coachName} will see this.`}
      </p>

      <Link
        href={`/player/${token}`}
        className="w-full max-w-[240px] bg-[#ff7a3d] text-[#0f0f10] font-semibold text-[15px] py-[14px] rounded-[10px] hover:bg-[#ff8a52] transition-colors"
      >
        Back to my reps
      </Link>
    </main>
  );
}
