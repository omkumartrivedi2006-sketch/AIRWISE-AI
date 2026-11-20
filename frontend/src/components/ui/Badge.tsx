import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "cyan" | "good" | "moderate" | "unhealthy" | "hazardous" | "outline";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  size = "md",
  dot = false,
  className,
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  const variantStyles = {
    default: "bg-surface-hover text-slate-300 border border-white/[0.08]",
    cyan: "bg-cyan-accent/10 text-cyan-light border border-cyan-accent/25",
    good: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
    moderate: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
    unhealthy: "bg-rose-500/10 text-rose-400 border border-rose-500/25",
    hazardous: "bg-purple-900/30 text-purple-300 border border-purple-500/30",
    outline: "bg-transparent text-slate-400 border border-white/[0.12]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full animate-pulse",
            variant === "cyan" && "bg-cyan-accent",
            variant === "good" && "bg-emerald-400",
            variant === "moderate" && "bg-amber-400",
            variant === "unhealthy" && "bg-rose-400",
            variant === "hazardous" && "bg-purple-400",
            variant === "default" && "bg-blue-400"
          )}
        />
      )}
      {children}
    </span>
  );
};
