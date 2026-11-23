"use client";

import React, { useEffect, useState } from "react";
import {
  Database,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Send,
  Radio,
  ExternalLink,
} from "lucide-react";
import { ApiClient } from "@/services/api";
import { AdminDataSource, AdminDataSourceHealth } from "@/types";

export default function AdminDataSourcesPage() {
  const [sources, setSources] = useState<AdminDataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, AdminDataSourceHealth>>({});
  const [pingingId, setPingingId] = useState<string | null>(null);

  async function loadSources() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiClient.getAdminDataSources();
      if (res.success && res.data) {
        setSources(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data sources");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSources();
  }, []);

  async function handlePing(sourceId: string) {
    setPingingId(sourceId);
    try {
      const res = await ApiClient.pingAdminDataSource(sourceId);
      if (res.success && res.data) {
        setPingResults((prev) => ({ ...prev, [sourceId]: res.data }));
      }
    } catch (err: any) {
      setPingResults((prev) => ({
        ...prev,
        [sourceId]: {
          id: sourceId,
          status: "unavailable",
          ping_success: false,
          latency_ms: null,
          checked_at: new Date().toISOString(),
          details: err.message || "Ping failed",
        },
      }));
    } finally {
      setPingingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">Environmental Data Sources</h1>
          <p className="text-xs text-[#A5B0BC] mt-1">
            Real-time status, latency, sync timestamps, and operational health of external telemetry providers.
          </p>
        </div>
        <button
          onClick={loadSources}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-[#A5B0BC] hover:text-white border border-white/5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Sources
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Sources Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-[#A5B0BC]">
          <div className="w-6 h-6 border-2 border-[#28C7F5] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Querying data provider status...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sources.map((src) => {
            const ping = pingResults[src.id];
            const isOperational = src.status === "operational";

            return (
              <div
                key={src.id}
                className="bg-[#10151B] border border-white/5 rounded-2xl p-6 flex flex-col justify-between space-y-6"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                        <Radio className="w-5 h-5 text-[#28C7F5]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#F5F7FA]">{src.name}</h3>
                        <p className="text-[10px] text-[#A5B0BC] uppercase tracking-wider font-mono">
                          Type: {src.type}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 ${
                        isOperational
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOperational ? "bg-emerald-400" : "bg-amber-400"}`} />
                      {src.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-[#A5B0BC] leading-relaxed mb-4">{src.coverage_summary}</p>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[11px] mb-4">
                    <div>
                      <span className="text-[#A5B0BC] block">API Latency:</span>
                      <span className="text-[#F5F7FA] font-medium font-mono">
                        {src.latency_ms ? `${src.latency_ms.toFixed(1)} ms` : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#A5B0BC] block">24h Error Count:</span>
                      <span className="text-[#F5F7FA] font-medium font-mono">{src.error_count_24h}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-white/5">
                      <span className="text-[#A5B0BC] block">Attribution:</span>
                      <span className="text-[#F5F7FA]">{src.attribution}</span>
                    </div>
                  </div>

                  {ping && (
                    <div
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        ping.ping_success
                          ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/5 border-amber-500/20 text-amber-300"
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-[11px]">
                        <span>Ping Result: {ping.ping_success ? "Success" : "Warning"}</span>
                        <span>{ping.latency_ms ? `${ping.latency_ms.toFixed(1)} ms` : "Timeout"}</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-[#A5B0BC]">{ping.details}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-[10px] text-[#A5B0BC]">
                    {src.last_successful_sync
                      ? `Last sync: ${new Date(src.last_successful_sync).toLocaleTimeString()}`
                      : "No sync record recorded"}
                  </span>

                  <button
                    onClick={() => handlePing(src.id)}
                    disabled={pingingId === src.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#28C7F5]/10 hover:bg-[#28C7F5]/20 text-[#28C7F5] border border-[#28C7F5]/30 text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    <Activity className={`w-3.5 h-3.5 ${pingingId === src.id ? "animate-spin" : ""}`} />
                    {pingingId === src.id ? "Pinging..." : "Test Endpoint"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
