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
        className="w-[30px] h-[30px] rounded-full bg-reps-orange/10 flex items-center justify-center text-[12px] font-semibold text-reps-orange hover:bg-reps-orange/20 transition-colors"
        title="Sign out"
      >
        {initials}
      </button>
      <div className="absolute right-0 top-9 bg-reps-raised border border-reps-line rounded-[8px] px-3 py-1.5 text-[12px] text-reps-sub whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Sign out
      </div>
    </div>
  );
}
