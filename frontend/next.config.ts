import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  experimental: {
    disableOptimizedLoading: true,
  },
};

// Disable Next.js telemetry
process.env.NEXT_TELEMETRY_DISABLED = '1';

export default nextConfig;
