// The in-app header lockup: 24px mark + 16px wordmark. One size for every
// platform screen (signup, roster, student home, parent digest) — the header
// must not change size as you move between them. Marketing pages do not use
// this; the landing page draws its own mark, and the student welcome / sign-in
// screens use LogoLarge.
export function LogoMini() {
  return (
    <div className="flex items-center gap-2 text-base font-semibold text-reps-ink">
      {/* Tally mark only — no box. Same four-tally + diagonal geometry as the
          landing page and student welcome mark, drawn in sky blue on the app's
          dark surface instead of white-in-a-box. */}
      <svg width={24} height={24} viewBox="0 0 32 32" fill="none">
        <line x1="9"  y1="8" x2="9"  y2="24" stroke="#378add" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="14" y1="8" x2="14" y2="24" stroke="#378add" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="19" y1="8" x2="19" y2="24" stroke="#378add" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="24" y1="8" x2="24" y2="24" stroke="#378add" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="6"  y1="23" x2="27" y2="9"  stroke="#378add" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span>Reps</span>
    </div>
  );
}

// Matches the tally-mark logo used on the landing page: sky-blue rounded
// square with four vertical tallies + one diagonal stroke, in white.
export function LogoLarge({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#378add" />
      <line x1="9"  y1="8" x2="9"  y2="24" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="14" y1="8" x2="14" y2="24" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="19" y1="8" x2="19" y2="24" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="24" y1="8" x2="24" y2="24" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="6"  y1="23" x2="27" y2="9"  stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
