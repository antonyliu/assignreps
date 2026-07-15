"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { LogoMini } from "./Logo";
import { ACTIVITY_TYPES, ACTIVITY_TYPE_ORDER, type ActivityType } from "@/config/activityTypes";

type Step = "name" | "instructor_type" | "email" | "code";

const INPUT = "bg-reps-card border border-reps-line rounded-[10px] px-[14px] py-[14px] text-base text-reps-ink outline-none focus:border-reps-orange transition-colors w-full placeholder:text-reps-dim";
const BTN_PRIMARY = "w-full bg-reps-orange text-reps-bg font-semibold text-[15px] py-[14px] rounded-[10px] transition-colors hover:bg-reps-orange-hi active:scale-[0.99]";
const ERROR_BOX = "bg-red-900/20 border border-red-500/30 text-red-400 rounded-[10px] px-4 py-3 text-sm mb-4";

// Hoisted to module scope so they keep a stable identity and never remount.

// Progress pills below the logo: active step is a wide blue pill, completed
// steps a small faded-blue dot, upcoming steps a small dark dot.
function StepDots({ stepNum, total }: { stepNum: number; total: number }) {
  return (
    <div className="flex justify-center items-center gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, i) => {
        const idx = i + 1;
        const active = idx === stepNum;
        const completed = idx < stepNum;
        return (
          <span
            key={idx}
            className={`h-1.5 rounded-full transition-all ${
              active ? "w-6 bg-reps-orange" : completed ? "w-1.5 bg-reps-orange/40" : "w-1.5 bg-reps-line"
            }`}
          />
        );
      })}
    </div>
  );
}

function ScreenHeader({ stepNum, total }: { stepNum: number; total: number }) {
  return (
    // Generous space above and below the dots so they read as an anchored
    // progress band rather than floating between the logo and the heading.
    <div className="mb-14">
      <div className="flex items-center h-7 mb-9">
        <LogoMini />
      </div>
      <StepDots stepNum={stepNum} total={total} />
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
  const [instructorType, setInstructorType] = useState<ActivityType>("basketball");
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
          <button type="submit" className={`${BTN_PRIMARY} w-full`}>Continue</button>
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
        <ScreenHeader stepNum={2} total={3} />
        <h2 className="text-2xl font-semibold tracking-[-0.5px] mb-6">What do you teach?</h2>
        <form onSubmit={submitInstructorType}>
          <div className="flex flex-col gap-3 mb-4">
            {ACTIVITY_TYPE_ORDER.map((id) => {
              const opt = ACTIVITY_TYPES[id];
              const selected = instructorType === id;
              if (!opt.available) {
                return (
                  <div
                    key={id}
                    // Disabled row: a very subtle dark surface with a near-invisible
                    // border to give it shape, and opacity-60 on the whole row so all
                    // its content recedes. No hover, not-allowed cursor.
                    className="flex items-center gap-3 px-[16px] py-[14px] rounded-[10px] border border-reps-line/40 bg-reps-card/50 opacity-60 cursor-not-allowed"
                  >
                    <span className="text-[22px] grayscale">{opt.emoji}</span>
                    <span className="text-[15px] font-medium text-reps-ink">{opt.label}</span>
                    <span className="ml-auto text-[10px] font-semibold text-reps-sub bg-reps-raised px-[7px] py-[3px] rounded-full tracking-wide uppercase">
                      Soon
                    </span>
                  </div>
                );
              }
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => setInstructorType(id)}
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
          {/* Hairline above anchors this as a section footer, not floating text. */}
          <p className="text-[12px] text-reps-sub text-center border-t border-reps-line pt-4 mt-1 mb-8">More disciplines coming soon.</p>
          <button type="submit" className={BTN_PRIMARY}>Continue</button>
        </form>
      </main>
    );
  }

  if (step === "email") {
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

  // step === "code"
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
