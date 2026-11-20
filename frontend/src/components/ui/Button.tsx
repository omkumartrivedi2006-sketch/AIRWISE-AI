import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "cyan";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs font-medium gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base font-medium gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-primary hover:bg-primary-hover text-white shadow-blue-glow border border-primary/30 active:scale-[0.98]",
    cyan:
      "bg-gradient-to-r from-cyan-accent to-primary text-background font-semibold hover:opacity-95 shadow-cyan-glow border border-cyan-light/30 active:scale-[0.98]",
    secondary:
      "bg-surface hover:bg-surface-hover text-slate-200 border border-surface-border active:scale-[0.98]",
    outline:
      "bg-transparent hover:bg-white/[0.04] text-slate-300 border border-white/[0.12] hover:border-white/[0.25]",
    ghost:
      "bg-transparent hover:bg-white/[0.05] text-slate-400 hover:text-slate-200",
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};
