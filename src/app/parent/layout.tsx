export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[390px] min-h-screen relative">
      {children}
    </div>
  );
}
