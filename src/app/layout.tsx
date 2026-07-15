import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reps — The work continues between sessions.",
  description: "Reps keeps the work going between training sessions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-reps-bg text-reps-ink">
        {children}
      </body>
    </html>
  );
}
