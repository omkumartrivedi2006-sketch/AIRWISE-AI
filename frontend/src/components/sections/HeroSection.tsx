"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Wind, Gauge, ShieldCheck, Thermometer, Droplets, CheckCircle2, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Tooltip } from "@/components/ui/Tooltip";

interface SampleStation {
  city: string;
  country: string;
  aqi: number;
  category: "Good" | "Moderate" | "Sensitive" | "Unhealthy" | "Hazardous";
  dominant: string;
  pm25: number;
  pm10: number;
  temp: number;
  humidity: number;
}

const SAMPLE_STATIONS: SampleStation[] = [
  {
    city: "New Delhi",
    country: "India",
    aqi: 312,
    category: "Hazardous",
    dominant: "PM2.5",
    pm25: 262.4,
    pm10: 384.0,
    temp: 21,
    humidity: 68,
  },
  {
    city: "London",
    country: "United Kingdom",
    aqi: 42,
    category: "Good",
    dominant: "NO2",
    pm25: 9.8,
    pm10: 16.2,
    temp: 11,
    humidity: 78,
  },
  {
    city: "New York",
    country: "United States",
    aqi: 58,
    category: "Moderate",
    dominant: "O3",
    pm25: 14.2,
    pm10: 22.1,
    temp: 14,
    humidity: 62,
  },
  {
    city: "Tokyo",
    country: "Japan",
    aqi: 35,
    category: "Good",
    dominant: "PM2.5",
    pm25: 8.4,
    pm10: 14.0,
    temp: 16,
    humidity: 55,
  },
];

