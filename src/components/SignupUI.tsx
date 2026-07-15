import { LogoMini } from "./Logo";

// Shared styling + chrome for the coach signup steps, each of which is its own
// route under /instructor/signup.

export const INPUT =
  "bg-reps-card border border-reps-line rounded-[10px] px-[14px] py-[14px] text-base text-reps-ink outline-none focus:border-reps-orange transition-colors w-full placeholder:text-reps-dim";
export const BTN_PRIMARY =
  "w-full bg-reps-orange text-white font-semibold text-[15px] py-[14px] rounded-[10px] transition-colors hover:bg-reps-orange-hi active:scale-[0.99]";
export const ERROR_BOX =
  "bg-red-900/20 border border-red-500/30 text-red-400 rounded-[10px] px-4 py-3 text-sm mb-4";

export function ScreenHeader({ stepNum, total }: { stepNum: number; total: number }) {
  return (
    <div className="flex justify-between items-center h-7 mb-12">
      <LogoMini />
      {/* Small and dim — a secondary marker that shouldn't rival the logo. */}
      <span className="text-xs font-medium text-reps-dim">
        Step {stepNum} of {total}
      </span>
    </div>
  );
}

export function ErrorBanner({ error }: { error: string }) {
  if (!error) return null;
  return <div className={ERROR_BOX}>{error}</div>;
}
