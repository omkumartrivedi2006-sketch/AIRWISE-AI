"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wind, Lock, Mail, User, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { register, login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  // Live Password Strength Requirements
  const hasMinLength = password.length >= 12;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_=+\\/~`]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const isFormValid =
    fullName.trim().length >= 2 &&
    email.trim().length > 0 &&
    hasMinLength &&
    hasLower &&
    hasUpper &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch &&
    agreedToTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError(null);
    setIsLoading(true);

    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
      });

      setSuccess(true);
      router.replace("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed. Please verify your details.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-8 sm:py-12">
      {/* Top Navigation Bar with Back Button */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between pb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-foreground-secondary hover:text-foreground transition-all duration-200 group px-3.5 py-1.5 rounded-lg bg-surface border border-border-subtle hover:border-primary/40 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-primary group-hover:-translate-x-0.5 transition-transform duration-200" />
          <span>Return to Landing Page</span>
        </Link>
        <span className="text-[11px] font-mono text-foreground-muted">AIRWISE AI</span>
      </div>

      <div className="w-full max-w-md mx-auto space-y-6 my-auto">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white dark:text-black shadow-sm group-hover:scale-105 transition-transform">
              <Wind className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-foreground">
              AIRWISE<span className="text-primary">.AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight mt-2">
            Create Your Account
          </h1>
          <p className="text-xs text-foreground-secondary">
            Join AIRWISE AI to track local air quality, save stations, and receive smart health alerts.
          </p>
        </div>

        <Card className="p-6 bg-surface border-border-subtle shadow-md space-y-5">
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300 font-mono"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            aria-live="polite"
            className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center text-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-mono"
          >
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span className="font-bold text-sm">Account Created Successfully!</span>
            <span>A verification token has been issued. Redirecting you to sign in...</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="reg-fullname"
                className="text-xs font-mono text-foreground-secondary flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                Full Name
              </label>
              <input
                id="reg-fullname"
                name="fullname"
                type="text"
                autoComplete="name"
                aria-required="true"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Elena Rostova"
                required
                disabled={isLoading}
                className="w-full px-3.5 py-2 text-xs rounded-lg bg-surface border border-border-subtle focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-foreground placeholder:text-foreground-muted disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-email"
                className="text-xs font-mono text-foreground-secondary flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                Email Address
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                aria-required="true"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="elena@example.com"
                required
                disabled={isLoading}
                className="w-full px-3.5 py-2 text-xs rounded-lg bg-surface border border-border-subtle focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-foreground placeholder:text-foreground-muted disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-password"
                className="text-xs font-mono text-foreground-secondary flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                Password (Argon2id Encrypted)
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  aria-required="true"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 12 characters"
                  required
                  disabled={isLoading}
                  className="w-full px-3.5 py-2 pr-10 text-xs rounded-lg bg-surface border border-border-subtle focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-foreground placeholder:text-foreground-muted disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Requirement Checklist */}
              <div
                role="status"
                aria-label="Password strength requirements"
                className="p-3 rounded-lg bg-background-secondary border border-border-subtle grid grid-cols-2 gap-1.5 text-[11px] font-mono mt-2"
              >
                <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-foreground-muted"}`}>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" /> 12+ Characters
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-foreground-muted"}`}>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" /> Uppercase (A-Z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-foreground-muted"}`}>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" /> Lowercase (a-z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-foreground-muted"}`}>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" /> Numeric (0-9)
                </div>
                <div className={`flex items-center gap-1.5 col-span-2 ${hasSpecial ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-foreground-muted"}`}>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" /> Symbol (!@#$%^&*)
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-confirm-password"
                className="text-xs font-mono text-foreground-secondary flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                Confirm Password
              </label>
              <input
                id="reg-confirm-password"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-required="true"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                disabled={isLoading}
                className={`w-full px-3.5 py-2 text-xs rounded-lg bg-surface border text-foreground placeholder:text-foreground-muted focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 ${confirmPassword && !passwordsMatch
                  ? "border-red-500/50 focus:border-red-500"
                  : "border-border-subtle focus:border-primary"
                  }`}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-[11px] font-mono text-red-500">Passwords do not match</p>
              )}
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-border-subtle text-primary focus:ring-0 bg-surface"
              />
              <label htmlFor="terms" className="text-xs text-foreground-secondary leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full text-xs font-semibold mt-2"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        )}

        <div className="pt-4 border-t border-border-subtle text-center text-xs text-foreground-secondary">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </Card>
    </div>

    {/* Subtle Footer */}
    <div className="text-center pt-8 pb-2 text-[11px] text-foreground-muted font-mono">
      AIRWISE AI &bull; Environmental &amp; Atmospheric Intelligence
    </div>
  </div>
  );
}
