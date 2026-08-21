"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { useSignup } from "../provider";
import { ScreenHeader, ErrorBanner, INPUT, BTN_PRIMARY, EYEBROW } from "@/components/SignupUI";

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

  // ⚠️ WHICH FLOW IS THIS. The screen is shared: new-coach signup step 2, the
  // "Already have an account?" button on step 1, and the landing header's Sign
  // in link all land here on the same route. Only step 1's Continue adds
  // `?new=1`, so its presence is the one reliable signal for a genuine signup —
  // see the long note at that push for why the provider's `name` is not.
  //
  // The STEP chrome — the progress bar, its sr-only "Step 2 of 2", and the
  // "Setting up your account" eyebrow — is true only for a signup. A returning
  // coach signing in is not on step 2 of anything, so they get none of it.
  //
  // ⚠️ THE WORDMARK IS NOT STEP CHROME AND RENDERS EITHER WAY. It lives inside
  // ScreenHeader, so an earlier version of this that gated the whole component
  // shipped a sign-in screen with no Reps branding at all. ScreenHeader now
  // takes `showProgress` for exactly this; do not go back to `{isNewSignup &&
  // <ScreenHeader …>}`.
  const isNewSignup = useSearchParams().get("new") === "1";

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
        <ScreenHeader stepNum={2} total={2} showProgress={isNewSignup} />
        {/* Same words as step 1 — the two screens are one job. */}
        {isNewSignup && <p className={EYEBROW}>Setting up your account</p>}
        {/* ⚠️ The eyebrow above keeps its tight mb-2 — one unit with the
            headline. The reassurance that used to sit here moved DOWN to the
            field it is about; see the caption under the input. */}
        <h2 className="text-2xl font-semibold tracking-[-0.5px] mb-10 text-reps-ink">Your email</h2>
        <ErrorBanner error={error} />
        <form onSubmit={submitEmail}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT}
          />
          {/* ⚠️ FIELD-LEVEL TRUST, next to the field it is about — the same job
              "They'll get a text when you assign work." does under the phone
              field on the add-student screen, and the same 13px caption sitting
              mt-2 under its input.

              ⚠️ NOT the same COLOUR as that one, deliberately. That caption is
              #5a5f72, which measures 3.11:1 and is recorded in CLAUDE.md as a
              pre-existing AA failure left for a future sweep. Matching it
              exactly would copy a known defect onto a new screen, so this uses
              #7a8090 — 4.99:1, quieter than body text and above the 4.5 floor
              for 13px. If that sweep ever lands, these two should meet at a
              passing value rather than this one moving down. */}
          <p className="mt-2 mb-10 text-[13px] text-[#7a8090]">
            We&apos;ll only use this to email you a sign-in code.
          </p>
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
          {/* ⚠️ NEW TAB, and ONLY here. Signup state — name, instructor type,
              email — lives in plain useState inside SignupProvider, which the
              signup layout mounts. Nothing is persisted: no sessionStorage, no
              draft row. So ANY navigation out of the signup segment destroys it,
              and the coach restarts at step 1.

              Found on device via the most likely path: tap Terms, then tap that
              page's own back arrow, which returns to the LANDING page rather
              than to signup. But browser-back is no better — it remounts the
              provider empty. Opening in a new tab is what actually fixes it,
              because the signup tab is never navigated away from at all.

              ⚠️ SCOPED TO THESE TWO LINKS. /terms, /privacy and PrivacyFooter
              are deliberately untouched: a marketing visitor's back arrow
              returning them to the landing page is correct, and no other surface
              has in-progress state to protect. Do not generalise this.

              rel="noopener noreferrer" because target="_blank" otherwise hands
              the opened page a live window.opener reference back to this one. */}
          {/* ⚠️ Deliberately quieter than the content above it, but NOT below AA.
              This is a legal notice — the one line that must stay readable —
              so it steps from #8a8fa8 (6.17:1) to #7a8090, which measures
              4.99:1 on the app background and still clears the 4.5 floor for
              12px text. The next stop down, #6f7587, is 4.29:1 and fails; do
              not take it further to make it recede more. */}
          <p className="mt-5 text-center text-[12px] leading-relaxed text-[#7a8090]">
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Terms of Service (opens in a new tab)"
              className={CONSENT_LINK}
            >
              Terms
            </Link>
            {" "}and{" "}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Privacy Policy (opens in a new tab)"
              className={CONSENT_LINK}
            >
              Privacy Policy
            </Link>.
          </p>
        </form>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">
      {/* ⚠️ Gated too, not just the email view. A sign-in was showing "Step 2
          of 2" on BOTH screens; the code view is still step 2 for a genuine
          signup, so it keeps the bar under the same condition. The WORDMARK
          renders either way — see showProgress in SignupUI. */}
      <ScreenHeader stepNum={2} total={2} showProgress={isNewSignup} />
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
