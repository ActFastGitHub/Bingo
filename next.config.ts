import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Avoid Windows-native lightningcss binary issues; use PostCSS instead
    optimizeCss: false,
  },
};

export default nextConfig;
