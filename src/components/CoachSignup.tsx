"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { LogoMini, LogoLarge } from "./Logo";

type Step = "landing" | "name" | "phone" | "code";

export default function CoachSignup() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("landing");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  function clearError() {
    if (error) setError("");
  }

  // Normalize phone to E.164 for Supabase
  function toE164(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
    if (digits.length === 10) return `+1${digits}`;
    return `+${digits}`;
  }

  async function handleSendCode() {
    setError("");
    const e164 = toE164(phone);
    if (e164.length < 10) {
      setError("Enter a valid US phone number.");
      return;
    }
    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: e164 });
    setLoading(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setStep("code");
  }

  async function handleVerify() {
    setError("");
    if (code.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    const e164 = toE164(phone);
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: e164,
      token: code,
      type: "sms",
    });
    const userId = data.user?.id;
    if (verifyError || !userId) {
      setLoading(false);
      setError(verifyError?.message ?? "Verification failed. Try again.");
      return;
    }

    // Insert coach row on first sign-up. On subsequent sign-ins the row already
    // exists — ignore the unique-constraint violation (Postgres code 23505).
    const { error: dbError } = await supabase.from("coaches").insert({
      id: userId,
      name: name.trim() || "Coach",
      phone: toE164(phone),
    });
    setLoading(false);
    if (dbError && dbError.code !== "23505") {
      setError(dbError.message);
      return;
    }
    router.push("/coach/roster");
  }

  // ── Shared UI primitives ──────────────────────────────────────────

  function StepHeader({ step: s, total }: { step: number; total: number }) {
    return (
      <div className="flex justify-between items-center mb-8">
        <LogoMini />
        <span className="text-xs text-[#5a5a5e]">Step {s} of {total}</span>
      </div>
    );
  }

  function ErrorBanner() {
    if (!error) return null;
    return (
      <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-[10px] px-4 py-3 text-sm mb-4">
        {error}
      </div>
    );
  }

  // ── Screens ───────────────────────────────────────────────────────

  if (step === "landing") {
    return (
      <div className="flex flex-col flex-1 items-center justify-center text-center">
        <LogoLarge />
        <h1 className="text-[36px] font-semibold tracking-[-1px] mb-2">Reps</h1>
        <p className="text-sm text-[#8a8a8e] italic mb-12">For players who want to be great.</p>
        <button
          onClick={() => setStep("name")}
          className="w-full max-w-[240px] bg-[#ff7a3d] text-[#0f0f10] font-semibold text-[15px] py-[14px] rounded-[10px] transition-colors hover:bg-[#ff8a52] active:scale-[0.99]"
        >
          Get started
        </button>
        <p className="mt-5 text-[13px] text-[#5a5a5e]">
          Already have an account?{" "}
          <button
            onClick={() => setStep("phone")}
            className="text-[#ff7a3d] font-medium hover:text-[#ff8a52]"
          >
            Sign in
          </button>
        </p>
      </div>
    );
  }

  if (step === "name") {
    return (
      <div className="flex flex-col flex-1">
        <StepHeader step={1} total={3} />
        <h2 className="text-2xl font-medium tracking-[-0.3px] mb-6">What&apos;s your name?</h2>
        <ErrorBanner />
        <input
          type="text"
          placeholder="Coach Rick"
          value={name}
          onChange={(e) => { setName(e.target.value); clearError(); }}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep("phone")}
          autoFocus
          className="bg-[#1a1a1c] border border-[#2a2a2c] rounded-[10px] px-[14px] py-[14px] text-base text-[#e8e8ea] outline-none focus:border-[#ff7a3d] transition-colors w-full mb-6 placeholder:text-[#5a5a5e]"
        />
        <button
          onClick={() => { if (name.trim()) setStep("phone"); else setError("Enter your name."); }}
          className="w-full bg-[#ff7a3d] text-[#0f0f10] font-semibold text-[15px] py-[14px] rounded-[10px] transition-colors hover:bg-[#ff8a52] active:scale-[0.99]"
        >
          Continue
        </button>
      </div>
    );
  }

  if (step === "phone") {
    return (
      <div className="flex flex-col flex-1">
        <StepHeader step={2} total={3} />
        <h2 className="text-2xl font-medium tracking-[-0.3px] mb-1">Your phone number</h2>
        <p className="text-[13px] text-[#8a8a8e] mb-1">We&apos;ll text you a code to sign in. No passwords ever.</p>
        <p className="text-[11px] text-[#5a5a5e] mb-6">Used only to sign in. Never shared.</p>
        <ErrorBanner />
        <input
          type="tel"
          placeholder="(555) 123-4567"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); clearError(); }}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleSendCode()}
          autoFocus
          className="bg-[#1a1a1c] border border-[#2a2a2c] rounded-[10px] px-[14px] py-[14px] text-base text-[#e8e8ea] outline-none focus:border-[#ff7a3d] transition-colors w-full mb-6 placeholder:text-[#5a5a5e]"
        />
        <button
          onClick={handleSendCode}
          disabled={loading}
          className="w-full bg-[#ff7a3d] text-[#0f0f10] font-semibold text-[15px] py-[14px] rounded-[10px] transition-colors hover:bg-[#ff8a52] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? "Sending…" : "Send code"}
        </button>
      </div>
    );
  }

  // step === "code"
  return (
    <div className="flex flex-col flex-1">
      <StepHeader step={3} total={3} />
      <h2 className="text-2xl font-medium tracking-[-0.3px] mb-1">Enter the code</h2>
      <p className="text-[13px] text-[#8a8a8e] mb-6">Sent to {phone}.</p>
      <ErrorBanner />
      <input
        ref={codeRef}
        type="text"
        inputMode="numeric"
        placeholder="000000"
        maxLength={6}
        value={code}
        onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); clearError(); }}
        onKeyDown={(e) => e.key === "Enter" && !loading && handleVerify()}
        className="bg-[#1a1a1c] border border-[#2a2a2c] rounded-[10px] px-[14px] py-[14px] text-lg tracking-[6px] text-center text-[#e8e8ea] outline-none focus:border-[#ff7a3d] transition-colors w-full mb-6 placeholder:text-[#5a5a5e] placeholder:tracking-normal"
      />
      <button
        onClick={handleVerify}
        disabled={loading}
        className="w-full bg-[#ff7a3d] text-[#0f0f10] font-semibold text-[15px] py-[14px] rounded-[10px] transition-colors hover:bg-[#ff8a52] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? "Verifying…" : "Verify"}
      </button>
      <div className="mt-auto pt-6 text-center">
        <button
          onClick={() => { setCode(""); setError(""); setStep("phone"); }}
          className="text-[13px] text-[#5a5a5e] hover:text-[#8a8a8e] transition-colors"
        >
          Wrong number? Go back
        </button>
      </div>
    </div>
  );
}
