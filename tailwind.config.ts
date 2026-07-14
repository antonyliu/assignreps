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
        "reps-bg":        "#1a1612",
        "reps-card":      "#252018",
        "reps-raised":    "#2a2420",
        "reps-line":      "#3a3328",
        "reps-line-hi":   "#4a4338",
        "reps-ink":       "#f0ede8",
        "reps-sub":       "#9a9189",
        "reps-dim":       "#6b6059",
        "reps-orange":    "#378add",
        "reps-orange-hi": "#4a9ae8",
        "reps-green":     "#4ade80",
      },
      maxWidth: {
        mobile: "390px",
      },
    },
  },
  plugins: [],
};

export default config;
