import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // GitHub Pages repository name for basePath
  // Note: This is required for username.github.io/repo-name
  basePath: '/byunhwa',
  assetPrefix: '/byunhwa/',
};

export default nextConfig;
