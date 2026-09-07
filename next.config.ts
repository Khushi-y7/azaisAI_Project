import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Generated images are stored as Pollinations' own cacheable URL rather
    // than downloaded locally (Vercel's filesystem isn't writable at
    // runtime), so next/image needs this host allow-listed.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.pollinations.ai",
      },
    ],
  },
};

export default nextConfig;
