"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function AuthComplete() {
  const router = useRouter();

  useEffect(() => {
    async function finish() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/coach");
        return;
      }

      const raw = localStorage.getItem("reps_pending_profile");
      const profile = raw ? JSON.parse(raw) : null;

      const { error } = await supabase.from("coaches").insert({
        id: user.id,
        name: profile?.name ?? user.email ?? "Coach",
        email: user.email,
        instructor_type: profile?.instructorType ?? "basketball",
      });

      // 23505 = unique violation — coach row already exists, that's fine
      if (error && error.code !== "23505") {
        console.error("coaches insert error:", error.message);
      }

      localStorage.removeItem("reps_pending_profile");
      router.replace("/coach/roster");
    }

    finish();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-reps-dim text-sm">Signing you in…</p>
    </div>
  );
}
