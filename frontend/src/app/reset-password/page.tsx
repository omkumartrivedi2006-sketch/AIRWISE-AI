"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Wind, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ApiClient } from "@/services/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Requirements
  const hasMinLength = password.length >= 12;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_=+\\/~`]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const isFormValid =
    token.length > 0 &&
    hasMinLength &&
    hasLower &&
    hasUpper &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError(null);
    setIsLoading(true);

    try {
      await ApiClient.resetPassword({
        token,
        new_password: password,
        confirm_new_password: confirmPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Password reset failed. Token may be invalid or expired.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24 space-y-8">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#28C7F5] to-[#38E0B4] flex items-center justify-center shadow-cyan-glow">
            <Wind className="w-5 h-5 text-[#080A0D]" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xl tracking-tight text-[#F5F7FA]">
            AIRWISE<span className="text-[#28C7F5]">.AI</span>
          </span>
        </Link>
        <h1 className="text-2xl font-bold text-[#F5F7FA] mt-4">
          Choose a New Password
        </h1>
        <p className="text-xs text-[#A5B0BC]">
          Set a new, cryptographically secure password for your AIRWISE account.
        </p>
      </div>

      <Card className="p-6 bg-[#141B23] border-white/[0.09] space-y-5">
        {!token && (
          <div role="alert" aria-live="polite" className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-400 font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Missing password reset token. Please request a new recovery link.</span>
          </div>
        )}

        {error && (
          <div role="alert" aria-live="polite" className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-400 font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div role="status" className="p-4 rounded-lg bg-[#38E0B4]/10 border border-[#38E0B4]/30 space-y-3 text-center">
            <CheckCircle2 className="w-8 h-8 text-[#38E0B4] mx-auto" />
            <h3 className="text-sm font-bold text-[#F5F7FA]">Password Reset Completed</h3>
            <p className="text-xs text-[#A5B0BC]">
              Your password has been updated. All prior sessions have been revoked. Redirecting to login...
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button variant="primary" size="sm" className="w-full">
                  Sign In Now
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="reset-password" className="text-xs font-mono text-[#A5B0BC] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#38E0B4]" />
                New Password (Argon2id Encrypted)
              </label>
              <div className="relative">
                <input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  aria-required="true"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 12 characters"
                  required
                  disabled={isLoading || !token}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A8D] hover:text-[#F5F7FA] transition-colors focus:outline-none focus-visible:text-[#28C7F5]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Requirements Checklist */}
              <div role="status" aria-label="Password strength requirements" className="p-3 rounded-lg bg-[#10151B] border border-white/[0.06] grid grid-cols-2 gap-1.5 text-[11px] font-mono mt-2">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-[#38E0B4]" : "text-[#6B7A8D]"}`}>
                  <Check className="w-3.5 h-3.5" /> 12+ Characters
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? "text-[#38E0B4]" : "text-[#6B7A8D]"}`}>
                  <Check className="w-3.5 h-3.5" /> Uppercase (A-Z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? "text-[#38E0B4]" : "text-[#6B7A8D]"}`}>
                  <Check className="w-3.5 h-3.5" /> Lowercase (a-z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? "text-[#38E0B4]" : "text-[#6B7A8D]"}`}>
                  <Check className="w-3.5 h-3.5" /> Numeric Digit (0-9)
                </div>
                <div className={`flex items-center gap-1.5 col-span-2 ${hasSpecial ? "text-[#38E0B4]" : "text-[#6B7A8D]"}`}>
                  <Check className="w-3.5 h-3.5" /> Special Symbol (!@#$%^&*)
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reset-confirm-password" className="text-xs font-mono text-[#A5B0BC] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#38E0B4]" />
                Confirm New Password
              </label>
              <input
                id="reset-confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-required="true"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                required
                disabled={isLoading || !token}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none disabled:opacity-50 ${
                  confirmPassword && !passwordsMatch
                    ? "border-rose-500/50 focus:border-rose-500"
                    : "border-white/[0.09] focus:border-[#28C7F5]/50"
                }`}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-[11px] font-mono text-rose-400">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Updating Password...
                </span>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        )}

        <div className="pt-4 border-t border-white/[0.06] text-center">
          <Link
            href="/login"
            className="text-xs font-mono text-[#A5B0BC] hover:text-[#28C7F5] transition-colors"
          >
            Return to Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#28C7F5] animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
