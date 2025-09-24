import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Accept-CH", value: "Sec-CH-Prefers-Color-Scheme" },
          { key: "Vary", value: "Sec-CH-Prefers-Color-Scheme" },
        ],
      },
    ];
  },
};

export default nextConfig;
