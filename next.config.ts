import type { NextConfig } from "next";

const config: NextConfig = {
  // This line explicitly tells Next.js where the project root is,
  // which fixes the "inferred workspace root" warning.
  outputFileTracingRoot: __dirname,
};

export default config;