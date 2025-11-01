import type { Config } from "tailwindcss";

const config: Config = {
  // This tells Tailwind to scan all files inside the src/ folder
  // for class names. This is the part that fixes the error.
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;