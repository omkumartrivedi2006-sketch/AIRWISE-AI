"use client";

import React, { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import {
  Users,
  MapPin,
  AlertTriangle,
  Flame,
  Factory,
  Car,
  Wind,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Layers,
  Send,
  Building2,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/context/ThemeContext";
import { ApiClient } from "@/services/api";
import {
  CommunityOverviewStats,
  CommunityReport,
  CommunityReportCreatePayload,
  CommunityAIInsights,
} from "@/types";

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  industrial_smoke: { label: "Industrial Smoke", icon: Factory, color: "#9333EA" },
  open_waste_burning: { label: "Open Waste Burning", icon: Flame, color: "#EF4444" },
  construction_dust: { label: "Construction Dust", icon: Building2, color: "#F59E0B" },
  vehicle_emissions: { label: "Vehicle Emissions", icon: Car, color: "#3B82F6" },
  road_dust: { label: "Road Dust", icon: Wind, color: "#EAB308" },
  garbage_burning: { label: "Garbage Burning", icon: Flame, color: "#DC2626" },
  unusual_odor: { label: "Unusual Odor", icon: AlertTriangle, color: "#EC4899" },
  other: { label: "Other Concern", icon: AlertTriangle, color: "#6B7280" },
};

export default function CommunityPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <CommunityContent />
      </AppLayout>
    </AuthGuard>
  );
}

