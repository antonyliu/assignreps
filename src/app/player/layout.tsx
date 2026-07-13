export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[390px] min-h-screen relative">
      {children}
    </div>
  );
}
