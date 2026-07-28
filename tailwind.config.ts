import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "reps-bg":        "#080b0f",
        "reps-card":      "#1c1f26",
        "reps-raised":    "#22252e",
        "reps-line":      "#2a2d36",
        "reps-line-hi":   "#3a3d46",
        "reps-ink":       "#ffffff",
        "reps-sub":       "#8a8fa8",
        "reps-dim":       "#8a8fa8",
        "reps-orange":    "#378add",
        "reps-orange-hi": "#4a9ae8",
        // Emerald family, hue 150 — see the note in globals.css. Kept in step
        // with the CSS variables of the same names; both are the source of
        // truth for their own consumers (utility classes here, inline styles
        // there), so a change to one has to be mirrored in the other.
        "reps-green":       "#3ed68a",
        "reps-green-muted": "#247a4f",
      },
      maxWidth: {
        mobile: "390px",
      },
    },
  },
  plugins: [],
};

export default config;
