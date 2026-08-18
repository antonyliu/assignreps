"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { useSignup } from "../provider";
import { ScreenHeader, ErrorBanner, INPUT, BTN_PRIMARY } from "@/components/SignupUI";

// ⚠️ A 44px tap target on a 12px line, via the same technique PrivacyFooter
// uses: inline-flex for the height, a negative block margin so it adds none,
// align-middle to keep it on the text baseline. At 12px these labels are ~14px
// tall — the dead zone that made seven back links need several taps.
//
// px-1 rather than px-2 because there are TWO links in one sentence and they sit
// side by side; wider padding would run their targets together.
//
// text-reps-orange (#378add) is the app's established inline-link colour, used
// by this flow's own "Sign in" control. 5.48:1 on the app background — passes AA
// for normal text.
const CONSENT_LINK =
  "inline-flex min-h-[44px] items-center px-1 -my-[15px] align-middle text-reps-orange underline underline-offset-2 hover:text-reps-orange-hi transition-colors";

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

  // Send code is active only for an email with an @ and a dot after it.
  const emailValid = /.+@.+\..+/.test(email.trim());

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
        <h2 className="text-2xl font-semibold tracking-[-0.5px] mb-1 text-reps-ink">Your email</h2>
        <p className="text-[15px] text-reps-sub mb-6">We&apos;ll email you a sign-in code.</p>
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
            disabled={loading || !emailValid}
            className={`w-full rounded-[10px] py-[14px] text-[15px] font-semibold transition-colors disabled:pointer-events-none ${
              emailValid
                ? "bg-[#378add] text-white hover:bg-[#4a9ae8] active:scale-[0.99]"
                : "bg-[#1c1f26] text-[#3d4252]"
            }`}
          >
            {loading ? "Sending…" : "Send code"}
          </button>
          {/* ⚠️ THE ONLY PLACE A COACH IS EVER SHOWN /terms OR /privacy. Until
              Aug 17 2026 the entire signup tree contained no reference to
              either — no link, no checkbox — so every "you are responsible for"
              clause on /terms was asserted against someone who had never been
              shown it. The SMS verbal-consent clause is the load-bearing one:
              Twilio's toll-free registration rests on it.

              ⚠️ A NOTICE, NOT A GATE, and deliberately so. No checkbox, no
              consent column, no timestamp. The coaches row is inserted
              CLIENT-SIDE in submitCode() below, so a checkbox gating a button
              the client also controls would prove nothing an attacker or a bug
              could not walk past — it would look more rigorous while being
              exactly as unenforceable. This is a visibility fix; do not
              "strengthen" it into theatre.

              ⚠️ Renders on BOTH first signup and every returning sign-in,
              because this screen serves both — the landing header's "Sign in"
              links straight here, and the insert below tolerates a 23505 unique
              violation precisely because the row may already exist. Nothing
              distinguishes the two until after the email is submitted, so a
              checkbox would also have been shown to people who signed up months
              ago.

              ⚠️ /privacy, NOT /privacy#students-and-minors. That anchor is where
              PrivacyFooter sends students and parents; this reader is the coach,
              and the top of the page is written for them. */}
          <p className="mt-5 text-center text-[12px] leading-relaxed text-reps-dim">
            By continuing, you agree to our{" "}
            <Link href="/terms" className={CONSENT_LINK}>Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className={CONSENT_LINK}>Privacy Policy</Link>.
          </p>
        </form>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">
      <ScreenHeader stepNum={3} total={3} />
      <h2 className="text-2xl font-semibold tracking-[-0.5px] mb-1 text-reps-ink">Enter your code</h2>
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