export const HeroSection: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState<SampleStation>(SAMPLE_STATIONS[0]);

  const getAqiDetails = (aqi: number) => {
    if (aqi <= 50) return { stroke: "#38E0B4", variant: "good" as const, text: "text-[#38E0B4]" };
    if (aqi <= 100) return { stroke: "#F59E0B", variant: "moderate" as const, text: "text-amber-400" };
    if (aqi <= 150) return { stroke: "#F97316", variant: "sensitive" as const, text: "text-orange-400" };
    if (aqi <= 200) return { stroke: "#EF4444", variant: "unhealthy" as const, text: "text-rose-400" };
    return { stroke: "#C084FC", variant: "hazardous" as const, text: "text-purple-400" };
  };

  const aqiStyle = getAqiDetails(selectedStation.aqi);

  return (
    <section id="home" className="pt-6 sm:pt-12 pb-16 space-y-12">
      {/* 
        HERO SECTION: Content-led, strict compliance with NO HERO IMAGES / NO 3D BLOAT.
        Strong typography, concise messaging, clear CTAs, trust indicator.
      */}
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2">
          <Badge variant="cyan" size="md" dot>
            GENAI POLLUTION INTELLIGENCE
          </Badge>
          <span className="hidden sm:inline-block text-[#6B7A8D] text-xs font-mono">
            | Environmental Safety Platform
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#F5F7FA] leading-[1.08] font-sans">
          Understand Your Air. <br />
          <span className="text-gradient-cyan">Make Smarter Decisions.</span>
        </h1>

        <p className="text-base sm:text-xl text-[#A5B0BC] max-w-2xl mx-auto leading-relaxed">
          Your intelligent pollution companion. Explore environmental insights, understand air quality and get AI-powered guidance to make informed decisions.
        </p>

        {/* Primary & Secondary CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/dashboard">
            <Button variant="primary" size="lg" className="group">
              Explore AIRWISE AI
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <a href="#features">
            <Button variant="secondary" size="lg">
              Discover Features
            </Button>
          </a>
        </div>

        {/* Compact, Truthful Trust Indicator (No invented stats) */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-[#A5B0BC]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#38E0B4]" />
            WHO & US-EPA Grounded Standards
          </span>
          <span className="hidden sm:inline text-white/[0.15]">•</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#28C7F5]" />
            Server-Side GenAI Reasoning
          </span>
          <span className="hidden sm:inline text-white/[0.15]">•</span>
          <span className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            Multi-Standard AQI Normalization
          </span>
        </div>
      </div>

      {/* 
        HERO INTERFACE PREVIEW: Functional, clearly labeled illustrative preview.
        Explicitly identifies sample environmental values as demo data.
      */}
      <div className="max-w-4xl mx-auto">
        <Card className="border-white/[0.12] bg-[#141B23]/90 shadow-2xl relative">
          {/* Top Bar with Demo Identifier and Station Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.09] gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#28C7F5] animate-pulse" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#F5F7FA]">
                Environmental Telemetry Preview
              </span>
              <Badge variant="outline" size="sm" className="font-mono text-[10px] text-amber-400 border-amber-500/30">
                SAMPLE DEMO DATA
              </Badge>
            </div>

            {/* Interactive Location Switcher for the sample preview */}
            <div className="flex items-center bg-[#10151B] p-1 rounded-lg border border-white/[0.09] self-start sm:self-auto">
              <span className="text-[11px] font-mono text-[#6B7A8D] px-2 hidden sm:inline flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#28C7F5]" /> Station:
              </span>
              {SAMPLE_STATIONS.map((station) => (
                <button
                  key={station.city}
                  onClick={() => setSelectedStation(station)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                    selectedStation.city === station.city
                      ? "bg-[#19222D] text-[#28C7F5] shadow-sm border border-white/[0.09]"
                      : "text-[#A5B0BC] hover:text-[#F5F7FA]"
                  }`}
                >
                  {station.city}
                </button>
              ))}
            </div>
          </div>

          {/* Core Telemetry Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 items-center">
            {/* Left: Gauge Dial */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-5 rounded-xl bg-[#10151B] border border-white/[0.06]">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-white/[0.06]"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={aqiStyle.stroke}
                    strokeWidth="8"
                    strokeDasharray="251"
                    strokeDashoffset={Math.max(0, 251 - (Math.min(selectedStation.aqi, 400) / 400) * 251)}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-3xl font-extrabold tracking-tight text-[#F5F7FA] font-mono">
                    {selectedStation.aqi}
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#A5B0BC]">
                    US-AQI
                  </span>
                </div>
              </div>

              <div className="mt-3 text-center space-y-1">
                <div className="text-sm font-semibold text-[#F5F7FA]">
                  {selectedStation.city}, {selectedStation.country}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant={aqiStyle.variant} size="sm">
                    {selectedStation.category}
                  </Badge>
                  <span className="text-xs font-mono text-[#A5B0BC]">
                    Dominant: <strong className="text-[#F5F7FA]">{selectedStation.dominant}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Key Metric Indicators & Quick AI Snapshot */}
            <div className="md:col-span-7 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-lg bg-[#10151B] border border-white/[0.06]">
                  <div className="text-[10px] font-mono text-[#A5B0BC]">PM2.5</div>
                  <div className="text-base font-bold text-[#F5F7FA] font-mono mt-0.5">
                    {selectedStation.pm25} <span className="text-[10px] font-normal text-[#A5B0BC]">µg/m³</span>
                  </div>
                  <div className="text-[10px] text-[#6B7A8D] mt-0.5">Fine particles</div>
                </div>

                <div className="p-3 rounded-lg bg-[#10151B] border border-white/[0.06]">
                  <div className="text-[10px] font-mono text-[#A5B0BC]">PM10</div>
                  <div className="text-base font-bold text-[#F5F7FA] font-mono mt-0.5">
                    {selectedStation.pm10} <span className="text-[10px] font-normal text-[#A5B0BC]">µg/m³</span>
                  </div>
                  <div className="text-[10px] text-[#6B7A8D] mt-0.5">Coarse dust</div>
                </div>

                <div className="p-3 rounded-lg bg-[#10151B] border border-white/[0.06]">
                  <div className="text-[10px] font-mono text-[#A5B0BC]">TEMP</div>
                  <div className="text-base font-bold text-[#F5F7FA] font-mono mt-0.5 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    {selectedStation.temp}°C
                  </div>
                  <div className="text-[10px] text-[#6B7A8D] mt-0.5">Ambient</div>
                </div>

                <div className="p-3 rounded-lg bg-[#10151B] border border-white/[0.06]">
                  <div className="text-[10px] font-mono text-[#A5B0BC]">HUMIDITY</div>
                  <div className="text-base font-bold text-[#F5F7FA] font-mono mt-0.5 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-[#28C7F5]" />
                    {selectedStation.humidity}%
                  </div>
                  <div className="text-[10px] text-[#6B7A8D] mt-0.5">Relative</div>
                </div>
              </div>

              {/* Sample AI Insight Card */}
              <div className="p-3.5 rounded-lg bg-[#19222D]/60 border border-white/[0.08] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-[#28C7F5] font-semibold">
                    <Sparkles className="w-3.5 h-3.5" /> AIRWISE AI Assistant Guidance
                  </span>
                  <span className="text-[10px] text-[#6B7A8D]">Sample Response</span>
                </div>
                <p className="text-xs text-[#F5F7FA] leading-relaxed">
                  {selectedStation.aqi > 150
                    ? "Severe particulate concentration detected. Outdoor endurance exercise is discouraged. Keep indoor HEPA air filtration active and seal windows during morning inversion peaks."
                    : "Ambient air quality is within acceptable thresholds. Outdoor activities can proceed normally with standard hydration."}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7A8D]">
                <span>Notice: All metrics above represent illustrative demonstration data.</span>
                <Link href="#assistant" className="text-[#28C7F5] hover:underline flex items-center gap-1">
                  Try AI Assistant <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
