"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Wind, MapPin, Search, Activity, ShieldAlert, Sparkles, Navigation } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface StationQuickStat {
  city: string;
  country: string;
  aqi: number;
  category: "Good" | "Moderate" | "Sensitive" | "Unhealthy" | "Hazardous";
  dominant: string;
  pm25: number;
  pm10: number;
  temp: number;
}

const FEATURED_STATIONS: StationQuickStat[] = [
  { city: "New Delhi", country: "India", aqi: 215, category: "Hazardous", dominant: "PM2.5", pm25: 164.2, pm10: 242.0, temp: 24 },
  { city: "Ahmedabad", country: "Gujarat, India", aqi: 156, category: "Unhealthy", dominant: "PM2.5", pm25: 65.4, pm10: 118.0, temp: 31 },
  { city: "Mumbai", country: "Maharashtra, India", aqi: 138, category: "Sensitive", dominant: "PM2.5", pm25: 50.8, pm10: 94.2, temp: 29 },
  { city: "Bengaluru", country: "Karnataka, India", aqi: 78, category: "Moderate", dominant: "O3", pm25: 24.6, pm10: 52.0, temp: 23 },
];

function getCategoryBadge(category: StationQuickStat["category"]) {
  switch (category) {
    case "Good":
      return <Badge variant="good" size="sm">AQI Good (0-50)</Badge>;
    case "Moderate":
      return <Badge variant="moderate" size="sm">AQI Moderate (51-100)</Badge>;
    case "Sensitive":
      return <Badge variant="sensitive" size="sm">Sensitive Groups (101-150)</Badge>;
    case "Unhealthy":
      return <Badge variant="unhealthy" size="sm">Unhealthy (151-200)</Badge>;
    default:
      return <Badge variant="hazardous" size="sm">Hazardous (300+)</Badge>;
  }
}

export const HeroSection: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState<StationQuickStat>(FEATURED_STATIONS[0]);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface my-4">
      {/* Background Visual Asset Treatment */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-90 dark:opacity-75">
        <Image
          src="/images/hero-environmental-visual.svg"
          alt="Atmospheric Airflow & Environmental Telemetry"
          fill
          priority
          className="object-cover object-right md:object-center"
        />
        {/* Scrim Overlay for 100% Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Mission-Driven Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>WHO 2021 & US EPA Compliant Intelligence</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground font-sans leading-[1.15]">
              Real-Time Air Quality & <br className="hidden sm:inline" />
              <span className="text-primary">Environmental Intelligence</span>
            </h1>

            <p className="text-base sm:text-lg text-foreground-secondary leading-relaxed max-w-2xl">
              Understand the air you breathe. Access hyper-local AQI telemetry, multi-pollutant breakdowns (PM2.5, PM10, NO2, O3), and Gemini AI health guidance tailored to your vulnerability profile.
            </p>

            {/* Action CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/dashboard">
                <Button variant="primary" size="lg" className="shadow-md">
                  Check Local Air Quality
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>

              <Link href="/map">
                <Button variant="secondary" size="lg">
                  <Navigation className="w-4 h-4 text-primary mr-1" />
                  Explore Interactive Map
                </Button>
              </Link>
            </div>

            {/* Credibility & Telemetry Strip */}
            <div className="pt-6 border-t border-border-subtle grid grid-cols-3 gap-4 text-left">
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono text-foreground">6</p>
                <p className="text-xs text-foreground-muted">Pollutants Tracked</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono text-foreground">Real-Time</p>
                <p className="text-xs text-foreground-muted">Copernicus CAMS & In-Situ</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono text-foreground">Gemini AI</p>
                <p className="text-xs text-foreground-muted">Personalized Advisory</p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Telemetry Preview Card */}
          <div className="lg:col-span-5">
            <Card className="p-6 backdrop-blur-md bg-surface/90 border-border-subtle shadow-lg space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">
                    {selectedStation.city}, {selectedStation.country}
                  </span>
                </div>
                {getCategoryBadge(selectedStation.category)}
              </div>

              {/* Station Switcher Pills */}
              <div className="flex flex-wrap gap-1.5">
                {FEATURED_STATIONS.map((station) => (
                  <button
                    key={station.city}
                    onClick={() => setSelectedStation(station)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                      selectedStation.city === station.city
                        ? "bg-primary text-white dark:text-black font-semibold shadow-sm"
                        : "bg-background-secondary text-foreground-secondary hover:bg-surface-hover border border-border-subtle"
                    }`}
                  >
                    {station.city}
                  </button>
                ))}
              </div>

              {/* Live Metric Gauge Display */}
              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="p-4 rounded-xl bg-background-secondary border border-border-subtle flex flex-col justify-center">
                  <span className="text-xs font-mono text-foreground-muted">Standard AQI</span>
                  <span className="text-4xl font-extrabold font-mono text-foreground mt-1">
                    {selectedStation.aqi}
                  </span>
                  <span className="text-[11px] text-foreground-secondary mt-1">
                    Dominant: <strong className="text-foreground">{selectedStation.dominant}</strong>
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-background-secondary border border-border-subtle flex items-center justify-between">
                    <span className="text-xs font-mono text-foreground-muted">PM2.5</span>
                    <span className="text-xs font-bold font-mono text-foreground">{selectedStation.pm25} µg/m³</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background-secondary border border-border-subtle flex items-center justify-between">
                    <span className="text-xs font-mono text-foreground-muted">PM10</span>
                    <span className="text-xs font-bold font-mono text-foreground">{selectedStation.pm10} µg/m³</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background-secondary border border-border-subtle flex items-center justify-between">
                    <span className="text-xs font-mono text-foreground-muted">Temp</span>
                    <span className="text-xs font-bold font-mono text-foreground">{selectedStation.temp}°C</span>
                  </div>
                </div>
              </div>

              {/* Direct Deep Link */}
              <div className="pt-2">
                <Link
                  href={`/dashboard?city=${encodeURIComponent(selectedStation.city)}`}
                  className="w-full"
                >
                  <Button variant="secondary" size="sm" className="w-full text-xs">
                    View Full Telemetry & 24h Trends
                    <ArrowRight className="w-3.5 h-3.5 ml-1 text-primary" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
