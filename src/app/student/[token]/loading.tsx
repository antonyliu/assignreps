import { Sk, SkPage, SkTabs, SkCard } from "@/components/Skeleton";

// Student home loading state.
//
// This one matters more than its query count suggests. A student arrives here
// from an SMS link — cold, on cellular, with no prefetch possible at all,
// because nothing in the app linked them here to prefetch from. Before this
// file, that tap on the text message showed a blank white flash and then the
// screen; now it shows the shape of their homework arriving.
//
// Mirrors: mini logo, first name + "{Coach}'s assignments", the New/Archive
// tabs, then cards. Same card skeleton the coach screen uses, because both
// screens render the identical card.
export default function Loading() {
  return (
    <SkPage>
      <div className="flex items-center mb-5">
        <Sk h="23px" w="76px" className="!rounded-[6px]" />
      </div>

      <div className="mb-4 flex flex-col gap-2">
        <Sk h="20px" w="112px" />
        <Sk h="11px" w="132px" />
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
