"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Gauge, MapPin, Wind, Thermometer, Droplets, AlertTriangle, ArrowUpRight, BarChart3, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface StationOverview {
  name: string;
  city: string;
  country: string;
  aqi: number;
  category: "Good" | "Moderate" | "Sensitive" | "Unhealthy" | "Hazardous";
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  temp: number;
  humidity: number;
}

const DASHBOARD_STATIONS: StationOverview[] = [
  {
    name: "Central Anand Vihar Station",
    city: "New Delhi",
    country: "India",
    aqi: 312,
    category: "Hazardous",
    pm25: 262.4,
    pm10: 384.1,
    no2: 52.8,
    o3: 24.1,
    temp: 21,
    humidity: 68,
  },
  {
    name: "Westminster Urban Monitoring Hub",
    city: "London",
    country: "United Kingdom",
    aqi: 42,
    category: "Good",
    pm25: 9.8,
    pm10: 16.2,
    no2: 24.5,
    o3: 38.0,
    temp: 11,
    humidity: 78,
  },
  {
    name: "Manhattan Central Sensor 04",
    city: "New York",
    country: "United States",
    aqi: 58,
    category: "Moderate",
    pm25: 14.2,
    pm10: 22.1,
    no2: 18.2,
    o3: 45.3,
    temp: 14,
    humidity: 62,
  },
  {
    name: "Shinjuku Atmospheric Center",
    city: "Tokyo",
    country: "Japan",
    aqi: 35,
    category: "Good",
    pm25: 8.4,
    pm10: 14.0,
    no2: 15.6,
    o3: 32.1,
    temp: 16,
    humidity: 55,
  },
];

