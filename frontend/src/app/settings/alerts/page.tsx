"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  ChevronLeft,
  Settings2,
  Clock,
  MapPin,
  Play,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ApiClient } from "@/services/api";
import { AlertRule, SavedLocation } from "@/types";

function AlertSettingsContent() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState<number | null>(null);
  const [evalResult, setEvalResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New Rule Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [locationId, setLocationId] = useState<number | "all">("all");
  const [metric, setMetric] = useState("aqi");
  const [operator, setOperator] = useState(">=");
  const [thresholdValue, setThresholdValue] = useState<number>(100);
  const [aqiScale, setAqiScale] = useState("US_EPA");
  const [cooldownMinutes, setCooldownMinutes] = useState(60);
  const [channels, setChannels] = useState<string[]>(["in_app"]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rulesRes, locsRes] = await Promise.all([
        ApiClient.getAlertRules(),
        ApiClient.getSavedLocations(),
      ]);

      if (rulesRes.success && rulesRes.data) {
        setRules(rulesRes.data);
      }
      if (locsRes.success && locsRes.data) {
        setSavedLocations(locsRes.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load alert rules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleRule = async (rule: AlertRule) => {
    try {
      const res = await ApiClient.updateAlertRule(rule.id, {
        is_enabled: !rule.is_enabled,
      });
      if (res.success) {
        setRules((prev) =>
          prev.map((r) => (r.id === rule.id ? { ...r, is_enabled: !r.is_enabled } : r))
        );
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    try {
      const res = await ApiClient.deleteAlertRule(ruleId);
      if (res.success) {
        setRules((prev) => prev.filter((r) => r.id !== ruleId));
      }
    } catch {
      // Ignore
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      const payload = {
        location_id: locationId === "all" ? null : locationId,
        metric,
        comparison_operator: operator,
        threshold_value: Number(thresholdValue),
        aqi_scale: aqiScale,
        cooldown_minutes: Number(cooldownMinutes),
        notification_channels: channels,
        is_enabled: true,
      };

      const res = await ApiClient.createAlertRule(payload);
      if (res.success && res.data) {
        setRules((prev) => [res.data, ...prev]);
        setShowCreateModal(false);
        // Reset form
        setThresholdValue(metric === "aqi" ? 100 : 35);
      } else {
        setCreateError(res.message || "Failed to create rule");
      }
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create rule");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleTriggerEvaluation = async (locationIdVal: number) => {
    setEvaluating(locationIdVal);
    setEvalResult(null);
    try {
      const res = await ApiClient.evaluateAlerts(locationIdVal);
      if (res.success && res.data) {
        setEvalResult(
          `Observation evaluated: Generated ${res.data.triggered_count} alert notification(s). Check Notification Center.`
        );
        setTimeout(() => setEvalResult(null), 5000);
      }
    } catch (err: unknown) {
      setEvalResult(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setEvaluating(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
          <div>
            <Link
              href="/notifications"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mb-2 font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back to Alerts Center
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Smart Alert Rules
            </h1>
            <p className="text-xs text-foreground-secondary mt-1">
              Configure automated environmental thresholds and cooldown intervals for your monitored Indian stations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
              variant="primary"
              className="text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> New Alert Rule
            </Button>
          </div>
        </div>

        {evalResult && (
          <div className="p-3 rounded-lg text-xs font-mono bg-[#38E0B4]/10 text-[#38E0B4] border border-[#38E0B4]/20 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{evalResult}</span>
          </div>
        )}

        {/* Create Rule Modal */}
        {showCreateModal && (
          <Card className="p-6 bg-[#141B23] border-[#28C7F5]/40 space-y-5 animate-in fade-in duration-200 shadow-xl shadow-black/50">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-base font-bold font-mono text-[#F5F7FA] flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-[#28C7F5]" /> Configure New Alert Rule
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="text-xs font-mono text-[#6B7A8D]"
              >
                Cancel
              </Button>
            </div>

            {createError && (
              <div className="p-3 rounded-lg text-xs font-mono bg-red-500/10 text-red-400 border border-red-500/20">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateRule} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#A5B0BC] mb-1">Target Location</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value === "all" ? "all" : Number(e.target.value))}
                  className="w-full bg-[#10151B] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
                >
                  <option value="all">All Monitored Locations (Global)</option>
                  {savedLocations.map((loc) => (
                    <option key={loc.id} value={loc.location_id}>
                      {loc.custom_name ? `${loc.custom_name} (${loc.city})` : loc.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5B0BC] mb-1">Environmental Metric</label>
                <select
                  value={metric}
                  onChange={(e) => {
                    setMetric(e.target.value);
                    if (e.target.value === "aqi") setThresholdValue(100);
                    else if (e.target.value === "pm25") setThresholdValue(35);
                    else if (e.target.value === "pm10") setThresholdValue(50);
                    else setThresholdValue(100);
                  }}
                  className="w-full bg-[#10151B] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
                >
                  <option value="aqi">Air Quality Index (AQI)</option>
                  <option value="pm25">PM2.5 (Fine Particulate)</option>
                  <option value="pm10">PM10 (Coarse Particulate)</option>
                  <option value="no2">Nitrogen Dioxide (NO2)</option>
                  <option value="so2">Sulfur Dioxide (SO2)</option>
                  <option value="co">Carbon Monoxide (CO)</option>
                  <option value="o3">Ozone (O3)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5B0BC] mb-1">Condition & Threshold</label>
                <div className="flex gap-2">
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-24 bg-[#10151B] border border-white/[0.1] rounded-lg px-2 py-2 text-xs font-mono text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
                  >
                    <option value=">=">&gt;= (At or above)</option>
                    <option value=">">&gt; (Strictly above)</option>
                    <option value="<=">&lt;= (At or below)</option>
                  </select>
                  <input
                    type="number"
                    step="0.1"
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(Number(e.target.value))}
                    required
                    className="flex-1 bg-[#10151B] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
                  />
                </div>
              </div>

              {metric === "aqi" && (
                <div>
                  <label className="block text-xs font-mono text-[#A5B0BC] mb-1">Applicable AQI Standard</label>
                  <select
                    value={aqiScale}
                    onChange={(e) => setAqiScale(e.target.value)}
                    className="w-full bg-[#10151B] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
                  >
                    <option value="US_EPA">US EPA Standard (0–500)</option>
                    <option value="IN_NAAQS">Indian NAAQS Standard (0–500)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-[#A5B0BC] mb-1">Cooldown Interval (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={cooldownMinutes}
                  onChange={(e) => setCooldownMinutes(Number(e.target.value))}
                  className="w-full bg-[#10151B] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
                />
                <span className="text-[10px] text-[#6B7A8D]">Minimum 5m, Maximum 1440m (24h)</span>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5B0BC] mb-1">Dispatch Channels</label>
                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-1.5 text-xs font-mono text-[#F5F7FA] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.includes("in_app")}
                      onChange={(e) => {
                        if (e.target.checked) setChannels((p) => [...p, "in_app"]);
                        else setChannels((p) => p.filter((c) => c !== "in_app"));
                      }}
                      className="rounded border-white/20 bg-[#10151B] text-[#28C7F5]"
                    />
                    In-App Center
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-mono text-[#F5F7FA] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.includes("email")}
                      onChange={(e) => {
                        if (e.target.checked) setChannels((p) => [...p, "email"]);
                        else setChannels((p) => p.filter((c) => c !== "email"));
                      }}
                      className="rounded border-white/20 bg-[#10151B] text-[#28C7F5]"
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-mono text-[#F5F7FA] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.includes("push")}
                      onChange={(e) => {
                        if (e.target.checked) setChannels((p) => [...p, "push"]);
                        else setChannels((p) => p.filter((c) => c !== "push"));
                      }}
                      className="rounded border-white/20 bg-[#10151B] text-[#28C7F5]"
                    />
                    Browser Push
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 pt-3 flex justify-end gap-3 border-t border-white/[0.06]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="font-mono text-xs border-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createLoading}
                  className="font-mono text-xs bg-[#28C7F5] hover:bg-[#28C7F5]/90 text-black"
                >
                  {createLoading ? "Saving Rule..." : "Create Rule"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Rules Table */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#28C7F5] mx-auto" />
            <p className="text-sm font-mono text-[#A5B0BC]">Loading configured rules...</p>
          </div>
        ) : error ? (
          <Card className="p-8 text-center bg-[#141B23] border-red-500/30 space-y-4">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-sm font-mono text-red-400">{error}</p>
          </Card>
        ) : rules.length === 0 ? (
          <Card className="p-12 text-center bg-[#141B23] border-white/[0.08] space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#28C7F5]/10 text-[#28C7F5] flex items-center justify-center mx-auto border border-[#28C7F5]/20">
              <Bell className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold font-mono text-[#F5F7FA]">No Alert Rules Configured</h3>
              <p className="text-xs font-mono text-[#A5B0BC] max-w-md mx-auto">
                Create threshold rules to receive automated alerts when pollution levels in your monitored cities exceed health guidelines.
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
              className="text-xs font-mono bg-[#28C7F5] hover:bg-[#28C7F5]/90 text-black"
            >
              Create Your First Rule
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <Card
                key={rule.id}
                className={`p-5 transition-all border ${
                  rule.is_enabled
                    ? "bg-[#141B23] border-white/[0.08]"
                    : "bg-[#10151B]/50 border-white/[0.03] opacity-60"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#F5F7FA]">
                        {rule.metric.toUpperCase()} {rule.comparison_operator} {rule.threshold_value}
                        {rule.metric === "aqi" ? ` (${rule.aqi_scale})` : " µg/m³"}
                      </span>
                      <Badge
                        variant={rule.is_enabled ? "good" : "moderate"}
                        size="sm"
                        className="text-[10px]"
                      >
                        {rule.is_enabled ? "ACTIVE" : "PAUSED"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[#A5B0BC]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#28C7F5]" />
                        {rule.city ? rule.city : "All Locations (Global)"}
                      </span>
                      <span className="flex items-center gap-1 text-[#6B7A8D]">
                        <Clock className="w-3.5 h-3.5" /> Cooldown: {rule.cooldown_minutes}m
                      </span>
                      <span className="text-[#6B7A8D]">
                        Channels: {rule.notification_channels.join(", ")}
                      </span>
                      {rule.last_triggered_at && (
                        <span className="text-[#6B7A8D]">
                          Last Triggered: {new Date(rule.last_triggered_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {rule.location_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTriggerEvaluation(rule.location_id!)}
                        disabled={evaluating === rule.location_id}
                        title="Evaluate rule against latest live data"
                        className="h-8 px-2.5 text-xs font-mono border-white/10 text-[#38E0B4] hover:bg-[#38E0B4]/10"
                      >
                        <Play className="w-3.5 h-3.5 mr-1" />
                        {evaluating === rule.location_id ? "Evaluating..." : "Evaluate Now"}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleRule(rule)}
                      className="h-8 px-2 text-xs font-mono text-[#A5B0BC] hover:text-[#F5F7FA]"
                    >
                      {rule.is_enabled ? "Pause" : "Resume"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="h-8 w-8 p-0 text-[#6B7A8D] hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AlertSettingsPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <AlertSettingsContent />
      </AppLayout>
    </AuthGuard>
  );
}
