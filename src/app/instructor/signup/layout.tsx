import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { SignupProvider } from "./provider";

export const metadata: Metadata = { title: "Sign up — Reps" };

// Guards the whole signup segment: an already-signed-in coach with a COMPLETED
// profile is sent to the roster. An authed user with no coaches row (a dangling
// OTP session that never finished signup) is allowed to stay and complete it —
// bouncing them would loop against requireCoach, which sends them back here.
// Runs on the server on initial load of any signup route; preserved (not re-run)
// as the coach navigates between steps client-side.
export default async function SignupLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("id", user.id)
      .single();
    if (coach) redirect("/instructor/students");
  }

  return <SignupProvider>{children}</SignupProvider>;
}
