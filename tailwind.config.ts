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
        "reps-bg":        "#111318",
        "reps-card":      "#1c1f26",
        "reps-raised":    "#22252e",
        "reps-line":      "#2a2d36",
        "reps-line-hi":   "#3a3d46",
        "reps-ink":       "#e8eaf0",
        "reps-sub":       "#8a8fa8",
        "reps-dim":       "#8a8fa8",
        "reps-orange":    "#378add",
        "reps-orange-hi": "#4a9ae8",
        "reps-green":     "#6bd63d",
      },
      maxWidth: {
        mobile: "390px",
      },
    },
  },
  plugins: [],
};

export default config;
