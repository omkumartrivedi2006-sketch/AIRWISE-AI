import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "blue" | "cyan" | "none";
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
        "glass-panel rounded-xl p-5 relative overflow-hidden",
        hoverable && "glass-panel-hover cursor-pointer",
        glow === "blue" && "border-primary/25 shadow-blue-glow",
        glow === "cyan" && "border-cyan-accent/25 shadow-cyan-glow",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
