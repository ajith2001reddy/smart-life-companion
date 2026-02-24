import type { NextConfig } from "next/dist/server/config-shared";


const nextConfig = {
  allowedDevOrigins: [
    "http://10.0.0.49:3000",
  ],
};

module.exports = nextConfig;
