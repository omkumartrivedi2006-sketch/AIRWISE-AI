import React from "react";
import { Badge } from "./Badge";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  badgeText?: string;
  badgeVariant?: "cyan" | "teal" | "default";
  title: string;
  titleHighlight?: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  badgeText,
  badgeVariant = "cyan",
  title,
  titleHighlight,
  description,
  align = "center",
  className,
}) => {
  return (
    <div
      className={cn(
        "space-y-3",
        align === "center" ? "text-center max-w-3xl mx-auto" : "text-left max-w-2xl",
        className
      )}
    >
      {badgeText && (
        <div>
          <Badge variant={badgeVariant} size="sm" dot>
            {badgeText}
          </Badge>
        </div>
      )}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#F5F7FA]">
        {title}{" "}
        {titleHighlight && (
          <span className="text-gradient-cyan">{titleHighlight}</span>
        )}
      </h2>
      {description && (
        <p className="text-sm sm:text-base text-[#A5B0BC] leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};
