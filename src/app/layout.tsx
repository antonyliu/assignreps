// Global stylesheet imported first so it is the earliest entry in the
// stylesheet order — Safari applies it on first paint instead of flashing
// unstyled content before it resolves.
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { LogoLarge } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Reps — The work continues between sessions.",
  description: "Reps keeps the work going between training sessions.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-reps-bg text-reps-ink">
        {/* Landscape notice: hidden in portrait, and (via globals.css) takes
            over the screen when a phone is held in landscape. The short-height
            guard keeps desktop and the responsive landing page unaffected.
            The `hidden` attribute keeps it display:none before any CSS loads
            (so it never flashes on Safari's first paint); the landscape media
            query in globals.css overrides it to show the notice. */}
        <div className="landscape-message" aria-hidden="true" hidden>
          <LogoLarge size={48} />
          <p>Reps works best in portrait mode.</p>
        </div>
        {children}
      </body>
    </html>
  );
}
