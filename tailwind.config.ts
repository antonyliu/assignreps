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
        orange: {
          accent: "#ff7a3d",
        },
        green: {
          complete: "#4ade80",
        },
        background: "#100d0b",
      },
      maxWidth: {
        mobile: "390px",
      },
    },
  },
  plugins: [],
};

export default config;
