import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f3ff",
          500: "#7c3aed",
          600: "#6d28d9",
          700: "#5b21b6"
        },
        accent: {
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c"
        },
        success: {
          500: "#14b8a6",
          600: "#0d9488"
        }
      }
    }
  },
  plugins: []
};

export default config;
