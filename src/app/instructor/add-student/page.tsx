import { getActivityLabels } from "@/config/activityTypes";
import { requireCoach } from "@/lib/require-coach";
import { activeStudentLimit, isEntitled } from "@/lib/entitlement";
import { countActiveStudents } from "@/lib/active-students";
import AddPlayerForm from "./AddPlayerForm";

export default async function AddPlayerPage() {
  const { supabase, user, coach } = await requireCoach();

  const labels = getActivityLabels(coach.instructor_type ?? null);

  // requireCoach() already selected subscription_status, so this costs nothing.
  const entitled = isEntitled(coach.subscription_status);
  const limit = activeStudentLimit(coach.subscription_status);

  // ⚠️ Counted for EVERY coach now, where this used to skip the query entirely
  // for a Pro one. Pro had no ceiling in code before deactivation shipped, so
  // there was nothing to check; it has a real limit now, so everyone gets asked.
  //
  // ⚠️ Fails OPEN here, and that asymmetry with the action is deliberate.
  // addPlayer() fails CLOSED on an unreadable count because it is the layer that
  // actually enforces the paywall. This one only decides whether to render a
  // form, so on a hiccup it shows the form and lets the action have the final
  // word — better than telling a coach they are out of room when we could not
  // read how much room they have.
  const activeCount = (await countActiveStudents(supabase, user.id)) ?? 0;

  const atLimit = activeCount >= limit;

  return (
    <AddPlayerForm
      studentLabel={labels.studentLabel}
      studentsLabel={labels.studentsLabel}
      // ⚠️ Two different blocked states. An unentitled coach at 3 sees the
      // paywall, which has an upgrade to offer. A Pro coach at 30 has nowhere to
      // upgrade to, so they see the ceiling notice instead — same shell, no
      // Stripe CTA, and it names deactivation as the move that works.
      atLimit={atLimit}
      canUpgrade={!entitled}
      playerCount={activeCount}
      limit={limit}
    />
  );
}
