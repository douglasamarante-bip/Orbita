import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['node:sqlite', 'pg', '@netlify/blobs'],
  experimental: {
    cpus: 2,
  },
};

export default nextConfig;
