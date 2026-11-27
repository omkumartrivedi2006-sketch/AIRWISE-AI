import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "cyan"
    | "teal"
    | "outline"
    | "good"
    | "moderate"
    | "sensitive"
    | "unhealthy"
    | "poor"
    | "veryUnhealthy"
    | "hazardous";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  size = "md",
  dot = false,
  className,
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center font-mono font-medium rounded-full transition-colors select-none";

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-xs font-semibold",
  };

  const variantStyles = {
    default:
      "bg-surface text-foreground-secondary border border-border-subtle",
    cyan:
      "bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20",
    teal:
      "bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20",
    outline:
      "bg-transparent text-foreground-secondary border border-border-subtle",
    good:
      "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-semibold",
    moderate:
      "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-semibold",
    sensitive:
      "bg-orange-500/10 text-orange-800 dark:text-orange-300 border border-orange-500/30 font-semibold",
    unhealthy:
      "bg-red-500/10 text-red-800 dark:text-red-300 border border-red-500/30 font-semibold",
    poor:
      "bg-red-500/10 text-red-800 dark:text-red-300 border border-red-500/30 font-semibold",
    veryUnhealthy:
      "bg-purple-500/10 text-purple-800 dark:text-purple-300 border border-purple-500/30 font-semibold",
    hazardous:
      "bg-rose-900/15 text-rose-800 dark:text-rose-300 border border-rose-600/40 font-semibold",
  };

  return (
    <span
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse inline-block flex-shrink-0" />
      )}
      {children}
    </span>
  );
};
