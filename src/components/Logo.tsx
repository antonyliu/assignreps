// The in-app header lockup: 23px contained mark + 13px wordmark. Scaled down
// so the logo reads quieter than the coach name / profile icon on the right.
// One size for every platform screen (signup, roster, student home, parent
// digest) — the header must not change size as you move between them. Marketing
// pages do not use this; the landing page draws its own mark, and the student
// welcome / sign-in screens use LogoLarge.
export function LogoMini() {
  return (
    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-reps-ink">
      {/* Full contained lockup: muted dark rounded square (#252830) with a
          dimmed tally (#6a6a72) that recedes behind the wordmark, sized for
          the header. The filled box reaches
          the container's left edge (no internal stroke inset), which keeps the
          header flush-left. `block` removes the inline baseline gap so it
          centers cleanly on Safari iOS as well as Chrome. */}
      <svg width={23} height={23} viewBox="0 0 32 32" fill="none" className="block shrink-0" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#252830" />
        <line x1="9"  y1="8" x2="9"  y2="24" stroke="#6a6a72" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="14" y1="8" x2="14" y2="24" stroke="#6a6a72" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="19" y1="8" x2="19" y2="24" stroke="#6a6a72" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="24" y1="8" x2="24" y2="24" stroke="#6a6a72" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="6"  y1="23" x2="27" y2="9"  stroke="#6a6a72" strokeWidth="2.4" strokeLinecap="round" />
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
