"use client";

import React, { useState, useEffect } from "react";
import { Gauge, HelpCircle, Wind, Droplets, Thermometer, ShieldAlert, AlertTriangle, ArrowRight, RefreshCw, Database } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ApiClient } from "@/services/api";
import { LocationItem, PollutionObservationItem } from "@/types";

interface MetricInfo {
  id: string;
  name: string;
  value: string;
  unit: string;
  status: "Good" | "Moderate" | "Sensitive" | "Unhealthy" | "Hazardous";
  whoLimit: string;
  explanation: string;
  healthImpact: string;
}

const DEMO_METRICS: MetricInfo[] = [
  {
    id: "aqi",
    name: "Air Quality Index (AQI)",
    value: "168",
    unit: "US-AQI",
    status: "Unhealthy",
    whoLimit: "0 - 50 is Healthy",
    explanation: "Composite scale standardizing multi-pollutant hazard levels for public health awareness.",
    healthImpact: "Increased likelihood of adverse respiratory effects in sensitive groups; general public may experience discomfort.",
  },
  {
    id: "pm25",
    name: "Particulate Matter 2.5 (PM2.5)",
    value: "88.4",
    unit: "µg/m³",
    status: "Unhealthy",
    whoLimit: "15 µg/m³ (24-hour limit)",
    explanation: "Microscopic inhalable combustion particles with diameters ≤ 2.5 micrometers that penetrate deep into pulmonary alveoli and enter the bloodstream.",
    healthImpact: "Triggers airway inflammation, exacerbates asthma and bronchitis, and elevates cardiovascular event risk.",
  },
  {
    id: "pm10",
    name: "Particulate Matter 10 (PM10)",
    value: "142.1",
    unit: "µg/m³",
    status: "Moderate",
    whoLimit: "45 µg/m³ (24-hour limit)",
    explanation: "Inhalable dust, pollen, and mechanically generated particulate matter with diameters ≤ 10 micrometers.",
    healthImpact: "Causes upper respiratory tract irritation, coughing, eye discomfort, and throat dryness.",
  },
  {
    id: "temperature",
    name: "Ambient Temperature",
    value: "24.5",
    unit: "°C",
    status: "Good",
    whoLimit: "Optimal comfort: 20-25°C",
    explanation: "Local atmospheric dry-bulb temperature affecting boundary layer height, ground thermal convection, and photochemical ozone formation.",
    healthImpact: "High temperatures intensify ground-level smog and ozone creation, increasing respiratory stress.",
  },
  {
    id: "humidity",
    name: "Relative Humidity",
    value: "58",
    unit: "%",
    status: "Good",
    whoLimit: "Optimal comfort: 40-60%",
    explanation: "Moisture saturation percentage in ambient air influencing droplet condensation, particle hygroscopic growth, and particulate settling.",
    healthImpact: "High humidity can trap airborne particulates near ground level while very low humidity dries mucosal membranes.",
  },
];

const AQI_SCALE_TIERS = [
  { range: "0 - 50", label: "Good", color: "bg-[#38E0B4]", text: "text-[#38E0B4]", desc: "Air quality is satisfactory; negligible risk." },
  { range: "51 - 100", label: "Moderate", color: "bg-amber-400", text: "text-amber-400", desc: "Acceptable quality; mild concern for unusually sensitive individuals." },
  { range: "101 - 150", label: "Sensitive", color: "bg-orange-400", text: "text-orange-400", desc: "Members of sensitive groups may experience health effects." },
  { range: "151 - 200", label: "Unhealthy", color: "bg-rose-400", text: "text-rose-400", desc: "Everyone may begin to experience health effects; sensitive groups more serious." },
  { range: "201 - 300", label: "Very Unhealthy", color: "bg-purple-400", text: "text-purple-400", desc: "Health alert: entire population is likely to be affected." },
  { range: "301+", label: "Hazardous", color: "bg-rose-600", text: "text-rose-600", desc: "Emergency conditions: acute health warnings for everyone." },
];

