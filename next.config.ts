import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: we leave Cache Components off (create-next-app turns it on by default).
  // With it on, Next keeps old pages alive in the background after you navigate,
  // so a logged-out patient's chat and the typed password would stay in memory.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
