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
        background: {
          DEFAULT: "#080A0D",
          secondary: "#10151B",
          card: "#141B23",
          cardHover: "#19222D",
        },
        surface: {
          DEFAULT: "#10151B",
          card: "#141B23",
          hover: "#19222D",
          border: "rgba(255, 255, 255, 0.09)",
          glass: "rgba(20, 27, 35, 0.75)",
        },
        primary: {
          DEFAULT: "#28C7F5",
          hover: "#1AAAD5",
          glow: "rgba(40, 199, 245, 0.25)",
        },
        accent: {
          cyan: "#28C7F5",
          teal: "#38E0B4",
          blue: "#1E70F5",
        },
        foreground: {
          DEFAULT: "#F5F7FA",
          secondary: "#A5B0BC",
          muted: "#6B7A8D",
        },
        aqi: {
          good: "#38E0B4",
          moderate: "#F59E0B",
          unhealthySensitive: "#F97316",
          unhealthy: "#EF4444",
          veryUnhealthy: "#C084FC",
          hazardous: "#F87171",
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
      boxShadow: {
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
        "cyan-glow": "0 0 25px -5px rgba(40, 199, 245, 0.25)",
        "teal-glow": "0 0 25px -5px rgba(56, 224, 180, 0.25)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