export const AQIOverviewSection: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<MetricInfo>(DEMO_METRICS[0]);
  const [liveObservations, setLiveObservations] = useState<PollutionObservationItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [dataSource, setDataSource] = useState<"api" | "demo">("demo");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiConnected, setApiConnected] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [locRes, obsRes] = await Promise.all([
          ApiClient.getLocations(1, 10).catch(() => null),
          ApiClient.getLatestPollution(10).catch(() => null),
        ]);

        if (mounted) {
          if (locRes?.success && locRes.data) {
            setLocations(locRes.data);
            setApiConnected(true);
          }
          if (obsRes?.success && obsRes.data && obsRes.data.length > 0) {
            setLiveObservations(obsRes.data);
            setDataSource("api");
          } else {
            // No live data yet in database -> default to labeled demo mode
            setDataSource("demo");
          }
        }
      } catch {
        if (mounted) {
          setApiConnected(false);
          setDataSource("demo");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const getStatusBadgeVariant = (status: MetricInfo["status"]) => {
    switch (status) {
      case "Good": return "good";
      case "Moderate": return "moderate";
      case "Sensitive": return "sensitive";
      case "Unhealthy": return "unhealthy";
      case "Hazardous": return "hazardous";
      default: return "default";
    }
  };

  return (
    <section id="overview" className="py-16 space-y-12 scroll-mt-20">
      <SectionHeading
        badgeText="SECTION C • ENVIRONMENTAL METRICS"
        badgeVariant="cyan"
        title="Air Quality Overview &"
        titleHighlight="Pollutant Diagnostics"
        description="Comprehensive dashboard breakdown of primary environmental parameters, measurement units, and World Health Organization recommended safety limits."
      />

      {/* Backend API Connection & Data Source Banner */}
      <div className="max-w-4xl mx-auto p-4 rounded-xl bg-[#141B23] border border-white/[0.09] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#A5B0BC] font-mono gap-3">
        <div className="flex items-center gap-2.5">
          <Database className={`w-4 h-4 ${apiConnected ? "text-[#38E0B4]" : "text-amber-400"} flex-shrink-0`} />
          <div>
            <span className="text-[#F5F7FA] font-bold">Data Mode: </span>
            {dataSource === "api" ? (
              <span className="text-[#38E0B4]">Live PostgreSQL Observations Active</span>
            ) : (
              <span className="text-amber-400">
                {liveObservations.length === 0 && apiConnected
                  ? "Connected to Database (0 live observations recorded). Showing Labeled Demo Dataset."
                  : "Offline / Standby Mode. Showing Labeled Demo Dataset."}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge
            variant={dataSource === "api" ? "teal" : "outline"}
            size="sm"
            className="font-mono text-[10px]"
          >
            {dataSource === "api" ? "LIVE API DATA" : "DEMO DATASET"}
          </Badge>
          {apiConnected && liveObservations.length > 0 && (
            <button
              onClick={() => setDataSource(dataSource === "api" ? "demo" : "api")}
              className="text-[11px] text-[#28C7F5] hover:underline"
            >
              Switch to {dataSource === "api" ? "Demo Data" : "Live API"}
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
        {DEMO_METRICS.map((metric) => {
          const isSelected = selectedMetric.id === metric.id;
          return (
            <Card
              key={metric.id}
              onClick={() => setSelectedMetric(metric)}
              hoverable
              className={`transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "border-[#28C7F5]/50 bg-[#19222D] shadow-cyan-glow"
                  : "bg-[#141B23]"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#A5B0BC] truncate">
                    {metric.name.split(" ")[0]}
                  </span>
                  <Badge variant={getStatusBadgeVariant(metric.status)} size="sm">
                    {metric.status}
                  </Badge>
                </div>

                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#F5F7FA] font-mono tracking-tight">
                    {metric.value}
                  </div>
                  <div className="text-xs text-[#A5B0BC] font-mono">
                    {metric.unit}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.06] text-[11px] text-[#6B7A8D] flex items-center justify-between">
                  <span>WHO: {metric.whoLimit.split(" ")[0]} {metric.unit.includes("µg") ? "µg/m³" : ""}</span>
                  <Tooltip content={metric.explanation}>
                    <HelpCircle className="w-3.5 h-3.5 text-[#A5B0BC] hover:text-[#28C7F5] cursor-pointer" />
                  </Tooltip>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Focused Detail Panel */}
      <div className="max-w-4xl mx-auto">
        <Card className="border-white/[0.09] bg-[#10151B] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
            <div>
              <span className="text-xs font-mono text-[#28C7F5] uppercase tracking-wider">
                Detailed Parameter Analysis
              </span>
              <h3 className="text-lg font-bold text-[#F5F7FA]">
                {selectedMetric.name}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(selectedMetric.status)} size="md">
                Status: {selectedMetric.status}
              </Badge>
              <span className="text-xs font-mono text-[#A5B0BC]">
                Limit: <strong className="text-[#F5F7FA]">{selectedMetric.whoLimit}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-3.5 rounded-lg bg-[#141B23] border border-white/[0.06] space-y-1">
              <div className="font-mono text-[#28C7F5] text-xs font-semibold uppercase">
                Technical Explanation:
              </div>
              <p className="text-[#A5B0BC] leading-relaxed">
                {selectedMetric.explanation}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#141B23] border border-white/[0.06] space-y-1">
              <div className="font-mono text-[#38E0B4] text-xs font-semibold uppercase">
                Physiological & Health Impact:
              </div>
              <p className="text-[#A5B0BC] leading-relaxed">
                {selectedMetric.healthImpact}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Standardized AQI Scale Reference Matrix */}
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="text-center">
          <h3 className="text-sm font-semibold uppercase tracking-wider font-mono text-[#A5B0BC]">
            Standardized US-EPA AQI Classification Scale
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {AQI_SCALE_TIERS.map((tier) => (
            <div
              key={tier.label}
              className="p-3 rounded-lg bg-[#141B23] border border-white/[0.06] text-center space-y-1"
            >
              <div className="w-2.5 h-2.5 rounded-full mx-auto" style={{ backgroundColor: tier.color.replace('bg-[', '').replace(']', '') }} />
              <div className="font-mono text-xs font-bold text-[#F5F7FA] mt-1">
                {tier.range}
              </div>
              <div className={`text-xs font-semibold ${tier.text}`}>
                {tier.label}
              </div>
              <p className="text-[10px] text-[#6B7A8D] line-clamp-2 leading-tight">
                {tier.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
