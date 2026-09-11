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
};

export default nextConfig;
