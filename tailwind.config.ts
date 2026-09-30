import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cad: {
          bg: "#07080B",
          surface: "#0B0E14",
          panel: "#101520",
          card: "#161C2A",
          border: "#1E273A",
          borderLight: "#2B374F",
          accent: "#0284C7",
          cyan: "#38BDF8",
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#F43F5E",
          violet: "#8B5CF6",
          text: "#E2E8F0",
          muted: "#94A3B8",
          dim: "#64748B",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "SF Mono", "Consolas", "monospace"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 12s linear infinite",
        "scan-line": "scanline 2.5s ease-in-out infinite",
        "marquee": "marquee 35s linear infinite",
      },
      keyframes: {
        scanline: {
          "0%, 100%": { transform: "translateY(0%)" },
          "50%": { transform: "translateY(100%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
