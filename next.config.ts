import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set root to this project dir so Turbopack doesn't pick up
    // the stray package-lock.json at /home/aman-saleem and resolve modules
    // from the wrong location.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
