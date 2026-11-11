import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['node:sqlite', 'pg', '@supabase/supabase-js'],
  experimental: {
    cpus: 2,
  },
};

export default nextConfig;
