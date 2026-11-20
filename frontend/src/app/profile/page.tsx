"use client";

import React, { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
} from "lucide-react";
import { ApiClient } from "@/services/api";

function ProfileContent() {
  const { user, logout, logoutAll, updateProfile } = useAuth();

  // Profile Edit State
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [profileImage, setProfileImage] = useState(user?.profile_image || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/[0.09] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-[#28C7F5]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F7FA] tracking-tight">
              User Profile & Security
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#A5B0BC] mt-1">
            Manage your account credentials, security preferences, and personal details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={user?.role === "ADMIN" ? "cyan" : "outline"}
            size="md"
            className="font-mono text-xs"
          >
            Role: {user?.role || "USER"}
          </Badge>
          <Badge
            variant={user?.is_verified ? "good" : "sensitive"}
            size="md"
            className="font-mono text-xs"
          >
            {user?.is_verified ? "Email Verified" : "Unverified Email"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Overview Card */}
        <Card className="lg:col-span-1 p-6 bg-[#141B23] border-white/[0.09] space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#28C7F5]/20 to-[#38E0B4]/20 border border-[#28C7F5]/40 flex items-center justify-center text-2xl font-bold font-mono text-[#28C7F5]">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F5F7FA]">
                {user?.full_name || "AIRWISE User"}
              </h2>
              <p className="text-xs font-mono text-[#A5B0BC]">{user?.email}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between text-[#A5B0BC]">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#28C7F5]" /> Member Since:
              </span>
              <span className="text-[#F5F7FA]">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between text-[#A5B0BC]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#38E0B4]" /> Last Sign In:
              </span>
              <span className="text-[#F5F7FA]">
                {user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Active Now"}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="w-full text-xs font-mono text-rose-400 hover:text-rose-300 border-rose-500/30 hover:bg-rose-500/10"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutAll()}
              className="w-full text-[11px] font-mono text-[#6B7A8D] hover:text-[#A5B0BC]"
            >
              Terminate All Active Sessions
            </Button>
          </div>
        </Card>

        {/* Right Column: Update Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form 1: Profile Details */}
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
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B]/50 border border-white/[0.05] text-sm text-[#6B7A8D] cursor-not-allowed font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#A5B0BC]">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Name"
                  required
                  disabled={profileLoading}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#A5B0BC]">Profile Image URL (Optional)</label>
                <input
                  type="url"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  placeholder="https://..."
                  disabled={profileLoading}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50 disabled:opacity-50"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="md" disabled={profileLoading}>
                  {profileLoading ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Form 2: Change Password */}
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
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={passwordLoading}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#A5B0BC]">New Password (12+ chars)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    disabled={passwordLoading}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#A5B0BC]">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    disabled={passwordLoading}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50 disabled:opacity-50"
                  />
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
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
