"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      tabIndex={0}
      role="tooltip"
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-2.5 py-1.5 text-xs text-[#F5F7FA] bg-[#10151B] border border-white/[0.15] rounded-md shadow-card whitespace-nowrap pointer-events-none transition-opacity duration-150 animate-in fade-in",
            positionStyles[position]
          )}
        >
          {content}
          <div
            className={cn(
              "absolute w-1.5 h-1.5 bg-[#10151B] border-white/[0.15] transform rotate-45",
              position === "top" && "top-full -translate-y-1 left-1/2 -translate-x-1/2 border-r border-b",
              position === "bottom" && "bottom-full translate-y-1 left-1/2 -translate-x-1/2 border-l border-t",
              position === "left" && "left-full -translate-x-1 top-1/2 -translate-y-1/2 border-t border-r",
              position === "right" && "right-full translate-x-1 top-1/2 -translate-y-1/2 border-b border-l"
            )}
          />
        </div>
      )}
    </div>
  );
};
