import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow cache-busting query strings (e.g. ?v=2) on local images.
    localPatterns: [
      { pathname: "/**", search: "?v=2" },
    ],
  },
};

export default nextConfig;
