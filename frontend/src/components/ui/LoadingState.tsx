import React from "react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading environmental intelligence...",
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 space-y-4 text-center",
        className
      )}
    >
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-[#28C7F5]/20 animate-ping" />
        <div className="absolute inset-0 rounded-full border-2 border-t-[#28C7F5] border-r-transparent border-b-[#38E0B4] border-l-transparent animate-spin" />
      </div>
      <p className="text-xs font-mono text-[#A5B0BC]">{message}</p>
    </div>
  );
};
