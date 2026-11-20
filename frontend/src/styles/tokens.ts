/**
 * AIRWISE AI — Design Tokens Definition
 * Standardized constants for typography, colors, borders, shadows, and transitions.
 */

export const tokens = {
  colors: {
    background: {
      primary: "#070B12",
      surface: "#0B111E",
      surfaceHover: "#111A2D",
      card: "rgba(11, 17, 30, 0.75)",
      overlay: "rgba(7, 11, 18, 0.85)",
    },
    borders: {
      subtle: "rgba(255, 255, 255, 0.08)",
      active: "rgba(0, 102, 255, 0.5)",
      cyan: "rgba(0, 242, 254, 0.4)",
    },
    brand: {
      blue: "#0066FF",
      blueHover: "#0052CC",
      cyan: "#00F2FE",
      cyanLight: "#22D3EE",
    },
    text: {
      primary: "#F8FAFC",
      secondary: "#94A3B8",
      muted: "#64748B",
      accent: "#38BDF8",
    },
    aqi: {
      good: { bg: "rgba(16, 185, 129, 0.15)", text: "#10B981", border: "rgba(16, 185, 129, 0.3)", label: "Good" },
      moderate: { bg: "rgba(245, 158, 11, 0.15)", text: "#F59E0B", border: "rgba(245, 158, 11, 0.3)", label: "Moderate" },
      unhealthySensitive: { bg: "rgba(249, 115, 22, 0.15)", text: "#F97316", border: "rgba(249, 115, 22, 0.3)", label: "Unhealthy for Sensitive Groups" },
      unhealthy: { bg: "rgba(239, 68, 68, 0.15)", text: "#EF4444", border: "rgba(239, 68, 68, 0.3)", label: "Unhealthy" },
      veryUnhealthy: { bg: "rgba(139, 92, 246, 0.15)", text: "#A78BFA", border: "rgba(139, 92, 246, 0.3)", label: "Very Unhealthy" },
      hazardous: { bg: "rgba(153, 27, 27, 0.2)", text: "#F87171", border: "rgba(239, 68, 68, 0.5)", label: "Hazardous" },
    },
  },
  radii: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    full: "9999px",
  },
  transitions: {
    default: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    smooth: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
  },
} as const;

export type DesignTokens = typeof tokens;
