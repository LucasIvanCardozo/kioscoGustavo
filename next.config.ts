import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  agentRules: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'https', hostname: 'ufs.sh' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
