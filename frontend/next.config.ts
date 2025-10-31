import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  experimental: {
    disableOptimizedLoading: true,
  },
};

// Disable Next.js telemetry
process.env.NEXT_TELEMETRY_DISABLED = '1';

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "crm-vision",
  project: "crm-frontend",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
