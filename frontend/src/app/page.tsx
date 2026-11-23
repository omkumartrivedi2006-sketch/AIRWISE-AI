import React from "react";
import { HeroSection } from "@/components/sections/HeroSection";
import { CoreFeaturesSection } from "@/components/sections/CoreFeaturesSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { CTASection } from "@/components/sections/CTASection";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
      {/* 1. HERO SECTION: Problem Statement Visual, Headline, Quick Station Check & CTAs */}
      <HeroSection />

      {/* 2. CORE FEATURES: Four Pillars of Intelligence (Telemetry, Gemini AI, Maps, Alerts) */}
      <CoreFeaturesSection />

      {/* 3. HOW IT WORKS: Three-Step Lifecycle (Detect, Analyze, Protect) */}
      <HowItWorksSection />

      {/* 4. FINAL ACTION / ESSENTIAL INFORMATION: Actionable CTA & Standards Validation */}
      <CTASection />
    </div>
  );
}
