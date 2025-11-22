import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/christmas-gift-exchange-app",
  images: {
    unoptimized: true,
  },
  /* config options here */
};

export default nextConfig;
