"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function SignOutButton({ initials }: { initials: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="relative group">
      <button
        onClick={handleSignOut}
        className="w-[30px] h-[30px] rounded-full bg-[rgba(255,122,61,0.12)] flex items-center justify-center text-[12px] font-semibold text-[#ff7a3d] hover:bg-[rgba(255,122,61,0.2)] transition-colors"
        title="Sign out"
      >
        {initials}
      </button>
      {/* Tooltip */}
      <div className="absolute right-0 top-9 bg-[#1a1a1c] border border-[#2a2a2c] rounded-[8px] px-3 py-1.5 text-[12px] text-[#8a8a8e] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Sign out
      </div>
    </div>
  );
}
