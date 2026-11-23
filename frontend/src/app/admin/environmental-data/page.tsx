"use client";

import React, { useEffect, useState } from "react";
import {
  Wind,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Eye,
  ShieldCheck,
  Flag,
} from "lucide-react";
import { ApiClient } from "@/services/api";
import { AdminObservation } from "@/types";

export default function AdminEnvironmentalDataPage() {
  const [observations, setObservations] = useState<AdminObservation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewStatusFilter, setReviewStatusFilter] = useState("");
  const [flaggedFilter, setFlaggedFilter] = useState<string>("");
  const [demoFilter, setDemoFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Review modal
  const [selectedObs, setSelectedObs] = useState<AdminObservation | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"verified" | "flagged" | "rejected">("verified");
  const [reviewReason, setReviewReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadObservations(targetPage = page) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiClient.getAdminEnvironmentalData({
        query: searchQuery || undefined,
        review_status: reviewStatusFilter || undefined,
        is_flagged: flaggedFilter === "" ? undefined : flaggedFilter === "true",
        is_demo: demoFilter === "" ? undefined : demoFilter === "true",
        page: targetPage,
        limit: 15,
      });
      if (res.success && res.data) {
        setObservations(res.data);
        if (res.meta) {
          setTotal(res.meta.total || 0);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load environmental observations");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadObservations(1);
  }, [reviewStatusFilter, flaggedFilter, demoFilter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadObservations(1);
  }

  async function handleConfirmReview() {
    if (!selectedObs || !reviewReason.trim()) return;
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await ApiClient.reviewAdminObservation(selectedObs.id, reviewStatus, reviewReason);
      if (res.success) {
        setSuccessMessage(`Observation #${selectedObs.id} marked as '${reviewStatus}' successfully`);
        setSelectedObs(null);
        setReviewReason("");
        loadObservations(page);
      }
    } catch (err: any) {
      setError(err.message || "Failed to record observation review");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">Environmental Data Management</h1>
          <p className="text-xs text-[#A5B0BC] mt-1">
            Audit physical telemetry, review sensor anomalies, and record data-quality determinations without modifying source readings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadObservations(page)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-[#A5B0BC] hover:text-white border border-white/5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white text-xs">Dismiss</button>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-[#10151B] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#A5B0BC]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by city or country..."
            className="w-full bg-[#141B23] border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-[#F5F7FA] placeholder-[#A5B0BC] focus:outline-none focus:border-[#28C7F5]"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={reviewStatusFilter}
            onChange={(e) => setReviewStatusFilter(e.target.value)}
            className="bg-[#141B23] border border-white/5 rounded-xl px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
          >
            <option value="">All Review Statuses</option>
            <option value="unreviewed">Unreviewed</option>
            <option value="verified">Verified Clean</option>
            <option value="flagged">Flagged Anomaly</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={flaggedFilter}
            onChange={(e) => setFlaggedFilter(e.target.value)}
            className="bg-[#141B23] border border-white/5 rounded-xl px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
          >
            <option value="">All Flags</option>
            <option value="true">Flagged Only</option>
            <option value="false">Non-Flagged</option>
          </select>

          <select
            value={demoFilter}
            onChange={(e) => setDemoFilter(e.target.value)}
            className="bg-[#141B23] border border-white/5 rounded-xl px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
          >
            <option value="">All Data Types</option>
            <option value="false">Live Sensor Feeds</option>
            <option value="true">Demo Records</option>
          </select>
        </div>
      </div>

      {/* Observations Table */}
      <div className="bg-[#10151B] border border-white/5 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#A5B0BC]">
            <div className="w-6 h-6 border-2 border-[#28C7F5] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading observations...
          </div>
        ) : observations.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#A5B0BC]">
            No pollution observations found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-[#A5B0BC] border-b border-white/5 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Observation / Location</th>
                  <th className="py-3 px-4">AQI (Scale)</th>
                  <th className="py-3 px-4">PM2.5 / PM10</th>
                  <th className="py-3 px-4">Provider / Source</th>
                  <th className="py-3 px-4">Observed Time</th>
                  <th className="py-3 px-4">Quality Status</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {observations.map((obs) => (
                  <tr key={obs.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#F5F7FA]">
                        {obs.city || "Coordinates Station"}
                        {obs.country ? `, ${obs.country}` : ""}
                      </div>
                      <div className="text-[10px] text-[#A5B0BC]">ID: #{obs.id} · Loc #{obs.location_id}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-sm text-[#F5F7FA]">{obs.aqi ?? "—"}</span>
                      <span className="text-[10px] text-[#A5B0BC] ml-1">({obs.aqi_scale})</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#F5F7FA]">
                      <div>PM2.5: <span className="font-medium">{obs.pm25 !== null ? `${obs.pm25} µg/m³` : "—"}</span></div>
                      <div className="text-[11px] text-[#A5B0BC]">PM10: {obs.pm10 !== null ? `${obs.pm10} µg/m³` : "—"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] text-[#A5B0BC] font-mono">
                        {obs.provider || "sensor"}
                      </span>
                      {obs.is_demo && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-semibold">
                          DEMO
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#A5B0BC] text-[11px]">
                      {new Date(obs.observed_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            obs.review_status === "verified"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : obs.review_status === "flagged"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : obs.review_status === "rejected"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-white/[0.04] text-[#A5B0BC]"
                          }`}
                        >
                          {obs.review_status}
                        </span>
                        {obs.is_flagged && <Flag className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />}
                      </div>
                      {obs.review_notes && (
                        <p className="text-[10px] text-[#A5B0BC] mt-0.5 max-w-xs truncate" title={obs.review_notes}>
                          {obs.review_notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedObs(obs);
                          setReviewStatus(
                            obs.review_status === "flagged" ? "verified" : "flagged"
                          );
                          setReviewReason(obs.review_notes || "");
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-[#28C7F5] border border-white/5 text-[11px] font-medium"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedObs && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#10151B] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#28C7F5]/10 border border-[#28C7F5]/20 flex items-center justify-center text-[#28C7F5]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F7FA]">Data Quality Determination</h3>
                <p className="text-xs text-[#A5B0BC]">
                  Observation #{selectedObs.id} · {selectedObs.city || "Unknown Location"}
                </p>
              </div>
            </div>

            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#A5B0BC]">Recorded Telemetry:</span>
                <span className="text-[#F5F7FA] font-medium">AQI {selectedObs.aqi} · PM2.5: {selectedObs.pm25} µg/m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A5B0BC]">Data Provenance:</span>
                <span className="text-[#F5F7FA]">{selectedObs.provider || "Station Sensor"}</span>
              </div>
              <p className="text-[10px] text-[#38E0B4] pt-1">
                ✓ Physical measurements remain immutable and preserved for audit transparency.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A5B0BC] mb-1.5">
                Quality Review Determination
              </label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value as any)}
                className="w-full bg-[#141B23] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
              >
                <option value="verified">Verified Clean (Validated measurement)</option>
                <option value="flagged">Flagged Anomaly (Suspicious sensor spike)</option>
                <option value="rejected">Rejected (Faulty / corrupted station read)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A5B0BC] mb-1.5">
                Mandatory Audit Justification
              </label>
              <textarea
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                placeholder="Explain the determination (e.g. Verified against satellite radar / Sensor optical saturation)..."
                rows={3}
                className="w-full bg-[#141B23] border border-white/10 rounded-xl p-3 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedObs(null)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A5B0BC] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                disabled={isSubmitting || !reviewReason.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#28C7F5] text-[#080A0D] hover:bg-[#28C7F5]/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Record Determination"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
