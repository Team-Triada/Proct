import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Optimize for development
  typescript: {
    // Skip type checking during dev for speed (still checked in IDE)
    ignoreBuildErrors: false,
  },
  // Reduce memory usage
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['@radix-ui/react-avatar', '@radix-ui/react-checkbox', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-progress', '@radix-ui/react-tooltip', 'framer-motion'],
  },
};

export default nextConfig;
