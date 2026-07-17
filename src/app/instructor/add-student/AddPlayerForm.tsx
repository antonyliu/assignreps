"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addPlayer } from "./actions";

const INPUT =
  "w-full rounded-[10px] border border-[#2a2d36] bg-[#1c1f26] px-[14px] py-[13px] text-base text-white outline-none transition-colors placeholder:text-[#5a5f72] focus:border-[#378add]";

type Recipient = "player" | "parent";

type Props = {
  studentLabel: string;
};

export default function AddPlayerForm({ studentLabel }: Props) {
  const router = useRouter();

  const [name, setName]           = useState("");
  const [phone, setPhone]         = useState("");
  const [recipient, setRecipient] = useState<Recipient>("player");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  const isParent = recipient === "parent";

  // CTA is active only with a name and a full 10-digit phone number.
  const firstName  = name.trim().split(/\s+/)[0];
  const phoneValid = phone.replace(/\D/g, "").length === 10;
  const formValid  = name.trim().length > 0 && phoneValid;

  function toE164(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
    if (digits.length === 10) return `+1${digits}`;
    return `+${digits}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim())  { setError(`Enter the ${studentLabel}'s name.`); return; }
    if (!phone.trim()) { setError("Enter a phone number."); return; }

    setLoading(true);
    const result = await addPlayer(
      name.trim(),
      toE164(phone),
      null,
      isParent
    );
    setLoading(false);

    if (!result.ok) { setError(result.error); return; }
    router.push("/instructor/students");
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#111318] px-6 pb-10 pt-9">

      {/* Header */}
      <div className="mb-10 flex items-center gap-3">
        <Link
          href="/instructor/students"
          aria-label="Back"
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-[20px] leading-none text-[#8a8fa8] transition-colors hover:text-white"
        >
          ←
        </Link>
        <span className="text-[15px] font-medium text-white">Add {studentLabel}</span>
      </div>

      {error && (
        <div className="mb-6 rounded-[10px] border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">

        {/* Name */}
        <label className="mb-2 block text-[13px] font-medium text-[var(--reps-label)]">Name</label>
        <input
          type="text"
          placeholder="First name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className={`${INPUT} mb-8`}
        />

        {/* Phone — label with an inline mini-segment for whose number this is */}
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-[13px] font-medium text-[var(--reps-label)]">Send homework to</label>
          <div className="flex items-center gap-[2px] rounded-[7px] bg-[#1c1f26] p-[3px]">
            {([
              ["player", studentLabel.charAt(0).toUpperCase() + studentLabel.slice(1)],
              ["parent", "Parent"],
            ] as [Recipient, string][]).map(([value, label]) => {
              const active = recipient === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setRecipient(value)}
                  className={`rounded-[5px] px-[10px] py-[3px] text-[11px] transition-colors ${
                    active ? "bg-[#378add] text-white" : "text-[#8a8fa8] hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <input
          type="tel"
          placeholder="(555) 000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={INPUT}
        />
        {isParent ? (
          <>
            <p className="mt-2 text-[13px] text-[#5a5f72]">
              They&apos;ll get the link to share with {firstName || "them"}.
            </p>
            <p className="mt-0.5 text-[13px] text-[#5a5f72]">Great for younger students.</p>
          </>
        ) : (
          <p className="mt-2 text-[13px] text-[#5a5f72]">
            They&apos;ll get a text with their homework link.
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !formValid}
          className={`mt-8 w-full rounded-[10px] py-[14px] text-[15px] font-semibold transition-all disabled:pointer-events-none ${
            formValid
              ? "bg-[#378add] text-white hover:bg-[#4a9ae8] active:scale-[0.99]"
              : "bg-[#1c1f26] text-[#3d4252]"
          }`}
        >
          {loading ? "Adding…" : formValid ? `Add ${firstName}` : `Add ${studentLabel}`}
        </button>
      </form>
    </main>
  );
}
