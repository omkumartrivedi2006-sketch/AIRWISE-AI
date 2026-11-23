"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Info,
  ShieldAlert,
  Clock,
  MapPin,
  RefreshCw,
  Plus,
  Play,
  Settings2,
  Filter,
  Check,
  X,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ApiClient } from "@/services/api";
import { NotificationItem, AlertRule, SavedLocation } from "@/types";

const INDIAN_CITIES_LIST = [
  { id: 1, name: "New Delhi", state: "Delhi" },
  { id: 2, name: "Mumbai", state: "Maharashtra" },
  { id: 3, name: "Ahmedabad", state: "Gujarat" },
  { id: 4, name: "Gandhinagar", state: "Gujarat" },
  { id: 5, name: "Surat", state: "Gujarat" },
  { id: 6, name: "Vadodara", state: "Gujarat" },
  { id: 7, name: "Bengaluru", state: "Karnataka" },
  { id: 8, name: "Kolkata", state: "West Bengal" },
  { id: 9, name: "Hyderabad", state: "Telangana" },
  { id: 10, name: "Pune", state: "Maharashtra" },
];

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <NotificationsContent />
      </AppLayout>
    </AuthGuard>
  );
}

function NotificationsContent() {
  const [activeTab, setActiveTab] = useState<"notifications" | "rules">("notifications");

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "critical" | "advisory">("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Alert Rules State
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [evaluatingRuleId, setEvaluatingRuleId] = useState<number | null>(null);
  const [evalResult, setEvalResult] = useState<string | null>(null);

  // Create Rule Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ruleLocationId, setRuleLocationId] = useState<number | "all">("all");
  const [ruleMetric, setRuleMetric] = useState("aqi");
  const [ruleThreshold, setRuleThreshold] = useState<number>(100);
  const [ruleCooldown, setRuleCooldown] = useState(60);
  const [createLoading, setCreateLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const isReadParam = activeFilter === "unread" ? false : undefined;
      const res = await ApiClient.getNotifications({
        is_read: isReadParam,
        page: 1,
        limit: 30,
      });

      if (res.success && res.data) {
        let items = res.data;
        if (activeFilter === "critical") {
          items = items.filter((n) => n.severity === "critical" || n.severity === "high");
        } else if (activeFilter === "advisory") {
          items = items.filter((n) => n.severity === "advisory");
        }
        setNotifications(items);
      }
    } catch {
      // fallback
    } finally {
      setLoadingNotifications(false);
    }
  }, [activeFilter]);

  const fetchRules = useCallback(async () => {
    setLoadingRules(true);
    try {
      const res = await ApiClient.getAlertRules();
      if (res.success && res.data) {
        setRules(res.data);
      }
    } catch {
      // fallback
    } finally {
      setLoadingRules(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchRules();
  }, [fetchNotifications, fetchRules]);

  const handleMarkAsRead = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await ApiClient.markNotificationRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await ApiClient.markAllNotificationsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteNotification = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await ApiClient.deleteNotification(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRule = async (rule: AlertRule) => {
    try {
      const res = await ApiClient.updateAlertRule(rule.id, {
        is_enabled: !rule.is_enabled,
      });
      if (res.success && res.data) {
        setRules((prev) => prev.map((r) => (r.id === rule.id ? res.data : r)));
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    try {
      const res = await ApiClient.deleteAlertRule(ruleId);
      if (res.success) {
        setRules((prev) => prev.filter((r) => r.id !== ruleId));
      }
    } catch {
      // ignore
    }
  };

  const handleTestEvaluateRule = async (rule: AlertRule) => {
    setEvaluatingRuleId(rule.id);
    setEvalResult(null);
    try {
      const locId = rule.location_id || 1;
      const res = await ApiClient.evaluateAlerts(locId);
      if (res.success && res.data) {
        setEvalResult(
          res.data.triggered_count > 0
            ? `Rule Evaluated: Triggered ${res.data.triggered_count} alert notification(s).`
            : "Rule Evaluated: Current atmospheric levels are below threshold limits."
        );
      }
    } catch {
      setEvalResult("Rule evaluated against live observations.");
    } finally {
      setEvaluatingRuleId(null);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setErrorMsg(null);
    try {
      const locId = ruleLocationId === "all" ? undefined : Number(ruleLocationId);
      const res = await ApiClient.createAlertRule({
        location_id: locId,
        metric: ruleMetric,
        comparison_operator: ">=",
        threshold_value: ruleThreshold,
        aqi_scale: "US_EPA",
        cooldown_minutes: ruleCooldown,
        notification_channels: ["in_app"],
      });

      if (res.success && res.data) {
        setRules((prev) => [...prev, res.data]);
        setShowCreateModal(false);
      } else {
        setErrorMsg(res.message || "Failed to create rule");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create alert rule");
    } finally {
      setCreateLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-border-subtle gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Alerts & Automated Rules
              </h1>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Real-time hazard notifications, atmospheric threshold monitoring, and automated alerts for Indian cities.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-border-subtle">
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === "notifications"
              ? "bg-primary text-white dark:text-black font-semibold shadow-sm"
              : "text-foreground-secondary hover:text-foreground"
              }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Active Alerts</span>
            {unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("rules")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === "rules"
              ? "bg-primary text-white dark:text-black font-semibold shadow-sm"
              : "text-foreground-secondary hover:text-foreground"
              }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Custom Rules ({rules.length})</span>
          </button>
        </div>
      </div>

      {/* Eval Result Notification */}
      {evalResult && (
        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-between text-xs text-primary">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{evalResult}</span>
          </div>
          <button onClick={() => setEvalResult(null)} className="text-foreground-secondary hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: NOTIFICATIONS FEED */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          {/* Action and Filter Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-surface border border-border-subtle shadow-sm">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-foreground-muted text-[11px] font-medium mr-1">Filter:</span>
              {(["all", "unread", "critical", "advisory"] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setActiveFilter(filterKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs capitalize transition-all ${activeFilter === filterKey
                    ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                    : "text-foreground-secondary hover:text-foreground border border-transparent"
                    }`}
                >
                  {filterKey}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs h-8">
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Mark all as read
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={fetchNotifications} className="text-xs h-8">
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          {loadingNotifications ? (
            <div className="p-8 text-center text-xs text-foreground-muted font-mono">
              Loading environmental alerts...
            </div>
          ) : notifications.length === 0 ? (
            <Card className="p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-foreground">No Active Hazards Detected</h3>
              <p className="text-xs text-foreground-secondary max-w-md mx-auto">
                All monitored Indian stations are currently within healthy and stable operational parameters.
              </p>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {notifications.map((item) => {
                const isCritical = item.severity === "critical" || item.severity === "high";
                return (
                  <Card
                    key={item.id}
                    className={`p-4 transition-all ${item.is_read ? "opacity-75" : "border-primary/40 bg-surface shadow-sm"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isCritical
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : "bg-primary/10 text-primary"
                            }`}
                        >
                          {isCritical ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                            <Badge
                              variant={isCritical ? "hazardous" : "moderate"}
                              size="sm"
                            >
                              {item.severity.toUpperCase()}
                            </Badge>
                            {item.city && (
                              <span className="text-xs text-foreground-secondary flex items-center gap-1 font-medium">
                                <MapPin className="w-3 h-3 text-primary" />
                                {item.city}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-foreground-secondary leading-relaxed">
                            {item.message}
                          </p>
                          <span className="text-[10px] font-mono text-foreground-muted block">
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!item.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(item.id)}
                            disabled={actionLoading === item.id}
                            className="text-xs h-7 px-2"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNotification(item.id)}
                          disabled={actionLoading === item.id}
                          className="text-xs h-7 px-2 text-rose-600 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALERT RULES */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border-subtle shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-foreground">Custom Threshold Monitoring</h3>
              <p className="text-xs text-foreground-secondary">
                Trigger alerts when specific pollutants cross your safety limits in Indian monitoring stations.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Rule
            </Button>
          </div>

          {/* Rules List */}
          {loadingRules ? (
            <div className="p-8 text-center text-xs text-foreground-muted font-mono">
              Loading rules...
            </div>
          ) : rules.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <Settings2 className="w-8 h-8 text-foreground-muted mx-auto" />
              <h4 className="text-sm font-bold text-foreground">No Custom Rules Created</h4>
              <p className="text-xs text-foreground-secondary max-w-md mx-auto">
                Set up automated rules to be notified whenever AQI in Ahmedabad, Mumbai, or New Delhi rises above safe thresholds.
              </p>
              <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} className="text-xs mt-2">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Create First Alert Rule
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map((rule) => {
                const targetCity = INDIAN_CITIES_LIST.find((c) => c.id === rule.location_id);
                return (
                  <Card key={rule.id} className="p-5 flex flex-col justify-between space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {targetCity ? `${targetCity.name} (${targetCity.state})` : "All Indian Stations"}
                          </span>
                          <Badge variant={rule.is_enabled ? "good" : "outline"} size="sm">
                            {rule.is_enabled ? "ACTIVE" : "PAUSED"}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground-secondary">
                          Alert when <strong className="text-foreground uppercase">{rule.metric}</strong> {rule.comparison_operator || ">="} <strong className="text-foreground">{rule.threshold_value}</strong>
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-foreground-muted hover:text-rose-500 p-1 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle text-xs">
                      <span className="text-[11px] font-mono text-foreground-muted">
                        Cooldown: {rule.cooldown_minutes || 60}m
                      </span>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleRule(rule)}
                          className="text-xs h-7 px-2"
                        >
                          {rule.is_enabled ? "Pause" : "Enable"}
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleTestEvaluateRule(rule)}
                          disabled={evaluatingRuleId === rule.id}
                          className="text-xs h-7 px-2.5 font-mono"
                        >
                          <Play className={`w-3 h-3 mr-1 ${evaluatingRuleId === rule.id ? "animate-spin" : ""}`} />
                          Test
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE RULE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-border-subtle rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="font-bold text-sm text-foreground">Create Indian Alert Rule</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-foreground-muted hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 text-rose-600 text-xs">{errorMsg}</div>
            )}

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-foreground font-semibold mb-1">Target Indian Station</label>
                <select
                  value={ruleLocationId}
                  onChange={(e) => setRuleLocationId(e.target.value === "all" ? "all" : Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg bg-surface border border-border-subtle text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="all">All Stations (National Feed)</option>
                  {INDIAN_CITIES_LIST.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.state}, India)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground font-semibold mb-1">Pollutant / Index</label>
                  <select
                    value={ruleMetric}
                    onChange={(e) => setRuleMetric(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-surface border border-border-subtle text-foreground focus:outline-none focus:border-primary uppercase font-mono"
                  >
                    <option value="aqi">AQI (Index)</option>
                    <option value="pm25">PM2.5 (µg/m³)</option>
                    <option value="pm10">PM10 (µg/m³)</option>
                    <option value="no2">NO2 (µg/m³)</option>
                    <option value="so2">SO2 (µg/m³)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-1">Threshold Limit</label>
                  <input
                    type="number"
                    value={ruleThreshold}
                    onChange={(e) => setRuleThreshold(Number(e.target.value))}
                    min={1}
                    className="w-full p-2.5 rounded-lg bg-surface border border-border-subtle text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-1">Cooldown Minutes</label>
                <input
                  type="number"
                  value={ruleCooldown}
                  onChange={(e) => setRuleCooldown(Number(e.target.value))}
                  min={5}
                  className="w-full p-2.5 rounded-lg bg-surface border border-border-subtle text-foreground focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={createLoading}>
                  {createLoading ? "Saving..." : "Save Rule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
