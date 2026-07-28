"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type Tab = "new" | "archive";

type Props = {
  /** Both lists are built and fully rendered by the calling server component;
   *  this client wrapper only chooses which one is on screen. Keeping the cards
   *  on the server means the log aggregation, completion checks and card markup
   *  all stay in one place — this file knows nothing about assignments. */
  newList: ReactNode;
  archiveList: ReactNode;
  newCount: number;
  archiveCount: number;
  /** Sits at the top of the New tab's stack, above its cards — the all-done
   *  celebration when finished work is still waiting to be archived.
   *
   *  ⚠️ Rendered ONLY on the New tab, and only when that tab has cards. Both
   *  halves matter: the first keeps the celebration off Archive, the second
   *  stops it appearing above `newEmpty`, which carries its own copy of it. */
  newTop?: ReactNode;
  /** Shown instead of the list when the tab has nothing in it. Nodes rather than
   *  copy strings, because the New tab's empty state is now the full celebration
   *  panel on both screens while Archive's is a quiet line. */
  newEmpty: ReactNode;
  archiveEmpty: ReactNode;
};

// Same segmented-control language as the add-student recipient toggle and the
// edit-phone modal: a rounded track, 3px inset, accent-blue active pill. Tabs
// are new here, so they borrow the pattern the app already uses rather than
// inventing an underline style that appears nowhere else.
const TRACK = "flex items-center gap-[2px] rounded-[8px] bg-reps-card p-[3px]";

// Same sticky treatment as the old student home ASSIGNMENTS header this
// replaced: pin to the top, bleed past the page's 1.25rem gutter with -mx and
// restore it with px so the background spans the full width, and fill with SOLID
// --reps-bg. The full-bleed fill is what actually hides the cards passing
// underneath — stopping at the content edge would let them show through at the
// sides.
//
// No gradient beneath it. One was tried under the student header and removed:
// the list starts flush against the bar, so any overhang dimmed the first card.
// Solid background, hard edge.
//
// z-20 is chosen against the busiest screen this renders on, the coach's: its
// card menus use z-40 for their click-away and z-50 for the dropdown, so the bar
// has to sit below both or it would clip a menu opened on the top row. Above the
// cards (no z) and below the menus. The student screen has no menus, so the same
// value is simply safe there.
//
// pb-5 (20px) is the gap between the pills and the first card, deliberately
// double the 10px the cards keep between themselves. At pb-3 the two were 12 vs
// 10 — near enough that the tab bar read as one more item in the stack rather
// than as a control sitting above it.
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
  archiveList,
  newCount,
  archiveCount,
  newTop,
  newEmpty,
  archiveEmpty,
}: Props) {
  // Always opens on New. Deliberately not "whichever tab has something in it":
  // a default that moves depending on state means nobody can learn where things
  // are. New is the working list — everything not yet archived, finished or not.
  const [tab, setTab] = useState<Tab>("new");

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "new", label: "New", count: newCount },
    { id: "archive", label: "Archive", count: archiveCount },
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
                    one that simply hasn't been opened, so it shows even at 0. */}
                <span className={active ? "text-white/70" : "text-reps-dim"}>{t.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {tab === "new" ? (
        newCount > 0 ? (
          <>
            {/* Deliberately OUTSIDE the cards' gap-2.5 column. Inside it the
                celebration sat exactly one card-gap above the first card and
                read as another item in the stack rather than as a message
                sitting above one.

                mb-5 (20px) is double the 10px the cards keep between
                themselves — the same ratio, and the same value, as the gap
                under the tab bar. That makes one rule for the screen: things
                that aren't cards get 20px beneath them, cards get 10px between
                them. */}
            {newTop && <div className="mb-5">{newTop}</div>}
            <div className="flex flex-col gap-2.5">{newList}</div>
          </>
        ) : (
          newEmpty
        )
      ) : archiveCount > 0 ? (
        <div className="flex flex-col gap-2.5">{archiveList}</div>
      ) : (
        archiveEmpty
      )}
    </div>
  );
}

// Quiet placeholder for a tab with nothing in it and nothing to celebrate.
// Exported so callers can use it for the Archive tab (and for the New tab in the
// one case where "empty" isn't an achievement) without re-deriving the styling.
export function EmptyState({ line, sub }: { line: string; sub?: string }) {
  return (
    <div className="text-center py-10">
      <p className="text-[14px] text-reps-sub">{line}</p>
      {sub && <p className="text-[13px] text-reps-dim mt-1">{sub}</p>}
    </div>
  );
}
