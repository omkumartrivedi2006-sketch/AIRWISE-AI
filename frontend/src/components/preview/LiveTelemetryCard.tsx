"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Wind, Gauge, Droplets, Thermometer, ArrowUpRight } from "lucide-react";

interface CitySample {
  city: string;
  country: string;
  aqi: number;
  category: "Good" | "Moderate" | "Unhealthy" | "Very Unhealthy" | "Hazardous";
  dominant: string;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  temp: number;
  humidity: number;
}

const SAMPLE_CITIES: CitySample[] = [
  {
    city: "New Delhi",
    country: "India",
    aqi: 312,
    category: "Hazardous",
    dominant: "PM2.5",
    pm25: 262.4,
    pm10: 384.1,
    no2: 52.8,
    o3: 24.1,
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
    no2: 24.5,
    o3: 38.0,
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
    no2: 18.2,
    o3: 45.3,
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
    no2: 15.6,
    o3: 32.1,
    temp: 16,
    humidity: 55,
  },
];

export const LiveTelemetryCard: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const current = SAMPLE_CITIES[selectedIdx];

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return { text: "text-emerald-400", bg: "bg-emerald-500", stroke: "#10B981", variant: "good" as const };
    if (aqi <= 100) return { text: "text-amber-400", bg: "bg-amber-500", stroke: "#F59E0B", variant: "moderate" as const };
    if (aqi <= 200) return { text: "text-orange-400", bg: "bg-orange-500", stroke: "#F97316", variant: "unhealthy" as const };
    if (aqi <= 300) return { text: "text-rose-400", bg: "bg-rose-500", stroke: "#EF4444", variant: "unhealthy" as const };
    return { text: "text-purple-400", bg: "bg-purple-600", stroke: "#8B5CF6", variant: "hazardous" as const };
  };

  const aqiStyle = getAqiColor(current.aqi);

  return (
    <Card className="border-white/[0.1] bg-surface/90 shadow-2xl relative">
      {/* Header & City Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.06] gap-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-cyan-accent" />
          <h3 className="font-semibold text-white text-sm sm:text-base tracking-tight">
            Live Telemetry Engine Preview
          </h3>
          <Badge variant="cyan" size="sm" dot>
            Real-time Ingestion Contract
          </Badge>
        </div>

        {/* City Toggle Buttons */}
        <div className="flex items-center bg-background/60 p-1 rounded-lg border border-white/[0.06] self-start sm:self-auto">
          {SAMPLE_CITIES.map((c, i) => (
            <button
              key={c.city}
              onClick={() => setSelectedIdx(i)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                selectedIdx === i
                  ? "bg-surface-hover text-cyan-light shadow-sm border border-white/[0.08]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {c.city}
            </button>
          ))}
        </div>
      </div>

      {/* Main Metric Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5 items-center">
        {/* Left: AQI Dial & Location */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-xl bg-background/40 border border-white/[0.04]">
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="7"
                className="text-white/[0.06]"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke={aqiStyle.stroke}
                strokeWidth="7"
                strokeDasharray="264"
                strokeDashoffset={Math.max(0, 264 - (Math.min(current.aqi, 400) / 400) * 264)}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
                {current.aqi}
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                US-AQI
              </span>
            </div>
          </div>

          <div className="mt-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <h4 className="text-base font-semibold text-white">
                {current.city}, {current.country}
              </h4>
            </div>
            <div className="mt-1 flex items-center justify-center gap-2">
              <Badge variant={aqiStyle.variant} size="sm">
                {current.category}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                Primary: <strong className="text-slate-200">{current.dominant}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Sub-Pollutant Matrix & Atmospheric Params */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-background/50 border border-white/[0.05]">
              <div className="text-[11px] font-mono text-slate-400">PM2.5</div>
              <div className="text-lg font-bold text-white font-mono mt-0.5">
                {current.pm25} <span className="text-[10px] text-slate-400 font-normal">µg/m³</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Std: 15 µg/m³</div>
            </div>

            <div className="p-3 rounded-lg bg-background/50 border border-white/[0.05]">
              <div className="text-[11px] font-mono text-slate-400">PM10</div>
              <div className="text-lg font-bold text-white font-mono mt-0.5">
                {current.pm10} <span className="text-[10px] text-slate-400 font-normal">µg/m³</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Std: 45 µg/m³</div>
            </div>

            <div className="p-3 rounded-lg bg-background/50 border border-white/[0.05]">
              <div className="text-[11px] font-mono text-slate-400">NO2</div>
              <div className="text-lg font-bold text-white font-mono mt-0.5">
                {current.no2} <span className="text-[10px] text-slate-400 font-normal">ppb</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Traffic marker</div>
            </div>

            <div className="p-3 rounded-lg bg-background/50 border border-white/[0.05]">
              <div className="text-[11px] font-mono text-slate-400">O3</div>
              <div className="text-lg font-bold text-white font-mono mt-0.5">
                {current.o3} <span className="text-[10px] text-slate-400 font-normal">ppb</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Photochemical</div>
            </div>
          </div>

          {/* Meteorological Readings */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-hover/50 border border-white/[0.05] text-xs">
            <div className="flex items-center gap-4 text-slate-300">
              <span className="flex items-center gap-1.5 font-mono">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                {current.temp}°C
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <Droplets className="w-3.5 h-3.5 text-cyan-accent" />
                {current.humidity}% Humidity
              </span>
              <span className="hidden sm:flex items-center gap-1.5 font-mono">
                <Wind className="w-3.5 h-3.5 text-primary" />
                3.4 m/s ENE
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              Refreshed 2m ago <ArrowUpRight className="w-3 h-3 text-cyan-accent" />
            </span>
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed font-mono">
            Endpoint target: <code className="text-cyan-light">GET /api/v1/pollution/current?city={current.city.toLowerCase()}</code>
          </div>
        </div>
      </div>
    </Card>
  );
};
