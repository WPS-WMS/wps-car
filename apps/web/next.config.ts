import type { NextConfig } from "next";

const apiOrigin =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, '') ??
  'http://localhost:3001';

const apiHost = new URL(apiOrigin).hostname;
const apiPort = new URL(apiOrigin).port || undefined;

const nextConfig: NextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: apiHost,
        port: apiPort,
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: apiHost,
        port: apiPort,
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
