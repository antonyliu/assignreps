import CoachSignup from "@/components/CoachSignup";

// /coach — shows signup/sign-in flow if unauthenticated.
// After verifying OTP, CoachSignup redirects to /coach/roster.
export default function CoachPage() {
  return <CoachSignup />;
}