function CommunityContent() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<"map" | "feed" | "my_reports" | "admin">("map");
  const [overview, setOverview] = useState<CommunityOverviewStats | null>(null);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [myReports, setMyReports] = useState<CommunityReport[]>([]);
  const [aiInsights, setAiInsights] = useState<CommunityAIInsights | null>(null);
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Reporting Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  const [reportForm, setReportForm] = useState<CommunityReportCreatePayload>({
    category: "open_waste_burning",
    title: "",
    description: "",
    location_name: "",
    latitude: 23.0225,
    longitude: 72.5714,
    severity: "moderate",
    image_url: "",
  });

  // Admin Moderation State
  const [moderationNotes, setModerationNotes] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Leaflet Map References
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ovRes, repRes, myRes, aiRes] = await Promise.all([
        ApiClient.getCommunityOverview(),
        ApiClient.getCommunityReports({ category: categoryFilter, status: statusFilter }),
        ApiClient.getMyCommunityReports(),
        ApiClient.getCommunityAiInsights(),
      ]);

      if (ovRes.success && ovRes.data) setOverview(ovRes.data);
      if (repRes.success && repRes.data) setReports(repRes.data);
      if (myRes.success && myRes.data) setMyReports(myRes.data);
      if (aiRes.success && aiRes.data) setAiInsights(aiRes.data);
    } catch (err) {
      console.error("Failed to load community intelligence:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, statusFilter]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

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

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

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

  // Render Map Markers
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !markersLayerRef.current) return;

    import("leaflet").then((L) => {
      const markersLayer = markersLayerRef.current;
      markersLayer.clearLayers();

      // 1. Render Official Monitoring Stations (Cyan Badge)
      if (overview?.nearby_stations) {
        overview.nearby_stations.forEach((stn) => {
          const stnIconHtml = `
            <div style="
              background: #0D9488;
              color: #FFFFFF;
              font-size: 10px;
              font-weight: 700;
              padding: 2px 6px;
              border-radius: 12px;
              border: 1.5px solid #FFFFFF;
              display: flex;
              align-items: center;
              gap: 3px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              cursor: pointer;
            ">
              <span>🏛️</span>
              <span>${stn.city || stn.name}</span>
            </div>
          `;
          const customIcon = L.divIcon({
            html: stnIconHtml,
            className: "official-station-marker",
            iconSize: [60, 24],
            iconAnchor: [30, 12],
          });
          const marker = L.marker([stn.latitude, stn.longitude], { icon: customIcon });
          marker.bindPopup(`<b>Official Station</b><br/>${stn.name}<br/>Code: ${stn.station_code}`);
          markersLayer.addLayer(marker);
        });
      }

      // 2. Render Citizen Reports (Category-colored Pin)
      reports.forEach((rep) => {
        const meta = CATEGORY_META[rep.category] || CATEGORY_META.other;
        const pinHtml = `
          <div style="
            background: ${meta.color};
            color: #FFFFFF;
            font-size: 10px;
            font-weight: bold;
            padding: 3px 6px;
            border-radius: 8px;
            border: 1.5px solid #FFFFFF;
            display: flex;
            align-items: center;
            gap: 3px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            cursor: pointer;
          ">
            <span>⚠️</span>
            <span>${meta.label}</span>
          </div>
        `;

        const pinIcon = L.divIcon({
          html: pinHtml,
          className: "community-report-pin",
          iconSize: [80, 24],
          iconAnchor: [40, 12],
        });

        const marker = L.marker([rep.latitude, rep.longitude], { icon: pinIcon });
        marker.on("click", () => {
          setSelectedReport(rep);
        });
        markersLayer.addLayer(marker);
      });
    });
  }, [isMapReady, reports, overview, theme]);

  // Geolocation detector for form
  const handleDetectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setReportForm((prev) => ({
            ...prev,
            latitude: parseFloat(pos.coords.latitude.toFixed(4)),
            longitude: parseFloat(pos.coords.longitude.toFixed(4)),
            location_name: prev.location_name || "Detected Device GPS",
          }));
        },
        (err) => {
          console.warn("Geolocation denied:", err.message);
        }
      );
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await ApiClient.submitCommunityReport(reportForm);
      if (res.success && res.data) {
        setSubmissionSuccess(res.data.reference_id);
        setReports((prev) => [res.data, ...prev]);
        setMyReports((prev) => [res.data, ...prev]);
        setReportForm({
          category: "open_waste_burning",
          title: "",
          description: "",
          location_name: "",
          latitude: 23.0225,
          longitude: 72.5714,
          severity: "moderate",
          image_url: "",
        });
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (reportId: number, status: string) => {
    setUpdatingId(reportId);
    try {
      const res = await ApiClient.updateCommunityReportStatus(reportId, {
        status,
        moderation_notes: moderationNotes,
      });
      if (res.success && res.data) {
        setReports((prev) => prev.map((r) => (r.id === reportId ? res.data : r)));
        if (selectedReport?.id === reportId) setSelectedReport(res.data);
        setModerationNotes("");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Community Insights
            </h1>
          </div>
          <p className="text-sm text-foreground-secondary mt-1 max-w-2xl">
            Empowering citizens to report localized pollution incidents, track environmental hotspots, and collaborate on collective clean-air initiatives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowModal(true);
              setSubmissionSuccess(null);
            }}
            className="gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Report Pollution Incident
          </Button>
        </div>
      </div>

      {/* SECTION 1: Community Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-surface border-border-subtle">
          <span className="text-[11px] text-foreground-muted font-semibold uppercase tracking-wider">
            Total Observations
          </span>
          <p className="text-2xl font-black text-foreground mt-1">
            {overview?.total_reports ?? 0}
          </p>
          <span className="text-[10px] text-foreground-secondary mt-1 block">
            Submitted by citizens
          </span>
        </Card>

        <Card className="p-4 bg-surface border-border-subtle">
          <span className="text-[11px] text-foreground-muted font-semibold uppercase tracking-wider">
            Verified Hotspots
          </span>
          <p className="text-2xl font-black text-emerald-500 mt-1">
            {overview?.verified_reports ?? 0}
          </p>
          <span className="text-[10px] text-foreground-secondary mt-1 block">
            Moderated & authenticated
          </span>
        </Card>

        <Card className="p-4 bg-surface border-border-subtle">
          <span className="text-[11px] text-foreground-muted font-semibold uppercase tracking-wider">
            Under Review
          </span>
          <p className="text-2xl font-black text-amber-500 mt-1">
            {overview?.under_review ?? 0}
          </p>
          <span className="text-[10px] text-foreground-secondary mt-1 block">
            Awaiting verification
          </span>
        </Card>

        <Card className="p-4 bg-surface border-border-subtle">
          <span className="text-[11px] text-foreground-muted font-semibold uppercase tracking-wider">
            Resolved Incidents
          </span>
          <p className="text-2xl font-black text-primary mt-1">
            {overview?.resolved_reports ?? 0}
          </p>
          <span className="text-[10px] text-foreground-secondary mt-1 block">
            Addressed by authorities
          </span>
        </Card>
      </div>

      {/* Transparency Banner: Clear separation between Official, Citizen, and AI */}
      <div className="p-3 rounded-lg bg-surface-subtle border border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="good" size="sm">1. Official Stations</Badge>
          <span className="text-foreground-secondary text-[11px]">CPCB / State Pollution Boards</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="moderate" size="sm">2. Community Reports</Badge>
          <span className="text-foreground-secondary text-[11px]">Citizen observations (Privacy protected)</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="poor" size="sm">3. AI Insights</Badge>
          <span className="text-foreground-secondary text-[11px]">Gemini trend synthesis</span>
        </div>
      </div>

      {/* SECTION 2: Tabs (Map / Feed / My Reports / Admin Moderation) */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("map")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "map"
                ? "bg-primary text-white dark:text-black shadow-sm"
                : "text-foreground-secondary hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            Interactive Hotspot Map
          </button>
          <button
            onClick={() => setActiveTab("feed")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "feed"
                ? "bg-primary text-white dark:text-black shadow-sm"
                : "text-foreground-secondary hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            Recent Incident Feed
          </button>
          <button
            onClick={() => setActiveTab("my_reports")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "my_reports"
                ? "bg-primary text-white dark:text-black shadow-sm"
                : "text-foreground-secondary hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            My Reports ({myReports.length})
          </button>
          {user?.role === "ADMIN" && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "admin"
                  ? "bg-red-500 text-white shadow-sm"
                  : "text-red-400 hover:text-red-300 hover:bg-red-500/10"
              }`}
            >
              Admin Moderation
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="hidden sm:flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
          >
            <option value="all" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">All Categories</option>
            <option value="open_waste_burning" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Open Waste Burning</option>
            <option value="industrial_smoke" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Industrial Smoke</option>
            <option value="construction_dust" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Construction Dust</option>
            <option value="vehicle_emissions" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Vehicle Emissions</option>
            <option value="garbage_burning" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Garbage Burning</option>
            <option value="unusual_odor" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Unusual Odor</option>
          </select>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE MAP */}
      {activeTab === "map" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 relative">
            <Card className="overflow-hidden border-border-subtle p-0 h-[480px]">
              <div ref={mapContainerRef} className="w-full h-full z-10" />
            </Card>
            <div className="absolute top-3 right-3 z-20 bg-surface/90 backdrop-blur-sm border border-border-subtle rounded-lg px-2.5 py-1 text-[11px] text-foreground-secondary shadow-md">
              <span>📍 Coordinates rounded to ~1.1km for domestic privacy</span>
            </div>
          </div>

          {/* Selected Report Detail Card */}
          <Card className="p-5 bg-surface border-border-subtle flex flex-col justify-between">
            {selectedReport ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" size="sm">
                      {selectedReport.reference_id}
                    </Badge>
                    <Badge
                      size="sm"
                      variant={
                        selectedReport.status === "VERIFIED"
                          ? "good"
                          : selectedReport.status === "RESOLVED"
                          ? "good"
                          : selectedReport.status === "REJECTED"
                          ? "hazardous"
                          : "moderate"
                      }
                    >
                      {selectedReport.status}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-foreground-muted">
                    {new Date(selectedReport.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                    {selectedReport.category.replace("_", " ")}
                  </span>
                  <h3 className="text-base font-bold text-foreground mt-0.5">
                    {selectedReport.title}
                  </h3>
                  <p className="text-xs text-foreground-secondary mt-2 leading-relaxed">
                    {selectedReport.description}
                  </p>
                </div>

                <div className="p-3 rounded bg-surface-subtle border border-border-subtle space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Reported Area:</span>
                    <span className="font-semibold text-foreground">{selectedReport.location_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Severity:</span>
                    <span className="font-semibold text-foreground capitalize">{selectedReport.severity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Reporter:</span>
                    <span className="text-foreground">{selectedReport.user_name}</span>
                  </div>
                </div>

                {selectedReport.image_url && (
                  <div>
                    <span className="text-[10px] text-foreground-muted block mb-1">Attached Photo:</span>
                    <img
                      src={selectedReport.image_url}
                      alt="Incident proof"
                      className="w-full h-32 object-cover rounded-lg border border-border-subtle"
                    />
                  </div>
                )}

                {selectedReport.moderation_notes && (
                  <div className="p-2.5 rounded bg-surface-subtle/80 border border-primary/20 text-xs">
                    <span className="font-bold text-primary block text-[10px] uppercase">
                      Official Action / Moderation Note:
                    </span>
                    <p className="text-foreground-secondary text-[11px] mt-0.5">
                      {selectedReport.moderation_notes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center space-y-2">
                <MapPin className="w-8 h-8 text-foreground-muted mx-auto" />
                <h4 className="text-xs font-semibold text-foreground">Select a Pin on the Map</h4>
                <p className="text-[11px] text-foreground-secondary max-w-xs mx-auto">
                  Click any citizen observation pin on the left to inspect incident photos, details, and verification status.
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-border-subtle text-[11px] text-foreground-muted flex justify-between">
              <span>AIRWISE Citizen Watch</span>
              <span>100% Verified Community Moderation</span>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: INCIDENT FEED */}
      {activeTab === "feed" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((r) => {
            const meta = CATEGORY_META[r.category] || CATEGORY_META.other;
            const Icon = meta.icon;
            return (
              <Card key={r.id} className="p-4 bg-surface border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">{meta.label}</span>
                  </div>
                  <Badge
                    size="sm"
                    variant={
                      r.status === "VERIFIED"
                        ? "good"
                        : r.status === "RESOLVED"
                        ? "good"
                        : r.status === "REJECTED"
                        ? "hazardous"
                        : "moderate"
                    }
                  >
                    {r.status}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-foreground line-clamp-1">{r.title}</h4>
                  <p className="text-xs text-foreground-secondary mt-1 line-clamp-2 leading-relaxed">
                    {r.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-foreground-muted">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-primary" />
                    {r.location_name}
                  </span>
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 3: MY REPORTS */}
      {activeTab === "my_reports" && (
        <Card className="p-5 bg-surface border-border-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              My Submitted Pollution Observations
            </h3>
            <span className="text-xs text-foreground-muted">{myReports.length} Total</span>
          </div>

          {myReports.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-foreground-muted mx-auto" />
              <p className="text-xs text-foreground-secondary">
                You haven&apos;t reported any pollution incidents yet.
              </p>
              <Button size="sm" variant="primary" onClick={() => setShowModal(true)}>
                Submit Your First Observation
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-foreground-secondary">
                <thead>
                  <tr className="border-b border-border-subtle text-[11px] text-foreground-muted uppercase tracking-wider">
                    <th className="py-2.5 px-3">Tracking ID</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {myReports.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-hover/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">
                        {item.reference_id}
                      </td>
                      <td className="py-2.5 px-3 capitalize">
                        {item.category.replace("_", " ")}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        {item.title}
                      </td>
                      <td className="py-2.5 px-3">{item.location_name}</td>
                      <td className="py-2.5 px-3">
                        <Badge
                          size="sm"
                          variant={
                            item.status === "VERIFIED"
                              ? "good"
                              : item.status === "RESOLVED"
                              ? "good"
                              : item.status === "REJECTED"
                              ? "hazardous"
                              : "moderate"
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-foreground-muted">
                        {item.moderation_notes || "Under review by community team"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: ADMIN MODERATION PANEL */}
      {activeTab === "admin" && user?.role === "ADMIN" && (
        <Card className="p-5 bg-surface border-red-500/30 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Community Reports Moderation Queue
            </h3>
            <Badge variant="outline" size="sm">Admin Role Only</Badge>
          </div>

          <div className="space-y-4">
            {reports.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-lg bg-surface-subtle border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-primary">{r.reference_id}</span>
                    <Badge size="sm">{r.status}</Badge>
                    <span className="text-xs font-semibold text-foreground">{r.title}</span>
                  </div>
                  <p className="text-xs text-foreground-secondary">{r.description}</p>
                  <span className="text-[11px] text-foreground-muted block">
                    {r.location_name} • Reported by {r.user_name}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(r.id, "VERIFIED")}
                    disabled={updatingId === r.id}
                    className="text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10 text-xs h-8"
                  >
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(r.id, "RESOLVED")}
                    disabled={updatingId === r.id}
                    className="text-primary border-primary/30 hover:bg-primary/10 text-xs h-8"
                  >
                    Resolve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(r.id, "REJECTED")}
                    disabled={updatingId === r.id}
                    className="text-red-400 border-red-400/30 hover:bg-red-400/10 text-xs h-8"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* SECTION 3: Gemini AI Community Insights Synthesis */}
      <Card className="p-6 bg-surface border-border-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Gemini AI Community Trend Synthesis
              </h3>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Automated aggregate analysis of reported pollution patterns and collective clean-air action plans.
              </p>
            </div>
          </div>
          <Badge variant="good" size="sm">
            AI Synthesis
          </Badge>
        </div>

        {aiInsights ? (
          <div className="space-y-4">
            <p className="text-xs text-foreground leading-relaxed">
              {aiInsights.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-lg bg-surface-subtle border border-border-subtle space-y-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Identified Local Hotspots
                </h4>
                <ul className="space-y-1 text-xs text-foreground-secondary">
                  {aiInsights.identified_hotspots.map((h, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-subtle border border-border-subtle space-y-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  Collective Clean-Air Initiatives
                </h4>
                <ul className="space-y-1 text-xs text-foreground-secondary">
                  {aiInsights.community_actions.map((act, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="text-primary font-bold">✓</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-[10px] text-foreground-muted italic pt-1">
              * {aiInsights.disclaimer}
            </p>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-foreground-secondary">
            Loading Gemini community synthesis...
          </div>
        )}
      </Card>

      {/* REPORT SUBMISSION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="max-w-lg w-full p-6 bg-surface border-border-subtle shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary" />
                Report Pollution Incident
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-xs text-foreground-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {submissionSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-foreground">
                  Incident Submitted Successfully!
                </h4>
                <p className="text-xs text-foreground-secondary">
                  Your observation has been assigned the tracking reference:
                </p>
                <div className="p-2.5 rounded bg-surface-subtle border border-primary/30 inline-block font-mono font-bold text-primary text-sm">
                  {submissionSuccess}
                </div>
                <p className="text-[11px] text-foreground-muted max-w-xs mx-auto">
                  You can track the verification progress anytime under the &ldquo;My Reports&rdquo; tab.
                </p>
                <Button size="sm" variant="primary" onClick={() => setShowModal(false)}>
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Pollution Category</label>
                  <select
                    value={reportForm.category}
                    onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
                  >
                    <option value="open_waste_burning" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Open Waste Burning</option>
                    <option value="industrial_smoke" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Industrial Smoke</option>
                    <option value="construction_dust" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Construction Dust</option>
                    <option value="vehicle_emissions" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Vehicle Emissions</option>
                    <option value="road_dust" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Road Dust</option>
                    <option value="garbage_burning" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Garbage Burning</option>
                    <option value="unusual_odor" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Unusual Smoke or Odor</option>
                    <option value="other" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Other Concern</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Short Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Heavy tire burning near ring road flyover"
                    value={reportForm.title}
                    onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide details about smoke density, smell, duration, or active works..."
                    value={reportForm.description}
                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Location Name / Area</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SG Highway, Bodakdev"
                      value={reportForm.location_name}
                      onChange={(e) => setReportForm({ ...reportForm, location_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Severity Level</label>
                    <select
                      value={reportForm.severity}
                      onChange={(e) =>
                        setReportForm({ ...reportForm, severity: e.target.value as any })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
                    >
                      <option value="minor" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Minor (Low smoke / localized)</option>
                      <option value="moderate" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Moderate (Noticeable haze)</option>
                      <option value="severe" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Severe (Dense acrid smoke)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">Approximate Coordinates</label>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" /> Use Device Location
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      value={reportForm.latitude}
                      onChange={(e) =>
                        setReportForm({ ...reportForm, latitude: parseFloat(e.target.value) || 0 })
                      }
                      className="px-3 py-1.5 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      value={reportForm.longitude}
                      onChange={(e) =>
                        setReportForm({ ...reportForm, longitude: parseFloat(e.target.value) || 0 })
                      }
                      className="px-3 py-1.5 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Optional Photo URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={reportForm.image_url}
                    onChange={(e) => setReportForm({ ...reportForm, image_url: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Incident"}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
