import { getActivityLabels } from "@/config/activityTypes";
import { requireCoach } from "@/lib/require-coach";
import { isEntitled, FREE_STUDENT_LIMIT } from "@/lib/entitlement";
import AddPlayerForm from "./AddPlayerForm";

export default async function AddPlayerPage() {
  const { supabase, user, coach } = await requireCoach();

  const labels = getActivityLabels(coach.instructor_type ?? null);

  // requireCoach() already selected subscription_status, so this costs nothing.
  const entitled = isEntitled(coach.subscription_status);

  // Only counted for a coach who could actually be blocked. A Pro coach never
  // pays for this query.
  let playerCount = 0;
  if (!entitled) {
    const { count } = await supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", user.id);

    // ⚠️ Fails OPEN here, and that asymmetry with the action is deliberate.
    // addPlayer() fails CLOSED on an unreadable count because it is the layer
    // that actually enforces the paywall. This one only decides whether to
    // render a form, so on a hiccup it shows the form and lets the action have
    // the final word — better than telling a coach they are out of room when
    // we could not read how much room they have.
    playerCount = count ?? 0;
  }

  const atLimit = !entitled && playerCount >= FREE_STUDENT_LIMIT;

  return (
    <AddPlayerForm
      studentLabel={labels.studentLabel}
      studentsLabel={labels.studentsLabel}
      atLimit={atLimit}
      playerCount={playerCount}
    />
  );
}
