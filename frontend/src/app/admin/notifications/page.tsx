"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Send,
  RotateCcw,
  Activity,
  Smartphone,
  Mail,
  AppWindow,
} from "lucide-react";
import { ApiClient } from "@/services/api";
import { AdminNotification, AdminNotificationMetrics } from "@/types";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [metrics, setMetrics] = useState<AdminNotificationMetrics | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  async function loadData(targetPage = page) {
    setIsLoading(true);
    setError(null);
    try {
      const [listRes, metRes] = await Promise.all([
        ApiClient.getAdminNotifications({
          delivery_status: deliveryStatusFilter || undefined,
          severity: severityFilter || undefined,
          page: targetPage,
          limit: 15,
        }),
        ApiClient.getAdminNotificationMetrics(),
      ]);

      if (listRes.success && listRes.data) {
        setNotifications(listRes.data);
        if (listRes.meta) setTotal(listRes.meta.total || 0);
      }
      if (metRes.success && metRes.data) {
        setMetrics(metRes.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load notification logs");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData(1);
  }, [deliveryStatusFilter, severityFilter]);

  async function handleRetry(notifId: number) {
    setRetryingId(notifId);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await ApiClient.retryAdminNotification(notifId);
      if (res.success) {
        setSuccessMessage(`Notification #${notifId} successfully retried.`);
        loadData(page);
      }
    } catch (err: any) {
      setError(err.message || "Failed to retry notification delivery");
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">Notification & Alert Audits</h1>
          <p className="text-xs text-[#A5B0BC] mt-1">
            Multi-channel dispatch monitoring, delivery failure diagnostics, and safe retry execution.
          </p>
        </div>
        <button
          onClick={() => loadData(page)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-[#A5B0BC] hover:text-white border border-white/5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs hover:text-white">Dismiss</button>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-xs hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Metrics Banner */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Generated", value: metrics.total_notifications, color: "text-[#F5F7FA]" },
            { label: "Delivered Clean", value: metrics.delivered_count, color: "text-emerald-400" },
            { label: "Pending Queue", value: metrics.pending_count, color: "text-amber-400" },
            { label: "Failed Attempts", value: metrics.failed_count, color: "text-red-400" },
            { label: "In-App Logged", value: metrics.in_app_count, color: "text-[#28C7F5]" },
            { label: "Push Devices", value: metrics.web_push_count, color: "text-purple-400" },
          ].map((m) => (
            <div key={m.label} className="bg-[#10151B] border border-white/5 rounded-xl p-3.5">
              <span className="text-[10px] text-[#A5B0BC] block uppercase font-medium">{m.label}</span>
              <span className={`text-xl font-bold mt-1 block ${m.color}`}>{m.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-[#10151B] border border-white/5 rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={deliveryStatusFilter}
            onChange={(e) => setDeliveryStatusFilter(e.target.value)}
            className="bg-[#141B23] border border-white/5 rounded-xl px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
          >
            <option value="">All Delivery Statuses</option>
            <option value="delivered">Delivered Successfully</option>
            <option value="failed">Failed Delivery</option>
            <option value="pending">Pending Queue</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#141B23] border border-white/5 rounded-xl px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
          >
            <option value="">All Severities</option>
            <option value="advisory">Advisory</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>

        <span className="text-xs text-[#A5B0BC]">{total} total logged events</span>
      </div>

      {/* Notifications Table */}
      <div className="bg-[#10151B] border border-white/5 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#A5B0BC]">
            <div className="w-6 h-6 border-2 border-[#28C7F5] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading notifications audit trail...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#A5B0BC]">
            No notification logs found matching the filter selection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-[#A5B0BC] border-b border-white/5 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Alert Content</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Channels</th>
                  <th className="py-3 px-4">Status & Reason</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#F5F7FA]">
                      {n.user_email || `User #${n.user_id}`}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-[#F5F7FA] truncate">{n.title}</div>
                      <div className="text-[11px] text-[#A5B0BC] truncate">{n.message}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          n.severity === "critical" || n.severity === "emergency"
                            ? "bg-red-500/10 text-red-400"
                            : n.severity === "warning" || n.severity === "high"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-[#28C7F5]/10 text-[#28C7F5]"
                        }`}
                      >
                        {n.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {n.channels.map((ch) => (
                          <span
                            key={ch}
                            className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[10px] text-[#A5B0BC] font-mono"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          n.delivery_status === "delivered"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : n.delivery_status === "failed"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            n.delivery_status === "delivered"
                              ? "bg-emerald-400"
                              : n.delivery_status === "failed"
                              ? "bg-red-400"
                              : "bg-amber-400"
                          }`}
                        />
                        {n.delivery_status}
                      </span>
                      {n.failure_reason && (
                        <p className="text-[10px] text-red-400/80 mt-0.5 truncate max-w-xs" title={n.failure_reason}>
                          {n.failure_reason}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#A5B0BC] text-[11px]">
                      {new Date(n.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {n.delivery_status === "failed" ? (
                        <button
                          onClick={() => handleRetry(n.id)}
                          disabled={retryingId === n.id}
                          className="flex items-center gap-1 ml-auto px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-semibold transition-all disabled:opacity-50"
                        >
                          <RotateCcw className={`w-3 h-3 ${retryingId === n.id ? "animate-spin" : ""}`} />
                          Retry
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#A5B0BC]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
