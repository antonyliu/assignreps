"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignup } from "./provider";
import { ScreenHeader, ErrorBanner, INPUT, EYEBROW } from "@/components/SignupUI";

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
    // ⚠️ `?new=1` MARKS THIS AS THE GENUINE SIGNUP PATH, and it is the only
    // push that carries it. /instructor/signup/email serves three entry points
    // — this one, the "Already have an account? Sign in" button below, and the
    // landing header's Sign in link — and until this param the three were
    // indistinguishable: same route, no query, nothing in the URL.
    //
    // ⚠️ NOT the provider's `name`, which was the obvious candidate and is
    // wrong twice. The Sign in button below does not clear it, so a visitor who
    // types a name and then realises they already have an account arrives with
    // it set; and provider state is not persisted (see the signup-state item in
    // CLAUDE.md), so a genuine signup who reloads the email screen loses it. A
    // query param survives the reload and cannot be set by the other two paths.
    //
    // Absence means sign-in. That is the safe default: a returning coach shown
    // signup chrome is the bug being fixed, and nothing is lost if a signup ever
    // arrives without it.
    router.push("/instructor/signup/email?new=1");
  }

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">
      <ScreenHeader stepNum={1} total={2} />
      {/* Names the job both signup screens belong to. Same words on step 2. */}
      <p className={EYEBROW}>Setting up your account</p>
      {/* ⚠️ The eyebrow above keeps its tight mb-2 — those two are ONE unit and
          must not drift apart while everything around them opens up. */}
      <h2 className="text-2xl font-semibold tracking-[-0.5px] mb-10 text-reps-ink">What should students call you?</h2>
      <ErrorBanner error={error} />
      <form onSubmit={submit}>
        <input
          type="text"
          placeholder="e.g. Coach RJ"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${INPUT} mb-10 placeholder:italic`}
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
          // ⚠️ Deliberately NO ?new=1 — this is the sign-in path, and it must
          // stay bare even though the name field above may already be filled.
          onClick={() => router.push("/instructor/signup/email")}
          className="text-reps-orange hover:text-reps-orange-hi transition-colors"
        >
          Sign in
        </button>
      </p>
    </main>
  );
}
