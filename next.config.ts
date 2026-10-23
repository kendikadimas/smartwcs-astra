import type { NextConfig } from "next";

const allowedDevOrigins = [
  "educational-pee-ads-anytime.trycloudflare.com",
  "*.trycloudflare.com",
  ...(process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",").map((s) => s.trim())
    : []),
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins,
};

export default nextConfig;
