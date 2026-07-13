import type { Metadata } from "next";
import CoachSignup from "@/components/CoachSignup";

export const metadata: Metadata = { title: "Coach Sign In — Reps" };

// /coach — shows signup/sign-in flow if unauthenticated.
// After verifying OTP, CoachSignup redirects to /coach/roster.
export default function CoachPage() {
  return <CoachSignup />;
}
