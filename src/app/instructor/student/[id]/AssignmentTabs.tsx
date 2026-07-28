"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type Tab = "new" | "logged";

type Props = {
  /** Both lists are built and fully rendered by the server component; this
   *  client wrapper only chooses which one is on screen. Keeping the cards on
   *  the server means the log aggregation, completion checks and card markup all
   *  stay in one place — this file knows nothing about assignments. */
  newList: ReactNode;
  loggedList: ReactNode;
  newCount: number;
  loggedCount: number;
  firstName: string;
};

// Same segmented-control language as the add-student recipient toggle and the
// edit-phone modal: a rounded track, 3px inset, accent-blue active pill. Tabs
// are new here, so they borrow the pattern the app already uses rather than
// inventing an underline style that appears nowhere else.
const TRACK = "flex items-center gap-[2px] rounded-[8px] bg-reps-card p-[3px]";

// Same sticky treatment as the student home ASSIGNMENTS header: pin to the top,
// bleed past the page's 1.25rem gutter with -mx and restore it with px so the
// background spans the full width, and fill with SOLID --reps-bg. The full-bleed
// fill is what actually hides the cards passing underneath — stopping at the
// content edge would let them show through at the sides.
//
// No gradient beneath it. One was tried under the student header and removed:
// the list starts flush against the bar, so any overhang dimmed the first card.
// Solid background, hard edge.
//
// z-20 is chosen against this screen's existing layers, not copied: the card
// menus use z-40 for their click-away and z-50 for the dropdown, so the bar has
// to sit below both or it would clip a menu opened on the top row. Above the
// cards (no z) and below the menus.
// pb-5 (20px) is the gap between the pills and the first card, deliberately
// double the 10px the cards keep between themselves. At the old pb-3 the two
// were 12 vs 10 — near enough that the tab bar read as one more item in the
// stack rather than as a control sitting above it.
//
// ⚠️ The gap belongs to the BAR's padding, not to a margin on the list. A margin
// would collapse the moment the bar pins: the card would scroll up under it and
// the only thing left between pills and content would be the bar's own padding.
// Keeping it here holds the same distance whether the bar is resting or stuck,
// and gives the pinned band enough body to mask the rows passing beneath it.
const STICKY_BAR = "sticky top-0 z-20 -mx-[1.25rem] px-[1.25rem] pt-2 pb-5 bg-reps-bg";
const TAB_BASE =
  "flex-1 flex items-center justify-center gap-1.5 rounded-[6px] py-[7px] text-[12px] font-medium transition-colors";
const TAB_ON = "bg-[#378add] text-white";
const TAB_OFF = "text-reps-sub hover:text-reps-ink";

export default function AssignmentTabs({
  newList,
  loggedList,
  newCount,
  loggedCount,
  firstName,
}: Props) {
  // Always opens on New. Deliberately not "whichever tab has something in it":
  // a default that moves depending on state means the coach can't learn where
  // anything is. New is the working list — everything the coach hasn't filed
  // away yet, finished or not.
  const [tab, setTab] = useState<Tab>("new");

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "new", label: "New", count: newCount },
    { id: "logged", label: "Logged", count: loggedCount },
  ];

  return (
    <div className="mb-6">
      <div className={STICKY_BAR}>
        <div className={TRACK} role="tablist" aria-label="Assignments">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`${TAB_BASE} ${active ? TAB_ON : TAB_OFF}`}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {t.label}
                {/* The count is the only way to tell a genuinely empty tab from
                    one the coach simply hasn't opened, so it shows even at 0. */}
                <span className={active ? "text-white/70" : "text-reps-dim"}>{t.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {tab === "new" ? (
        newCount > 0 ? (
          <div className="flex flex-col gap-2.5">{newList}</div>
        ) : (
          <Empty
            line={`Nothing open for ${firstName}.`}
            sub={loggedCount > 0 ? "Everything has been moved to Logged." : undefined}
          />
        )
      ) : loggedCount > 0 ? (
        <div className="flex flex-col gap-2.5">{loggedList}</div>
      ) : (
        <Empty line="Nothing moved here yet." />
      )}
    </div>
  );
}

// Quiet placeholder, not a call to action — the screen already has its CTA
// pinned to the bottom, and a second button here would compete with it.
function Empty({ line, sub }: { line: string; sub?: string }) {
  return (
    <div className="text-center py-10">
      <p className="text-[14px] text-reps-sub">{line}</p>
      {sub && <p className="text-[13px] text-reps-dim mt-1">{sub}</p>}
    </div>
  );
}
