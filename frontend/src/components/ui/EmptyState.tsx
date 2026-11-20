import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Data Available",
  description = "No environmental readings or results match the requested criteria.",
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 rounded-xl bg-[#141B23] border border-white/[0.09] text-center space-y-3",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center text-[#A5B0BC]">
        <AlertCircle className="w-5 h-5 text-[#28C7F5]" />
      </div>
      <h4 className="text-sm font-semibold text-[#F5F7FA]">{title}</h4>
      <p className="text-xs text-[#A5B0BC] max-w-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
