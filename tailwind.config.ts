import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FCE7F3",
          500: "#E91E63",
          600: "#D81B60",
          700: "#BE185D"
        },
        success: {
          500: "#22C55E",
          600: "#16A34A"
        }
      }
    }
  },
  plugins: []
};

export default config;
