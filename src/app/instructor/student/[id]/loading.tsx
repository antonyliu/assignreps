import { Sk, SkPage, SkTabs, SkCard } from "@/components/Skeleton";

// Coach player detail loading state — the worst-affected route in the app.
//
// It runs five sequential round trips before it can render (auth → coaches →
// players → assignments → logs), and with no boundary here the coach saw the
// roster sit unchanged for all five, then jump. Hence the repeated tapping.
//
// Shape mirrors the real screen top to bottom: back row, 52px avatar with name
// and joined line, the New/Archive tab bar, then cards. Keeping the tab bar in
// the skeleton matters — it is the tallest piece of chrome above the list, so
// omitting it would let everything below shift upward on swap.
export default function Loading() {
  return (
    <SkPage>
      {/* Back row — 44px tall to match the real link's new tap target, so the
          header below it doesn't move when the page resolves. */}
      <div className="flex items-center mb-5">
        <div className="-ml-4 flex h-11 items-center pl-4 pr-3 gap-2">
          <Sk h="14px" w="14px" />
          <Sk h="13px" w="58px" />
        </div>
      </div>

      <div className="flex items-center gap-[14px] mb-4">
        <Sk h="52px" w="52px" className="shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <Sk h="20px" w="150px" />
          <Sk h="11px" w="94px" />
        </div>
        <Sk h="36px" w="36px" className="shrink-0 !rounded-[8px]" />
      </div>

      <SkTabs />

      <div className="flex flex-col gap-2.5">
        {[0, 1, 2].map((i) => (
          <SkCard key={i} />
        ))}
      </div>
    </SkPage>
  );
}
