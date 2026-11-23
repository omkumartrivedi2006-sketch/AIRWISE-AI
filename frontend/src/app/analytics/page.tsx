"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  MapPin,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Activity,
  Layers,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ApiClient } from "@/services/api";
import {
  AnalyticsOverviewResponse,
  AQITrendsResponse,
  PollutantTrendsResponse,
  StatisticsData,
  DataCoverageResponse,
  AIInsightResponse,
  LocationSearchResult,
} from "@/types";

const TIME_RANGES = [
  { label: "24 Hours", value: "24h" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
];

const INDIAN_PRESET_CITIES = [
  { name: "Ahmedabad", state: "Gujarat" },
  { name: "Gandhinagar", state: "Gujarat" },
  { name: "Surat", state: "Gujarat" },
  { name: "Mumbai", state: "Maharashtra" },
  { name: "New Delhi", state: "Delhi" },
  { name: "Bengaluru", state: "Karnataka" },
  { name: "Pune", state: "Maharashtra" },
  { name: "Kolkata", state: "West Bengal" },
];

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <AnalyticsContent />
      </AppLayout>
    </AuthGuard>
  );
}

function AnalyticsContent() {
  const [selectedCity, setSelectedCity] = useState<string>("Ahmedabad");
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [activeTab, setActiveTab] = useState<string>("aqi");
  const [interval, setInterval] = useState<string>("daily");

  const [overview, setOverview] = useState<AnalyticsOverviewResponse | null>(null);
  const [aqiTrends, setAqiTrends] = useState<AQITrendsResponse | null>(null);
  const [pollutantTrends, setPollutantTrends] = useState<PollutantTrendsResponse | null>(null);
  const [coverage, setCoverage] = useState<DataCoverageResponse | null>(null);
  const [aiInsight, setAiInsight] = useState<AIInsightResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [ovRes, aqiRes, polRes, covRes] = await Promise.all([
        ApiClient.getAnalyticsOverview({ city: selectedCity, time_range: timeRange }).catch(() => null),
        activeTab === "aqi"
          ? ApiClient.getAqiTrends({ city: selectedCity, time_range: timeRange, interval }).catch(() => null)
          : null,
        activeTab !== "aqi"
          ? ApiClient.getPollutantTrends({ pollutant: activeTab, city: selectedCity, time_range: timeRange, interval }).catch(() => null)
          : null,
        ApiClient.getDataCoverage({ city: selectedCity, time_range: timeRange }).catch(() => null),
      ]);

      if (ovRes?.success && ovRes.data) setOverview(ovRes.data);
      if (aqiRes?.success && aqiRes.data) setAqiTrends(aqiRes.data);
      if (polRes?.success && polRes.data) setPollutantTrends(polRes.data);
      if (covRes?.success && covRes.data) setCoverage(covRes.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load analytical metrics";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedCity, timeRange, activeTab, interval]);

  const handleGenerateAiInsight = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await ApiClient.generateAiInsight({
        city: selectedCity,
        pollutant: activeTab,
        time_range: timeRange,
      });
      if (res.success && res.data) {
        setAiInsight(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate AI insights";
      setErrorMsg(msg);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const csvStr = await ApiClient.downloadCsvExport({
        city: selectedCity,
        time_range: timeRange,
      });
      const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `airwise_${selectedCity.toLowerCase()}_${timeRange}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setErrorMsg("Failed to download CSV export.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length >= 2) {
      setIsSearching(true);
      try {
        const res = await ApiClient.searchLocations(val.trim(), 5);
        if (res.success && res.data) {
          setSearchResults(res.data);
          setShowDropdown(true);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    setSearchQuery(city);
    setShowDropdown(false);
    setAiInsight(null);
  };

  const activePoints = activeTab === "aqi" ? aqiTrends?.points || [] : pollutantTrends?.points || [];
  const activeStats: StatisticsData | undefined =
    activeTab === "aqi" ? aqiTrends?.statistics : pollutantTrends?.statistics;
  const activeTrend = activeTab === "aqi" ? aqiTrends?.trend : pollutantTrends?.trend;

  const maxVal = Math.max(
    ...activePoints.map((p) => p.value || 0),
    activeTab === "aqi" ? 150 : 50
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-border-subtle gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Analytics & Atmospheric Trends
              </h1>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Indian National Clean Air Programme (NCAP) telemetry, time-series distributions, and Gemini insights.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="text-xs font-medium"
          >
            <Download className={`w-3.5 h-3.5 mr-1.5 ${isExporting ? "animate-spin" : ""}`} />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerateAiInsight}
            disabled={isGeneratingAi || isLoading}
            className="text-xs font-medium"
          >
            <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${isGeneratingAi ? "animate-spin" : ""}`} />
            {isGeneratingAi ? "Analyzing..." : "Gemini AI Summary"}
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* City & Time Range Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border-subtle shadow-sm">
        {/* City Quick Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-foreground-muted font-medium text-[11px] mr-1 flex-shrink-0">
            Indian Cities:
          </span>
          {INDIAN_PRESET_CITIES.map((c) => {
            const isSelected = selectedCity.toLowerCase() === c.name.toLowerCase();
            return (
              <button
                key={c.name}
                onClick={() => handleSelectCity(c.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${isSelected
                  ? "bg-primary text-white dark:text-black font-semibold shadow-sm"
                  : "bg-surface-hover text-foreground-secondary hover:text-foreground border border-border-subtle"
                  }`}
              >
                {c.name}
                <span className="text-[10px] opacity-70 ml-1 font-normal">({c.state})</span>
              </button>
            );
          })}
        </div>

        {/* Time Window Switcher */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Calendar className="w-4 h-4 text-foreground-muted mr-1" />
          {TIME_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setTimeRange(r.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${timeRange === r.value
                ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                : "bg-surface-hover text-foreground-secondary hover:text-foreground border border-border-subtle"
                }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-foreground-secondary">
              <span className="font-medium">Average AQI</span>
              <Badge variant="cyan" size="sm">
                {overview.latest_aqi_scale || "US_EPA"}
              </Badge>
            </div>
            <div className="text-3xl font-extrabold font-mono text-foreground">
              {overview.average_aqi != null ? overview.average_aqi.toFixed(1) : "—"}
            </div>
            <div className="text-[11px] text-foreground-secondary">
              Latest: <span className="font-semibold text-foreground">{overview.latest_aqi ?? "—"}</span> ({overview.latest_aqi_category ?? "Normal"})
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-foreground-secondary">
              <span className="font-medium">Average PM2.5</span>
              <span className="text-[10px] font-mono text-foreground-muted">µg/m³</span>
            </div>
            <div className="text-3xl font-extrabold font-mono text-foreground">
              {overview.average_pm25 != null ? overview.average_pm25.toFixed(1) : "—"}
            </div>
            <div className="text-[11px] text-foreground-secondary">
              CPCB Standard: <span className="font-semibold text-emerald-600 dark:text-emerald-400">60 µg/m³</span>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-foreground-secondary">
              <span className="font-medium">Average PM10</span>
              <span className="text-[10px] font-mono text-foreground-muted">µg/m³</span>
            </div>
            <div className="text-3xl font-extrabold font-mono text-foreground">
              {overview.average_pm10 != null ? overview.average_pm10.toFixed(1) : "—"}
            </div>
            <div className="text-[11px] text-foreground-secondary">
              CPCB Standard: <span className="font-semibold text-emerald-600 dark:text-emerald-400">100 µg/m³</span>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-foreground-secondary">
              <span className="font-medium">Data Telemetry</span>
              <Badge
                variant={overview.data_coverage_status === "good" ? "good" : "moderate"}
                size="sm"
              >
                {overview.data_coverage_status.toUpperCase()}
              </Badge>
            </div>
            <div className="text-3xl font-extrabold font-mono text-foreground">
              {overview.observation_count} <span className="text-xs font-normal text-foreground-secondary">readings</span>
            </div>
            <div className="text-[11px] text-foreground-secondary">
              Coverage: <span className="font-semibold text-primary">100% Active</span>
            </div>
          </Card>
        </div>
      )}

      {/* Main Chart Section */}
      <Card className="p-6 space-y-6">
        {/* Metric Selector Tabs & Interval */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-subtle gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {["aqi", "pm25", "pm10", "no2", "so2", "co", "o3"].map((metricKey) => (
              <button
                key={metricKey}
                onClick={() => setActiveTab(metricKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all ${activeTab === metricKey
                  ? "bg-primary text-white dark:text-black font-bold shadow-sm"
                  : "bg-surface-hover text-foreground-secondary hover:text-foreground border border-border-subtle"
                  }`}
              >
                {metricKey}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-foreground-muted font-medium text-[11px]">Interval:</span>
            {["hourly", "daily", "weekly"].map((intKey) => (
              <button
                key={intKey}
                onClick={() => setInterval(intKey)}
                className={`px-2.5 py-1 rounded-lg text-xs capitalize transition-all ${interval === intKey
                  ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                  : "text-foreground-secondary hover:text-foreground"
                  }`}
              >
                {intKey}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Progress Bar Chart */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              {selectedCity} — {activeTab.toUpperCase()} Progression ({interval})
            </span>
            {activeTrend && (
              <div className="flex items-center gap-2">
                <span className="text-foreground-secondary text-[11px]">Trend:</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-1 ${activeTrend.direction === "increasing"
                    ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                    : activeTrend.direction === "decreasing"
                      ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
                      : "bg-primary/10 text-primary border border-primary/20"
                    }`}
                >
                  {activeTrend.direction === "increasing" && <TrendingUp className="w-3 h-3" />}
                  {activeTrend.direction === "decreasing" && <TrendingDown className="w-3 h-3" />}
                  {activeTrend.direction === "stable" && <Minus className="w-3 h-3" />}
                  {activeTrend.direction.toUpperCase()}
                  {activeTrend.percentage_change != null &&
                    ` (${activeTrend.percentage_change > 0 ? "+" : ""}${activeTrend.percentage_change}%)`}
                </span>
              </div>
            )}
          </div>

          {activePoints.length > 0 ? (
            <div className="p-5 rounded-xl bg-background-secondary border border-border-subtle space-y-4">
              <div className="relative h-60 sm:h-72 w-full pt-6 pb-2 px-2 flex flex-col justify-end">
                {/* Reference Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pt-4 pb-8 px-2 opacity-25">
                  <div className="w-full border-b border-dashed border-foreground-muted flex justify-between text-[9px] font-mono text-foreground-muted">
                    <span>{Math.round(maxVal)}</span>
                  </div>
                  <div className="w-full border-b border-dashed border-border-subtle flex justify-between text-[9px] font-mono text-foreground-muted">
                    <span>{Math.round(maxVal * 0.66)}</span>
                  </div>
                  <div className="w-full border-b border-dashed border-border-subtle flex justify-between text-[9px] font-mono text-foreground-muted">
                    <span>{Math.round(maxVal * 0.33)}</span>
                  </div>
                  <div className="w-full border-b border-border-subtle flex justify-between text-[9px] font-mono text-foreground-muted">
                    <span>0</span>
                  </div>
                </div>

                {/* Bars flex row */}
                <div className="relative z-10 h-full w-full flex items-end gap-1 sm:gap-2">
                  {activePoints.map((pt, idx) => {
                    const val = pt.value ?? 0;
                    const heightPct = Math.min(100, Math.max(12, (val / maxVal) * 100));

                    const isHigh = val > (activeTab === "aqi" ? 150 : 60);
                    const isModerate = val > (activeTab === "aqi" ? 100 : 35);

                    const barBg = isHigh
                      ? "bg-rose-500 hover:bg-rose-400 dark:bg-rose-500"
                      : isModerate
                        ? "bg-amber-500 hover:bg-amber-400 dark:bg-amber-500"
                        : "bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-500";

                    // Show label without slicing and space labels if there are many points
                    const showLabel = activePoints.length <= 16 || idx % Math.ceil(activePoints.length / 14) === 0;

                    return (
                      <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center group relative min-w-[6px]">
                        {/* Tooltip on hover */}
                        <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-surface border border-border-subtle p-2 rounded-lg text-[10px] font-mono text-foreground pointer-events-none whitespace-nowrap z-30 shadow-xl">
                          <div className="font-bold text-primary">{pt.period_label}</div>
                          <div className="text-foreground">
                            {activeTab.toUpperCase()}: <span className="font-bold">{val.toFixed(1)}</span> {activeTab === "aqi" ? "" : "µg/m³"}
                          </div>
                          <div className="text-[9px] text-foreground-muted">
                            Range: {pt.min?.toFixed(1) ?? "—"} – {pt.max?.toFixed(1) ?? "—"}
                          </div>
                        </div>

                        {/* Bar Track & Fill */}
                        <div className="w-full h-full flex items-end justify-center">
                          <div
                            className={`w-full max-w-[28px] rounded-t-sm sm:rounded-t transition-all duration-300 shadow-sm ${barBg}`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>

                        {/* Label */}
                        <div className="h-6 flex items-center justify-center w-full">
                          {showLabel ? (
                            <span className="text-[10px] font-mono text-foreground-muted truncate text-center">
                              {pt.period_label}
                            </span>
                          ) : (
                            <span className="w-1 h-1 rounded-full bg-border-subtle" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between text-[11px] text-foreground-secondary border-t border-border-subtle pt-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                    <span>Clean & Safe</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                    <span>Moderate Air</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                    <span>Unhealthy Peak</span>
                  </div>
                </div>
                <span className="font-mono text-foreground-muted">
                  Max Observed: {maxVal.toFixed(1)}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-foreground-muted font-mono">
              Loading analytical points for {selectedCity}...
            </div>
          )}
        </div>

        {/* Statistical Summary Strip */}
        {activeStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border-subtle">
            <div className="p-3 rounded-lg bg-surface-hover border border-border-subtle text-center">
              <span className="text-[10px] font-mono text-foreground-muted block">MINIMUM</span>
              <span className="text-base font-bold font-mono text-foreground">
                {activeStats.min != null ? activeStats.min.toFixed(1) : "—"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-surface-hover border border-border-subtle text-center">
              <span className="text-[10px] font-mono text-foreground-muted block">AVERAGE</span>
              <span className="text-base font-bold font-mono text-foreground">
                {activeStats.mean != null ? activeStats.mean.toFixed(1) : "—"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-surface-hover border border-border-subtle text-center">
              <span className="text-[10px] font-mono text-foreground-muted block">MAXIMUM</span>
              <span className="text-base font-bold font-mono text-foreground">
                {activeStats.max != null ? activeStats.max.toFixed(1) : "—"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-surface-hover border border-border-subtle text-center">
              <span className="text-[10px] font-mono text-foreground-muted block">SAMPLES COUNT</span>
              <span className="text-base font-bold font-mono text-foreground">
                {activeStats.count ?? 0}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Gemini AI Synthesis Insight Card */}
      {aiInsight && (
        <Card className="p-5 border-primary/30 space-y-3 bg-primary/5">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Gemini AI Atmospheric Intelligence Synthesis</span>
          </div>
          <p className="text-xs text-foreground font-semibold">
            {aiInsight.key_finding}
          </p>
          <p className="text-xs text-foreground-secondary leading-relaxed">
            {aiInsight.trend_interpretation}
          </p>
          {aiInsight.recommendations && aiInsight.recommendations.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-semibold text-foreground">Actionable Recommendations:</span>
              <ul className="text-xs text-foreground-secondary space-y-1 list-disc list-inside">
                {aiInsight.recommendations.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
