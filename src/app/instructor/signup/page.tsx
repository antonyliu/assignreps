"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignup } from "./provider";
import { ScreenHeader, ErrorBanner, INPUT } from "@/components/SignupUI";

export default function NameStep() {
  const router = useRouter();
  const { name, setName } = useSignup();
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }
    setError("");
    router.push("/instructor/signup/type");
  }

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">
      <ScreenHeader stepNum={1} total={3} />
      <h2 className="text-2xl font-semibold tracking-[-0.5px] mb-6">What&apos;s your name?</h2>
      <ErrorBanner error={error} />
      <form onSubmit={submit}>
        <input
          type="text"
          placeholder="Coach RJ, Mrs. Tai"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${INPUT} mb-6 placeholder:italic`}
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className={`w-full rounded-[10px] py-[14px] text-[15px] font-semibold transition-colors disabled:pointer-events-none ${
            name.trim()
              ? "bg-[#378add] text-white hover:bg-[#4a9ae8] active:scale-[0.99]"
              : "bg-[#1c1f26] text-[#3d4252]"
          }`}
        >
          Continue
        </button>
      </form>
      <p className="mt-6 text-center text-[13px] text-reps-dim">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => router.push("/instructor/signup/email")}
          className="text-reps-orange hover:text-reps-orange-hi transition-colors"
        >
          Sign in
        </button>
      </p>
    </main>
  );
}
