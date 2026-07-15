"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useSignup } from "../provider";
import { ScreenHeader, ErrorBanner, INPUT, BTN_PRIMARY } from "@/components/SignupUI";

export default function EmailStep() {
  const supabase = createClient();
  const router = useRouter();
  const { name, instructorType, email, setEmail } = useSignup();

  // The code entry lives here as a sub-view rather than its own route: once the
  // OTP is sent we swap the email form for the code form on the same URL.
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    // No emailRedirectTo → Supabase sends a 6-digit OTP code instead of a magic link.
    const { error: otpError } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setLoading(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setCode("");
    setSent(true);
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim();
    if (!/^\d{6}$/.test(clean)) {
      setError("Enter the 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: clean,
      type: "email",
    });
    if (verifyError) {
      setLoading(false);
      setError(verifyError.message);
      return;
    }

    // Session is now set client-side. Create the coach row if it doesn't exist yet.
    const user = data.user;
    if (user) {
      const { error: insertError } = await supabase.from("coaches").insert({
        id: user.id,
        name: name.trim() || user.email || "Coach",
        email: user.email,
        instructor_type: instructorType,
      });
      // 23505 = unique violation — account row already exists (existing sign-in), that's fine.
      if (insertError && insertError.code !== "23505") {
        console.error("Failed to create instructor account", { code: insertError.code });
      }
    }

    router.push("/instructor/students");
  }

  async function resendCode() {
    setError("");
    const { error: otpError } = await supabase.auth.signInWithOtp({ email: email.trim() });
    if (otpError) setError(otpError.message);
  }

  if (!sent) {
    return (
      <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">
        <ScreenHeader stepNum={3} total={3} />
        <h2 className="text-2xl font-semibold tracking-[-0.5px] mb-1">Your email</h2>
        <p className="text-[15px] text-reps-sub mb-6">We&apos;ll send a 6-digit code. No password.</p>
        <ErrorBanner error={error} />
        <form onSubmit={submitEmail}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${INPUT} mb-6`}
          />
          <button
            type="submit"
            disabled={loading}
            className={`${BTN_PRIMARY} disabled:opacity-50 disabled:pointer-events-none`}
          >
            {loading ? "Sending…" : "Send code"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">
      <ScreenHeader stepNum={3} total={3} />
      <h2 className="text-2xl font-semibold tracking-[-0.5px] mb-1">Enter your code</h2>
      <p className="text-[13px] text-reps-sub mb-6">
        We emailed a 6-digit code to <span className="text-reps-ink font-medium">{email}</span>.
      </p>
      <ErrorBanner error={error} />
      <form onSubmit={submitCode}>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className={`${INPUT} mb-6 text-center text-2xl tracking-[0.4em] font-semibold`}
        />
        <button
          type="submit"
          disabled={loading}
          className={`${BTN_PRIMARY} disabled:opacity-50 disabled:pointer-events-none`}
        >
          {loading ? "Verifying…" : "Verify & continue"}
        </button>
      </form>
      <p className="mt-6 text-center text-[12px] text-reps-dim">
        Didn&apos;t get it?{" "}
        <button
          type="button"
          onClick={resendCode}
          className="text-reps-orange hover:text-reps-orange-hi transition-colors"
        >
          Resend code
        </button>
      </p>
    </main>
  );
}
