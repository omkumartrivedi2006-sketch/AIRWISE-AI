/**
 * AIRWISE AI — Design Tokens Definition
 * Standardized constants for typography, colors, borders, shadows, and transitions.
 * Aligned with Module 02 specifications.
 */

export const tokens = {
  colors: {
    background: {
      primary: "#080A0D",
      secondary: "#10151B",
      card: "#141B23",
      cardHover: "#19222D",
      surface: "#10151B",
      surfaceGlass: "rgba(20, 27, 35, 0.75)",
      overlay: "rgba(8, 10, 13, 0.85)",
    },
    borders: {
      subtle: "rgba(255, 255, 255, 0.09)",
      active: "rgba(40, 199, 245, 0.4)",
      teal: "rgba(56, 224, 180, 0.4)",
      focus: "#28C7F5",
    },
    text: {
      primary: "#F5F7FA",
      secondary: "#A5B0BC",
      muted: "#6B7A8D",
      accent: "#28C7F5",
      teal: "#38E0B4",
    },
    brand: {
      primary: "#28C7F5",      // Electric Cyan
      primaryHover: "#1AAAD5",
      primaryGlow: "rgba(40, 199, 245, 0.25)",
      secondary: "#38E0B4",    // Emerald Clean-Air Mint
      secondaryHover: "#2BC49B",
      secondaryGlow: "rgba(56, 224, 180, 0.25)",
      dark: "#080A0D",
      surface: "#141B23",
    },
    aqi: {
      good: {
        bg: "rgba(56, 224, 180, 0.12)",
        text: "#38E0B4",
        border: "rgba(56, 224, 180, 0.3)",
        label: "Good (0-50)",
      },
      moderate: {
        bg: "rgba(245, 158, 11, 0.12)",
        text: "#F59E0B",
        border: "rgba(245, 158, 11, 0.3)",
        label: "Moderate (51-100)",
      },
      unhealthySensitive: {
        bg: "rgba(249, 115, 22, 0.12)",
        text: "#F97316",
        border: "rgba(249, 115, 22, 0.3)",
        label: "Sensitive (101-150)",
      },
      unhealthy: {
        bg: "rgba(239, 68, 68, 0.12)",
        text: "#EF4444",
        border: "rgba(239, 68, 68, 0.3)",
        label: "Unhealthy (151-200)",
      },
      veryUnhealthy: {
        bg: "rgba(168, 85, 247, 0.12)",
        text: "#C084FC",
        border: "rgba(168, 85, 247, 0.3)",
        label: "Very Unhealthy (201-300)",
      },
      hazardous: {
        bg: "rgba(153, 27, 27, 0.2)",
        text: "#F87171",
        border: "rgba(239, 68, 68, 0.5)",
        label: "Hazardous (301+)",
      },
    },
  },
  radii: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.25rem",
    full: "9999px",
  },
  shadows: {
    card: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
    cyanGlow: "0 0 25px -5px rgba(40, 199, 245, 0.25)",
    tealGlow: "0 0 25px -5px rgba(56, 224, 180, 0.25)",
  },
  transitions: {
    default: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    smooth: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
  },
} as const;

export type DesignTokens = typeof tokens;
