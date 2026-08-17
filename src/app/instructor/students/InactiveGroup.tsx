"use client";

import { useState } from "react";
import type { ReactNode } from "react";

/**
 * The roster's one collapsible group.
 *
 * ⚠️ THE ONLY CLIENT COMPONENT ON THE ROSTER, and it exists for exactly one
 * reason: the page is an async server component, so a header that expands on tap
 * cannot live in it. Everything else here stays on the server.
 *
 * Collapsed by default, and the state is deliberately NOT persisted. Inactive
 * students are the ones a coach is not working with right now — the working view
 * should come back clean on every visit rather than remembering that someone
 * once went looking. One tap reopens it.
 *
 * The header keeps the group pattern the other four use — a 6px dot, its label,
 * both in one colour — and adds only the count and a chevron. It has to read as
 * the fifth member of that set, not as a new kind of control.
 */
export default function InactiveGroup({
  title,
  color,
  count,
  children,
}: {
  title: string;
  color: string;
  count: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        // 44px tall, matching every other tap target in the app — the label is
        // small but the target is not. -my-2 keeps the extra height from
        // pushing the group apart, so the row still sits on the same rhythm as
        // the four static headers above it.
        className="-my-2 mb-0 flex h-11 items-center gap-1.5 text-xs font-semibold"
        style={{ color, WebkitTapHighlightColor: "transparent" }}
      >
        <span className="rounded-full shrink-0" style={{ width: 6, height: 6, background: color }} />
        {title} · {count}
        {/* Rotates rather than swapping glyphs, so the control reads as one
            thing in two states. */}
        <span
          aria-hidden="true"
          className="text-[10px] transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "none" }}
        >
          ▶
        </span>
      </button>
      {open && <div className="flex flex-col gap-1.5 mt-2">{children}</div>}
    </div>
  );
}
