"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addPlayer } from "./actions";

const INPUT = "bg-reps-card border border-reps-line rounded-[10px] px-[14px] py-[14px] text-base text-reps-ink outline-none focus:border-reps-orange transition-colors w-full placeholder:text-reps-dim";

type Props = {
  studentLabel: string;
};

export default function AddPlayerForm({ studentLabel }: Props) {
  const router = useRouter();

  const [name, setName]               = useState("");
  const [phone, setPhone]             = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);

  const StudentLabel = studentLabel.charAt(0).toUpperCase() + studentLabel.slice(1);

  function toE164(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
    if (digits.length === 10) return `+1${digits}`;
    return `+${digits}`;
  }

  async function handleSubmit() {
    setError("");
    if (!name.trim()) { setError(`Enter the ${studentLabel}'s name.`); return; }
    if (!phone.trim()) { setError(`Enter the ${studentLabel}'s phone number.`); return; }

    setLoading(true);
    const result = await addPlayer(
      name.trim(),
      toE164(phone),
      parentPhone.trim() ? toE164(parentPhone) : null
    );
    setLoading(false);

    if (!result.ok) { setError(result.error); return; }
    router.push("/coach/roster");
  }

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/coach/roster"
          className="text-reps-sub text-lg -ml-1 px-1 hover:text-reps-ink transition-colors"
        >
          ←
        </Link>
        <span className="text-[14px] font-medium text-reps-ink">Add {studentLabel}</span>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-[10px] px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <label className="text-[13px] text-reps-sub block mb-1.5">Name</label>
      <input
        type="text"
        placeholder="First name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        className={`${INPUT} mb-6`}
      />

      <label className="text-[13px] text-reps-sub block mb-1.5">{StudentLabel}&apos;s phone</label>
      <input
        type="tel"
        placeholder="(555) 123-4567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className={`${INPUT} mb-0.5`}
      />
      <p className="text-[11px] text-reps-dim mb-6">
        {name.trim()
          ? `${name.trim()} will get a text with their homework link.`
          : "They'll get a text with their homework link."}
      </p>

      <div className="border-t border-reps-line pt-5 mb-6">
        <label className="text-[13px] text-reps-sub block mb-1.5">
          Parent&apos;s phone{" "}
          <span className="text-reps-dim font-normal">(optional)</span>
        </label>
        <input
          type="tel"
          placeholder="(555) 123-4567"
          value={parentPhone}
          onChange={(e) => setParentPhone(e.target.value)}
          className={`${INPUT} mb-0.5`}
        />
        <p className="text-[11px] text-reps-dim">
          They&apos;ll get a short weekly digest. Skip if not needed.
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-reps-orange text-reps-bg font-semibold text-[15px] py-[14px] rounded-[10px] hover:bg-reps-orange-hi active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? "Adding…" : name.trim() ? `Add ${name.trim()}` : `Add ${studentLabel}`}
      </button>
    </main>
  );
}
