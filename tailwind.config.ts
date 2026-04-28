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
        primary: "#5822fb",
        "primary-dark": "#00628F",
        mint: "#E8F2F9",
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
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fadeIn 0.4s ease both",
        "scale-in": "scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "slide-right": "slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-left": "slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        breathe: "breathe 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
