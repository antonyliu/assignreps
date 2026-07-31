import { Sk } from "@/components/Skeleton";

// Roster loading state.
//
// ⚠️ This route is `ƒ` (dynamic — it reads cookies), and Next only prefetches a
// dynamic route down to its nearest loading boundary. Before this file existed
// there was none, so the prefetch was inert AND the tap produced no visual
// change at all: the previous screen simply sat there for the whole round trip.
// That is what read as "the tap didn't register".
//
// Mirrors the real header: logo row, the hairline under it, then the "Your
// students" heading with + Add, then rows. Rows are dimmer than the header so
// the eye settles on the chrome, which is the part that resolves first anyway.
//
// The page's own padding lives on the sticky header block rather than on <main>
// (see the roster), so this shell repeats that shape instead of using SkPage.
export default function Loading() {
  return (
    <main className="flex flex-col min-h-screen p-[0_1.25rem_1.75rem] animate-pulse" aria-busy="true">
      <div className="-mx-[1.25rem] pt-4">
        <div className="relative flex items-center justify-between px-[1.25rem] pb-4">
          <Sk h="23px" w="86px" className="!rounded-[6px]" />
          <Sk h="26px" w="26px" />
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-0 right-0"
            style={{ height: 1, background: "#2a2d36" }}
          />
        </div>
        <div className="flex items-baseline justify-between gap-3 px-[1.25rem] pt-[20px] pb-1.5">
          <Sk h="20px" w="140px" className="!rounded-[6px]" />
          <Sk h="26px" w="58px" className="!rounded-[8px]" />
        </div>
      </div>

      {/* Group label + rows, matching the grouped roster's shape. */}
      <div className="mt-0.5">
        <Sk h="11px" w="64px" className="mb-2" />
        <div className="flex flex-col gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-[14px] py-2 rounded-[10px] bg-[#111620]"
              aria-hidden="true"
            >
              <Sk h="34px" w="34px" className="shrink-0" />
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <Sk h="12px" w="96px" />
                <Sk h="10px" w="64px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
