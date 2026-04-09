import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2DB87A",
        "primary-dark": "#1A9E64",
        mint: "#E8F7F1",
        trust: "#2B6FEB",
        "trust-light": "#EBF1FD",
        page: "#F5F7FA",
        card: "#FFFFFF",
        heading: "#1A1D23",
        muted: "#6B7280",
        "risk-low": "#2DB87A",
        "risk-moderate": "#F5A623",
        "risk-high": "#E84040",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
