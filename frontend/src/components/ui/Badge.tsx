import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "cyan" | "teal" | "good" | "moderate" | "sensitive" | "unhealthy" | "hazardous" | "outline";
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
    default: "bg-[#141B23] text-[#A5B0BC] border border-white/[0.09]",
    cyan: "bg-[#28C7F5]/10 text-[#28C7F5] border border-[#28C7F5]/30",
    teal: "bg-[#38E0B4]/10 text-[#38E0B4] border border-[#38E0B4]/30",
    good: "bg-emerald-500/10 text-[#38E0B4] border border-emerald-500/25",
    moderate: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
    sensitive: "bg-orange-500/10 text-orange-400 border border-orange-500/25",
    unhealthy: "bg-rose-500/10 text-rose-400 border border-rose-500/25",
    hazardous: "bg-purple-900/30 text-purple-300 border border-purple-500/30",
    outline: "bg-transparent text-[#A5B0BC] border border-white/[0.12]",
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
            variant === "cyan" && "bg-[#28C7F5]",
            variant === "teal" && "bg-[#38E0B4]",
            variant === "good" && "bg-[#38E0B4]",
            variant === "moderate" && "bg-amber-400",
            variant === "sensitive" && "bg-orange-400",
            variant === "unhealthy" && "bg-rose-400",
            variant === "hazardous" && "bg-purple-400",
            variant === "default" && "bg-[#28C7F5]"
          )}
        />
      )}
      {children}
    </span>
  );
};
