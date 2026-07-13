import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reps — For players who want to be great.",
  description: "Reps keeps the work going between training sessions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#100d0b] text-[#f5f0eb]">
        {children}
      </body>
    </html>
  );
}
