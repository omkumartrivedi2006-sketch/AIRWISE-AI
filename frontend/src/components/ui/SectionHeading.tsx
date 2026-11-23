import React from "react";
import { Badge } from "./Badge";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  badgeText?: string;
  badgeVariant?: "cyan" | "teal" | "default" | "good";
  title: string;
  titleHighlight?: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  badgeText,
  badgeVariant = "teal",
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
          <Badge variant={badgeVariant === "cyan" ? "cyan" : "good"} size="sm">
            {badgeText}
          </Badge>
        </div>
      )}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground font-sans">
        {title}{" "}
        {titleHighlight && (
          <span className="text-primary">{titleHighlight}</span>
        )}
      </h2>
      {description && (
        <p className="text-sm sm:text-base text-foreground-secondary leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};
