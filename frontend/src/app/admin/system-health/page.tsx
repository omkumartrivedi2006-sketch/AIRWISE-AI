"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  Database,
  CheckCircle2,
  AlertTriangle,
  Server,
  Clock,
  RefreshCw,
  HardDrive,
  Cpu,
  Layers,
} from "lucide-react";
import { ApiClient } from "@/services/api";
import { AdminSystemHealth } from "@/types";

export default function AdminSystemHealthPage() {
  const [health, setHealth] = useState<AdminSystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadHealth() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiClient.getAdminSystemHealth();
      if (res.success && res.data) {
        setHealth(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load system diagnostics");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadHealth();
  }, []);

  function formatUptime(seconds: number) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#28C7F5] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-[#A5B0BC]">Running infrastructure diagnostic checks...</p>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="p-6 bg-[#10151B] border border-red-500/20 rounded-2xl text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-[#F5F7FA] font-medium mb-1">Diagnostic Check Failed</p>
        <p className="text-xs text-[#A5B0BC] mb-4">{error || "Unable to retrieve platform health status"}</p>
        <button
          onClick={loadHealth}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold"
        >
          Retry Diagnostics
        </button>
      </div>
    );
  }

  const db = health.database;
  const s = health.services;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">System & Infrastructure Health</h1>
          <p className="text-xs text-[#A5B0BC] mt-1">
            Real-time platform telemetry, database connection latency, and service availability.
          </p>
        </div>
        <button
          onClick={loadHealth}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-[#A5B0BC] hover:text-white border border-white/5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Run Diagnostic Check
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#10151B] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3 text-xs text-[#A5B0BC]">
            <span>FastAPI Gateway</span>
            <Server className="w-4 h-4 text-[#28C7F5]" />
          </div>
          <span className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {s.fastapi_status.toUpperCase()}
          </span>
          <p className="text-[10px] text-[#A5B0BC] mt-1 font-mono">v{health.version} · {health.environment}</p>
        </div>

        <div className="bg-[#10151B] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3 text-xs text-[#A5B0BC]">
            <span>Database Ping Latency</span>
            <Database className="w-4 h-4 text-[#38E0B4]" />
          </div>
          <span className="text-xl font-bold text-[#F5F7FA] font-mono">{db.latency_ms.toFixed(1)} ms</span>
          <p className="text-[10px] text-[#A5B0BC] mt-1">Status: {db.status.toUpperCase()} ({db.dialect})</p>
        </div>

        <div className="bg-[#10151B] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3 text-xs text-[#A5B0BC]">
            <span>Platform Uptime</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-xl font-bold text-[#F5F7FA] font-mono">{formatUptime(health.uptime_seconds)}</span>
          <p className="text-[10px] text-[#A5B0BC] mt-1">Continuous uptime without crashes</p>
        </div>

        <div className="bg-[#10151B] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3 text-xs text-[#A5B0BC]">
            <span>Gemini AI Engine</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-xl font-bold text-[#F5F7FA] capitalize">{s.gemini_status}</span>
          <p className="text-[10px] text-[#A5B0BC] mt-1">Inference & clinical grounding</p>
        </div>
      </div>

      {/* Database Diagnostic Table Counts */}
      <div className="bg-[#10151B] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#28C7F5]" />
            <h2 className="text-sm font-semibold text-[#F5F7FA]">Database Entity Counts & Pool Allocation</h2>
          </div>
          <span className="text-xs font-mono text-[#A5B0BC]">Engine: {db.dialect.toUpperCase()}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(db.table_counts).map(([tableName, count]) => (
            <div key={tableName} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[11px] font-mono text-[#A5B0BC] block truncate">{tableName}</span>
              <span className="text-lg font-bold text-[#F5F7FA] mt-1 block">{count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Services Health Matrix */}
      <div className="bg-[#10151B] border border-white/5 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-[#F5F7FA] mb-4">Integrated Service Subsystems</h2>
        <div className="divide-y divide-white/5">
          {[
            { name: "FastAPI Application Framework", status: s.fastapi_status, desc: "Asynchronous REST backend running on Uvicorn" },
            { name: "SQLAlchemy 2.0 ORM Engine", status: s.database_status, desc: "Transactional persistence layer with Alembic migrations" },
            { name: "Google Gemini GenAI Assistant", status: s.gemini_status, desc: "Domain-specific pollution consultation and recommendation engine" },
            { name: "Open-Meteo Environmental Ingestion", status: s.open_meteo_status, desc: "CAMS European atmospheric multi-pollutant telemetry" },
            { name: "WAQI Global Ground Station Registry", status: s.waqi_status, desc: "Terrestrial monitoring station integration" },
            { name: "Notification Multi-Channel Dispatcher", status: s.notifications_status, desc: "In-app, console email, and Web Push distribution" },
          ].map((item) => (
            <div key={item.name} className="py-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#F5F7FA]">{item.name}</p>
                <p className="text-[11px] text-[#A5B0BC]">{item.desc}</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold capitalize">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
