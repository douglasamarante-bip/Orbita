import type {NextConfig} from 'next';
const nextConfig:NextConfig={output:'standalone',serverExternalPackages:['node:sqlite'],experimental:{cpus:2}};
export default nextConfig;
