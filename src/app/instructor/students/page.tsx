import Link from "next/link";
import { requireCoach } from "@/lib/require-coach";
import { LogoMini } from "@/components/Logo";
import ProfileMenu from "@/components/ProfileMenu";
import ScrollToTop from "./ScrollToTop";
import { getActivityLabels } from "@/config/activityTypes";
import { isComplete } from "@/lib/exercises";
import type { GoalType } from "@/lib/exercises";
import type { Metadata } from "next";
import type { Player } from "@/types/database";

function initials(name: string) {
  return name.trim()[0]?.toUpperCase() ?? "?";
}

function firstName(name: string) {
  const trimmed = name.trim();
  return trimmed.split(/\s+/)[0] || trimmed;
}

// Relative "last logged" label. `recent` is true under 24h — the row shows it in
// accent blue then, muted grey once a day or more has passed. Coarse buckets
// (m / h / d) match how much precision a coach glancing at the roster needs.
function timeAgo(iso: string): { text: string; recent: boolean } {
  const diffMs = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diffMs / 60000);
  const hr = Math.floor(diffMs / 3600000);
  const day = Math.floor(diffMs / 86400000);
  const text = min < 1 ? "just now" : hr < 1 ? `${min}m ago` : day < 1 ? `${hr}h ago` : `${day}d ago`;
  return { text, recent: diffMs < 86400000 };
}

// Completion-based roster groups, in display order.
type Group = "done" | "progress" | "notstarted" | "unassigned";

const GROUP_ORDER: Group[] = ["done", "progress", "notstarted", "unassigned"];

// Group label styling — a dot plus its label, no pill background. Dot and text
// always share one color, so each group reads as a single mark rather than as a
// tinted chip competing with the rows beneath it. Green is reserved for Done,
// where it is earned; In progress is neutral gray (active, but colour would
// imply an outcome it hasn't reached), and the two idle groups share one quieter
// gray. The three grays sit a step apart from each other rather than at the
// extremes, so the four groups read as one ramp down from Done.
const GROUP_STYLE: Record<Group, { title: string; text: string; dot: string }> = {
  done:       { title: "Done",             text: "#6bd63d", dot: "#6bd63d" },
  progress:   { title: "In progress",      text: "#8a8fa8", dot: "#8a8fa8" },
  notstarted: { title: "Not started",      text: "#6b7080", dot: "#6b7080" },
  unassigned: { title: "Nothing assigned", text: "#6b7080", dot: "#6b7080" },
};

export const metadata: Metadata = { title: "Students — Reps" };

