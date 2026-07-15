"use client";

import { useRouter } from "next/navigation";
import { useSignup } from "../provider";
import { ScreenHeader, BTN_PRIMARY } from "@/components/SignupUI";
import { ACTIVITY_TYPES, ACTIVITY_TYPE_ORDER } from "@/config/activityTypes";

const SOON_BADGE =
  "ml-auto text-[10px] font-semibold text-reps-sub bg-reps-raised px-[7px] py-[3px] rounded-full tracking-wide uppercase";

export default function TypeStep() {
  const router = useRouter();
  const { instructorType, setInstructorType } = useSignup();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/coach/signup/email");
  }

  return (
    // Full-height column: header + heading stay put, the list scrolls on its
    // own, and Continue is pinned at the bottom.
    <main className="flex flex-col h-[100dvh] p-[1.75rem_1.25rem]">
      <ScreenHeader stepNum={2} total={3} />
      <h2 className="text-2xl font-semibold tracking-[-0.5px] mb-6">What do you teach?</h2>

      <form onSubmit={submit} className="flex flex-col flex-1 min-h-0">
        {/* Scrolls independently. The hairline, "More coming soon." and the
            "Create your own" row all live inside here, so they scroll with the
            list rather than being pinned. */}
        <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
          {ACTIVITY_TYPE_ORDER.map((id) => {
            const opt = ACTIVITY_TYPES[id];
            const selected = instructorType === id;
            if (!opt.available) {
              return (
                <div
                  key={id}
                  className="flex items-center gap-3 px-[16px] py-[14px] rounded-[10px] border border-reps-line/40 bg-reps-card/50 opacity-60 cursor-not-allowed shrink-0"
                >
                  <span className="text-[22px] grayscale">{opt.emoji}</span>
                  <span className="text-[15px] font-medium text-reps-ink">{opt.label}</span>
                  <span className={SOON_BADGE}>Soon</span>
                </div>
              );
            }
            return (
              <button
                type="button"
                key={id}
                onClick={() => setInstructorType(id)}
                className={`flex items-center gap-3 px-[16px] py-[14px] rounded-[10px] border text-left transition-all shrink-0 ${
                  selected
                    ? "border-reps-orange bg-reps-orange/10"
                    : "border-reps-line bg-reps-card hover:border-reps-line-hi"
                }`}
              >
                <span className="text-[22px]">{opt.emoji}</span>
                <span className={`text-[15px] font-medium ${selected ? "text-reps-ink" : "text-reps-sub"}`}>
                  {opt.label}
                </span>
                {selected && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-reps-orange flex items-center justify-center shrink-0">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="var(--reps-bg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}

          {/* Hairline anchors the caption + escape hatch as a footer section. */}
          <p className="text-[12px] text-reps-sub text-center border-t border-reps-line pt-4 mt-1 shrink-0">
            More coming soon.
          </p>

          {/* Escape hatch — deliberately distinct from the preset rows: dashed
              border, a + glyph instead of a discipline emoji. Also not yet live. */}
          <div className="flex items-center gap-3 px-[16px] py-[14px] rounded-[10px] border border-dashed border-reps-line-hi opacity-60 cursor-not-allowed shrink-0">
            <span className="w-[22px] h-[22px] flex items-center justify-center text-reps-sub shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-[15px] font-medium text-reps-ink">Create your own</span>
            <span className={SOON_BADGE}>Soon</span>
          </div>
        </div>

        <button type="submit" className={`${BTN_PRIMARY} mt-4 shrink-0`}>Continue</button>
      </form>
    </main>
  );
}
