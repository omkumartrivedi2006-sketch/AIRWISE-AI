"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  User,
  Clock,
  Globe,
  Code,
  X,
  Download,
  AlertCircle,
  Eye,
} from "lucide-react";
import { ApiClient } from "@/services/api";
import { AdminAuditLog } from "@/types";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [targetTypeFilter, setTargetTypeFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: { action?: string; target_type?: string } = {};
      if (actionFilter !== "ALL") params.action = actionFilter;
      if (targetTypeFilter !== "ALL") params.target_type = targetTypeFilter;

      const res = await ApiClient.getAdminAuditLogs(params);
      if (res.success && res.data) {
        setLogs(res.data);
      } else {
        setError(res.message || "Failed to load audit records");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while fetching logs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, targetTypeFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.admin_email.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.target_type.toLowerCase().includes(term) ||
      (log.target_id && log.target_id.toLowerCase().includes(term)) ||
      (log.ip_address && log.ip_address.toLowerCase().includes(term))
    );
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes("STATUS") || action.includes("DEACTIVATE")) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
    if (action.includes("ROLE") || action.includes("ADMIN")) {
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }
    if (action.includes("REVIEW") || action.includes("FLAG")) {
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    }
    if (action.includes("RETRY") || action.includes("NOTIFICATION")) {
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
    return "bg-slate-500/10 text-slate-300 border-slate-500/20";
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `audit-logs-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">Security & Audit Logs</h1>
          <p className="text-sm text-[#A5B0BC] mt-1">
            Immutable trail of administrative operations, security changes, and data verifications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-[#A5B0BC] hover:text-[#F5F7FA] bg-[#141B23] border border-white/[0.09] hover:bg-[#1A232D] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#28C7F5]" />
            Export JSON
          </button>
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-[#A5B0BC] hover:text-[#F5F7FA] bg-[#141B23] border border-white/[0.09] hover:bg-[#1A232D] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#28C7F5]" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-[#10151B] border border-white/[0.09] flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A5B0BC]" />
          <input
            type="text"
            placeholder="Search by actor email, action, target ID, or client IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141B23] border border-white/[0.09] rounded-lg pl-9 pr-4 py-2 text-sm text-[#F5F7FA] placeholder-[#A5B0BC]/50 focus:outline-none focus:border-[#28C7F5]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#A5B0BC]" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-[#141B23] border border-white/[0.09] rounded-lg px-3 py-2 text-sm text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
            >
              <option value="ALL">All Actions</option>
              <option value="USER_STATUS_CHANGE">User Status Change</option>
              <option value="USER_ROLE_CHANGE">User Role Change</option>
              <option value="DATA_REVIEW">Data Review</option>
              <option value="NOTIFICATION_RETRY">Notification Retry</option>
            </select>
          </div>
          <div>
            <select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              className="bg-[#141B23] border border-white/[0.09] rounded-lg px-3 py-2 text-sm text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
            >
              <option value="ALL">All Targets</option>
              <option value="USER">User</option>
              <option value="POLLUTION_OBSERVATION">Pollution Observation</option>
              <option value="NOTIFICATION">Notification</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Logs Table */}
      <div className="rounded-xl bg-[#10151B] border border-white/[0.09] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#A5B0BC]">
            <thead className="bg-[#141B23] text-xs font-mono uppercase text-[#A5B0BC] border-b border-white/[0.09]">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Admin Actor</th>
                <th className="px-5 py-3.5">Action Executed</th>
                <th className="px-5 py-3.5">Target</th>
                <th className="px-5 py-3.5">Client IP</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#A5B0BC]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#28C7F5]" />
                      Loading audit records...
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#A5B0BC]">
                    No audit records match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-mono text-[#A5B0BC]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#28C7F5]" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#28C7F5] to-[#38E0B4] flex items-center justify-center text-[#080A0D] text-[10px] font-bold">
                          {log.admin_email[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-xs text-[#F5F7FA]">{log.admin_email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-xs">
                        <span className="font-mono text-[#F5F7FA]">{log.target_type}</span>
                        {log.target_id && (
                          <span className="block text-[10px] font-mono text-[#A5B0BC]/70 truncate max-w-[120px]">
                            {log.target_id}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-mono">
                      {log.ip_address ? (
                        <div className="flex items-center gap-1.5 text-[#A5B0BC]">
                          <Globe className="w-3.5 h-3.5" />
                          {log.ip_address}
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#141B23] border border-white/[0.09] text-xs text-[#28C7F5] hover:bg-[#1A232D] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#10151B] border border-white/[0.09] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.09]">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-[#28C7F5]" />
                <h3 className="font-semibold text-[#F5F7FA] text-base">Audit Event Payload Inspection</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-[#A5B0BC] hover:text-[#F5F7FA] hover:bg-white/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#141B23] p-3 rounded-lg border border-white/[0.05] font-mono">
                <div>
                  <span className="text-[#A5B0BC]">Action:</span>{" "}
                  <span className="text-[#F5F7FA]">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-[#A5B0BC]">Actor:</span>{" "}
                  <span className="text-[#F5F7FA]">{selectedLog.admin_email}</span>
                </div>
                <div>
                  <span className="text-[#A5B0BC]">Target:</span>{" "}
                  <span className="text-[#F5F7FA]">
                    {selectedLog.target_type} ({selectedLog.target_id || "N/A"})
                  </span>
                </div>
                <div>
                  <span className="text-[#A5B0BC]">Recorded:</span>{" "}
                  <span className="text-[#F5F7FA]">{new Date(selectedLog.created_at).toISOString()}</span>
                </div>
                {selectedLog.user_agent && (
                  <div className="col-span-2 truncate">
                    <span className="text-[#A5B0BC]">User Agent:</span>{" "}
                    <span className="text-[#F5F7FA]">{selectedLog.user_agent}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[#A5B0BC] font-mono mb-1.5 block">State Mutation & Context Payload:</span>
                <pre className="p-4 rounded-lg bg-[#080A0D] border border-white/[0.09] text-[#38E0B4] font-mono text-xs overflow-x-auto max-h-72">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-lg bg-[#141B23] border border-white/[0.09] text-sm text-[#F5F7FA] hover:bg-[#1A232D]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
