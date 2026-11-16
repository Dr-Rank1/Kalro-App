import type { NextConfig } from 'next';
import { validateEnv } from './src/lib/env';

// Execute Secrets Guard validation during boot-up / compile time
validateEnv();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
