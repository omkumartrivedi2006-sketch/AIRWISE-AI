"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  AlertTriangle,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { ApiClient } from "@/services/api";
import { AdminUser } from "@/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalType, setModalType] = useState<"status" | "role" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadUsers(targetPage = page) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiClient.getAdminUsers({
        query: searchQuery || undefined,
        role: roleFilter || undefined,
        is_active: statusFilter === "" ? undefined : statusFilter === "true",
        page: targetPage,
        limit: 15,
      });
      if (res.success && res.data) {
        setUsers(res.data);
        if (res.meta) {
          setTotal(res.meta.total || 0);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers(1);
  }, [roleFilter, statusFilter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadUsers(1);
  }

  async function handleConfirmAction() {
    if (!selectedUser || !modalType) return;
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (modalType === "status") {
        const nextStatus = !selectedUser.is_active;
        const res = await ApiClient.updateAdminUserStatus(selectedUser.id, nextStatus, actionReason);
        if (res.success) {
          setSuccessMessage(`User status successfully changed to ${nextStatus ? "Active" : "Deactivated"}`);
          loadUsers(page);
        }
      } else if (modalType === "role") {
        const nextRole = selectedUser.role === "ADMIN" ? "USER" : "ADMIN";
        const res = await ApiClient.updateAdminUserRole(selectedUser.id, nextRole, actionReason);
        if (res.success) {
          setSuccessMessage(`User role successfully updated to ${nextRole}`);
          loadUsers(page);
        }
      }
      setModalType(null);
      setSelectedUser(null);
      setActionReason("");
    } catch (err: any) {
      setError(err.message || "Failed to execute administrative action");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">User Management</h1>
          <p className="text-xs text-[#A5B0BC] mt-1">
            Audit registered citizens, verify roles, and manage active platform account permissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadUsers(page)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-[#A5B0BC] hover:text-white border border-white/5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Alert Banners */}
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

      {/* Filters & Search Toolbar */}
      <div className="bg-[#10151B] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#A5B0BC]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-[#141B23] border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-[#F5F7FA] placeholder-[#A5B0BC] focus:outline-none focus:border-[#28C7F5]"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#141B23] border border-white/5 rounded-xl px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
          >
            <option value="">All Roles</option>
            <option value="USER">Citizens (USER)</option>
            <option value="ADMIN">Administrators (ADMIN)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#141B23] border border-white/5 rounded-xl px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-[#10151B] border border-white/5 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#A5B0BC]">
            <div className="w-6 h-6 border-2 border-[#28C7F5] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading registered users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#A5B0BC]">
            No users match the active search or filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-[#A5B0BC] border-b border-white/5 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4">Locations / Rules</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#F5F7FA]">{u.full_name || "Unnamed User"}</div>
                      <div className="text-[11px] text-[#A5B0BC]">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.role === "ADMIN"
                            ? "bg-[#28C7F5]/10 text-[#28C7F5] border border-[#28C7F5]/20"
                            : "bg-white/[0.04] text-[#A5B0BC]"
                        }`}
                      >
                        {u.role === "ADMIN" && <Shield className="w-3 h-3" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.is_active
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-400" : "bg-red-400"}`} />
                        {u.is_active ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#A5B0BC] text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-[#A5B0BC] text-[11px]">
                      {u.saved_locations_count} locations · {u.alert_rules_count} rules
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setModalType("role");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-[#28C7F5] border border-white/5 text-[11px] font-medium"
                          title="Change Role"
                        >
                          {u.role === "ADMIN" ? "Demote" : "Make Admin"}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setModalType("status");
                          }}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium ${
                            u.is_active
                              ? "bg-red-500/5 hover:bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {modalType && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#10151B] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F7FA]">
                  {modalType === "status"
                    ? `${selectedUser.is_active ? "Deactivate" : "Activate"} User Account`
                    : `Change Role for ${selectedUser.full_name || selectedUser.email}`}
                </h3>
                <p className="text-xs text-[#A5B0BC]">
                  Target User: {selectedUser.email} (ID: {selectedUser.id})
                </p>
              </div>
            </div>

            <p className="text-xs text-[#A5B0BC] leading-relaxed">
              {modalType === "status"
                ? selectedUser.is_active
                  ? "Deactivating this account will immediately revoke access token validation and terminate active user sessions. The user will be unable to log in until re-activated."
                  : "Activating this account will restore full access to environmental services, alerts, and conversational history."
                : `Are you sure you want to change this user's role from ${selectedUser.role} to ${
                    selectedUser.role === "ADMIN" ? "USER" : "ADMIN"
                  }? Administrators possess full platform governance privileges.`}
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-[#A5B0BC] mb-1.5">
                Administrative Justification (Audit Log Reason)
              </label>
              <input
                type="text"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g. Terms violation review / Role promotion"
                className="w-full bg-[#141B23] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setModalType(null);
                  setSelectedUser(null);
                  setActionReason("");
                }}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A5B0BC] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#28C7F5] text-[#080A0D] hover:bg-[#28C7F5]/90 transition-colors"
              >
                {isSubmitting ? "Processing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