export default async function RosterPage() {
  const { supabase, user, coach } = await requireCoach();

  const [{ data: players }, { data: assignments }] = await Promise.all([
    supabase.from("players").select("*").eq("coach_id", user.id).order("created_at"),
    // Assignments are not time-bounded — grouping reflects every assignment
    // that still exists (they persist until cleared), matching the student
    // detail view. The old `.eq("week_start", weekStart)` filter here dropped
    // every assignment whenever the stored week_start differed from the
    // roster's computed Monday, forcing all students into "Nothing assigned".
    supabase
      .from("assignments")
      .select("id, player_id, target, goal_type")
      .eq("coach_id", user.id),
  ]);

  // Sum all logs for those assignments (no date filter), same as student detail.
  // `makes` is fetched because a makes-goal assignment is scored on it: summing
  // amount alone would mark a student done the moment their ATTEMPTS reached the
  // target, regardless of how many actually went in.
  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const playerIds = (players ?? []).map((p) => p.id);

  // Two log reads, filtered differently on purpose. Completion is scoped to the
  // current assignments (and needs amount/makes). Last-activity is scoped to the
  // PLAYER (and needs only logged_at) — a log must still count as activity after
  // its assignment was cleared, when logs.assignment_id has gone to NULL, which
  // the assignment-scoped read would drop.
  const [{ data: logs }, { data: activityLogs }] = await Promise.all([
    assignmentIds.length
      ? supabase.from("logs").select("assignment_id, amount, makes").in("assignment_id", assignmentIds)
      : Promise.resolve({ data: [] as { assignment_id: string | null; amount: number; makes: number | null }[] }),
    playerIds.length
      ? supabase.from("logs").select("player_id, logged_at").in("player_id", playerIds)
      : Promise.resolve({ data: [] as { player_id: string; logged_at: string }[] }),
  ]);

  // MAX(logged_at) per player — computed in JS, since PostgREST has no GROUP BY
  // without an RPC. This is when the student last LOGGED work, not signed in.
  const lastLoggedByPlayer: Record<string, string> = {};
  for (const l of activityLogs ?? []) {
    if (!l.player_id || !l.logged_at) continue;
    const prev = lastLoggedByPlayer[l.player_id];
    if (!prev || l.logged_at > prev) lastLoggedByPlayer[l.player_id] = l.logged_at;
  }

  const labels = getActivityLabels(coach?.instructor_type ?? null);
  const playerList: Player[] = players ?? [];

  // Sum logged reps per assignment (same completion rule used elsewhere).
  const loggedByAssignment: Record<string, number> = {};
  const makesByAssignment: Record<string, number> = {};
  for (const log of logs ?? []) {
    if (!log.assignment_id) continue;
    loggedByAssignment[log.assignment_id] = (loggedByAssignment[log.assignment_id] ?? 0) + log.amount;
    if (log.makes == null) continue;
    makesByAssignment[log.assignment_id] = (makesByAssignment[log.assignment_id] ?? 0) + log.makes;
  }

  const assignmentsByPlayer: Record<string, { id: string; target: number; goalType: GoalType }[]> = {};
  for (const a of assignments ?? []) {
    (assignmentsByPlayer[a.player_id] ??= []).push({
      id: a.id,
      target: a.target,
      goalType: (a.goal_type ?? "reps") as GoalType,
    });
  }

  function assignmentDone(a: { id: string; target: number; goalType: GoalType }): boolean {
    return isComplete(
      a.goalType,
      a.target,
      loggedByAssignment[a.id] ?? 0,
      makesByAssignment[a.id] ?? 0,
    );
  }

  function doneCount(playerId: string): number {
    const list = assignmentsByPlayer[playerId] ?? [];
    return list.filter(assignmentDone).length;
  }

  // Group by completion: all assignments complete → Done; some logged but not
  // all complete → In progress; assignments but no logs → Not started; no
  // assignments at all → Nothing assigned.
  function playerGroup(playerId: string): Group {
    const list = assignmentsByPlayer[playerId] ?? [];
    if (list.length === 0) return "unassigned";
    if (list.every(assignmentDone)) return "done";
    // "Started" is still any logged activity, whatever the goal is scored on —
    // a student who has taken attempts toward a makes goal is underway even
    // though none have gone in yet.
    if (list.some((a) => (loggedByAssignment[a.id] ?? 0) > 0)) return "progress";
    return "notstarted";
  }

  // The two idle groups say less than the active ones on purpose: the group
  // label above already supplies the noun, so the row only has to carry the
  // count. Done and In progress keep the fuller "X of Y done".
  function subline(playerId: string, g: Group): string {
    const total = (assignmentsByPlayer[playerId] ?? []).length;
    if (g === "unassigned") return "no assignments";
    if (g === "notstarted") return `${total} waiting`;
    return `${doneCount(playerId)} of ${total} done`;
  }

  const grouped: Record<Group, Player[]> = { done: [], progress: [], notstarted: [], unassigned: [] };
  for (const p of playerList) grouped[playerGroup(p.id)].push(p);

  return (
    <main className="flex flex-col min-h-screen p-[0_1.25rem_1.75rem]">

      {/* Renders nothing — resets scroll so the sticky header is never already
          covering the first group on arrival. */}
      <ScrollToTop />

      {/* Logo row and heading row travel together as one sticky unit, so the
          roster's identity and its primary action stay on screen however far
          the list scrolls. The -mx here bleeds the block past main's gutters so
          its background fills the screen edge to edge and rows vanish cleanly
          underneath instead of showing through at the sides — solid fill, hard
          edge, no gradient, the same call made for the student ASSIGNMENTS
          header. It carries the page's top padding itself (main no longer has
          any), otherwise that padding would scroll away and leave the logo
          against the status bar. Horizontal padding lives on the rows below,
          not here. */}
      <div className="sticky top-0 z-30 -mx-[1.25rem] pt-4 bg-reps-bg">
        {/* items-center keeps the left lockup and the right profile control on
            the same centerline across Chrome and Safari iOS. The control's 44px
            tap target is taller than the 23px logo, so centering — not baseline
            alignment — is what holds the two ends of the row level.

            `relative` exists to anchor the divider below. */}
        <div className="relative flex items-center justify-between px-[1.25rem] pb-4">
          <LogoMini />
          <ProfileMenu coachName={coach?.name?.trim() || ""} />

          {/* Separates app chrome (logo, account) from the page itself, so the
              title reads as the top of the content rather than the bottom of
              the toolbar.

              Positioned rather than in flow: left/right on an absolute box
              resolve against the parent's PADDING box, so this row's own
              px-[1.25rem] cannot inset the line — it pins to the row's edges no
              matter what padding the row carries. That removes the margin
              arithmetic the earlier in-flow versions depended on, which is what
              failed to reach the screen edge on iOS. Out of flow, so it adds no
              height; bottom-0 sits it on the row's bottom edge, below the
              padding, exactly where the in-flow rule sat. */}
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-0 right-0"
            style={{ height: 1, background: "#2a2d36" }}
          />
        </div>

        {/* Add lives inline with the heading rather than pinned to the bottom, so
            it stays reachable without the list having to scroll to its end. White
            label because this is the screen's primary action; the border stays
            subtle so the button reads as an affordance, not a filled CTA competing
            with the heading. Suppressed on the empty state, where the full-width
            bottom CTA is the whole point. */}
        <div className="flex items-baseline justify-between gap-3 px-[1.25rem] pt-[20px] pb-1.5">
          <h1 className="text-xl font-semibold tracking-[-0.5px]">Your {labels.studentsLabel}</h1>
          {playerList.length > 0 && (
            <Link
              href="/instructor/add-student"
              className="shrink-0 text-[13px] font-medium text-[#ffffff] px-2.5 py-1.5 rounded-[8px] hover:bg-reps-card transition-colors"
              style={{ border: "1px solid #2a2d36", WebkitTapHighlightColor: "transparent" }}
            >
              + Add
            </Link>
          )}
        </div>
      </div>

      {playerList.length === 0 ? (
        <>
          {/* Ghost roster — faded skeleton rows mirroring a real student row
              (avatar, name bar, status bar, chevron) hint at what fills this
              screen, in place of an empty-state illustration. Opacity steps
              down per row and a mask fades the bottom so the rows dissolve
              rather than hard-stop. */}
          <div
            className="flex flex-col gap-1 mt-6 mb-8"
            aria-hidden="true"
            style={{
              WebkitMaskImage:
                "linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)",
            }}
          >
            {[0.25, 0.18, 0.12].map((op, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-[14px] py-3 border border-reps-line rounded-[10px] pointer-events-none select-none"
                style={{ opacity: op }}
              >
                <div className="w-8 h-8 rounded-full bg-reps-ink shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="h-3 w-24 rounded-full bg-reps-ink" />
                  <div className="h-2.5 w-16 rounded-full bg-reps-ink" />
                </div>
                <span className="text-[18px] text-reps-ink">›</span>
              </div>
            ))}
          </div>
          <Link
            href="/instructor/add-student"
            className="block text-center bg-reps-orange text-white font-semibold text-[15px] px-6 py-[14px] rounded-[10px] hover:bg-reps-orange-hi transition-colors"
          >
            + Add your first {labels.studentLabel}
          </Link>
        </>
      ) : (
        <>
          {/* Tight but distinct spacing between completion groups. The top
              margin is small because the heading row's own bottom padding
              already sits above it — together they set the heading-to-first-
              group gap, so both have to stay small to keep it tight. */}
          <div className="flex flex-col gap-5 mt-0.5 mb-8">
            {GROUP_ORDER.map((g) => {
              const group = grouped[g];
              if (group.length === 0) return null;
              const style = GROUP_STYLE[g];
              return (
                <div key={g}>
                  <div className="mb-2">
                    {/* No horizontal padding now that the pill background is
                        gone — the dot sits flush with the left edge of the row
                        cards below, so the group and its rows share one margin. */}
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: style.text }}
                    >
                      <span
                        className="rounded-full shrink-0"
                        style={{ width: 6, height: 6, background: style.dot }}
                      />
                      {style.title}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {group.map((player) => {
                      // Only shown when the student has logged at least once —
                      // no dash or placeholder otherwise.
                      const last = lastLoggedByPlayer[player.id]
                        ? timeAgo(lastLoggedByPlayer[player.id])
                        : null;
                      return (
                      <Link
                        key={player.id}
                        href={`/instructor/student/${player.id}`}
                        className="flex items-center gap-3 px-[14px] py-2 rounded-[10px] bg-[#111620] active:scale-[0.99]"
                        style={{ WebkitTapHighlightColor: "transparent" }}
                      >
                        <div
                          className="flex items-center justify-center shrink-0 rounded-full text-[13px] font-semibold"
                          style={{
                            width: 34,
                            height: 34,
                            background: "#252830",
                            border: "0.5px solid #2a2d36",
                            color: "#8a8fa8",
                          }}
                        >
                          {initials(player.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-medium truncate" style={{ color: "#ffffff" }}>
                            {firstName(player.name)}
                          </div>
                          {/* One step up from the #6b7080 used for the chevron
                              and the group dots — enough to read at a glance
                              without rivalling the white name above it. */}
                          <div className="text-[12px] truncate" style={{ color: "#7d8494" }}>
                            {subline(player.id, g)}
                          </div>
                        </div>
                        {last && (
                          <span
                            className="text-[12px] shrink-0 tabular-nums"
                            style={{ color: last.recent ? "#378add" : "#7d8494" }}
                          >
                            {last.text}
                          </span>
                        )}
                        <span className="text-[18px]" style={{ color: "#6b7080" }}>›</span>
                      </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
