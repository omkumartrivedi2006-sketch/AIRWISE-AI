"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Mail,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Calendar,
  Clock,
  Loader2,
  Lock,
  Sliders,
  MapPin,
  Bell,
  Plus,
  Trash2,
  Star,
  Search,
  ExternalLink,
  VolumeX,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ApiClient } from "@/services/api";
import {
  UserPreferences,
  SavedLocation,
  LocationSearchResult,
} from "@/types";

const AVAILABLE_INTERESTS = [
  { id: "air_pollution", label: "Air Pollution & Particulates (PM2.5/PM10)" },
  { id: "water_pollution", label: "Water Quality & Watershed Safety" },
  { id: "noise_pollution", label: "Acoustic & Noise Pollution" },
  { id: "soil_pollution", label: "Soil & Heavy Metal Contamination" },
  { id: "sustainable_living", label: "Sustainable Habits & Clean Living" },
  { id: "environmental_awareness", label: "Environmental Science & Climate Education" },
];

const AVAILABLE_INFO = [
  { id: "aqi_updates", label: "Real-Time AQI Index Updates" },
  { id: "pollutant_measurements", label: "Specific Pollutant Breakdown (µg/m³)" },
  { id: "historical_trends", label: "Diurnal & Multi-Day Trend Charts" },
  { id: "recommendations", label: "Personalized Behavioral & Health Directives" },
  { id: "educational_info", label: "Educational & Preventive Guidance" },
];

