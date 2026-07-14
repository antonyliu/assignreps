export function LogoMini() {
  return (
    <div className="flex items-center gap-1.5 text-sm font-semibold text-reps-ink">
      <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
        <path d="M6 8 L6 24 M14 8 L14 24 M22 8 L22 24 M28 14 L28 18" stroke="#378add" strokeWidth="3" strokeLinecap="round" />
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
