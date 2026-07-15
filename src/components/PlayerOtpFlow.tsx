"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Props = {
  token: string;
  prefillPhone?: string;
  lookupByPhone?: (phone: string) => Promise<{ ok: true; token: string } | { ok: false; error: string }>;
};

type Step = "phone" | "code";

const INPUT = "bg-reps-card border border-reps-line rounded-[10px] px-[14px] py-[14px] text-base text-reps-ink outline-none focus:border-reps-orange transition-colors w-full placeholder:text-reps-dim";

export default function PlayerOtpFlow({ token, prefillPhone = "", lookupByPhone }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep]               = useState<Step>("phone");
  const [phone, setPhone]             = useState(prefillPhone ?? "");
  const [displayPhone, setDisplayPhone] = useState(prefillPhone ? formatDisplay(prefillPhone) : "");
  const [code, setCode]               = useState("");
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);

  const codeRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (step === "code") codeRef.current?.focus(); }, [step]);

  function toE164(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
    if (digits.length === 10) return `+1${digits}`;
    return `+${digits}`;
  }

  function formatDisplay(e164: string) {
    const digits = e164.replace(/\D/g, "");
    if (digits.length === 11 && digits.startsWith("1")) {
      const d = digits.slice(1);
      return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    }
    return e164;
  }

  async function handleSendCode() {
    setError("");
    const e164 = toE164(phone);
    if (e164.length < 10) { setError("Enter a valid US phone number."); return; }
    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: e164 });
    setLoading(false);
    if (otpError) { setError(otpError.message); return; }
    setPhone(e164);
    setStep("code");
  }

  async function handleVerify() {
    setError("");
    if (code.length !== 6) { setError("Enter the 6-digit code."); return; }
    setLoading(true);
    const e164 = toE164(phone);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: e164, token: code, type: "sms",
    });

    if (verifyError) { setLoading(false); setError(verifyError.message); return; }

    if (token) { router.push(`/student/${token}`); return; }

    if (lookupByPhone) {
      const result = await lookupByPhone(e164);
      setLoading(false);
      if (!result.ok) { setError(result.error); return; }
      router.push(`/student/${result.token}`);
      return;
    }

    setLoading(false);
    setError("Something went wrong.");
  }

  if (step === "phone") {
    return (
      <div className="w-full flex flex-col gap-0">
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-[10px] px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}
        <input
          type="tel"
          placeholder={prefillPhone ? displayPhone : "(555) 123-4567"}
          value={displayPhone}
          onChange={(e) => { setDisplayPhone(e.target.value); setPhone(e.target.value); setError(""); }}
          className={`${INPUT} mb-4`}
        />
        <button
          onClick={handleSendCode}
          disabled={loading}
          className="w-full bg-reps-orange text-white font-semibold text-[15px] py-[14px] rounded-[10px] hover:bg-reps-orange-hi active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? "Sending…" : "Send code"}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-0">
      <p className="text-[13px] text-reps-sub text-center mb-4">
        Code sent to {displayPhone || phone}.
      </p>
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-[10px] px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}
      <input
        ref={codeRef}
        type="text"
        inputMode="numeric"
        placeholder="000000"
        maxLength={6}
        value={code}
        onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
        onKeyDown={(e) => e.key === "Enter" && !loading && handleVerify()}
        className={`${INPUT} tracking-[6px] text-center mb-4 placeholder:tracking-normal`}
      />
      <button
        onClick={handleVerify}
        disabled={loading}
        className="w-full bg-reps-orange text-white font-semibold text-[15px] py-[14px] rounded-[10px] hover:bg-reps-orange-hi active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? "Verifying…" : "Verify"}
      </button>
      <button
        onClick={() => { setCode(""); setError(""); setStep("phone"); }}
        className="mt-4 text-[13px] text-reps-dim hover:text-reps-sub transition-colors"
      >
        Wrong number? Go back
      </button>
    </div>
  );
}
