"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "", showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className={`p-2 rounded-lg border border-border-subtle bg-surface text-foreground-secondary opacity-60 ${className}`}
        disabled
      >
        <Sun className="w-4 h-4" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-foreground-secondary hover:text-foreground transition-all duration-150 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary/40 ${className}`}
      title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
      aria-label={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          {showLabel && <span className="text-xs font-medium">Light</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-slate-700" />
          {showLabel && <span className="text-xs font-medium">Dark</span>}
        </>
      )}
    </button>
  );
};
