import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "cyan" | "teal" | "none";
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
        "bg-[#141B23] border border-white/[0.09] rounded-xl p-5 relative overflow-hidden backdrop-blur-md",
        hoverable && "transition-all duration-250 hover:bg-[#19222D] hover:border-[#28C7F5]/35 hover:-translate-y-1 hover:shadow-cyan-glow cursor-pointer",
        glow === "cyan" && "border-[#28C7F5]/30 shadow-cyan-glow",
        glow === "teal" && "border-[#38E0B4]/30 shadow-teal-glow",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
