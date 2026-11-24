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
          DEFAULT: "var(--background)",
          secondary: "var(--background-secondary)",
          card: "var(--background-card)",
          cardHover: "var(--background-card-hover)",
        },
        surface: {
          DEFAULT: "var(--background-card)",
          card: "var(--background-card)",
          hover: "var(--background-card-hover)",
          subtle: "var(--background-secondary)",
          border: "var(--border-subtle)",
          sidebar: "var(--surface-sidebar)",
          sidebarHover: "var(--surface-sidebar-hover)",
          sidebarActive: "var(--surface-sidebar-active)",
        },
        primary: {
          DEFAULT: "var(--accent-emerald)",
          hover: "var(--accent-emerald-hover)",
          glow: "rgba(16, 185, 129, 0.20)",
        },
        accent: {
          emerald: "var(--accent-emerald)",
          teal: "var(--accent-teal)",
          sky: "var(--accent-sky)",
        },
        foreground: {
          DEFAULT: "var(--foreground)",
          secondary: "var(--foreground-secondary)",
          muted: "var(--foreground-muted)",
        },
        border: {
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
        },
        aqi: {
          good: "#10B981",              // Emerald Green
          moderate: "#F59E0B",          // Amber Yellow
          unhealthySensitive: "#F97316",// Vivid Orange
          unhealthy: "#EF4444",         // Strong Red
          veryUnhealthy: "#8B5CF6",     // Violet Purple
          hazardous: "#DC2626",         // Dark Crimson
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
        card: "var(--card-shadow)",
        "emerald-glow": "0 0 20px -3px rgba(16, 185, 129, 0.25)",
        "sky-glow": "0 0 20px -3px rgba(56, 189, 248, 0.25)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
