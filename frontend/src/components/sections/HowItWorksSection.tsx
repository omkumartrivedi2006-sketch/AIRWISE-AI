import React from "react";
import { Search, MessageSquareCode, ShieldCheck, ArrowRight } from "lucide-react";
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
    title: "Explore",
    subtitle: "Real-Time Telemetry Discovery",
    description: "Understand available pollution and environmental information. Access standardized AQI readings, particulate concentrations (PM2.5, PM10), and atmospheric trends.",
    icon: Search,
    deliverable: "Standardized multi-pollutant telemetry & EPA risk tiers",
  },
  {
    number: "02",
    title: "Ask",
    subtitle: "Contextual AI Interaction",
    description: "Interact with AIRWISE AI to ask questions and understand environmental conditions. Receive natural-language explanations contextualized by local conditions and personal health profiles.",
    icon: MessageSquareCode,
    deliverable: "Server-side Gemini reasoning with WHO health standards",
  },
  {
    number: "03",
    title: "Act",
    subtitle: "Informed Decision Execution",
    description: "Use relevant insights and recommendations to make informed decisions. Optimize workout scheduling, apartment ventilation, purifier usage, and commute timing.",
    icon: ShieldCheck,
    deliverable: "Actionable protective measures & reduced exposure risk",
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-16 space-y-12 scroll-mt-20">
      <SectionHeading
        badgeText="SECTION E • THREE-STEP LIFECYCLE"
        badgeVariant="cyan"
        title="How AIRWISE AI"
        titleHighlight="Works in Practice"
        description="A transparent three-step process translating complex atmospheric sensor data into clear personal health actions."
      />

      <div className="max-w-6xl mx-auto">
        {/* Desktop Horizontal Timeline & Mobile Vertical Stack */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {STEPS.map((step, idx) => {
            const IconComponent = step.icon;
            return (
              <div key={step.number} className="relative flex flex-col">
                <Card className="p-6 h-full flex flex-col justify-between bg-[#141B23] space-y-4 hover:border-[#28C7F5]/40 transition-all">
                  <div className="space-y-4">
                    {/* Step Number & Icon Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-extrabold font-mono text-[#28C7F5]/40 tracking-tight">
                        {step.number}
                      </span>
                      <div className="w-10 h-10 rounded-lg bg-[#10151B] border border-white/[0.09] flex items-center justify-center text-[#38E0B4]">
                        <IconComponent className="w-5 h-5" />
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-[#38E0B4] font-semibold">
                        Step {step.number}
                      </div>
                      <h3 className="text-xl font-bold text-[#F5F7FA] mt-0.5">
                        {step.title}
                      </h3>
                      <div className="text-xs font-mono text-[#A5B0BC] mt-0.5">
                        {step.subtitle}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#A5B0BC] leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] text-[11px] font-mono text-[#6B7A8D]">
                    <strong className="text-[#F5F7FA]">Outcome:</strong> {step.deliverable}
                  </div>
                </Card>

                {/* Desktop Connector Arrow between steps */}
                {idx < STEPS.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#10151B] border border-white/[0.12] items-center justify-center text-[#28C7F5]">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
