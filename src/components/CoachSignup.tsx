"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { LogoMini } from "./Logo";

type Step = "name" | "instructor_type" | "email" | "code";
type InstructorType = "basketball" | "piano" | "martial_arts" | "tennis";

const INSTRUCTOR_OPTIONS: { id: InstructorType; label: string; emoji: string; available: boolean }[] = [
  { id: "basketball",   label: "Basketball",   emoji: "🏀", available: true  },
  { id: "piano",        label: "Piano",        emoji: "🎹", available: false },
  { id: "martial_arts", label: "Martial Arts", emoji: "🥋", available: false },
  { id: "tennis",       label: "Tennis",       emoji: "🎾", available: false },
];

const INPUT = "bg-reps-card border border-reps-line rounded-[10px] px-[14px] py-[14px] text-base text-reps-ink outline-none focus:border-reps-orange transition-colors w-full placeholder:text-reps-dim";
const BTN_PRIMARY = "w-full bg-reps-orange text-reps-bg font-semibold text-[15px] py-[14px] rounded-[10px] transition-colors hover:bg-reps-orange-hi active:scale-[0.99]";
const ERROR_BOX = "bg-red-900/20 border border-red-500/30 text-red-400 rounded-[10px] px-4 py-3 text-sm mb-4";

// Hoisted to module scope so they keep a stable identity and never remount.
function ScreenHeader({ stepNum, total, onBack }: { stepNum: number; total: number; onBack?: () => void }) {
  return (
    // Fixed height so the row is invariant to the back arrow: it is text-lg
    // (~28px line box, taller than the 24px logo) and only present from step 2
    // on, which would otherwise re-center the "Step X of 3" label 2px lower on
    // later steps. Pinning the height keeps the label in the same spot.
    <div className="flex justify-between items-center h-7 mb-12">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-reps-orange text-lg -ml-1 px-1 hover:text-reps-orange-hi transition-colors"
            aria-label="Go back"
          >
            ←
          </button>
        )}
        <LogoMini />
      </div>
      {/* Sized and weighted to match the wordmark — the two read as a pair. */}
      <span className="text-base font-semibold text-reps-dim">Step {stepNum} of {total}</span>
    </div>
  );
}

function ErrorBanner({ error }: { error: string }) {
  if (!error) return null;
  return <div className={ERROR_BOX}>{error}</div>;
}

export default function CoachSignup() {
  const supabase = createClient();
  const router = useRouter();

  const [step, setStep]                     = useState<Step>("name");
  const [name, setName]                     = useState("");
  const [instructorType, setInstructorType] = useState<InstructorType>("basketball");
  const [email, setEmail]                   = useState("");
  const [code, setCode]                     = useState("");
  const [error, setError]                   = useState("");
  const [loading, setLoading]               = useState(false);

  function submitName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Enter your name."); return; }
    setError("");
    setStep("instructor_type");
  }

  function submitInstructorType(e: React.FormEvent) {
    e.preventDefault();
    setStep("email");
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) { setError("Enter a valid email address."); return; }
    setError("");
    setLoading(true);
    // No emailRedirectTo → Supabase sends a 6-digit OTP code instead of a magic link.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
    });
    setLoading(false);
    if (otpError) { setError(otpError.message); return; }
    setCode("");
    setStep("code");
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim();
    if (!/^\d{6}$/.test(clean)) { setError("Enter the 6-digit code."); return; }
    setError("");
    setLoading(true);
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: clean,
      type: "email",
    });
    if (verifyError) { setLoading(false); setError(verifyError.message); return; }

    // Session is now set client-side. Create the coach row if it doesn't exist yet.
    const user = data.user;
    if (user) {
      const { error: insertError } = await supabase.from("coaches").insert({
        id: user.id,
        name: name.trim() || user.email || "Coach",
        email: user.email,
        instructor_type: instructorType,
      });
      // 23505 = unique violation — coach row already exists (existing sign-in), that's fine.
      if (insertError && insertError.code !== "23505") {
        console.error("coaches insert error:", insertError.message);
      }
    }

    router.push("/coach/roster");
  }

  async function resendCode() {
    setError("");
    const { error: otpError } = await supabase.auth.signInWithOtp({ email: email.trim() });
    if (otpError) setError(otpError.message);
  }

  if (step === "name") {
    return (
      <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">
        <ScreenHeader stepNum={1} total={3} />
        <h2 className="text-2xl font-semibold tracking-[-0.5px] mb-6">What&apos;s your name?</h2>
        <ErrorBanner error={error} />
        <form onSubmit={submitName}>
          <input
            type="text"
            placeholder="Coach RJ, Mrs. Tai"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${INPUT} mb-6 placeholder:italic`}
          />
          <button type="submit" className={BTN_PRIMARY}>Continue</button>
        </form>
        <p className="mt-6 text-center text-[13px] text-reps-dim">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => { setError(""); setStep("email"); }}
            className="text-reps-orange hover:text-reps-orange-hi transition-colors"
          >
            Sign in
          </button>
        </p>
      </main>
    );
  }

  if (step === "instructor_type") {
    return (
      <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">
        <ScreenHeader stepNum={2} total={3} onBack={() => setStep("name")} />
        <h2 className="text-2xl font-semibold tracking-[-0.5px] mb-6">What do you teach?</h2>
        <form onSubmit={submitInstructorType}>
          <div className="flex flex-col gap-3 mb-4">
            {INSTRUCTOR_OPTIONS.map((opt) => {
              const selected = instructorType === opt.id;
              if (!opt.available) {
                return (
                  <div
                    key={opt.id}
                    className="flex items-center gap-3 px-[16px] py-[14px] rounded-[10px] border border-reps-line/40 bg-reps-card/50 cursor-not-allowed"
                  >
                    {/* No opacity on the row — it would compound onto the badge
                        and label and cap their legibility. Each element carries
                        its own muting instead. */}
                    <span className="text-[22px] grayscale opacity-60">{opt.emoji}</span>
                    <span className="text-[15px] font-medium text-reps-ink/60">{opt.label}</span>
                    <span className="ml-auto text-[10px] font-semibold text-reps-ink bg-reps-line-hi px-[7px] py-[3px] rounded-full tracking-wide uppercase">
                      Soon
                    </span>
                  </div>
                );
              }
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setInstructorType(opt.id)}
                  className={`flex items-center gap-3 px-[16px] py-[14px] rounded-[10px] border text-left transition-all ${
                    selected
                      ? "border-reps-orange bg-reps-orange/10"
                      : "border-reps-line bg-reps-card hover:border-reps-line-hi"
                  }`}
                >
                  <span className="text-[22px]">{opt.emoji}</span>
                  <span className={`text-[15px] font-medium ${selected ? "text-reps-ink" : "text-reps-sub"}`}>
                    {opt.label}
                  </span>
                  {selected && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-reps-orange flex items-center justify-center shrink-0">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="var(--reps-bg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[12px] text-reps-sub text-center mb-8">More disciplines coming soon.</p>
          <button type="submit" className={BTN_PRIMARY}>Continue</button>
        </form>
      </main>
    );
  }

  if (step === "email") {
    return (
      <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">
        <ScreenHeader stepNum={3} total={3} onBack={() => setStep("instructor_type")} />
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

  // step === "code"
  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">
      <ScreenHeader stepNum={3} total={3} onBack={() => { setError(""); setStep("email"); }} />
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
