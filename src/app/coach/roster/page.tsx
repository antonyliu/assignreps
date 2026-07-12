import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { LogoMini } from "@/components/Logo";
import type { Player } from "@/types/database";

export default async function RosterPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/coach");

  const initials = (name: string) => name.trim()[0]?.toUpperCase() ?? "?";

  // Fetch coach name + players in parallel
  const [{ data: coach }, { data: players }] = await Promise.all([
    supabase.from("coaches").select("name").eq("id", user.id).single(),
    supabase.from("players").select("*").eq("coach_id", user.id).order("created_at"),
  ]);

  const coachInitials = coach?.name ? initials(coach.name) : "?";
  const playerList: Player[] = players ?? [];

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <LogoMini />
        <div className="w-[30px] h-[30px] rounded-full bg-[rgba(255,122,61,0.12)] flex items-center justify-center text-[12px] font-semibold text-[#ff7a3d]">
          {coachInitials}
        </div>
      </div>

      <h1 className="text-2xl font-medium tracking-[-0.3px] mb-1">Your players</h1>

      {playerList.length === 0 ? (
        <>
          <p className="text-[13px] text-[#8a8a8e] mb-8">No players yet.</p>

          {/* Empty state */}
          <div className="flex-1 flex flex-col items-center justify-center text-center pb-8">
            <div className="w-14 h-14 rounded-[14px] border border-dashed border-[#3a3a3c] flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <path d="M10 4v12M4 10h12" stroke="#5a5a5e" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[14px] text-[#8a8a8e] mb-5">Add your first player to start.</p>
            <Link
              href="/coach/add-player"
              className="bg-[#ff7a3d] text-[#0f0f10] font-semibold text-[15px] px-6 py-[14px] rounded-[10px] hover:bg-[#ff8a52] transition-colors"
            >
              + Add player
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="text-[13px] text-[#8a8a8e] mb-6">
            {playerList.length} {playerList.length === 1 ? "player" : "players"}
          </p>

          {/* Player list */}
          <div className="flex flex-col gap-1 mb-6">
            {playerList.map((player) => (
              <Link
                key={player.id}
                href={`/coach/player/${player.id}`}
                className="flex items-center gap-3 px-[14px] py-3 border border-[#2a2a2c] rounded-[10px] hover:bg-[#1a1a1c] hover:border-[#3a3a3c] active:scale-[0.99] transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-[rgba(255,122,61,0.12)] flex items-center justify-center text-[13px] font-semibold text-[#ff7a3d] shrink-0">
                  {initials(player.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-[#e8e8ea]">{player.name}</div>
                  <div className="text-[12px] text-[#5a5a5e]">No reps assigned yet</div>
                </div>
                <span className="text-[18px] text-[#5a5a5e]">›</span>
              </Link>
            ))}
          </div>

          {/* Add player — secondary, pushed to bottom */}
          <Link
            href="/coach/add-player"
            className="mt-auto block text-center border border-[#2a2a2c] text-[#e8e8ea] font-medium text-[15px] py-[14px] rounded-[10px] hover:border-[#3a3a3c] hover:bg-[#1a1a1c] transition-all"
          >
            + Add player
          </Link>
        </>
      )}
    </main>
  );
}
