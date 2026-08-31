/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // pdf-parse ships a debug harness that references test files; keep it external
    // so Next doesn't try to bundle those non-existent assets into serverless fns.
    serverComponentsExternalPackages: ["pdf-parse", "@prisma/client", "bcryptjs"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
