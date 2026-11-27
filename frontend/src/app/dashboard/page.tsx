"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  MapPin,
  Wind,
  Thermometer,
  Droplets,
  AlertTriangle,
  BarChart3,
  Clock,
  RefreshCw,
  Database,
  Radio,
  Search,
  CheckCircle2,
  ExternalLink,
  Bot,
  Activity,
  Compass,
  Bell,
  Sparkles,
  Star,
  Bookmark,
  ShieldAlert,
  Map as MapIcon,
  Navigation,
  Home,
  Users,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AppLayout } from "@/components/layout/AppLayout";
import { LocationPermissionModal } from "@/components/location/LocationPermissionModal";
import { useGeolocation } from "@/hooks/useGeolocation";
import { ApiClient } from "@/services/api";
import {
  LocationSearchResult,
  HistoricalObservationPoint,
  SavedLocation,
  RecommendationsResponse,
} from "@/types";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";

interface DisplayObservation {
  location_id?: number;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  aqi: number;
  aqi_scale: string;
  category: "Good" | "Moderate" | "Sensitive" | "Unhealthy" | "Very Unhealthy" | "Hazardous";
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction?: number;
  provider: string;
  source: string;
  freshness: "live" | "cached" | "delayed" | "unavailable";
  observed_at: string;
  is_live: boolean;
}

const PRESET_CITIES = [
  { name: "New Delhi", country: "India", lat: 28.6139, lon: 77.2090 },
  { name: "Ahmedabad", country: "Gujarat, India", lat: 23.0225, lon: 72.5714 },
  { name: "Mumbai", country: "Maharashtra, India", lat: 19.0760, lon: 72.8777 },
  { name: "Gandhinagar", country: "Gujarat, India", lat: 23.2156, lon: 72.6369 },
  { name: "Surat", country: "Gujarat, India", lat: 21.1702, lon: 72.8311 },
  { name: "Bengaluru", country: "Karnataka, India", lat: 12.9716, lon: 77.5946 },
  { name: "Pune", country: "Maharashtra, India", lat: 18.5204, lon: 73.8567 },
  { name: "Kolkata", country: "West Bengal, India", lat: 22.5726, lon: 88.3639 },
];

