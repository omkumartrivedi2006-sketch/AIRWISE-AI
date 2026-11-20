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
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#28C7F5]/50 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs font-medium gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base font-medium gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-[#28C7F5] to-[#1AAAD5] text-[#080A0D] font-semibold hover:opacity-95 shadow-cyan-glow border border-[#28C7F5]/30",
    teal:
      "bg-gradient-to-r from-[#38E0B4] to-[#2BC49B] text-[#080A0D] font-semibold hover:opacity-95 shadow-teal-glow border border-[#38E0B4]/30",
    secondary:
      "bg-[#141B23] hover:bg-[#19222D] text-[#F5F7FA] border border-white/[0.09] hover:border-white/[0.2]",
    outline:
      "bg-transparent hover:bg-white/[0.04] text-[#A5B0BC] hover:text-[#F5F7FA] border border-white/[0.12] hover:border-[#28C7F5]/50",
    ghost:
      "bg-transparent hover:bg-white/[0.05] text-[#A5B0BC] hover:text-[#F5F7FA]",
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
