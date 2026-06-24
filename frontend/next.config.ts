import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly defines the local folder as the application root
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

