import { Sk, SkPage } from "@/components/Skeleton";

// Log screen loading state — the screen a student taps most often.
//
// Mirrors the real layout top to bottom, at the spacing set on July 27: back
// row, "X of Y done" line, the 6px hero bar (deliberately NOT the 2px card bar
// — this is one bar on its own screen), the large stepper block, then the
// button. The stepper's round buttons are 67px, so the block is tall enough
// that omitting it would collapse the page height and jump on swap.
//
// No makes row in the skeleton: it only renders on a reps goal with track_makes
// on, and guessing wrong would shift the button. Better to under-draw a piece
// that may not exist than to draw one that vanishes.
export default function Loading() {
  return (
    <SkPage>
      <div className="flex items-center mb-12">
        <div className="-ml-4 flex h-11 w-11 shrink-0 items-center justify-center">
          <Sk h="14px" w="14px" />
        </div>
        <Sk h="15px" w="148px" className="-ml-2" />
      </div>

      {/* "X of Y done" then the 6px bar. */}
      <Sk h="12px" w="86px" className="mb-3" />
      <div className="h-1.5 rounded-full mb-14" style={{ background: "#2a2d36" }} />

      {/* Label + the hero stepper: 67px circles either side of the number. */}
      <div className="mb-12">
        <Sk h="15px" w="88px" className="mb-5" />
        <div className="flex items-center gap-5">
          <Sk h="67px" w="67px" className="shrink-0" />
          <div className="flex-1 flex justify-center">
            <Sk h="56px" w="92px" className="!rounded-[12px]" />
          </div>
          <Sk h="67px" w="67px" className="shrink-0" />
        </div>
      </div>

      {/* "Log it" — follows the content now rather than pinning to the bottom. */}
      <Sk h="50px" w="100%" className="!rounded-[10px]" />
    </SkPage>
  );
}
