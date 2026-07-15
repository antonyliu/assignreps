import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reps — The work continues between sessions.",
  description: "Reps keeps the work going between training sessions.",
  // Orientation hints honored by some mobile browsers (Cordova / WebView / X5).
  // True enforcement is the CSS landscape lock in globals.css.
  other: { "screen-orientation": "portrait", "x5-orientation": "portrait" },
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
        {/* Portrait lock: this overlay is hidden by default and only appears
            when a phone is held in landscape (see globals.css). */}
        <div className="landscape-lock" aria-hidden="true">
          <span>Please rotate your device to portrait.</span>
        </div>
        {children}
      </body>
    </html>
  );
}
