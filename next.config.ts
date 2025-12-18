import type { NextConfig } from "next";

const config: NextConfig = {
  // This line explicitly tells Next.js where the project root is,
  // which fixes the "inferred workspace root" warning.
  outputFileTracingRoot: __dirname,
  async rewrites() {
    // Forward websocket info requests to the backend API server defined by NEXT_PUBLIC_API_URL
    // This keeps the client using a relative `/ws` path while the dev server proxies to the correct port.
  const dest = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8084';
    return [
      {
        source: '/ws/:path*',
        destination: `${dest.replace(/\/$/, '')}/ws/:path*`,
      },
      {
        source: '/ws',
        destination: `${dest.replace(/\/$/, '')}/ws`,
      },
    ];
  },
};

export default config;