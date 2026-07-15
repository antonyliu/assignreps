import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getActivityLabels } from "@/config/activityTypes";
import AddPlayerForm from "./AddPlayerForm";

export default async function AddPlayerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/instructor");

  const { data: coach } = await supabase
    .from("coaches")
    .select("instructor_type")
    .eq("id", user.id)
    .single();

  const labels = getActivityLabels(coach?.instructor_type ?? null);

  return <AddPlayerForm studentLabel={labels.studentLabel} />;
}
