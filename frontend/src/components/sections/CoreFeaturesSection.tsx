import React from "react";
import { Bot, LineChart, BookOpen, HeartHandshake, BarChart3, UserCog, ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

interface FeatureItem {
  id: string;
  icon: React.ElementType;
  title: string;
  badge: string;
  badgeVariant: "cyan" | "teal" | "default";
  description: string;
  bullets: string[];
  linkText: string;
  linkHref: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: "ai-assistant",
    icon: Bot,
    title: "AI Pollution Assistant",
    badge: "GenAI Powered",
    badgeVariant: "cyan",
    description: "Interact with an intelligent environmental assistant to clarify air quality terms, understand live risks, and receive personalized health guidance.",
    bullets: [
      "Ask natural-language pollution questions",
      "Understand complex environmental readings",
      "Receive context-aware explanations grounded in WHO standards",
    ],
    linkText: "Try Assistant Preview",
    linkHref: "#assistant",
  },
  {
    id: "air-insights",
    icon: LineChart,
    title: "Air Quality Insights",
    badge: "Real-Time Telemetry",
    badgeVariant: "teal",
    description: "Explore multi-pollutant concentrations (PM2.5, PM10, NO2, O3, CO) normalized into clear, standardized index ratings.",
    bullets: [
      "Explore comprehensive air quality indicators",
      "Understand regional pollutant severity metrics",
      "Access clear atmospheric and particulate breakdowns",
    ],
    linkText: "Explore Telemetry",
    linkHref: "#overview",
  },
  {
    id: "pollution-awareness",
    icon: BookOpen,
    title: "Pollution Awareness",
    badge: "Public Education",
    badgeVariant: "default",
    description: "Learn about anthropogenic and natural pollution causes, acute and chronic health effects, and ecological impacts.",
    bullets: [
      "Learn major urban and industrial emission sources",
      "Understand respiratory, cardiovascular, and environmental impacts",
      "Access transparent educational insights and safety guides",
    ],
    linkText: "Read Awareness Guide",
    linkHref: "#awareness",
  },
  {
    id: "smart-recommendations",
    icon: HeartHandshake,
    title: "Smart Recommendations",
    badge: "Actionable Advisory",
    badgeVariant: "cyan",
    description: "Receive practical, timely health precautions based on current environmental conditions and diurnal pollutant dispersion curves.",
    bullets: [
      "Receive practical daily environmental guidance",
      "Understand optimal window ventilation timing",
      "Get actionable outdoor workout and commuting advisories",
    ],
    linkText: "View Advisory Model",
    linkHref: "#assistant",
  },
  {
    id: "environmental-analytics",
    icon: BarChart3,
    title: "Environmental Analytics",
    badge: "Visual Intelligence",
    badgeVariant: "teal",
    description: "Transform dense atmospheric data sets into intuitive charts, historical comparative trends, and geographic heat distributions.",
    bullets: [
      "View pollution trends through clean visual charts",
      "Make multi-day historical exposure data intuitive",
      "Inspect moving 24-hour and 7-day particulate patterns",
    ],
    linkText: "View Sample Analytics",
    linkHref: "/dashboard",
  },
  {
    id: "personalized-experience",
    icon: UserCog,
    title: "Personalized Experience",
    badge: "Adaptive Profiles",
    badgeVariant: "default",
    description: "Configure vulnerability profiles (asthma, cardiovascular, elderly, children, athletes) for customized threshold alerts and protections.",
    bullets: [
      "Set user-specific health conditions and sensitivity thresholds",
      "Foundation for future customizable push alerts and notification triggers",
      "Tailor clean air recommendations to your daily routine",
    ],
    linkText: "Configure Profile",
    linkHref: "/register",
  },
];

export const CoreFeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-16 space-y-12 scroll-mt-20">
      <SectionHeading
        badgeText="SECTION D • CORE CAPABILITIES"
        badgeVariant="teal"
        title="Engineered for"
        titleHighlight="Actionable Environmental Intelligence"
        description="Six foundational capabilities built to transform raw sensor data into meaningful health protection and smarter everyday decisions."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {FEATURES.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <Card
              key={feature.id}
              hoverable
              className="flex flex-col justify-between p-6 space-y-5 bg-[#141B23]"
            >
              <div className="space-y-4">
                {/* Icon & Badge Header */}
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-[#10151B] border border-white/[0.09] flex items-center justify-center text-[#28C7F5] shadow-cyan-glow">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <Badge variant={feature.badgeVariant} size="sm">
                    {feature.badge}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#F5F7FA] tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A5B0BC] mt-2 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Bullet points */}
                <ul className="space-y-2 pt-2 border-t border-white/[0.06] text-xs text-[#A5B0BC]">
                  {feature.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38E0B4] mt-1.5 flex-shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Footer Link */}
              <div className="pt-3 border-t border-white/[0.06]">
                <Link
                  href={feature.linkHref}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#28C7F5] hover:text-[#38E0B4] transition-colors"
                >
                  <span>{feature.linkText}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
