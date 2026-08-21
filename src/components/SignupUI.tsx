import { LogoMini } from "./Logo";

// Shared styling + chrome for the coach signup steps, each of which is its own
// route under /instructor/signup.

export const INPUT =
  "bg-reps-card border border-reps-line rounded-[10px] px-[14px] py-[14px] text-base text-reps-ink outline-none focus:border-reps-orange transition-colors w-full placeholder:text-[#5a5f72]";
export const BTN_PRIMARY =
  "w-full bg-reps-orange text-white font-semibold text-[15px] py-[14px] rounded-[10px] transition-colors hover:bg-reps-orange-hi active:scale-[0.99]";
export const ERROR_BOX =
  "bg-red-900/20 border border-red-500/30 text-red-400 rounded-[10px] px-4 py-3 text-sm mb-4";

/**
 * The small uppercase line above each signup headline. Both steps carry the
 * same words, which is the point: it names the one task the two screens share,
 * so the flow reads as a single job rather than two unrelated forms.
 *
 * Uppercase matches the app's existing label idiom (the log screen's goal-type
 * labels), and #8a8fa8 measures 6.17:1 on the app background.
 */
export const EYEBROW =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-sub mb-2";

/**
 * Progress segments + wordmark.
 *
 * ⚠️ REPLACED the "Step X of Y" text label. One segment per step, filled up to
 * and including the current one, so the last step shows every segment filled —
 * a coach can see they are finishing rather than counting.
 *
 * ⚠️ The count is DERIVED from `total`, not hardcoded to two. Signup went from
 * three steps to two when the activity picker was cut, and a hardcoded pair
 * would have to be found and edited if a step is ever added back.
 *
 * ⚠️ Filled is the brand accent #378add, empty is #2a2d36 — the app's standard
 * empty-track grey, the same value every progress bar already uses. Emerald was
 * NOT used: it means "done / makes" on every assignment surface, and borrowing
 * it for onboarding chrome would give it a second meaning.
 *
 * ⚠️ The text is kept for screen readers. The visual label went; the
 * information it carried should not.
 */
export function ScreenHeader({
  stepNum,
  total,
  showProgress = true,
}: {
  stepNum: number;
  total: number;
  /**
   * ⚠️ SUPPRESSES THE STEP PROGRESS ONLY — NEVER THE WORDMARK. Added Aug 20
   * 2026 after the whole component was briefly gated out on the sign-in path,
   * which took the Reps lockup with it and left returning coaches on a screen
   * with no branding at all: just "Your email", 28px from the top.
   *
   * The distinction is the point. A returning coach signing in is not on step 2
   * of anything, so the bar and its sr-only label are wrong for them — but they
   * are still looking at Reps, so the wordmark is not. Gate the progress, keep
   * the identity.
   */
  showProgress?: boolean;
}) {
  return (
    /* ⚠️ Spacing widened after seeing these on device: the screens are
       top-packed inside a min-h-screen column with a large empty tail, so the
       chrome was crowding the content while the room sat unused below. */
    <div className="mb-12">
      {showProgress && (
        <>
          <div
            className="flex gap-1.5"
            role="progressbar"
            aria-valuenow={stepNum}
            aria-valuemin={1}
            aria-valuemax={total}
            aria-label={`Step ${stepNum} of ${total}`}
          >
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className="h-[3px] flex-1 rounded-full"
                style={{ background: i < stepNum ? "#378add" : "#2a2d36" }}
              />
            ))}
          </div>
          <span className="sr-only">
            Step {stepNum} of {total}
          </span>
        </>
      )}
      {/* ⚠️ mt-8 only when there IS a bar above to be separated from. Without
          this the lockup would sit under 32px of margin against nothing. */}
      <div className={`flex items-center h-7 ${showProgress ? "mt-8" : ""}`}>
        <LogoMini />
      </div>
    </div>
  );
}

export function ErrorBanner({ error }: { error: string }) {
  if (!error) return null;
  return <div className={ERROR_BOX}>{error}</div>;
}
