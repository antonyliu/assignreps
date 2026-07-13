"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addPlayer } from "./actions";

export default function AddPlayerPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toE164(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
    if (digits.length === 10) return `+1${digits}`;
    return `+${digits}`;
  }

  async function handleSubmit() {
    setError("");
    if (!name.trim()) { setError("Enter the player's name."); return; }
    if (!phone.trim()) { setError("Enter the player's phone number."); return; }

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

  const inputClass =
    "bg-[#1a1a1c] border border-[#2a2a2c] rounded-[10px] px-[14px] py-[14px] text-base text-[#e8e8ea] outline-none focus:border-[#ff7a3d] transition-colors w-full placeholder:text-[#5a5a5e]";

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      {/* Back header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/coach/roster"
          className="text-[#8a8a8e] text-lg px-2 hover:text-[#e8e8ea] transition-colors"
        >
          ←
        </Link>
        <span className="text-[14px] font-medium text-[#e8e8ea]">Add player</span>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-[10px] px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Name */}
      <label className="text-[13px] text-[#8a8a8e] block mb-1.5">Name</label>
      <input
        type="text"
        placeholder="First name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        className={`${inputClass} mb-6`}
      />

      {/* Player phone */}
      <label className="text-[13px] text-[#8a8a8e] block mb-1.5">Player&apos;s phone</label>
      <input
        type="tel"
        placeholder="(555) 123-4567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className={`${inputClass} mb-0.5`}
      />
      <p className="text-[11px] text-[#5a5a5e] mb-6">
        {name.trim()
          ? `${name.trim()} will get a text with their homework link.`
          : "They'll get a text with their homework link."}
      </p>

      {/* Parent phone */}
      <div className="border-t border-[#2a2a2c] pt-5 mb-6">
        <label className="text-[13px] text-[#8a8a8e] block mb-1.5">
          Parent&apos;s phone{" "}
          <span className="text-[#5a5a5e] font-normal">(optional)</span>
        </label>
        <input
          type="tel"
          placeholder="(555) 123-4567"
          value={parentPhone}
          onChange={(e) => setParentPhone(e.target.value)}
          className={`${inputClass} mb-0.5`}
        />
        <p className="text-[11px] text-[#5a5a5e]">
          They&apos;ll get a short weekly digest. Skip if not needed.
        </p>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-[#ff7a3d] text-[#0f0f10] font-semibold text-[15px] py-[14px] rounded-[10px] hover:bg-[#ff8a52] active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? "Adding…" : name.trim() ? `Add ${name.trim()}` : "Add player"}
      </button>
    </main>
  );
}
