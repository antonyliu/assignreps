import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import CoachSignup from "@/components/CoachSignup";

export const metadata: Metadata = { title: "Sign In — Reps" };

export default async function CoachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/coach/roster");
  return <CoachSignup />;
}
