import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

// Gate for instructor app pages. Requires BOTH an authenticated Supabase user
// AND a completed coach profile (a row in `coaches`).
//
// A verified auth session alone is NOT enough. Someone who verified an email
// OTP but never finished signup — e.g. hit /instructor/signup/email directly via
// the landing "Sign in" link, abandoned the flow, or had the coaches insert fail
// while navigation proceeded anyway — is authenticated yet has no coaches row.
// Gating on getUser() alone treated that dangling session as a full instructor,
// which let it reach Add Player and the rest of the instructor app without ever
// completing signup.
//
// Authed-but-no-coach is sent to /instructor/signup to finish signup. The signup
// layout only bounces COMPLETED coaches (auth user + coaches row) to the roster,
// so this does not loop.
//
// Returns the Supabase client, the auth user, and the coach row so callers reuse
// them instead of re-fetching.
export async function requireCoach() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/instructor/signup");

  const { data: coach } = await supabase
    .from("coaches")
    .select("id, name, instructor_type")
    .eq("id", user.id)
    .single();

  if (!coach) redirect("/instructor/signup");

  return { supabase, user, coach };
}