function determineCategory(aqi: number): DisplayObservation["category"] {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

function getAqiColor(aqi?: number | null): string {
  if (aqi == null) return "#10B981";
  if (aqi <= 50) return "#10B981";       // Good (Emerald)
  if (aqi <= 100) return "#F59E0B";      // Moderate (Amber)
  if (aqi <= 150) return "#F97316";      // Sensitive (Orange)
  if (aqi <= 200) return "#EF4444";      // Unhealthy (Red)
  if (aqi <= 300) return "#8B5CF6";      // Very Unhealthy (Purple)
  return "#DC2626";                      // Hazardous (Crimson)
}

function getAqiBadge(category: string) {
  switch (category) {
    case "Good":
      return <Badge variant="good">Good (0-50)</Badge>;
    case "Moderate":
      return <Badge variant="moderate">Moderate (51-100)</Badge>;
    case "Sensitive":
      return <Badge variant="sensitive">Sensitive (101-150)</Badge>;
    case "Unhealthy":
      return <Badge variant="unhealthy">Unhealthy (151-200)</Badge>;
    case "Very Unhealthy":
      return <Badge variant="veryUnhealthy">Very Unhealthy (201-300)</Badge>;
    default:
      return <Badge variant="hazardous">Hazardous (300+)</Badge>;
  }
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <DashboardContent />
      </AppLayout>
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const geo = useGeolocation();

  const [currentObs, setCurrentObs] = useState<DisplayObservation | null>(null);
  const [history, setHistory] = useState<HistoricalObservationPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string>("New Delhi");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Module 08 Personalization & Alert State
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savingLocation, setSavingLocation] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);

  // Load recommendations for current observation
  const loadRecommendations = useCallback(async (locationId: number) => {
    setLoadingRecs(true);
    try {
      const recRes = await ApiClient.getRecommendations(locationId);
      if (recRes?.success && recRes.data) {
        setRecommendations(recRes.data);
      }
    } catch {
      // Non-critical
    } finally {
      setLoadingRecs(false);
    }
  }, []);

  // Check saved state
  const checkSavedStatus = useCallback((city: string, savedList: SavedLocation[]) => {
    const match = savedList.some(
      (s) => (s.city || "").toLowerCase() === city.toLowerCase() ||
        (s.location_name || "").toLowerCase() === city.toLowerCase()
    );
    setIsSaved(match);
  }, []);

  // Fetch initial saved locations and unread notifications
  useEffect(() => {
    ApiClient.getSavedLocations()
      .then((res) => {
        if (res.success && res.data) {
          setSavedLocations(res.data);
          if (res.data.length > 0) {
            checkSavedStatus(activeCity, res.data);
          }
        }
      })
      .catch(() => { });

    ApiClient.getUnreadNotificationCount()
      .then((res) => {
        if (res.success && res.data) {
          const count = typeof res.data === "number" ? res.data : (res.data as any).unread_count ?? 0;
          setUnreadAlerts(count);
        }
      })
      .catch(() => { });
  }, [activeCity, checkSavedStatus]);

  // Load telemetry data from backend
  const loadLocationData = useCallback(async (
    params: { city?: string; lat?: number; lon?: number; location_id?: number },
    forceRefresh: boolean = false
  ) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMsg(null);

    try {
      const queryParams: Record<string, string | number | boolean> = {
        force_refresh: forceRefresh,
      };
      if (params.location_id) queryParams.location_id = params.location_id;
      if (params.city) queryParams.city = params.city;
      if (params.lat !== undefined && params.lon !== undefined) {
        queryParams.lat = params.lat;
        queryParams.lon = params.lon;
      }

      const [obsRes, historyRes] = await Promise.all([
        ApiClient.getPollutionObservation(queryParams),
        params.city
          ? ApiClient.getHistoricalObservations({ city: params.city, limit: 24 })
          : Promise.resolve(null),
      ]);

      if (obsRes?.success && obsRes.data) {
        const d = obsRes.data;
        const aqiVal = d.aqi ?? 0;
        const display: DisplayObservation = {
          location_id: d.location_id,
          name: d.location_name || d.location?.name || d.location?.city || params.city || "Monitored Station",
          city: d.city || d.location?.city || params.city || "Detected Location",
          country: d.country || d.location?.country || "Global Network",
          latitude: d.latitude ?? d.location?.latitude ?? params.lat ?? 0,
          longitude: d.longitude ?? d.location?.longitude ?? params.lon ?? 0,
          aqi: aqiVal,
          aqi_scale: d.aqi_scale || "US_EPA",
          category: (d.aqi_category as DisplayObservation["category"]) || determineCategory(aqiVal),
          pm25: d.pm25 ?? 0,
          pm10: d.pm10 ?? 0,
          no2: d.no2 ?? 0,
          so2: d.so2 ?? 0,
          co: d.co ?? 0,
          o3: d.o3 ?? 0,
          temperature: d.temperature ?? 20,
          humidity: d.humidity ?? 50,
          wind_speed: d.wind_speed ?? 0,
          wind_direction: d.wind_direction,
          provider: d.provider || "open-meteo",
          source: d.source || "Copernicus CAMS & Ground Stations",
          freshness: (d.freshness as DisplayObservation["freshness"]) || "live",
          observed_at: d.observed_at || new Date().toISOString(),
          is_live: !d.is_demo,
        };

        setCurrentObs(display);
        if (display.city) {
          setActiveCity(display.city);
          checkSavedStatus(display.city, savedLocations);
        }
        if (d.location_id) {
          loadRecommendations(d.location_id);
        }
      }

      if (historyRes?.success && historyRes.data) {
        setHistory(historyRes.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load live pollution observation";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [checkSavedStatus, loadRecommendations, savedLocations]);

  // When live coordinates are granted from the hook, automatically load them
  useEffect(() => {
    if (geo.status === "granted" && geo.coords) {
      loadLocationData({
        lat: geo.coords.latitude,
        lon: geo.coords.longitude,
      });
    }
  }, [geo.status, geo.coords, loadLocationData]);

  // Initial load default city if no geolocation
  useEffect(() => {
    if (geo.status !== "granted") {
      loadLocationData({ city: "New Delhi" });
    }
  }, []);

  // Debounced search handling
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
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
    }, 300);
  };

  const handleSelectLocation = (loc: LocationSearchResult) => {
    setSearchQuery(`${loc.name}, ${loc.country}`);
    setShowDropdown(false);
    loadLocationData({
      city: loc.city || loc.name,
      lat: loc.latitude,
      lon: loc.longitude,
    });
  };

  const handleToggleSaveLocation = async () => {
    if (!currentObs) return;
    setSavingLocation(true);
    try {
      if (isSaved) {
        const saved = savedLocations.find(
          (s) => (s.city || "").toLowerCase() === currentObs.city.toLowerCase()
        );
        if (saved) {
          await ApiClient.deleteSavedLocation(saved.id);
          const updated = savedLocations.filter((s) => s.id !== saved.id);
          setSavedLocations(updated);
          setIsSaved(false);
        }
      } else {
        const res = await ApiClient.saveLocation({
          location_id: currentObs.location_id ?? 1,
          custom_name: `${currentObs.city} Station`,
          city: currentObs.city,
          latitude: currentObs.latitude,
          longitude: currentObs.longitude,
          is_primary: savedLocations.length === 0,
        });
        if (res.success && res.data) {
          const updated = [...savedLocations, res.data];
          setSavedLocations(updated);
          setIsSaved(true);
        }
      }
    } catch {
      // Error handling
    } finally {
      setSavingLocation(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. DASHBOARD HERO BANNER (Atmospheric Satellite Visual Banner) */}
      <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-80 dark:opacity-60 overflow-hidden">
          <Image
            src="/images/dashboard-banner.svg"
            alt="Atmospheric Satellite Visual Banner"
            fill
            className="object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/90 to-surface/30" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span>Real-Time Environmental Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Welcome back, {user?.full_name ? user.full_name.split(" ")[0] : "Researcher"}
            </h1>
            <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
              Global atmospheric telemetry synchronized with Copernicus CAMS and regional surface monitoring stations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                currentObs &&
                loadLocationData(
                  { city: currentObs.city, lat: currentObs.latitude, lon: currentObs.longitude },
                  true
                )
              }
              disabled={isLoading || isRefreshing}
              className="text-xs font-mono"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
              Sync Sensors
            </Button>

            <Link href="/map">
              <Button variant="primary" size="sm" className="text-xs">
                <MapIcon className="w-3.5 h-3.5 mr-1.5" />
                Live Map
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. LIVE LOCATION PERMISSION & GEOLOCATION EXPERIENCE */}
      <LocationPermissionModal
        status={geo.status}
        coords={geo.coords}
        error={geo.error}
        onRequest={geo.requestLocation}
        onDismiss={geo.dismissPrompt}
        onManualSelect={() => searchInputRef.current?.focus()}
      />

      {/* 3. ERROR BANNER */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300 font-mono">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4. LOCATION SEARCH & PRESET STATIONS */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <div className="relative">
              <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                id="dashboard-search-stations"
                type="text"
                role="combobox"
                aria-expanded={showDropdown}
                aria-autocomplete="list"
                aria-label="Search Indian city, state, or station"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search Indian city, state, or station (e.g. Ahmedabad, Mumbai, New Delhi)..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface border border-border-subtle focus:border-primary focus:outline-none text-foreground placeholder:text-foreground-muted transition-colors shadow-sm"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-border-subtle rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-border-subtle">
                {searchResults.map((loc, idx) => (
                  <button
                    key={`${loc.name}-${idx}`}
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-surface-hover flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span className="font-medium text-foreground">{loc.name}</span>
                      <span className="text-foreground-muted">{loc.country}</span>
                    </div>
                    <span className="font-mono text-[10px] text-foreground-muted">
                      {loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preset City Quick Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_CITIES.map((c) => (
              <button
                key={c.name}
                onClick={() => loadLocationData({ city: c.name, lat: c.lat, lon: c.lon })}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${activeCity.toLowerCase() === c.name.toLowerCase()
                  ? "bg-primary text-white dark:text-black font-semibold shadow-sm"
                  : "bg-surface text-foreground-secondary hover:bg-surface-hover border border-border-subtle"
                  }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. PRIMARY TELEMETRY GAUGE & METRIC TILES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main AQI Status Card (Span 7) */}
        <div className="lg:col-span-7">
          <Card className="p-6 h-full flex flex-col justify-between space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-bold text-base text-foreground">
                  {currentObs?.name || "Active Monitoring Station"}
                </span>
                <span className="text-xs text-foreground-muted">
                  ({currentObs?.city}, {currentObs?.country})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSaveLocation}
                  disabled={savingLocation}
                  aria-label={isSaved ? "Remove station from bookmarks" : "Bookmark this station"}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${isSaved
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                    : "bg-surface border-border-subtle text-foreground-muted hover:text-foreground"
                    }`}
                  title={isSaved ? "Saved to your monitored stations" : "Bookmark this station"}
                >
                  <Star className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
                  <span className="text-[11px] font-medium hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
                </button>

                {currentObs && getAqiBadge(currentObs.category)}
              </div>
            </div>

            {/* Central AQI Meter Display */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              <div
                role="status"
                aria-label={`Current US EPA AQI: ${isLoading ? 'Loading' : currentObs?.aqi}, Category: ${currentObs?.category || 'Unknown'}`}
                className="sm:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-background-secondary border border-border-subtle text-center"
              >
                <span className="text-xs font-mono text-foreground-muted uppercase tracking-wider">
                  US EPA Standard AQI
                </span>
                <span
                  className="text-6xl font-extrabold font-mono my-2"
                  style={{ color: getAqiColor(currentObs?.aqi ?? 0) }}
                >
                  {isLoading ? "—" : currentObs?.aqi}
                </span>
                <span className="text-xs font-bold text-foreground">
                  {currentObs?.category} Air Quality
                </span>
                <span className="text-[10px] font-mono text-foreground-muted mt-1">
                  Dominant: {currentObs?.category === "Good" ? "Clean Profile" : "PM2.5 Particulates"}
                </span>
              </div>

              <div className="sm:col-span-7 space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-foreground-muted">
                  Atmospheric & Particulate Breakdown
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-surface border border-border-subtle">
                    <span className="text-[11px] font-mono text-foreground-muted block">PM2.5 (Fine)</span>
                    <span className="text-sm font-bold font-mono text-foreground">{currentObs?.pm25 ?? 0} µg/m³</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface border border-border-subtle">
                    <span className="text-[11px] font-mono text-foreground-muted block">PM10 (Coarse)</span>
                    <span className="text-sm font-bold font-mono text-foreground">{currentObs?.pm10 ?? 0} µg/m³</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface border border-border-subtle">
                    <span className="text-[11px] font-mono text-foreground-muted block">NO2 (Nitrogen)</span>
                    <span className="text-sm font-bold font-mono text-foreground">{currentObs?.no2 ?? 0} µg/m³</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface border border-border-subtle">
                    <span className="text-[11px] font-mono text-foreground-muted block">O3 (Ozone)</span>
                    <span className="text-sm font-bold font-mono text-foreground">{currentObs?.o3 ?? 0} µg/m³</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-xs text-foreground-muted font-mono">
                  <span className="flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-primary" /> {currentObs?.temperature ?? 20}°C
                  </span>
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-sky-500" /> {currentObs?.humidity ?? 50}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-teal-500" /> {currentObs?.wind_speed ?? 0} km/h
                  </span>
                </div>
              </div>
            </div>

            {/* Status Footer */}
            <div className="pt-4 border-t border-border-subtle flex flex-wrap items-center justify-between text-xs font-mono text-foreground-muted">
              <span>Source: {currentObs?.source || "Copernicus CAMS"}</span>
              <span>Observed: {new Date(currentObs?.observed_at || Date.now()).toLocaleTimeString()}</span>
            </div>
          </Card>
        </div>

        {/* Gemini AI Environmental Guidance Card (Span 5) */}
        <div className="lg:col-span-5">
          <Card className="p-6 h-full flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Gemini Health Advisory</h3>
                </div>
                <Badge variant="cyan" size="sm">AI Grounded</Badge>
              </div>

              <p className="text-xs text-foreground-secondary leading-relaxed">
                {recommendations?.general_guidance ||
                  recommendations?.recommendations?.[0]?.description ||
                  "Air quality poses minimal risk for healthy individuals. Sensitive groups should monitor for prolonged outdoor exertion."}
              </p>

              {/* Action Recommendations Grid */}
              <div className="space-y-2 pt-2">
                <div className="p-3 rounded-lg bg-background-secondary border border-border-subtle flex items-start gap-2.5 text-xs">
                  <ShieldAlert className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">Outdoor Activity Advice:</span>
                    <span className="text-foreground-secondary">
                      {currentObs && currentObs.aqi > 150
                        ? "Substitute rigorous outdoor running with indoor cardiovascular routines."
                        : "Safe for general jogging and cycling; sensitive groups monitor symptoms."}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-background-secondary border border-border-subtle flex items-start gap-2.5 text-xs">
                  <Wind className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">Ventilation & Filtration:</span>
                    <span className="text-foreground-secondary">
                      {currentObs && currentObs.aqi > 100
                        ? "Keep windows sealed during afternoon peak haze. Run HEPA filtration if available."
                        : "Natural ventilation is safe. Windows can remain open for ambient airflow."}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle">
              <Link href="/assistant" className="w-full">
                <Button variant="secondary" size="sm" className="w-full text-xs">
                  <Bot className="w-3.5 h-3.5 mr-1 text-primary" />
                  Consult Gemini Pollution Assistant
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* 6. 24-HOUR TELEMETRY TIMELINE */}
      {history.length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">24-Hour Observation Trend</h3>
            </div>
            <span className="text-xs font-mono text-foreground-muted">
              {history.length} Hourly Samples Recorded
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2 pt-2">
            {history.slice(-12).map((pt, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-background-secondary border border-border-subtle text-center flex flex-col justify-between"
              >
                <span className="text-[10px] font-mono text-foreground-muted">
                  {new Date(pt.observed_at).getHours()}:00
                </span>
                <span
                  className="text-base font-extrabold font-mono my-1"
                  style={{ color: getAqiColor(pt.aqi ?? 0) }}
                >
                  {pt.aqi}
                </span>
                <span className="text-[9px] font-mono text-foreground-secondary truncate">
                  {pt.pm25} µg
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
      {/* 7. NEW ENVIRONMENTAL INTELLIGENCE MODULES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-surface border-border-subtle flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Home className="w-5 h-5" />
              </div>
              <Badge variant="good" size="sm">Smart Assessment</Badge>
            </div>
            <h3 className="font-bold text-base text-foreground">Indoor Air Quality</h3>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Diagnose ventilation deficits, cooking emissions, and mold hazards in bedrooms, kitchens, and offices. Receive personalized mitigation guidance powered by Gemini AI.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/indoor">
              <Button variant="primary" size="sm" className="w-full text-xs justify-between">
                <span>Assess Indoor Space</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6 bg-surface border-border-subtle flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Users className="w-5 h-5" />
              </div>
              <Badge variant="good" size="sm">Citizen Network</Badge>
            </div>
            <h3 className="font-bold text-base text-foreground">Community Insights</h3>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Explore citizen-reported localized pollution incidents, track verified industrial and waste-burning hotspots on the interactive map, and join collective clean-air action plans.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/community">
              <Button variant="primary" size="sm" className="w-full text-xs justify-between">
                <span>Explore Community Hotspots</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