export default function DashboardPage() {
  const [selectedStation, setSelectedStation] = useState<StationOverview>(DASHBOARD_STATIONS[0]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/[0.09] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-[#28C7F5]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F7FA] tracking-tight">
              Environmental Telemetry Dashboard
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#A5B0BC] mt-1">
            Real-time multi-pollutant monitoring stations, index categorization, and exposure indicators.
          </p>
        </div>

        <Badge variant="cyan" size="md" className="font-mono text-xs self-start sm:self-auto">
          Module 02 Architecture Preview
        </Badge>
      </div>

      {/* Demo Disclaimer */}
      <div className="p-3.5 rounded-lg bg-[#141B23] border border-amber-500/30 flex items-center gap-2.5 text-xs text-[#A5B0BC] font-mono">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span>
          <strong className="text-[#F5F7FA]">Demo Sensor Shell:</strong> This interactive dashboard is rendered using sample telemetry models. Live OpenAQ sensor feeds and database persistence integrate in upcoming modules.
        </span>
      </div>

      {/* Station Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-mono text-[#6B7A8D] flex-shrink-0">
          Available Stations:
        </span>
        {DASHBOARD_STATIONS.map((st) => (
          <button
            key={st.name}
            onClick={() => setSelectedStation(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 flex-shrink-0 ${
              selectedStation.name === st.name
                ? "bg-[#28C7F5]/20 text-[#28C7F5] border border-[#28C7F5]/40"
                : "bg-[#141B23] text-[#A5B0BC] border border-white/[0.06] hover:text-[#F5F7FA]"
            }`}
          >
            <MapPin className="w-3 h-3" />
            <span>{st.city} ({st.country})</span>
          </button>
        ))}
      </div>

      {/* Core Telemetry Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AQI Status Dial */}
        <Card className="lg:col-span-5 p-6 bg-[#141B23] border-white/[0.09] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <span className="text-xs font-mono text-[#28C7F5] uppercase">
                Monitoring Location
              </span>
              <h3 className="text-lg font-bold text-[#F5F7FA]">
                {selectedStation.name}
              </h3>
            </div>
            <Badge
              variant={
                selectedStation.category === "Good"
                  ? "good"
                  : selectedStation.category === "Moderate"
                  ? "moderate"
                  : selectedStation.category === "Sensitive"
                  ? "sensitive"
                  : selectedStation.category === "Unhealthy"
                  ? "unhealthy"
                  : "hazardous"
              }
              size="md"
            >
              {selectedStation.category}
            </Badge>
          </div>

          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#10151B] border border-white/[0.04]">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" className="text-white/[0.06]" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke={selectedStation.aqi > 300 ? "#F87171" : selectedStation.aqi > 150 ? "#EF4444" : selectedStation.aqi > 100 ? "#F97316" : selectedStation.aqi > 50 ? "#F59E0B" : "#38E0B4"}
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={Math.max(0, 264 - (Math.min(selectedStation.aqi, 400) / 400) * 264)}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-4xl font-extrabold text-[#F5F7FA] font-mono">
                  {selectedStation.aqi}
                </span>
                <span className="text-[10px] font-mono text-[#A5B0BC] uppercase tracking-wider">
                  US-AQI Index
                </span>
              </div>
            </div>
            <div className="mt-3 text-xs font-mono text-[#A5B0BC]">
              Dominant Hazard: <strong className="text-[#F5F7FA]">PM2.5</strong>
            </div>
          </div>

          {/* Meteorological params */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#10151B] border border-white/[0.06] flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-[#6B7A8D]">Temperature</div>
                <div className="text-sm font-bold text-[#F5F7FA]">{selectedStation.temp}°C</div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#10151B] border border-white/[0.06] flex items-center gap-2">
              <Droplets className="w-4 h-4 text-[#28C7F5]" />
              <div>
                <div className="text-[10px] text-[#6B7A8D]">Humidity</div>
                <div className="text-sm font-bold text-[#F5F7FA]">{selectedStation.humidity}%</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Right Column: Multi-Pollutant Diagnostics Matrix */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 bg-[#141B23] border-white/[0.09] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#F5F7FA]">
                Chemical & Particulate Concentrations
              </h3>
              <span className="text-xs font-mono text-[#6B7A8D] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Updated 5m ago
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-[#10151B] border border-white/[0.06]">
                <div className="text-[11px] font-mono text-[#A5B0BC]">PM2.5</div>
                <div className="text-xl font-bold font-mono text-[#F5F7FA] mt-1">
                  {selectedStation.pm25} <span className="text-xs font-normal text-[#A5B0BC]">µg/m³</span>
                </div>
                <div className="text-[10px] text-[#6B7A8D] mt-1">WHO: 15 µg/m³</div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#10151B] border border-white/[0.06]">
                <div className="text-[11px] font-mono text-[#A5B0BC]">PM10</div>
                <div className="text-xl font-bold font-mono text-[#F5F7FA] mt-1">
                  {selectedStation.pm10} <span className="text-xs font-normal text-[#A5B0BC]">µg/m³</span>
                </div>
                <div className="text-[10px] text-[#6B7A8D] mt-1">WHO: 45 µg/m³</div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#10151B] border border-white/[0.06]">
                <div className="text-[11px] font-mono text-[#A5B0BC]">NO2</div>
                <div className="text-xl font-bold font-mono text-[#F5F7FA] mt-1">
                  {selectedStation.no2} <span className="text-xs font-normal text-[#A5B0BC]">ppb</span>
                </div>
                <div className="text-[10px] text-[#6B7A8D] mt-1">Combustion gas</div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#10151B] border border-white/[0.06]">
                <div className="text-[11px] font-mono text-[#A5B0BC]">O3</div>
                <div className="text-xl font-bold font-mono text-[#F5F7FA] mt-1">
                  {selectedStation.o3} <span className="text-xs font-normal text-[#A5B0BC]">ppb</span>
                </div>
                <div className="text-[10px] text-[#6B7A8D] mt-1">Photochemical</div>
              </div>
            </div>

            {/* Historical Trend Graph Placeholder Skeleton */}
            <div className="p-5 rounded-xl bg-[#10151B] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#F5F7FA] font-semibold flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#28C7F5]" /> 24-Hour Particulate Exposure Trend (Placeholder)
                </span>
                <span className="text-[10px] text-[#6B7A8D]">Hourly Moving Average</span>
              </div>

              <div className="h-32 flex items-end gap-2 pt-4 px-2">
                {[45, 60, 80, 110, 140, 180, 220, 260, 290, 312, 280, 240].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-[#28C7F5]/20 to-[#28C7F5] transition-all"
                      style={{ height: `${(h / 320) * 100}%` }}
                    />
                    <span className="text-[8px] font-mono text-[#6B7A8D]">{i * 2}h</span>
                  </div>
                ))}
              </div>
              <div className="text-[10px] font-mono text-[#6B7A8D] text-center pt-1">
                Visual analytics engine implemented in Module 04
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
