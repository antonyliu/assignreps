import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

// /instructor is the historical entry point; the signup flow now lives at
// /instructor/signup. Send COMPLETED coaches (auth user + coaches row) to the
// roster; send everyone else — unauthenticated visitors AND dangling OTP
// sessions with no coaches row — into the signup flow. (App links point straight
// at /instructor/signup, so this mainly catches bookmarks and direct visits.)
export default async function CoachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/instructor/signup");

  const { data: coach } = await supabase
    .from("coaches")
    .select("id")
    .eq("id", user.id)
    .single();
  redirect(coach ? "/instructor/students" : "/instructor/signup");
}
