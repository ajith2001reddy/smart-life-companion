// frontend/next.config.ts
import type { NextConfig } from "next/dist/server/config-shared";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://10.0.0.49:3000",
  ],

  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;