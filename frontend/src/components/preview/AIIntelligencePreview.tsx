"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Bot, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, CornerDownRight } from "lucide-react";

interface QueryScenario {
  id: string;
  title: string;
  query: string;
  context: {
    location: string;
    aqi: number;
    dominant: string;
    profile: string;
  };
  severity: "Hazardous" | "Elevated Risk" | "Optimal";
  aiAnalysis: string;
  precautions: string[];
  window: string;
}

const SCENARIOS: QueryScenario[] = [
  {
    id: "delhi-asthma",
    title: "Vulnerable Health Advisory",
    query: "Is it safe to go for a 5km morning run today with mild asthma?",
    context: {
      location: "New Delhi (Central)",
      aqi: 312,
      dominant: "PM2.5",
      profile: "Mild Asthma / Respiratory Sensitive",
    },
    severity: "Hazardous",
    aiAnalysis:
      "Outdoor strenuous exercise is strictly contraindicated. Ambient PM2.5 concentrations (262.4 µg/m³) exceed WHO 24-hour limits by over 17x. Elevated micro-particulate infiltration into bronchioles triggers acute bronchospasm and oxidative lung inflammation.",
    precautions: [
      "Shift all cardiovascular activity indoors with active HEPA air filtration.",
      "Wear certified N95 or FFP2 respirators if outdoor transit is unavoidable.",
      "Keep prescribed bronchodilator / rescue inhaler within immediate reach.",
    ],
    window: "No safe outdoor exercise window in next 18 hours.",
  },
  {
    id: "purifier-timing",
    title: "Indoor Air Management",
    query: "When should I ventilate my apartment and run high-speed air purification?",
    context: {
      location: "Urban Center",
      aqi: 185,
      dominant: "PM10 & NO2",
      profile: "General Household",
    },
    severity: "Elevated Risk",
    aiAnalysis:
      "Temperature inversion creates a surface pollution trap during early morning (05:00 - 09:30). Diurnal wind vectors increase dispersion efficiency between 13:30 and 15:30.",
    precautions: [
      "Keep windows sealed during morning and evening rush hours.",
      "Schedule high-CADR air purifier operation at continuous medium setting.",
      "Brief cross-ventilation window recommended between 14:00 - 14:20 only.",
    ],
    window: "Optimal low-exposure ventilation slot: 14:00 - 14:30.",
  },
];

export const AIIntelligencePreview: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);

  return (
    <Card className="border-white/[0.1] bg-surface/90 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.06] gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-cyan-accent flex items-center justify-center">
            <Bot className="w-4 h-4 text-background" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm sm:text-base tracking-tight flex items-center gap-2">
              Gemini Environmental Intelligence Engine
              <Sparkles className="w-3.5 h-3.5 text-cyan-accent" />
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Server-Side Grounded AI Inference Contract (Module 03 Preview)
            </span>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 bg-background/60 p-1 rounded-lg border border-white/[0.06] self-start sm:self-auto">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => setActiveScenario(sc)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                activeScenario.id === sc.id
                  ? "bg-surface-hover text-cyan-light border border-white/[0.08]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {sc.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
        {/* Left Column: Contextual Input Query Payload */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl bg-background/40 border border-white/[0.05] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                User Query
              </span>
              <Badge variant="cyan" size="sm">
                Contextual Prompt
              </Badge>
            </div>
            <p className="text-sm font-medium text-white italic">
              &quot;{activeScenario.query}&quot;
            </p>

            {/* Injected Environmental Telemetry Context */}
            <div className="pt-3 border-t border-white/[0.06] space-y-1.5 text-xs font-mono">
              <div className="text-[11px] text-cyan-accent uppercase tracking-wider font-semibold">
                Augmented Context Grounding:
              </div>
              <div className="text-slate-300 flex justify-between">
                <span className="text-slate-400">Location:</span>
                <span>{activeScenario.context.location}</span>
              </div>
              <div className="text-slate-300 flex justify-between">
                <span className="text-slate-400">Live AQI:</span>
                <span className="text-rose-400 font-bold">{activeScenario.context.aqi} (US-AQI)</span>
              </div>
              <div className="text-slate-300 flex justify-between">
                <span className="text-slate-400">Dominant Pollutant:</span>
                <span className="text-slate-200">{activeScenario.context.dominant}</span>
              </div>
              <div className="text-slate-300 flex justify-between">
                <span className="text-slate-400">Vulnerability:</span>
                <span className="text-amber-400">{activeScenario.context.profile}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-hover/30 border border-white/[0.05] text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Zero prompt leakage. Context injected via secure server-side template.</span>
          </div>
        </div>

        {/* Right Column: AI Analysis & Actionable Directives */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-background/50 border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-accent" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                  Gemini Expert Analysis
                </span>
              </div>
              <Badge
                variant={activeScenario.severity === "Hazardous" ? "hazardous" : "moderate"}
                size="sm"
              >
                {activeScenario.severity}
              </Badge>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {activeScenario.aiAnalysis}
            </p>

            {/* Prescriptive Precautions */}
            <div className="pt-3 border-t border-white/[0.06] space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Actionable Directives:
              </div>
              <div className="space-y-1.5">
                {activeScenario.precautions.map((p, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-accent mt-0.5 flex-shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timing Window */}
            <div className="pt-2 text-[11px] font-mono text-cyan-light flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5 text-cyan-accent" />
              <span>{activeScenario.window}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
