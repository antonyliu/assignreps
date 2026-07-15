import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

// /coach is the historical entry point; the signup flow now lives at
// /coach/signup. Send signed-in coaches to the roster, everyone else into the
// flow. (App links point straight at /coach/signup, so this mainly catches
// bookmarks and direct visits.)
export default async function CoachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  redirect(user ? "/coach/roster" : "/coach/signup");
}
