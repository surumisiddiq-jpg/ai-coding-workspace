import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly defines the local folder as the application root
    root: ".",
  },
};

export default nextConfig;

