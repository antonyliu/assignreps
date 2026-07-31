import { Sk, SkPage } from "@/components/Skeleton";

// Assign-flow loading state.
//
// ⚠️ Without this file, everything under /assign inherited the PARENT segment's
// boundary — the player detail skeleton — so tapping "+ Assign more" flashed an
// avatar, tab bar and progress cards before landing on a category picker that
// looks nothing like that. A wrong shape is worse than no shape: it promises
// one screen and delivers another.
//
// This one file covers the whole /assign subtree, and that is deliberate rather
// than lazy. The category picker, the exercise list and My exercises are all
// the same shape — a back row, a heading pair, then a column of bordered rows —
// so one skeleton serves all three honestly. Only if one of them later diverges
// would it need its own.
export default function Loading() {
  return (
    <SkPage>
      {/* Back row — 44px tall, matching the real header's tap target so the
          heading below doesn't shift on swap. */}
      <div className="flex items-center mb-6">
        <div className="-ml-4 flex h-11 items-center gap-2 pl-4 pr-3">
          <Sk h="14px" w="14px" />
          <Sk h="13px" w="104px" />
        </div>
      </div>

      {/* "Pick an exercise" / "Choose a category" */}
      <Sk h="24px" w="176px" className="mb-2 !rounded-[6px]" />
      <Sk h="12px" w="120px" className="mb-6" />

      {/* The row list. Bordered outlines rather than filled blocks, because the
          real rows are bordered and transparent — a filled skeleton would drop
          a shade on swap. */}
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex justify-between items-center px-4 py-[14px] border border-reps-line rounded-[10px]"
            aria-hidden="true"
          >
            <div className="flex flex-col gap-2">
              <Sk h="13px" w={["104px", "88px", "120px", "96px", "112px", "80px"][i]} />
              <Sk h="10px" w={["148px", "132px", "160px", "140px", "124px", "152px"][i]} />
            </div>
          </div>
        ))}
      </div>
    </SkPage>
  );
}
