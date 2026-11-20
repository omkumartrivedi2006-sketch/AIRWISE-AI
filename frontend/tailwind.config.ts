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
        background: "#070B12",
        surface: {
          DEFAULT: "#0B111E",
          hover: "#111A2D",
          border: "rgba(255, 255, 255, 0.08)",
          glass: "rgba(11, 17, 30, 0.65)",
        },
        primary: {
          DEFAULT: "#0066FF",
          hover: "#0052CC",
          glow: "rgba(0, 102, 255, 0.25)",
        },
        cyan: {
          accent: "#00F2FE",
          light: "#22D3EE",
          glow: "rgba(0, 242, 254, 0.2)",
        },
        aqi: {
          good: "#10B981",
          moderate: "#F59E0B",
          unhealthySensitive: "#F97316",
          unhealthy: "#EF4444",
          veryUnhealthy: "#8B5CF6",
          hazardous: "#991B1B",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      backgroundImage: {
        "radial-glow": "radial-gradient(circle at 50% 0%, rgba(0, 102, 255, 0.15) 0%, transparent 60%)",
        "cyan-glow": "radial-gradient(circle at 100% 50%, rgba(0, 242, 254, 0.1) 0%, transparent 50%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "blue-glow": "0 0 25px -5px rgba(0, 102, 255, 0.3)",
        "cyan-glow": "0 0 25px -5px rgba(0, 242, 254, 0.3)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
