"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Activity,
  Wind,
  Database,
  Bot,
  Bell,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { ApiClient } from "@/services/api";
import { AdminDashboardOverview, AdminActivityMetrics } from "@/types";

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);
  const [activity, setActivity] = useState<AdminActivityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [ovRes, actRes] = await Promise.all([
        ApiClient.getAdminOverview(),
        ApiClient.getAdminActivity(7),
      ]);
      if (ovRes.success && ovRes.data) {
        setOverview(ovRes.data);
      }
      if (actRes.success && actRes.data) {
        setActivity(actRes.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load admin overview metrics");
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
        <p className="text-xs text-[#A5B0BC]">Aggregating platform telemetry and metrics...</p>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="p-6 bg-[#10151B] border border-red-500/20 rounded-2xl text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-[#F5F7FA] font-medium mb-2">Error Loading Admin Data</p>
        <p className="text-xs text-[#A5B0BC] mb-4">{error || "Failed to load metrics"}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const m = overview.metrics;

  const KPI_CARDS = [
    {
      label: "Registered Users",
      value: m.total_users,
      sub: `${m.active_users} active accounts`,
      icon: Users,
      color: "text-[#28C7F5]",
      href: "/admin/users",
    },
    {
      label: "AI Inquiries Handled",
      value: m.total_ai_requests,
      sub: `${m.total_conversations} conversations`,
      icon: Bot,
      color: "text-purple-400",
      href: "/admin/ai-usage",
    },
    {
      label: "Pollution Observations",
      value: m.total_observations,
      sub: `${m.flagged_observations} flagged for review`,
      icon: Wind,
      color: "text-[#38E0B4]",
      href: "/admin/environmental-data",
    },
    {
      label: "Alert Rules & Triggers",
      value: m.active_alert_rules,
      sub: "Active threshold rules",
      icon: Bell,
      color: "text-amber-400",
      href: "/admin/notifications",
    },
    {
      label: "Notifications Generated",
      value: m.total_notifications,
      sub: `${m.failed_notifications} delivery failures`,
      icon: Activity,
      color: "text-blue-400",
      href: "/admin/notifications",
    },
    {
      label: "Data Sources Health",
      value: `${m.data_sources_healthy} / ${m.data_sources_total}`,
      sub: "Connected providers operational",
      icon: Database,
      color: "text-emerald-400",
      href: "/admin/data-sources",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">Platform Overview</h1>
          <p className="text-xs text-[#A5B0BC] mt-1">
            Real-time administrative telemetry, user activity, and environmental curation status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-[#A5B0BC] hover:text-white border border-white/5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="bg-[#10151B] border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-[#A5B0BC] font-medium">{card.label}</span>
                <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold text-[#F5F7FA]">{card.value}</span>
                <p className="text-[11px] text-[#A5B0BC] mt-1 flex items-center gap-1">
                  <span>{card.sub}</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-white/50" />
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 7-Day Activity Trends Visualization */}
      <div className="bg-[#10151B] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#28C7F5]" />
            <h2 className="text-sm font-semibold text-[#F5F7FA]">7-Day Activity Trends</h2>
          </div>
          <span className="text-[11px] text-[#A5B0BC]">Chronological observations & AI queries</span>
        </div>

        {activity && activity.data_points.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2 h-44 items-end pt-4 border-b border-white/5 pb-2">
              {activity.data_points.map((pt) => {
                const maxVal = Math.max(
                  ...activity.data_points.map((p) => Math.max(p.ai_requests, p.observations, p.registrations, 1))
                );
                const heightAi = Math.max(12, Math.round((pt.ai_requests / maxVal) * 120));
                const heightObs = Math.max(12, Math.round((pt.observations / maxVal) * 120));

                return (
                  <div key={pt.date} className="flex flex-col items-center h-full justify-end group">
                    <div className="flex items-end gap-1 mb-2">
                      <div
                        style={{ height: `${heightAi}px` }}
                        className="w-3 sm:w-4 bg-[#28C7F5]/80 hover:bg-[#28C7F5] rounded-t transition-all"
                        title={`AI Requests: ${pt.ai_requests}`}
                      />
                      <div
                        style={{ height: `${heightObs}px` }}
                        className="w-3 sm:w-4 bg-[#38E0B4]/80 hover:bg-[#38E0B4] rounded-t transition-all"
                        title={`Observations: ${pt.observations}`}
                      />
                    </div>
                    <span className="text-[10px] text-[#A5B0BC] truncate w-full text-center">
                      {pt.date.split("-").slice(1).join("/")}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-[#A5B0BC] pt-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#28C7F5]" />
                <span>AI Inquiries</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#38E0B4]" />
                <span>Observations Logged</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#A5B0BC] text-center py-8">No recent activity telemetry available.</p>
        )}
      </div>

      {/* System Status & Operational Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#10151B] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#F5F7FA]">Platform Services Status</h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Operational
            </span>
          </div>

          <div className="space-y-3">
            {[
              { name: "FastAPI REST Gateway", status: "Healthy", detail: "Serving /api/v1 endpoints" },
              { name: "PostgreSQL Database Engine", status: "Connected", detail: "Active connection pool" },
              { name: "Google Gemini GenAI Provider", status: "Ready", detail: "Context-grounded assistant operational" },
              { name: "Open-Meteo European CAMS Ingestion", status: "Operational", detail: "Numerical atmospheric dispersion models" },
            ].map((svc) => (
              <div key={svc.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div>
                  <p className="text-xs font-medium text-[#F5F7FA]">{svc.name}</p>
                  <p className="text-[10px] text-[#A5B0BC]">{svc.detail}</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{svc.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#10151B] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#F5F7FA] mb-2">Administrative Quick Actions</h3>
            <p className="text-xs text-[#A5B0BC] mb-4">
              Rapid access to critical governance tools and data curation workflows.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/admin/users"
                className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-xs text-[#F5F7FA] font-medium transition-colors"
              >
                Manage Users
              </Link>
              <Link
                href="/admin/environmental-data"
                className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-xs text-[#F5F7FA] font-medium transition-colors"
              >
                Review Telemetry
              </Link>
              <Link
                href="/admin/notifications"
                className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-xs text-[#F5F7FA] font-medium transition-colors"
              >
                Audit Notifications
              </Link>
              <Link
                href="/admin/audit-logs"
                className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-xs text-[#F5F7FA] font-medium transition-colors"
              >
                Inspect Audit Logs
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 mt-4 text-[11px] text-[#A5B0BC] flex items-center justify-between">
            <span>Last Telemetry Sync</span>
            <span>{new Date(overview.last_updated).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
