import { getActivityLabels } from "@/config/activityTypes";
import { requireCoach } from "@/lib/require-coach";
import AddPlayerForm from "./AddPlayerForm";

export default async function AddPlayerPage() {
  const { coach } = await requireCoach();

  const labels = getActivityLabels(coach.instructor_type ?? null);

  return <AddPlayerForm studentLabel={labels.studentLabel} />;
}
