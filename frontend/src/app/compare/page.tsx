"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  MapPin,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ApiClient } from "@/services/api";
import { LocationComparisonResponse } from "@/types";

const POLLUTANT_OPTIONS = [
  { label: "PM2.5 (Fine Particles)", value: "pm25", unit: "µg/m³" },
  { label: "PM10 (Coarse Particles)", value: "pm10", unit: "µg/m³" },
  { label: "Air Quality Index (AQI)", value: "aqi", unit: "Index" },
  { label: "NO2 (Nitrogen Dioxide)", value: "no2", unit: "µg/m³" },
  { label: "SO2 (Sulfur Dioxide)", value: "so2", unit: "µg/m³" },
  { label: "CO (Carbon Monoxide)", value: "co", unit: "µg/m³" },
  { label: "O3 (Surface Ozone)", value: "o3", unit: "µg/m³" },
];

const TIME_RANGES = [
  { label: "24 Hours", value: "24h" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
];

const INDIAN_COMPARISON_STATIONS = [
  { name: "Ahmedabad", state: "Gujarat" },
  { name: "Gandhinagar", state: "Gujarat" },
  { name: "Surat", state: "Gujarat" },
  { name: "Mumbai", state: "Maharashtra" },
  { name: "New Delhi", state: "Delhi" },
  { name: "Bengaluru", state: "Karnataka" },
  { name: "Pune", state: "Maharashtra" },
  { name: "Kolkata", state: "West Bengal" },
];

export default function ComparePage() {
  return (
    <AuthGuard>
      <AppLayout>
        <CompareContent />
      </AppLayout>
    </AuthGuard>
  );
}

function CompareContent() {
  const [metric, setMetric] = useState<string>("pm25");
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [selectedCities, setSelectedCities] = useState<string[]>(["Ahmedabad", "New Delhi"]);
  const [comparison, setComparison] = useState<LocationComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadComparison = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await ApiClient.compareLocations({
        metric,
        cities: selectedCities,
        time_range: timeRange,
      });
      if (res.success && res.data) {
        setComparison(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to compute cross-location comparison.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCities.length >= 2) {
      loadComparison();
    }
  }, [metric, timeRange, selectedCities]);

  const toggleCity = (city: string) => {
    if (selectedCities.includes(city)) {
      if (selectedCities.length <= 2) {
        setErrorMsg("Comparison requires at least 2 Indian cities.");
        return;
      }
      setSelectedCities(selectedCities.filter((c) => c !== city));
    } else {
      if (selectedCities.length >= 4) {
        setErrorMsg("Maximum of 4 cities can be compared simultaneously.");
        return;
      }
      setSelectedCities([...selectedCities, city]);
    }
  };

  const currentUnit = POLLUTANT_OPTIONS.find((p) => p.value === metric)?.unit || "µg/m³";
  const maxMean = comparison ? Math.max(...comparison.locations.map((l) => l.mean_value || 0), 10) : 10;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-border-subtle gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Compare Regional Air Quality
              </h1>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Side-by-side environmental exposure analysis between Indian metropolitan areas and industrial corridors.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadComparison}
          disabled={isLoading}
          className="text-xs font-medium"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
          Recalculate
        </Button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Control Strip */}
      <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-4 shadow-sm">
        {/* Metric Switcher */}
        <div>
          <label className="text-xs font-semibold text-foreground mb-2 block">
            Select Metric to Compare:
          </label>
          <div className="flex flex-wrap gap-2">
            {POLLUTANT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMetric(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all ${
                  metric === opt.value
                    ? "bg-primary text-white dark:text-black font-bold shadow-sm"
                    : "bg-surface-hover text-foreground-secondary hover:text-foreground border border-border-subtle"
                }`}
              >
                {opt.value} <span className="text-[10px] opacity-70">({opt.unit})</span>
              </button>
            ))}
          </div>
        </div>

        {/* City Selector Buttons */}
        <div>
          <div className="text-xs font-semibold text-foreground flex items-center justify-between mb-2">
            <span>Select Indian Stations (2 to 4 stations):</span>
            <span className="text-primary font-mono text-[11px] font-bold">
              {selectedCities.length} Selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {INDIAN_COMPARISON_STATIONS.map((c) => {
              const isSelected = selectedCities.includes(c.name);
              return (
                <button
                  key={c.name}
                  onClick={() => toggleCity(c.name)}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition-all ${
                    isSelected
                      ? "bg-primary text-white dark:text-black font-semibold shadow-sm"
                      : "bg-surface-hover text-foreground-secondary hover:text-foreground border border-border-subtle"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{c.name}</span>
                  <span className="text-[10px] opacity-70">({c.state})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Difference Summary Callout */}
      {comparison?.difference_summary && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/25 flex items-center gap-3 text-xs text-primary">
          <TrendingUp className="w-5 h-5 flex-shrink-0" />
          <div className="text-foreground">
            <span className="font-bold text-primary mr-1">Comparative Finding:</span>
            {comparison.difference_summary}
          </div>
        </div>
      )}

      {/* Side-by-Side Cards Comparison Grid */}
      {comparison && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {comparison.locations.map((loc) => {
            const meanVal = loc.mean_value != null ? loc.mean_value : 0;
            const heightPct = Math.min(100, Math.max(10, (meanVal / maxMean) * 100));

            return (
              <Card key={loc.city} className="p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-foreground flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      {loc.city}
                    </span>
                    <Badge variant="cyan" size="sm">
                      {loc.state || "India"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    {loc.location_name || `${loc.city} Clean Air Station`}
                  </p>
                </div>

                {/* Mean Metric Display */}
                <div className="p-4 rounded-xl bg-background-secondary border border-border-subtle text-center space-y-1">
                  <span className="text-[10px] font-mono text-foreground-muted uppercase">
                    Average {metric}
                  </span>
                  <div className="text-3xl font-extrabold font-mono text-foreground">
                    {meanVal.toFixed(1)}
                  </div>
                  <span className="text-[11px] font-mono text-foreground-secondary">
                    {currentUnit}
                  </span>
                </div>

                {/* Relative Exposure Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-foreground-secondary">
                    <span>Relative Load:</span>
                    <span className="font-semibold">{Math.round(heightPct)}% of max</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-border-subtle overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${heightPct}%` }}
                    />
                  </div>
                </div>

                {/* Min / Max Range */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-border-subtle">
                  <div>
                    <span className="text-foreground-muted block text-[10px]">MIN</span>
                    <span className="text-foreground font-semibold">{loc.min_value != null ? loc.min_value.toFixed(1) : "—"}</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted block text-[10px]">MAX</span>
                    <span className="text-foreground font-semibold">{loc.max_value != null ? loc.max_value.toFixed(1) : "—"}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Safety Reference Standards Card */}
      <Card className="p-5 space-y-3">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          CPCB & WHO Environmental Reference Standards
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-background-secondary border border-border-subtle">
            <span className="font-semibold text-foreground block">PM2.5 Safe Limit</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm font-bold">60 µg/m³</span>
            <span className="text-[10px] text-foreground-secondary block mt-0.5">CPCB 24-Hour standard</span>
          </div>
          <div className="p-3 rounded-lg bg-background-secondary border border-border-subtle">
            <span className="font-semibold text-foreground block">PM10 Safe Limit</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm font-bold">100 µg/m³</span>
            <span className="text-[10px] text-foreground-secondary block mt-0.5">CPCB 24-Hour standard</span>
          </div>
          <div className="p-3 rounded-lg bg-background-secondary border border-border-subtle">
            <span className="font-semibold text-foreground block">NO2 Safe Limit</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm font-bold">80 µg/m³</span>
            <span className="text-[10px] text-foreground-secondary block mt-0.5">CPCB 24-Hour standard</span>
          </div>
          <div className="p-3 rounded-lg bg-background-secondary border border-border-subtle">
            <span className="font-semibold text-foreground block">WHO PM2.5 Benchmark</span>
            <span className="text-sky-600 dark:text-sky-400 font-mono text-sm font-bold">15 µg/m³</span>
            <span className="text-[10px] text-foreground-secondary block mt-0.5">WHO Global Guideline</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
