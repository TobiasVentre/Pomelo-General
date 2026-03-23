import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bone: "#f4f1ea",
        ink: "#1a1916",
        taupe: "#b8ab97"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-cormorant)", "serif"]
      },
      boxShadow: {
        card: "0 12px 40px rgba(20, 19, 16, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
