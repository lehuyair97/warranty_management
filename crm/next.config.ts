import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: [
    'uit.warranty.com',
    'api.warranty.com',
    'localhost:3000',
    'localhost:5001',
    '127.0.0.1:3000',
  ],
};

export default nextConfig;
