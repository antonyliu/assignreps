"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { LogoMini } from "./Logo";

type Step = "name" | "instructor_type" | "email" | "check_email";
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
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-reps-sub text-lg -ml-1 px-1 hover:text-reps-ink transition-colors"
            aria-label="Go back"
          >
            ←
          </button>
        )}
        <LogoMini />
      </div>
      <span className="text-xs text-reps-dim">Step {stepNum} of {total}</span>
    </div>
  );
}

function ErrorBanner({ error }: { error: string }) {
  if (!error) return null;
  return <div className={ERROR_BOX}>{error}</div>;
}

export default function CoachSignup() {
  const supabase = createClient();

  const [step, setStep]                     = useState<Step>("name");
  const [name, setName]                     = useState("");
  const [instructorType, setInstructorType] = useState<InstructorType>("basketball");
  const [email, setEmail]                   = useState("");
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
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (otpError) { setError(otpError.message); return; }
    localStorage.setItem("reps_pending_profile", JSON.stringify({ name: name.trim(), instructorType }));
    setStep("check_email");
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
            placeholder="e.g. Coach RJ, Mrs. Chen, or Sarah"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${INPUT} mb-6`}
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
                    className="flex items-center gap-3 px-[16px] py-[14px] rounded-[10px] border border-reps-line/40 bg-reps-card/50 opacity-50 cursor-not-allowed"
                  >
                    <span className="text-[22px] grayscale">{opt.emoji}</span>
                    <span className="text-[15px] font-medium text-reps-dim">{opt.label}</span>
                    <span className="ml-auto text-[10px] font-semibold text-reps-dim bg-reps-line px-[7px] py-[3px] rounded-full tracking-wide uppercase">
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
                        <path d="M1 4l3 3 5-6" stroke="#161310" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[12px] text-reps-dim mb-8">More disciplines coming soon.</p>
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
        <p className="text-[13px] text-reps-sub mb-6">We&apos;ll send a magic link — no password needed.</p>
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
            {loading ? "Sending…" : "Send magic link"}
          </button>
        </form>
      </main>
    );
  }

  // step === "check_email"
  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">
      <div className="flex items-center mb-8">
        <LogoMini />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="w-14 h-14 rounded-[14px] bg-reps-orange/10 flex items-center justify-center mb-5">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="#378add" strokeWidth="1.7" />
            <path d="M2 8l10 7 10-7" stroke="#378add" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold tracking-[-0.5px] mb-2">Check your email</h2>
        <p className="text-[14px] text-reps-sub leading-relaxed max-w-[280px]">
          We sent a link to <span className="text-reps-ink font-medium">{email}</span>. Tap it to sign in — no password needed.
        </p>
        <p className="mt-8 text-[12px] text-reps-dim">
          Wrong email?{" "}
          <button
            type="button"
            onClick={() => { setEmail(""); setError(""); setStep("email"); }}
            className="text-reps-orange hover:text-reps-orange-hi"
          >
            Go back
          </button>
        </p>
      </div>
    </main>
  );
}
