import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  // Use standalone for Docker/Render (enable for Docker builds)
  output: "standalone",
  experimental: {
    disableOptimizedLoading: true,
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-toast",
    ],
  },

  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression
  compress: true,

  // Webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Increase chunk loading timeout for development
    if (!isServer) {
      config.output = {
        ...config.output,
        chunkLoadTimeout: 300000,
      };
    }

    // Production optimizations
    if (!dev && !isServer) {
      // Enable tree shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };

      // Split chunks for better caching
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for node_modules
          vendor: {
            name: "vendor",
            chunks: "all",
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk for shared components
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // UI library chunks
          lib: {
            test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|lucide-react)[\\/]/,
            name: "lib",
            chunks: "all",
            priority: 30,
          },
        },
      };
    }

    return config;
  },

  // Development optimizations
  ...(process.env.NODE_ENV === "development" && {
    productionBrowserSourceMaps: false,
    // Fast refresh optimizations
    reactStrictMode: true,
  }),

  // Enable fast refresh and polling for Docker
  ...(process.env.DOCKER_ENV === "true" ||
  process.env.WATCHPACK_POLLING === "true"
    ? {
        webpack: (config, { dev }) => {
          if (dev) {
            config.watchOptions = {
              poll: 1000, // Check for changes every second
              aggregateTimeout: 300, // Delay before rebuilding
              ignored: ["**/node_modules", "**/.git", "**/.next"],
            };
          }
          return config;
        },
      }
    : {}),
};

// Disable Next.js telemetry
process.env.NEXT_TELEMETRY_DISABLED = "1";

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
