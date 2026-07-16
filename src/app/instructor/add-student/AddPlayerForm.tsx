"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addPlayer } from "./actions";

const INPUT =
  "w-full rounded-[10px] border border-[#2a2d36] bg-[#1c1f26] px-[14px] py-[13px] text-base text-white outline-none transition-colors placeholder:text-[#5a5f72] focus:border-[#378add]";

type Props = {
  studentLabel: string;
};

export default function AddPlayerForm({ studentLabel }: Props) {
  const router = useRouter();

  const [name, setName]               = useState("");
  const [phone, setPhone]             = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [showParent, setShowParent]   = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);

  const parentRef = useRef<HTMLInputElement>(null);

  const StudentLabel = studentLabel.charAt(0).toUpperCase() + studentLabel.slice(1);

  // Auto-focus the parent input once the expand animation (200ms) has settled.
  useEffect(() => {
    if (!showParent) return;
    const t = setTimeout(() => parentRef.current?.focus(), 210);
    return () => clearTimeout(t);
  }, [showParent]);

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
    if (!phone.trim()) { setError(`Enter the ${studentLabel}'s phone number.`); return; }

    setLoading(true);
    const result = await addPlayer(
      name.trim(),
      toE164(phone),
      showParent && parentPhone.trim() ? toE164(parentPhone) : null
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
        <label className="mb-2 block text-[13px] font-medium text-[#8a8fa8]">Name</label>
        <input
          type="text"
          placeholder="First and last name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className={`${INPUT} mb-8`}
        />

        {/* Phone */}
        <label className="mb-2 block text-[13px] font-medium text-[#8a8fa8]">
          {StudentLabel}&apos;s phone
        </label>
        <input
          type="tel"
          placeholder="(555) 000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={INPUT}
        />
        <p className="mt-2 text-[12px] text-[#8a8fa8]">
          They&apos;ll get a text with their homework link.
        </p>

        {/* Divider between student section and parent card */}
        <div className="my-8 border-t-[0.5px] border-[#2a2d36]" />

        {/* Parent toggle card */}
        <div
          className={`rounded-[10px] border-[0.5px] bg-[#1c1f26] transition-colors duration-200 ${
            showParent ? "border-[#378add33]" : "border-[#2a2d36]"
          }`}
        >
          <div className="flex items-center justify-between gap-4 p-4">
            <div>
              <div className="text-[14px] font-medium text-white">Add a parent</div>
              <div className="mt-1 text-[12px] text-[#8a8fa8]">
                They&apos;ll get a short weekly update
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={showParent}
              aria-label="Add a parent"
              onClick={() => setShowParent((v) => !v)}
              className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-200 ${
                showParent ? "bg-[#378add]" : "bg-[#2a2d36]"
              }`}
            >
              <span
                className={`absolute top-[3px] left-[3px] h-[20px] w-[20px] rounded-full transition-transform duration-200 ease-out ${
                  showParent ? "translate-x-[18px] bg-white" : "translate-x-0 bg-[#5a5f72]"
                }`}
              />
            </button>
          </div>

          {/* Expandable phone input */}
          <div
            className={`grid transition-all duration-200 ease-out ${
              showParent ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div className="border-t-[0.5px] border-[#2a2d36] px-4 pb-4 pt-4">
                <label className="mb-2 block text-[13px] font-medium text-[#8a8fa8]">
                  Parent&apos;s phone{" "}
                  <span className="font-normal text-[#5a5f72]">(optional)</span>
                </label>
                <input
                  ref={parentRef}
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  tabIndex={showParent ? 0 : -1}
                  className="w-full rounded-[10px] border border-[#2a2d36] bg-[#111318] px-[14px] py-[13px] text-base text-white outline-none transition-colors placeholder:text-[#5a5f72] focus:border-[#378add]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-8 w-full rounded-[10px] bg-[#378add] py-[14px] text-[15px] font-semibold text-white transition-all hover:bg-[#4a9ae8] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? "Adding…" : name.trim() ? `Add ${name.trim()}` : `Add ${studentLabel}`}
        </button>
      </form>
    </main>
  );
}
