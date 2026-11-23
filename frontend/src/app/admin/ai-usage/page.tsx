"use client";

import React, { useEffect, useState } from "react";
import {
  Bot,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { ApiClient } from "@/services/api";
import { AdminAiUsageOverview, AdminAiUsageTrends } from "@/types";

export default function AdminAiUsagePage() {
  const [overview, setOverview] = useState<AdminAiUsageOverview | null>(null);
  const [trends, setTrends] = useState<AdminAiUsageTrends | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [ovRes, trRes] = await Promise.all([
        ApiClient.getAdminAiUsage(),
        ApiClient.getAdminAiTrends(7),
      ]);
      if (ovRes.success && ovRes.data) {
        setOverview(ovRes.data);
      }
      if (trRes.success && trRes.data) {
        setTrends(trRes.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load AI usage metrics");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#28C7F5] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-[#A5B0BC]">Auditing Gemini AI usage and quota metrics...</p>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="p-6 bg-[#10151B] border border-red-500/20 rounded-2xl text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-[#F5F7FA] font-medium mb-1">Failed to Load AI Telemetry</p>
        <p className="text-xs text-[#A5B0BC] mb-4">{error || "Unable to reach backend monitoring service"}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const quotaPercent = Math.min(
    100,
    Math.round((overview.daily_quota_consumed / (overview.daily_quota_limit * 10 || 1)) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">AI Assistant Usage & Quotas</h1>
          <p className="text-xs text-[#A5B0BC] mt-1">
            Inference volume, latency tracking, estimated token expenditures, and Google Gemini operational telemetry.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-[#A5B0BC] hover:text-white border border-white/5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
        </button>
      </div>

      {/* Model & Quota Banner */}
      <div className="bg-[#10151B] border border-white/5 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-[#F5F7FA]">{overview.provider_name}</h2>
                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono text-[10px] font-semibold">
                  {overview.model_name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 ${
                    overview.is_configured
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${overview.is_configured ? "bg-emerald-400" : "bg-amber-400"}`} />
                  {overview.is_configured ? "Configured" : "Standby (Key Required)"}
                </span>
              </div>
              <p className="text-xs text-[#A5B0BC] mt-1">
                Context-grounded multi-turn conversational pollution assistant. Rate limit cap: {overview.daily_quota_limit} req/user/day.
              </p>
            </div>
          </div>

          <div className="w-full md:w-64 bg-white/[0.02] border border-white/5 rounded-xl p-3 text-xs">
            <div className="flex justify-between text-[#A5B0BC] mb-1.5 text-[11px]">
              <span>Platform 24h Consumption:</span>
              <span className="text-[#F5F7FA] font-medium font-mono">{overview.daily_quota_consumed} queries</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.max(8, quotaPercent)}%` }}
                className="bg-gradient-to-r from-[#28C7F5] to-purple-400 h-full rounded-full transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Inquiries Logged", value: overview.total_requests, sub: "All time assistant messages", icon: Bot, color: "text-purple-400" },
          { label: "Successful Generations", value: overview.successful_requests, sub: "100% completion rate", icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Average Response Latency", value: overview.avg_latency_ms ? `${overview.avg_latency_ms.toFixed(0)} ms` : "N/A", sub: "FastAPI server-side processing", icon: Clock, color: "text-[#28C7F5]" },
          { label: "Estimated Tokens Processed", value: overview.estimated_tokens_used.toLocaleString(), sub: "Observation context & history", icon: Zap, color: "text-amber-400" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-[#10151B] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#A5B0BC] font-medium">{c.label}</span>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <div>
                <span className="text-xl font-bold text-[#F5F7FA]">{c.value}</span>
                <p className="text-[10px] text-[#A5B0BC] mt-0.5">{c.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 7-Day AI Activity Chart */}
      <div className="bg-[#10151B] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-[#F5F7FA]">7-Day Assistant Request Volume</h3>
          </div>
          <span className="text-[11px] text-[#A5B0BC]">Daily inquiries processed</span>
        </div>

        {trends && trends.data_points.length > 0 ? (
          <div className="grid grid-cols-7 gap-2 h-40 items-end pt-4 border-b border-white/5 pb-2">
            {trends.data_points.map((pt) => {
              const maxVal = Math.max(...trends.data_points.map((p) => p.request_count), 5);
              const height = Math.max(12, Math.round((pt.request_count / maxVal) * 110));

              return (
                <div key={pt.date} className="flex flex-col items-center h-full justify-end group">
                  <div
                    style={{ height: `${height}px` }}
                    className="w-4 sm:w-6 bg-purple-500/80 hover:bg-purple-400 rounded-t transition-all mb-2"
                    title={`Queries: ${pt.request_count}`}
                  />
                  <span className="text-[10px] text-[#A5B0BC] truncate w-full text-center">
                    {pt.date.split("-").slice(1).join("/")}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[#A5B0BC] text-center py-8">No AI requests logged in the current window.</p>
        )}
      </div>

      {/* Security Disclaimer */}
      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-[#A5B0BC] flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-[#28C7F5] shrink-0" />
        <p>
          <strong className="text-[#F5F7FA]">Privacy & Security Notice:</strong> Raw user prompts and sensitive health disclosures are strictly kept private to conversation owners. The administrative console inspects only aggregated performance telemetry, quota counters, and generation timestamps.
        </p>
      </div>
    </div>
  );
}
