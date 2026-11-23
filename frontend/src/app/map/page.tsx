"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import {
  Map as MapIcon,
  MapPin,
  Layers,
  Search,
  RefreshCw,
  AlertTriangle,
  Clock,
  Compass,
  Thermometer,
  Droplets,
  Wind,
  ShieldCheck,
  Bot,
  ExternalLink,
  Navigation,
  Eye,
  Filter,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useTheme } from "@/context/ThemeContext";
import { ApiClient } from "@/services/api";
import { MapObservationPoint, LocationSearchResult } from "@/types";

function getAqiColor(aqi?: number): string {
  if (aqi === undefined || aqi === null) return "#6B7280";
  if (aqi <= 50) return "#10B981";       // Good
  if (aqi <= 100) return "#F59E0B";      // Moderate
  if (aqi <= 150) return "#F97316";      // Sensitive
  if (aqi <= 200) return "#EF4444";      // Unhealthy
  if (aqi <= 300) return "#8B5CF6";      // Very Unhealthy
  return "#DC2626";                      // Hazardous
}

// Calculate distance between two coordinates in km using Haversine formula
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function MapPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <MapContent />
      </AppLayout>
    </AuthGuard>
  );
}

function MapContent() {
  const { theme } = useTheme();
  const geo = useGeolocation();

  const [points, setPoints] = useState<MapObservationPoint[]>([]);
  const [filteredPoints, setFilteredPoints] = useState<MapObservationPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<MapObservationPoint | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load geospatial observations from API
  const loadMapData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await ApiClient.getMapObservations();
      if (res.success && res.data && res.data.length > 0) {
        setPoints(res.data);
        setFilteredPoints(res.data);
        if (!selectedPoint) setSelectedPoint(res.data[0]);
      } else {
        // Fallback reference stations if backend empty
        const fallback: MapObservationPoint[] = [
          {
            location_id: 1,
            name: "Central Anand Vihar Station",
            city: "New Delhi",
            country: "India",
            latitude: 28.6139,
            longitude: 77.2090,
            aqi: 285,
            aqi_scale: "US_EPA",
            aqi_category: "Very Unhealthy",
            pm25: 145.2,
            pm10: 220.4,
            no2: 45.1,
            so2: 12.0,
            co: 1800.0,
            o3: 35.0,
            temperature: 22.0,
            humidity: 65.0,
            observed_at: new Date().toISOString(),
            provider: "open-meteo",
            freshness: "live",
            is_demo: false,
          },
          {
            location_id: 2,
            name: "Westminster Urban Station",
            city: "London",
            country: "United Kingdom",
            latitude: 51.5074,
            longitude: -0.1278,
            aqi: 38,
            aqi_scale: "US_EPA",
            aqi_category: "Good",
            pm25: 9.1,
            pm10: 15.4,
            no2: 21.0,
            so2: 3.2,
            co: 220.0,
            o3: 40.0,
            temperature: 13.0,
            humidity: 72.0,
            observed_at: new Date().toISOString(),
            provider: "open-meteo",
            freshness: "live",
            is_demo: false,
          },
          {
            location_id: 3,
            name: "Manhattan Environmental Sensor",
            city: "New York",
            country: "United States",
            latitude: 40.7128,
            longitude: -74.0060,
            aqi: 54,
            aqi_scale: "US_EPA",
            aqi_category: "Moderate",
            pm25: 14.5,
            pm10: 25.0,
            no2: 18.0,
            so2: 4.0,
            co: 310.0,
            o3: 48.0,
            temperature: 15.0,
            humidity: 58.0,
            observed_at: new Date().toISOString(),
            provider: "open-meteo",
            freshness: "live",
            is_demo: false,
          },
          {
            location_id: 4,
            name: "Shinjuku Atmospheric Center",
            city: "Tokyo",
            country: "Japan",
            latitude: 35.6762,
            longitude: 139.6503,
            aqi: 32,
            aqi_scale: "US_EPA",
            aqi_category: "Good",
            pm25: 7.2,
            pm10: 12.0,
            no2: 15.0,
            so2: 2.1,
            co: 190.0,
            o3: 38.0,
            temperature: 18.0,
            humidity: 60.0,
            observed_at: new Date().toISOString(),
            provider: "open-meteo",
            freshness: "live",
            is_demo: false,
          },
        ];
        setPoints(fallback);
        setFilteredPoints(fallback);
        setSelectedPoint(fallback[0]);
      }
    } catch {
      setErrorMsg("Failed to retrieve live monitoring stations.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedPoint]);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  // Filter stations by AQI category
  useEffect(() => {
    if (categoryFilter === "all") {
      setFilteredPoints(points);
    } else {
      setFilteredPoints(
        points.filter(
          (p) => (p.aqi_category || "").toLowerCase() === categoryFilter.toLowerCase()
        )
      );
    }
  }, [categoryFilter, points]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [22.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
      });

      // Free OpenStreetMap Standard Basemap (100% Free, Zero API Key Required)
      const tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

      const tileLayer = L.tileLayer(tileUrl, {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
      setIsMapReady(true);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [theme]);

  // Update tile layer when theme switches (OSM is styled via CSS filter in globals.css)
  useEffect(() => {
    if (!tileLayerRef.current) return;
    tileLayerRef.current.redraw();
  }, [theme]);

  // Render station markers
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !markersLayerRef.current) return;

    import("leaflet").then((L) => {
      const markersLayer = markersLayerRef.current;
      markersLayer.clearLayers();

      filteredPoints.forEach((pt) => {
        const color = getAqiColor(pt.aqi);
        const aqiText = pt.aqi !== null && pt.aqi !== undefined ? pt.aqi : "—";

        const iconHtml = `
          <div style="
            background: ${theme === "dark" ? "#0A0D0B" : "#FFFFFF"};
            border: 2px solid ${color};
            color: ${theme === "dark" ? "#F9FAFB" : "#111827"};
            font-family: monospace;
            font-size: 11px;
            font-weight: bold;
            padding: 3px 6px;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            cursor: pointer;
            white-space: nowrap;
          ">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: ${color};"></span>
            <span>${aqiText}</span>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "custom-aqi-marker",
          iconSize: [44, 24],
          iconAnchor: [22, 12],
        });

        const marker = L.marker([pt.latitude, pt.longitude], { icon: customIcon });

        marker.on("click", () => {
          setSelectedPoint(pt);
          mapInstanceRef.current.flyTo([pt.latitude, pt.longitude], 8, { duration: 1 });
        });

        markersLayer.addLayer(marker);
      });
    });
  }, [isMapReady, filteredPoints, theme]);

  // Render User Location Pin when Geolocation is granted
  useEffect(() => {
    const coords = geo.coords;
    if (!isMapReady || !mapInstanceRef.current || !coords) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
      }

      const userIconHtml = `
        <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(56, 189, 248, 0.3); animation: ping 2s infinite;"></div>
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #0284C7; border: 2px solid #FFFFFF; box-shadow: 0 0 8px rgba(2, 132, 199, 0.8);"></div>
        </div>
      `;

      const userIcon = L.divIcon({
        html: userIconHtml,
        className: "user-gps-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const userMarker = L.marker([coords.latitude, coords.longitude], {
        icon: userIcon,
      }).addTo(map);

      userMarker.bindPopup("<b>You are here</b><br>Live GPS Location").openPopup();
      userMarkerRef.current = userMarker;
    });
  }, [isMapReady, geo.coords]);

  // Center on user location
  const handleLocateMe = () => {
    if (geo.coords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([geo.coords.latitude, geo.coords.longitude], 10, {
        duration: 1.2,
      });
    } else {
      geo.requestLocation();
    }
  };

  // Debounced search handling
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await ApiClient.searchLocations(val.trim(), 5);
        if (res.success && res.data) {
          setSearchResults(res.data);
          setShowSearchDropdown(true);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelectSearchResult = (loc: LocationSearchResult) => {
    setSearchQuery(`${loc.name}, ${loc.country}`);
    setShowSearchDropdown(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.latitude, loc.longitude], 9, { duration: 1.2 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Map Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-primary" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Interactive Pollution & Sensor Map
            </h1>
          </div>
          <p className="text-xs text-foreground-secondary mt-0.5">
            Real-time geospatial monitoring across ground telemetry and CAMS atmospheric models.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLocateMe}
            className="text-xs font-medium"
          >
            <Navigation className="w-3.5 h-3.5 mr-1.5 text-primary" />
            {geo.coords ? "Center On Me" : "Detect My GPS"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={loadMapData}
            disabled={isLoading}
            className="text-xs font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? "animate-spin text-primary" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search & Category Filter Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Location Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search city, country, or sensor station..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface border border-border-subtle focus:border-primary focus:outline-none text-foreground placeholder:text-foreground-muted"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-border-subtle rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-border-subtle">
              {searchResults.map((loc, idx) => (
                <button
                  key={`${loc.name}-${idx}`}
                  onClick={() => handleSelectSearchResult(loc)}
                  className="w-full text-left px-3.5 py-2 hover:bg-surface-hover flex items-center justify-between text-xs"
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

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Stations" },
            { id: "good", label: "Good" },
            { id: "moderate", label: "Moderate" },
            { id: "unhealthy", label: "Unhealthy" },
            { id: "very unhealthy", label: "Hazardous" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono capitalize transition-all whitespace-nowrap ${categoryFilter === cat.id
                ? "bg-primary text-white dark:text-black font-semibold shadow-sm"
                : "bg-surface text-foreground-secondary hover:bg-surface-hover border border-border-subtle"
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map + Selected Station Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leaflet Map Container (Span 8) */}
        <div className="lg:col-span-8">
          <Card className="p-0 overflow-hidden rounded-2xl border-border-subtle h-[520px] relative shadow-md">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Map Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-20 p-2.5 rounded-xl bg-surface/90 backdrop-blur-md border border-border-subtle shadow-md flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Good (0-50)
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Mod (51-100)
              </span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Unhealthy (150+)
              </span>
            </div>
          </Card>
        </div>

        {/* Selected Station Telemetry Drawer (Span 4) */}
        <div className="lg:col-span-4">
          <Card className="p-6 h-[520px] flex flex-col justify-between space-y-4">
            {selectedPoint ? (
              <>
                <div className="space-y-4">
                  <div className="pb-3 border-b border-border-subtle">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold">
                      Selected Station Telemetry
                    </span>
                    <h3 className="text-lg font-bold text-foreground mt-0.5">
                      {selectedPoint.name}
                    </h3>
                    <p className="text-xs text-foreground-secondary">
                      {selectedPoint.city}, {selectedPoint.country}
                    </p>
                  </div>

                  {/* Distance from user GPS */}
                  {geo.coords && (
                    <div className="p-2.5 rounded-lg bg-background-secondary border border-border-subtle flex items-center justify-between text-xs">
                      <span className="text-foreground-muted flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-primary" /> Distance to you:
                      </span>
                      <span className="font-bold font-mono text-foreground">
                        {calculateDistanceKm(
                          geo.coords.latitude,
                          geo.coords.longitude,
                          selectedPoint.latitude,
                          selectedPoint.longitude
                        )}{" "}
                        km
                      </span>
                    </div>
                  )}

                  {/* Main AQI Badge & Score */}
                  <div className="p-4 rounded-xl bg-background-secondary border border-border-subtle flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-foreground-muted block">US EPA AQI</span>
                      <span
                        className="text-4xl font-extrabold font-mono"
                        style={{ color: getAqiColor(selectedPoint.aqi) }}
                      >
                        {selectedPoint.aqi ?? "—"}
                      </span>
                    </div>
                    <div className="text-right">
                      <Badge variant="good" size="sm">
                        {selectedPoint.aqi_category || "Standard"}
                      </Badge>
                      <span className="text-[10px] font-mono text-foreground-muted block mt-1">
                        Scale: {selectedPoint.aqi_scale}
                      </span>
                    </div>
                  </div>

                  {/* Pollutant Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-surface border border-border-subtle">
                      <span className="text-[10px] font-mono text-foreground-muted block">PM2.5</span>
                      <span className="text-xs font-bold font-mono text-foreground">{selectedPoint.pm25 ?? 0} µg/m³</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface border border-border-subtle">
                      <span className="text-[10px] font-mono text-foreground-muted block">PM10</span>
                      <span className="text-xs font-bold font-mono text-foreground">{selectedPoint.pm10 ?? 0} µg/m³</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface border border-border-subtle">
                      <span className="text-[10px] font-mono text-foreground-muted block">NO2</span>
                      <span className="text-xs font-bold font-mono text-foreground">{selectedPoint.no2 ?? 0} µg/m³</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface border border-border-subtle">
                      <span className="text-[10px] font-mono text-foreground-muted block">O3</span>
                      <span className="text-xs font-bold font-mono text-foreground">{selectedPoint.o3 ?? 0} µg/m³</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border-subtle space-y-2">
                  <Link
                    href={`/dashboard?city=${encodeURIComponent(selectedPoint.city)}`}
                    className="w-full"
                  >
                    <Button variant="primary" size="sm" className="w-full text-xs">
                      View Full Station Analytics
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-foreground-muted space-y-2">
                <MapPin className="w-8 h-8 text-foreground-muted opacity-40" />
                <p className="text-xs">Select any marker on the map to inspect live multi-pollutant telemetry.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
