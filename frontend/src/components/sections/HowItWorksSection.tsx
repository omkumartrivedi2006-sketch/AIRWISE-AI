"use client";

import React from "react";
import { Search, Cpu, ShieldCheck, ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";

interface StepItem {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  deliverable: string;
}

const STEPS: StepItem[] = [
  {
    number: "01",
    title: "Detect & Locate",
    subtitle: "Ground & Satellite Data Fusion",
    description: "Provide your live location or search any global city. AIRWISE AI connects to the nearest monitoring stations and Copernicus CAMS models to fetch live PM2.5, PM10, and gaseous concentrations.",
    icon: Search,
    deliverable: "Instant hyperlocal pollutant measurements",
  },
  {
    number: "02",
    title: "Analyze & Interpret",
    subtitle: "AI Contextual Engine",
    description: "Raw particulate data is normalized into standard US EPA and WHO 2021 air quality categories. Google Gemini analyzes atmospheric trends against your personalized health vulnerability profile.",
    icon: Cpu,
    deliverable: "Clear health risk level & pollutant breakdown",
  },
  {
    number: "03",
    title: "Protect & Act",
    subtitle: "Actionable Daily Decisions",
    description: "Receive practical recommendations: best outdoor exercise hours, optimal window ventilation times, N95 respirator mask advice, and smart notification triggers when conditions shift.",
    icon: ShieldCheck,
    deliverable: "Proactive exposure reduction & peace of mind",
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-12 sm:py-16 space-y-12">
      <SectionHeading
        badgeText="THREE-STEP WORKFLOW"
        badgeVariant="teal"
        title="How AIRWISE AI"
        titleHighlight="Protects You"
        description="A streamlined process translating complex atmospheric sensor telemetry into immediate, practical health actions."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {STEPS.map((step) => {
          const IconComponent = step.icon;
          return (
            <Card
              key={step.number}
              className="p-6 flex flex-col justify-between space-y-5 hover:border-primary/40 transition-all group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-extrabold font-mono text-primary/40 group-hover:text-primary transition-colors">
                    {step.number}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <IconComponent className="w-5 h-5" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {step.title}
                  </h3>
                  <span className="text-xs font-mono text-foreground-muted block mt-0.5">
                    {step.subtitle}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="pt-4 border-t border-border-subtle">
                <div className="text-[11px] font-mono text-foreground-muted flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>{step.deliverable}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
