import React from "react";
import { Wind, Droplets, Volume2, Mountain, AlertCircle, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface PollutionDomain {
  id: string;
  name: string;
  icon: React.ElementType;
  badge: string;
  badgeVariant: "cyan" | "teal" | "default";
  headline: string;
  primarySources: string[];
  healthImpacts: string[];
  mitigationSteps: string[];
}

const POLLUTION_DOMAINS: PollutionDomain[] = [
  {
    id: "air",
    name: "Air Pollution",
    icon: Wind,
    badge: "Atmospheric",
    badgeVariant: "cyan",
    headline: "Suspended micro-particulates and toxic combustion emissions.",
    primarySources: [
      "Vehicular exhaust emissions (diesel particulates, NOx)",
      "Coal thermal plants, brick kilns, and industrial stacks",
      "Agricultural crop stubble burning and municipal waste fires",
      "Construction dust and unpaved road dust resuspension",
    ],
    healthImpacts: [
      "Chronic obstructive pulmonary disease (COPD) and asthma exacerbation",
      "Elevated ischemic heart disease, stroke, and lung cancer morbidity",
      "Impaired fetal lung development in expectant mothers",
    ],
    mitigationSteps: [
      "Monitor daily AQI thresholds before outdoor physical exertion",
      "Wear certified N95 respirators in dense particulate corridors",
      "Equip indoor spaces with certified True HEPA air filtration",
    ],
  },
  {
    id: "water",
    name: "Water Pollution",
    icon: Droplets,
    badge: "Hydrological",
    badgeVariant: "teal",
    headline: "Chemical, biological, and microplastic contamination of aquifers.",
    primarySources: [
      "Untreated industrial chemical discharges and heavy metal effluents",
      "Agricultural fertilizer runoff generating eutrophication and nitrate spikes",
      "Inadequate municipal sewage processing and plastic debris degradation",
    ],
    healthImpacts: [
      "Waterborne gastrointestinal infections, cholera, and amoebiasis",
      "Bioaccumulation of lead, mercury, and arsenic in organ tissues",
      "Disruption of endocrine systems caused by persistent microplastics",
    ],
    mitigationSteps: [
      "Use multi-stage reverse osmosis (RO) and UV water purification",
      "Test residential groundwater for dissolved solids and heavy metal traces",
      "Prevent non-biodegradable chemical disposal into municipal drains",
    ],
  },
  {
    id: "noise",
    name: "Noise Pollution",
    icon: Volume2,
    badge: "Acoustic",
    badgeVariant: "default",
    headline: "Excessive anthropogenic acoustic stress disrupting biological cycles.",
    primarySources: [
      "Continuous urban vehicular traffic, horns, and railway networks",
      "Aviation corridors and low-altitude flight paths over residential zones",
      "Heavy industrial machinery, construction pneumatic drills, and sirens",
    ],
    healthImpacts: [
      "Permanent sensorineural hearing threshold shifts and tinnitus",
      "Elevated nocturnal cortisol secretion and sleep cycle fragmentation",
      "Chronic hypertension and heightened cardiovascular stress",
    ],
    mitigationSteps: [
      "Install dual-pane sound-dampening acoustic window glazing",
      "Deploy noise-cancelling ear protection in high-decibel environments",
      "Create designated quiet acoustic recovery sanctuaries in homes",
    ],
  },
  {
    id: "soil",
    name: "Soil Pollution",
    icon: Mountain,
    badge: "Terrestrial",
    badgeVariant: "teal",
    headline: "Persistent organic pollutants and heavy metal saturation in soil.",
    primarySources: [
      "Excessive chemical pesticide, herbicide, and fungicide application",
      "Unregulated industrial electronic waste (e-waste) landfill seepage",
      "Petroleum hydrocarbon spills and toxic mining tailings",
    ],
    healthImpacts: [
      "Transfer of heavy metals (cadmium, lead) into crop food chains",
      "Neurological impairment from prolonged direct dermal or dietary exposure",
      "Permanent degradation of soil microbial biodiversity and fertility",
    ],
    mitigationSteps: [
      "Support regenerative and organic agricultural soil practices",
      "Properly recycle electronic waste at certified hazardous collection hubs",
      "Promote phytoremediation planting to absorb heavy metal concentrations",
    ],
  },
];

export const EnvironmentalAwarenessSection: React.FC = () => {
  return (
    <section id="awareness" className="py-16 space-y-12 scroll-mt-20">
      <SectionHeading
        badgeText="SECTION G • ENVIRONMENTAL SCIENCE EDUCATION"
        badgeVariant="teal"
        title="Comprehensive"
        titleHighlight="Environmental Awareness"
        description="Understanding the four critical dimensions of planetary pollution: origin points, physiological health impacts, and evidence-based personal mitigation."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
        {POLLUTION_DOMAINS.map((domain) => {
          const IconComponent = domain.icon;
          return (
            <Card
              key={domain.id}
              className="p-6 bg-[#141B23] border border-white/[0.09] space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#10151B] border border-white/[0.09] flex items-center justify-center text-[#28C7F5] shadow-cyan-glow">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#F5F7FA]">
                      {domain.name}
                    </h3>
                    <p className="text-xs text-[#A5B0BC]">
                      {domain.headline}
                    </p>
                  </div>
                </div>
                <Badge variant={domain.badgeVariant} size="sm">
                  {domain.badge}
                </Badge>
              </div>

              {/* 3 Detail Blocks: Sources, Health, Mitigation */}
              <div className="space-y-4 text-xs">
                {/* Sources */}
                <div className="p-3 rounded-lg bg-[#10151B] border border-white/[0.05] space-y-1.5">
                  <span className="font-mono text-[11px] font-semibold text-[#F5F7FA] uppercase tracking-wider">
                    Primary Origin Sources:
                  </span>
                  <ul className="space-y-1 text-[#A5B0BC]">
                    {domain.primarySources.map((source, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#28C7F5]">•</span>
                        <span>{source}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Health Impacts */}
                <div className="p-3 rounded-lg bg-[#10151B] border border-white/[0.05] space-y-1.5">
                  <span className="font-mono text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
                    Clinical & Physiological Impacts:
                  </span>
                  <ul className="space-y-1 text-[#A5B0BC]">
                    {domain.healthImpacts.map((impact, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-400">•</span>
                        <span>{impact}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mitigations */}
                <div className="p-3 rounded-lg bg-[#10151B] border border-white/[0.05] space-y-1.5">
                  <span className="font-mono text-[11px] font-semibold text-[#38E0B4] uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#38E0B4]" />
                    Protective Mitigations:
                  </span>
                  <ul className="space-y-1 text-[#A5B0BC]">
                    {domain.mitigationSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#38E0B4]">✓</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
