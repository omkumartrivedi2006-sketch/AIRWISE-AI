import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "teal" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs font-medium gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-2.5 text-base font-medium gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-primary hover:bg-emerald-600 dark:hover:bg-emerald-400 text-white dark:text-black font-semibold shadow-sm hover:shadow border border-primary/20",
    teal:
      "bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm",
    secondary:
      "bg-surface hover:bg-surface-hover text-foreground border border-border-subtle hover:border-border-strong shadow-sm",
    outline:
      "bg-transparent hover:bg-surface-hover text-foreground-secondary hover:text-foreground border border-border-subtle hover:border-border-strong",
    ghost:
      "bg-transparent hover:bg-surface-hover text-foreground-secondary hover:text-foreground",
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
