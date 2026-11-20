import React from "react";
import { HeroSection } from "@/components/sections/HeroSection";
import { AQIOverviewSection } from "@/components/sections/AQIOverviewSection";
import { CoreFeaturesSection } from "@/components/sections/CoreFeaturesSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { AssistantPreviewSection } from "@/components/sections/AssistantPreviewSection";
import { EnvironmentalAwarenessSection } from "@/components/sections/EnvironmentalAwarenessSection";
import { CTASection } from "@/components/sections/CTASection";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
      {/* SECTION B: HERO SECTION (Typography-led, no hero artwork) */}
      <HeroSection />

      {/* SECTION C: AIR QUALITY OVERVIEW (Environmental Dashboard Preview) */}
      <AQIOverviewSection />

      {/* SECTION D: CORE FEATURES (6 Distinct Feature Cards) */}
      <CoreFeaturesSection />

      {/* SECTION E: HOW IT WORKS (3-Step Practical Process) */}
      <HowItWorksSection />

      {/* SECTION F: AI ASSISTANT PREVIEW (Interactive UI Demonstration) */}
      <AssistantPreviewSection />

      {/* SECTION G: ENVIRONMENTAL AWARENESS (Air, Water, Noise, Soil) */}
      <EnvironmentalAwarenessSection />

      {/* SECTION H: CALL TO ACTION (Closing Section) */}
      <CTASection />
    </div>
  );
}
