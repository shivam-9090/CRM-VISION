import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  experimental: {
    disableOptimizedLoading: true,
  },
  
  // Webpack configuration to prevent chunk loading timeouts
  webpack: (config, { isServer }) => {
    // Increase chunk loading timeout for development
    if (!isServer) {
      config.output = {
        ...config.output,
        // Increase timeout from default 120s to 300s
        chunkLoadTimeout: 300000,
      };
    }
    return config;
  },
  
  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Reduce compilation time
    productionBrowserSourceMaps: false,
  }),
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
  
  // Upload source maps
  widenClientFileUpload: true,
});