function ProfileContent() {
  const { user, logout, logoutAll, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"account" | "preferences" | "locations" | "notifications">("account");

  // Account State
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [profileImage, setProfileImage] = useState(user?.profile_image || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Preferences State
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState(false);
  const [prefError, setPrefError] = useState<string | null>(null);

  // Saved Locations State
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Geocoding Search for adding new saved location
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [newCustomName, setNewCustomName] = useState("");
  const [selectedResult, setSelectedResult] = useState<LocationSearchResult | null>(null);

  // Fetch initial preferences & saved locations
  const fetchPreferencesAndLocations = useCallback(async () => {
    try {
      const [prefRes, locRes] = await Promise.all([
        ApiClient.getMyPreferences(),
        ApiClient.getSavedLocations(),
      ]);
      if (prefRes.success && prefRes.data) {
        setPreferences(prefRes.data);
      }
      if (locRes.success && locRes.data) {
        setSavedLocations(locRes.data);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchPreferencesAndLocations();
  }, [fetchPreferencesAndLocations]);

  // Account Form Handler
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);

    try {
      await updateProfile({
        full_name: fullName.trim(),
        profile_image: profileImage.trim() || undefined,
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile attributes.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Password Form Handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 12) {
      setPasswordError("New password must be at least 12 characters.");
      return;
    }

    setPasswordLoading(true);
    try {
      await ApiClient.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Password change failed. Verify your current password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Preferences Form Handler
  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferences) return;
    setPrefError(null);
    setPrefSuccess(false);
    setPrefLoading(true);

    try {
      const res = await ApiClient.updateMyPreferences({
        preferred_language: preferences.preferred_language,
        timezone: preferences.timezone,
        temperature_unit: preferences.temperature_unit,
        preferred_aqi_scale: preferences.preferred_aqi_scale,
        environmental_interests: preferences.environmental_interests,
        preferred_information: preferences.preferred_information,
        quiet_hours_enabled: preferences.quiet_hours_enabled,
        quiet_hours_start: preferences.quiet_hours_start,
        quiet_hours_end: preferences.quiet_hours_end,
        in_app_notifications: preferences.in_app_notifications,
        email_notifications: preferences.email_notifications,
        push_notifications: preferences.push_notifications,
      });

      if (res.success && res.data) {
        setPreferences(res.data);
        setPrefSuccess(true);
        setTimeout(() => setPrefSuccess(false), 3000);
      } else {
        setPrefError(res.message || "Failed to update preferences");
      }
    } catch (err: unknown) {
      setPrefError(err instanceof Error ? err.message : "Failed to save preferences");
    } finally {
      setPrefLoading(false);
    }
  };

  // Location Search Handler
  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const res = await ApiClient.searchLocations(searchQuery.trim());
      if (res.success && res.data) {
        setSearchResults(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setSearchLoading(false);
    }
  };

  // Add Location Handler
  const handleAddLocation = async (result: LocationSearchResult) => {
    setLocLoading(true);
    setLocError(null);
    try {
      // First ensure location exists by triggering a latest pollution fetch
      const pollRes = await ApiClient.getLatestPollutionForLocation({
        city: result.name,
        lat: result.latitude,
        lon: result.longitude,
      });

      if (pollRes.success && pollRes.data?.location_id) {
        const saveRes = await ApiClient.addSavedLocation({
          location_id: pollRes.data.location_id,
          custom_name: newCustomName.trim() || result.name,
          is_primary: savedLocations.length === 0,
        });

        if (saveRes.success && saveRes.data) {
          setSavedLocations((prev) => [saveRes.data, ...prev.filter((l) => l.id !== saveRes.data.id)]);
          setSearchQuery("");
          setSearchResults([]);
          setSelectedResult(null);
          setNewCustomName("");
        }
      } else {
        setLocError("Could not resolve location coordinates in database.");
      }
    } catch (err: unknown) {
      setLocError(err instanceof Error ? err.message : "Failed to save location");
    } finally {
      setLocLoading(false);
    }
  };

  const handleSetPrimary = async (savedLocId: number) => {
    try {
      const res = await ApiClient.updateSavedLocation(savedLocId, { is_primary: true });
      if (res.success) {
        setSavedLocations((prev) =>
          prev.map((l) => ({ ...l, is_primary: l.id === savedLocId }))
        );
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteSavedLocation = async (savedLocId: number) => {
    try {
      const res = await ApiClient.deleteSavedLocation(savedLocId);
      if (res.success) {
        setSavedLocations((prev) => prev.filter((l) => l.id !== savedLocId));
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/[0.09] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-[#28C7F5]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F7FA] tracking-tight">
              Personalized Settings & Profile
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#A5B0BC] mt-1 font-mono">
            Customize your environmental thresholds, saved locations, telemetry preferences, and credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={user?.role === "ADMIN" ? "cyan" : "outline"} size="md" className="font-mono text-xs">
            Role: {user?.role || "USER"}
          </Badge>
          <Badge variant={user?.is_verified ? "good" : "sensitive"} size="md" className="font-mono text-xs">
            {user?.is_verified ? "Email Verified" : "Unverified"}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-3">
        <button
          onClick={() => setActiveTab("account")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all ${
            activeTab === "account"
              ? "bg-[#28C7F5] text-black font-semibold shadow-md shadow-[#28C7F5]/20"
              : "bg-[#141B23] text-[#A5B0BC] hover:text-[#F5F7FA] border border-white/[0.06]"
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" /> Account & Security
        </button>
        <button
          onClick={() => setActiveTab("preferences")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all ${
            activeTab === "preferences"
              ? "bg-[#28C7F5] text-black font-semibold shadow-md shadow-[#28C7F5]/20"
              : "bg-[#141B23] text-[#A5B0BC] hover:text-[#F5F7FA] border border-white/[0.06]"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Personal Preferences
        </button>
        <button
          onClick={() => setActiveTab("locations")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all ${
            activeTab === "locations"
              ? "bg-[#28C7F5] text-black font-semibold shadow-md shadow-[#28C7F5]/20"
              : "bg-[#141B23] text-[#A5B0BC] hover:text-[#F5F7FA] border border-white/[0.06]"
          }`}
        >
          <MapPin className="w-3.5 h-3.5" /> Saved Locations ({savedLocations.length})
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all ${
            activeTab === "notifications"
              ? "bg-[#28C7F5] text-black font-semibold shadow-md shadow-[#28C7F5]/20"
              : "bg-[#141B23] text-[#A5B0BC] hover:text-[#F5F7FA] border border-white/[0.06]"
          }`}
        >
          <Bell className="w-3.5 h-3.5" /> Notification Channels & Quiet Hours
        </button>
      </div>

      {/* TAB 1: ACCOUNT & CREDENTIALS */}
      {activeTab === "account" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 p-6 bg-[#141B23] border-white/[0.09] space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#28C7F5]/20 to-[#38E0B4]/20 border border-[#28C7F5]/40 flex items-center justify-center text-2xl font-bold font-mono text-[#28C7F5]">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-[#F5F7FA]">{user?.full_name || "AIRWISE User"}</h2>
                <p className="text-xs font-mono text-[#A5B0BC]">{user?.email}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between text-[#A5B0BC]">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#28C7F5]" /> Member Since:</span>
                <span className="text-[#F5F7FA]">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</span>
              </div>
              <div className="flex items-center justify-between text-[#A5B0BC]">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#38E0B4]" /> Last Sign In:</span>
                <span className="text-[#F5F7FA]">{user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Active Now"}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] space-y-2">
              <Button variant="outline" size="sm" onClick={() => logout()} className="w-full text-xs font-mono text-rose-400 hover:text-rose-300 border-rose-500/30 hover:bg-rose-500/10">
                <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
              </Button>
              <Button variant="ghost" size="sm" onClick={() => logoutAll()} className="w-full text-[11px] font-mono text-[#6B7A8D] hover:text-[#A5B0BC]">
                Terminate All Active Sessions
              </Button>
            </div>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-[#141B23] border-white/[0.09] space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#F5F7FA] flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#28C7F5]" /> Profile Information
              </h3>
              {profileError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}
              {profileSuccess && (
                <div className="p-3 rounded-lg bg-[#38E0B4]/10 border border-[#38E0B4]/30 text-xs text-[#38E0B4] font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Profile attributes updated successfully.</span>
                </div>
              )}
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#A5B0BC]">Email Address (Immutable)</label>
                  <input type="email" value={user?.email || ""} disabled className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B]/50 border border-white/[0.05] text-sm text-[#6B7A8D] cursor-not-allowed font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#A5B0BC]">Full Name</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={profileLoading} className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#A5B0BC]">Profile Image URL</label>
                  <input type="url" value={profileImage} onChange={(e) => setProfileImage(e.target.value)} placeholder="https://..." disabled={profileLoading} className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50" />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" size="md" disabled={profileLoading}>
                    {profileLoading ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="p-6 bg-[#141B23] border-white/[0.09] space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#F5F7FA] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#38E0B4]" /> Change Password
              </h3>
              {passwordError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 rounded-lg bg-[#38E0B4]/10 border border-[#38E0B4]/30 text-xs text-[#38E0B4] font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Password updated. Other active sessions have been terminated.</span>
                </div>
              )}
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#A5B0BC]">Current Password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required disabled={passwordLoading} className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]/50" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-[#A5B0BC]">New Password (12+ chars)</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={passwordLoading} className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]/50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-[#A5B0BC]">Confirm New Password</label>
                    <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required disabled={passwordLoading} className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]/50" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" size="md" disabled={passwordLoading}>
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONAL PREFERENCES */}
      {activeTab === "preferences" && preferences && (
        <Card className="p-6 bg-[#141B23] border-white/[0.09] space-y-6">
          <div className="pb-3 border-b border-white/[0.06]">
            <h3 className="text-base font-bold font-mono text-[#F5F7FA] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#28C7F5]" /> Environmental & Measurement Preferences
            </h3>
            <p className="text-xs font-mono text-[#A5B0BC] mt-1">
              Configure your default measurement standards, display units, and environmental learning interests.
            </p>
          </div>

          {prefError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-mono">
              {prefError}
            </div>
          )}
          {prefSuccess && (
            <div className="p-3 rounded-lg bg-[#38E0B4]/10 border border-[#38E0B4]/30 text-xs text-[#38E0B4] font-mono">
              Preferences updated successfully.
            </div>
          )}

          <form onSubmit={handlePreferencesSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#A5B0BC] mb-1">Temperature Unit</label>
                <select
                  value={preferences.temperature_unit}
                  onChange={(e) => setPreferences({ ...preferences, temperature_unit: e.target.value as "C" | "F" })}
                  className="w-full bg-[#10151B] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
                >
                  <option value="C">Celsius (°C)</option>
                  <option value="F">Fahrenheit (°F)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5B0BC] mb-1">Preferred AQI Standard</label>
                <select
                  value={preferences.preferred_aqi_scale}
                  onChange={(e) => setPreferences({ ...preferences, preferred_aqi_scale: e.target.value as "US_EPA" | "IN_NAAQS" })}
                  className="w-full bg-[#10151B] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
                >
                  <option value="US_EPA">US EPA Standard (0–500)</option>
                  <option value="IN_NAAQS">Indian NAAQS Standard (0–500)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5B0BC] mb-1">Timezone</label>
                <input
                  type="text"
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  className="w-full bg-[#10151B] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5B0BC] mb-1">Interface Language</label>
                <select
                  value={preferences.preferred_language}
                  onChange={(e) => setPreferences({ ...preferences, preferred_language: e.target.value })}
                  className="w-full bg-[#10151B] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
                >
                  <option value="en">English (US/UK)</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="hi">हिन्दी</option>
                </select>
              </div>
            </div>

            {/* Environmental Interests Multi-Select */}
            <div className="space-y-3 pt-3 border-t border-white/[0.06]">
              <label className="block text-xs font-bold font-mono text-[#F5F7FA]">
                Environmental Focus Areas
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AVAILABLE_INTERESTS.map((interest) => {
                  const checked = preferences.environmental_interests.includes(interest.id);
                  return (
                    <label
                      key={interest.id}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-mono cursor-pointer transition-all ${
                        checked
                          ? "bg-[#28C7F5]/10 border-[#28C7F5]/30 text-[#F5F7FA]"
                          : "bg-[#10151B] border-white/[0.05] text-[#A5B0BC] hover:border-white/10"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...preferences.environmental_interests, interest.id]
                            : preferences.environmental_interests.filter((i) => i !== interest.id);
                          setPreferences({ ...preferences, environmental_interests: updated });
                        }}
                        className="rounded border-white/20 bg-[#10151B] text-[#28C7F5]"
                      />
                      <span>{interest.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Preferred Information Types */}
            <div className="space-y-3 pt-3 border-t border-white/[0.06]">
              <label className="block text-xs font-bold font-mono text-[#F5F7FA]">
                Preferred Information Streams
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AVAILABLE_INFO.map((info) => {
                  const checked = preferences.preferred_information.includes(info.id);
                  return (
                    <label
                      key={info.id}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-mono cursor-pointer transition-all ${
                        checked
                          ? "bg-[#38E0B4]/10 border-[#38E0B4]/30 text-[#F5F7FA]"
                          : "bg-[#10151B] border-white/[0.05] text-[#A5B0BC] hover:border-white/10"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...preferences.preferred_information, info.id]
                            : preferences.preferred_information.filter((i) => i !== info.id);
                          setPreferences({ ...preferences, preferred_information: updated });
                        }}
                        className="rounded border-white/20 bg-[#10151B] text-[#38E0B4]"
                      />
                      <span>{info.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/[0.06]">
              <Button type="submit" disabled={prefLoading} className="font-mono text-xs bg-[#28C7F5] hover:bg-[#28C7F5]/90 text-black">
                {prefLoading ? "Saving Preferences..." : "Save Preferences"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 3: SAVED LOCATIONS */}
      {activeTab === "locations" && (
        <div className="space-y-6">
          <Card className="p-6 bg-[#141B23] border-white/[0.09] space-y-4">
            <div className="pb-3 border-b border-white/[0.06]">
              <h3 className="text-base font-bold font-mono text-[#F5F7FA] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#28C7F5]" /> Add New Monitored Location
              </h3>
              <p className="text-xs font-mono text-[#A5B0BC] mt-1">
                Search global air monitoring stations via Open-Meteo geocoding to bookmark in your personal portfolio.
              </p>
            </div>

            {locError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-mono">
                {locError}
              </div>
            )}

            <form onSubmit={handleLocationSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city (e.g. London, Tokyo, Delhi)..."
                className="flex-1 bg-[#10151B] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F7FA] focus:outline-none focus:border-[#28C7F5]"
              />
              <Button type="submit" disabled={searchLoading} className="font-mono text-xs bg-[#28C7F5] text-black">
                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </form>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-mono text-[#6B7A8D]">Select location to add:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchResults.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[#10151B] border border-white/[0.08] hover:border-[#28C7F5]/50 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#F5F7FA] font-mono">{r.name}</div>
                        <div className="text-[10px] text-[#A5B0BC] font-mono">{r.country} ({r.latitude.toFixed(2)}, {r.longitude.toFixed(2)})</div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddLocation(r)}
                        disabled={locLoading}
                        className="h-7 text-[11px] font-mono bg-[#38E0B4] text-black hover:bg-[#38E0B4]/90"
                      >
                        Bookmark
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Saved Locations List */}
          <Card className="p-6 bg-[#141B23] border-white/[0.09] space-y-4">
            <h3 className="text-base font-bold font-mono text-[#F5F7FA] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#38E0B4]" /> Bookmarked Monitoring Stations
            </h3>

            {savedLocations.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-[#A5B0BC] space-y-2">
                <p>No saved locations yet.</p>
                <p className="text-[11px] text-[#6B7A8D]">Use the search bar above to bookmark your primary cities.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedLocations.map((loc) => (
                  <div
                    key={loc.id}
                    className="p-4 rounded-xl bg-[#10151B] border border-white/[0.06] flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#F5F7FA] font-mono">
                          {loc.custom_name || loc.city}
                        </span>
                        {loc.is_primary && (
                          <Badge variant="cyan" size="sm" className="text-[10px] flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> PRIMARY
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs font-mono text-[#A5B0BC]">
                        {loc.city}, {loc.country}
                        {loc.latest_aqi !== null && loc.latest_aqi !== undefined && (
                          <span className="ml-3 text-[#28C7F5]">
                            Latest AQI: <strong>{loc.latest_aqi}</strong> ({loc.latest_category || "Standard"})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!loc.is_primary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimary(loc.id)}
                          className="h-8 text-xs font-mono border-white/10 hover:border-white/20"
                        >
                          Make Primary
                        </Button>
                      )}
                      <Link href={`/dashboard?city=${encodeURIComponent(loc.city || "")}`}>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-mono text-[#28C7F5]">
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSavedLocation(loc.id)}
                        className="h-8 w-8 p-0 text-[#6B7A8D] hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS & QUIET HOURS */}
      {activeTab === "notifications" && preferences && (
        <Card className="p-6 bg-[#141B23] border-white/[0.09] space-y-6">
          <div className="pb-3 border-b border-white/[0.06]">
            <h3 className="text-base font-bold font-mono text-[#F5F7FA] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#28C7F5]" /> Alert Channels & Quiet Hours Policy
            </h3>
            <p className="text-xs font-mono text-[#A5B0BC] mt-1">
              Configure dispatch destinations and specify uninterrupted sleeping windows during which non-critical alerts are suppressed.
            </p>
          </div>

          <form onSubmit={handlePreferencesSubmit} className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold font-mono uppercase text-[#F5F7FA] tracking-wider">
                Notification Delivery Channels
              </h4>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3.5 rounded-lg bg-[#10151B] border border-white/[0.06] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.in_app_notifications}
                    onChange={(e) => setPreferences({ ...preferences, in_app_notifications: e.target.checked })}
                    className="mt-1 rounded border-white/20 bg-[#080A0D] text-[#28C7F5]"
                  />
                  <div>
                    <div className="text-xs font-bold font-mono text-[#F5F7FA]">In-App Notification Center</div>
                    <div className="text-[11px] font-mono text-[#A5B0BC]">
                      Persistent alert inbox in the application navbar with live unread badge counters.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-lg bg-[#10151B] border border-white/[0.06] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email_notifications}
                    onChange={(e) => setPreferences({ ...preferences, email_notifications: e.target.checked })}
                    className="mt-1 rounded border-white/20 bg-[#080A0D] text-[#28C7F5]"
                  />
                  <div>
                    <div className="text-xs font-bold font-mono text-[#F5F7FA]">Email Alert Directives (Opt-In)</div>
                    <div className="text-[11px] font-mono text-[#A5B0BC]">
                      Receive automated emails when hazardous environmental events occur.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-lg bg-[#10151B] border border-white/[0.06] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.push_notifications}
                    onChange={(e) => setPreferences({ ...preferences, push_notifications: e.target.checked })}
                    className="mt-1 rounded border-white/20 bg-[#080A0D] text-[#28C7F5]"
                  />
                  <div>
                    <div className="text-xs font-bold font-mono text-[#F5F7FA]">Browser Web Push Notifications</div>
                    <div className="text-[11px] font-mono text-[#A5B0BC]">
                      Receive instant desktop or mobile push banners for high-severity alerts.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="space-y-4 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase text-[#F5F7FA] tracking-wider flex items-center gap-1.5">
                    <VolumeX className="w-3.5 h-3.5 text-[#38E0B4]" /> Quiet Hours Window
                  </h4>
                  <p className="text-[11px] font-mono text-[#A5B0BC] mt-0.5">
                    During quiet hours, routine advisories are kept silent in the in-app center without sounding push or email alerts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.quiet_hours_enabled}
                  onChange={(e) => setPreferences({ ...preferences, quiet_hours_enabled: e.target.checked })}
                  className="rounded border-white/20 bg-[#10151B] text-[#38E0B4] scale-125"
                />
              </div>

              {preferences.quiet_hours_enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#10151B] border border-white/[0.04]">
                  <div>
                    <label className="block text-xs font-mono text-[#A5B0BC] mb-1">Quiet Hours Begin (24h)</label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_start}
                      onChange={(e) => setPreferences({ ...preferences, quiet_hours_start: e.target.value })}
                      className="w-full bg-[#080A0D] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F7FA]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#A5B0BC] mb-1">Quiet Hours End (24h)</label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_end}
                      onChange={(e) => setPreferences({ ...preferences, quiet_hours_end: e.target.value })}
                      className="w-full bg-[#080A0D] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F7FA]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/[0.06]">
              <Button type="submit" disabled={prefLoading} className="font-mono text-xs bg-[#28C7F5] hover:bg-[#28C7F5]/90 text-black">
                {prefLoading ? "Saving Settings..." : "Save Notification Preferences"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <AppLayout>
        <ProfileContent />
      </AppLayout>
    </AuthGuard>
  );
}
