import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { SignupProvider } from "./provider";

export const metadata: Metadata = { title: "Sign up — Reps" };

// Guards the whole signup segment: an already-signed-in coach is sent to the
// roster. Runs on the server on initial load of any signup route; preserved
// (not re-run) as the coach navigates between steps client-side.
export default async function SignupLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/instructor/students");

  return <SignupProvider>{children}</SignupProvider>;
}
