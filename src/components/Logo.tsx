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

export function LogoLarge() {
  return (
    <div className="w-[72px] h-[72px] rounded-[18px] bg-reps-orange flex items-center justify-center mb-6">
      <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
        <path d="M6 8 L6 24 M14 8 L14 24 M22 8 L22 24 M28 14 L28 18" stroke="#161310" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}
