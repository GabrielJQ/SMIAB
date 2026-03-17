import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    'http://127.0.0.1:8000',
    'http://localhost:8000',
    'http://127.0.0.1:3001'
  ],

};

export default nextConfig;
