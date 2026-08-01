import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { LogoMini } from "@/components/Logo";
import AssignmentTabs, { EmptyState } from "@/components/AssignmentTabs";
import AllDonePanel from "@/components/AllDonePanel";
import { isComplete, progressTarget, progressValue } from "@/lib/exercises";
import type { GoalType } from "@/lib/exercises";

export const metadata: Metadata = { title: "Your homework — Reps" };

export default async function PlayerHomePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("id, name")
    .eq("token", token)
    .single();

  if (!player) notFound();

  const [coachNameRes, { data: assignments }, { data: logs }] = await Promise.all([
    // The `coaches` table isn't readable by the anon role, so the coach name
    // comes from a SECURITY DEFINER RPC keyed on the student's link token.
    supabase.rpc("coach_name_for_token", { p_token: token }),
    supabase
      .from("assignments")
      // filed_at drives the New/Archive split here exactly as it does on the
      // coach's screen. The student can SEE both tabs but cannot change them —
      // filing is the coach's action alone, and this page has no write path.
      .select("id, exercise_name, target, unit, track_makes, goal_type, side, filed_at")
      .eq("player_id", player.id)
      .order("created_at"),
    supabase
      .from("logs")
      // Widened for the note — no extra round trip, the same read the makes
      // fold already needed. logged_at comes with it because the note fold has
      // to compare recency; the makes fold, being a sum, never did.
      .select("assignment_id, amount, makes, note, logged_at")
      .eq("player_id", player.id),
  ]);

  const coachName = (coachNameRes.data as string | null)?.trim() || "Coach";
  const firstName = player.name?.trim().split(/\s+/)[0] || "there";
  const assignmentList = assignments ?? [];

  const loggedByAssignment: Record<string, number> = {};
  // Same shape and rule as the coach detail card: makes and their attempts
  // accumulate only from logs that recorded makes (null = "didn't say"), so the
  // "made X/Y · Z%" denominator matches the coach's exactly.
  const makesByAssignment: Record<string, { makes: number; attempts: number }> = {};
  // The student's most recent note per assignment. ⚠️ Most recent log that HAS
  // a note — not the most recent log. Most sessions carry no note, so keying on
  // the newest row would blank an earlier note the moment they logged again
  // without writing one. Same rule and shape as the coach detail page.
  const noteByAssignment: Record<string, { note: string; logged_at: string }> = {};
  for (const log of logs ?? []) {
    loggedByAssignment[log.assignment_id] =
      (loggedByAssignment[log.assignment_id] ?? 0) + log.amount;
    // ⚠️ Before the `continue` below — a log can carry a note without makes,
    // and skipping it there would lose exactly those notes.
    //
    // The query imposes no order, so this compares rather than assuming
    // last-wins. Date.parse rather than string comparison: both are UTC and
    // would usually sort lexicographically, but that quietly depends on every
    // row carrying identical fractional-second precision.
    if (log.note != null) {
      const prev = noteByAssignment[log.assignment_id];
      if (!prev || Date.parse(log.logged_at) > Date.parse(prev.logged_at)) {
        noteByAssignment[log.assignment_id] = { note: log.note, logged_at: log.logged_at };
      }
    }
    if (log.makes == null) continue;
    const entry = (makesByAssignment[log.assignment_id] ??= { makes: 0, attempts: 0 });
    entry.makes += log.makes;
    entry.attempts += log.amount;
  }

  // Same split as the coach's screen, same rule: filed_at and nothing else.
  // Completion has no say in which tab a card sits in.
  const newList = assignmentList.filter((a) => !a.filed_at);
  const archiveList = assignmentList.filter((a) => a.filed_at);

  const count = assignmentList.length;
  const allDone =
    count > 0 &&
    assignmentList.every((a) =>
      isComplete(
        (a.goal_type ?? "reps") as GoalType,
        a.target,
        loggedByAssignment[a.id] ?? 0,
        makesByAssignment[a.id]?.makes ?? 0,
      ),
    );

  return (
    <main className="flex flex-col min-h-screen p-[1.75rem_1.25rem]">

      {/* Same header trim as the coach detail screen — mb-5 on the chrome row,
          mb-4 on the name block — so both screens give up the same air above the
          tab bar. The logo row loses more than the coach's back row did (32 -> 20
          vs 24 -> 20) only because it started looser. */}
      <div className="flex items-center mb-5">
        <LogoMini />
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-[-0.5px] text-reps-ink">{firstName}</h1>
        <p className="text-[12px] text-reps-sub mt-0.5">{coachName}&apos;s assignments</p>
      </div>

      {count === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center pb-8">
          <p className="text-[21px] font-semibold text-reps-ink">You&apos;re all caught up. 🙌</p>
          <p className="text-[14px] text-reps-sub mt-3 max-w-[240px]">
            {`${coachName} will assign new work when it's time.`}
          </p>
        </div>
      ) : (
        <AssignmentTabs
          newCount={newList.length}
          archiveCount={archiveList.length}
          newList={newList.map((a) =>
            renderAssignmentCard(a, token, loggedByAssignment, makesByAssignment, noteByAssignment),
          )}
          archiveList={archiveList.map((a) =>
            renderAssignmentCard(a, token, loggedByAssignment, makesByAssignment, noteByAssignment),
          )}
          // Finished work still on the student's New tab: same celebration the
          // page used to show as a banner, now scoped to the tab it belongs to.
          newTop={
            allDone ? (
              <AllDonePanel
                headline="You finished everything."
                sub={`${coachName} can see your progress.`}
              />
            ) : undefined
          }
          // New has run dry because the coach archived it all. Still a win —
          // so the celebration, not a grey line, with the sub-line saying where
          // the work went rather than implying none exists.
          newEmpty={
            allDone ? (
              <AllDonePanel
                headline="You finished everything."
                sub="It's all in Archive now."
              />
            ) : (
              <EmptyState
                line="Nothing new right now."
                sub="Everything you've finished is in Archive."
              />
            )
          }
          archiveEmpty={
            <EmptyState
              line="Nothing here yet."
              sub={`${coachName} moves finished work here.`}
            />
          }
        />
      )}
    </main>
  );
}

