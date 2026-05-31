import { withSerwist } from "@serwist/turbopack"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },
  allowedDevOrigins: ["192.168.0.187"],
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
}

export default withSerwist(nextConfig)
