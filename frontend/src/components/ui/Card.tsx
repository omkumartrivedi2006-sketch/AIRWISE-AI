import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "cyan" | "teal" | "emerald" | "none";
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  glow = "none",
  hoverable = false,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "bg-surface border border-border-subtle rounded-xl p-5 relative overflow-hidden transition-all duration-200 shadow-sm",
        hoverable && "hover:bg-surface-hover hover:border-border-strong hover:-translate-y-0.5 hover:shadow-md cursor-pointer",
        glow === "emerald" && "border-emerald-500/30 shadow-emerald-glow",
        glow === "cyan" && "border-sky-500/30 shadow-sky-glow",
        glow === "teal" && "border-teal-500/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
