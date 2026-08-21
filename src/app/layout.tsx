// Global stylesheet imported first so it is the earliest entry in the
// stylesheet order — Safari applies it on first paint instead of flashing
// unstyled content before it resolves.
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { LogoLarge } from "@/components/Logo";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  // Mirrors the title in src/app/page.tsx. This one is only ever the fallback
  // for routes that set no title of their own, so if the two drift the app can
  // present two different names for itself depending on where you land.
  // ⚠️ "Trainers" as of Aug 5 2026, tracking the landing page and its hero
  // eyebrow. Updating page.tsx alone would have moved the divergence here
  // rather than fixing it.
  title: "Reps — Practice Homework App for Coaches & Trainers",
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
        {/* Page views and unique visitors, for the landing page. Renders no UI
            — it injects the collection script — so it needs no wrapper and is
            unaffected by the landscape rule above, which only hides visible
            top-level elements.

            ⚠️ THE ONLY ANALYTICS IN THIS APP. Vercel's is cookieless, which is
            why there is no consent banner anywhere; adding anything that sets a
            cookie or fingerprints would change that and would also need
            /privacy's processor list updated. */}
        <Analytics />
      </body>
    </html>
  );
}