/** SUM(amount) per assignment. */
type LoggedMap = Record<string, number>;
/** SUM(makes) and the attempts those makes were recorded against, per
 *  assignment — only from logs that actually reported makes. */
type MakesMap = Record<string, { makes: number; attempts: number }>;
/** The student's most recent note per assignment — most recent log that HAS a
 *  note, not the most recent log.
 *  ⚠️ Not consumed yet: the data layer landed first so it could be verified on
 *  its own, and rendering is the next step. */
type NoteMap = Record<string, { note: string; logged_at: string }>;

/** One assignment row as the STUDENT sees it. Lifted out of the page body when
 *  the list was split into New / Archive tabs — both tabs render the identical
 *  card, so the markup has to live in exactly one place or the two will drift.
 *
 *  Read-only: the card links to the log screen and carries no filing controls.
 *  Archiving is the coach's action alone. */
function renderAssignmentCard(
  a: {
    id: string;
    exercise_name: string;
    target: number;
    unit: string;
    track_makes: boolean | null;
    goal_type: string | null;
    side: string | null;
  },
  token: string,
  loggedByAssignment: LoggedMap,
  makesByAssignment: MakesMap,
  noteByAssignment: NoteMap,
) {
  const goalType = (a.goal_type ?? "reps") as GoalType;
  const rawLogged = loggedByAssignment[a.id] ?? 0;
  const rawMakes = makesByAssignment[a.id]?.makes ?? 0;
  const done = isComplete(goalType, a.target, rawLogged, rawMakes);
  // The bar measures whatever the goal is scored on, capped for
  // display so an overshoot doesn't render past the end.
  const cardTarget = progressTarget(goalType, a.target);
  const logged = Math.min(progressValue(goalType, rawLogged, rawMakes), cardTarget);
  const pct = cardTarget > 0 ? Math.round((logged / cardTarget) * 100) : 0;

  const note = noteByAssignment[a.id]?.note;
  // Makes summary — identical shape/logic/markup to the coach detail
  // card. attempts is the makes-recorded subset, not the target.
  const m = makesByAssignment[a.id];
  const showMakes = m !== undefined && m.attempts > 0;
  const makesPct =
    showMakes && m.makes <= m.attempts ? Math.round((m.makes / m.attempts) * 100) : null;

  // Two-tone bar when makes exist: muted-green attempts with a
  // bright-green makes overlay (makes/target), mirroring the log
  // screen. Otherwise the single bar below.
  //
  // Only a reps goal stacks the two: under a makes goal the single
  // bar is ALREADY measuring makes, so overlaying them again would
  // draw the same figure twice.
  const twoTone = goalType === "reps" && (a.track_makes ?? false) && showMakes;
  const barMakesPct =
    m && a.target > 0 ? Math.min(100, Math.round((m.makes / a.target) * 100)) : 0;
  // The count reads in whatever the goal is scored on — "12/50 reps"
  // is wrong on an assignment measured in makes or sets.
  // Matches the coach detail card exactly. A streak carries its
  // length too — "0/1 set" alone doesn't say what the set was.
  const countLabel =
    goalType === "consecutive"
      ? `${logged}/1 set · ${a.target} in a row`
      : goalType === "makes"
        ? `${logged}/${a.target} makes`
        : `${logged}/${a.target} ${a.unit}`;
  // "made 21/21 · 100%" restates what "21/25 makes" already says on a
  // makes goal, and the percentage is over attempts rather than the
  // target, so the two numbers read as contradicting each other.
  // Same rule as the coach detail card.
  const showMakesLine = showMakes && goalType !== "makes";

  return (
    <Link
      key={a.id}
      href={`/student/${token}/log/${a.id}`}
      className="bg-[#161a20] border border-reps-line rounded-[10px] px-4 py-[14px] hover:border-reps-line-hi transition-colors cursor-pointer"
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        {/* Same structure as the coach detail card: the side sits in
            its own shrink-0 span beside the truncating name, so a long
            exercise name gives up characters rather than hiding which
            hand was asked for. ml-1 because a flex item's leading
            whitespace is trimmed. */}
        <span className="flex-1 min-w-0 flex items-baseline">
          <span className="truncate text-[15px] font-medium text-reps-ink">{a.exercise_name}</span>
          {a.side && (
            <span className="ml-1 shrink-0 text-[15px] font-medium text-reps-sub">
              · {a.side === "left" ? "Left" : "Right"}
            </span>
          )}
        </span>
        {done ? (
          <span className="shrink-0 text-[12px] font-medium text-reps-green whitespace-nowrap">✓ Done</span>
        ) : (
          <span className="shrink-0 text-[12px] text-reps-dim whitespace-nowrap">{countLabel}</span>
        )}
      </div>
      {/* Same palette as the log screen: grey track, muted attempts
          fill, bright makes overlay. 2px here and on the coach card —
          the log screen's hero bar stays 6px, since it is one bar on its
          own screen rather than one of a stack of ten. */}
      {twoTone ? (
        <div className="relative h-[2px] rounded-full overflow-hidden" style={{ background: "#2a2d36" }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{ width: `${pct}%`, background: "var(--reps-green-muted)" }}
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{ width: `${barMakesPct}%`, background: "var(--reps-green)" }}
          />
        </div>
      ) : (
        <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "#2a2d36" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: done ? "var(--reps-green)" : "var(--reps-green-muted)" }}
          />
        </div>
      )}
      {showMakesLine && (
        <div className="mt-2 text-[11px] text-reps-dim">
          made {m.makes}/{m.attempts}
          {makesPct !== null && <span className="text-[var(--reps-label)]"> · {makesPct}%</span>}
        </div>
      )}
      {/* Identical treatment to the coach detail card — same border, size,
          italic and quotes — because it is the same content. Here the student
          is reading their own words back, which is also the only confirmation
          they get that the note was received at all. */}
      {note && (
        <div className="mt-2 border-t border-reps-line pt-2 text-[11.5px] italic text-reps-dim">
          &ldquo;{note}&rdquo;
        </div>
      )}
    </Link>
  );
}
