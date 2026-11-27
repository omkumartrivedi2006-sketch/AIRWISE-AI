"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Wind, Lock, Mail, Eye, EyeOff, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.replace(redirectPath.startsWith("/") ? redirectPath : "/dashboard");
    }
  }, [isAuthenticated, authLoading, redirectPath, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({
        email: email.trim(),
        password,
        remember_me: rememberMe,
      });
      router.replace(redirectPath.startsWith("/") ? redirectPath : "/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed. Please verify your credentials.";
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
            Welcome Back
          </h1>
          <p className="text-xs text-foreground-secondary">
            Sign in to access real-time environmental intelligence and personalized telemetry.
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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="text-xs font-mono text-foreground-secondary flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                Email Address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                aria-required="true"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-3.5 py-2 text-xs rounded-lg bg-surface border border-border-subtle focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-foreground placeholder:text-foreground-muted"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-xs font-mono text-foreground-secondary flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline font-mono"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  aria-required="true"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2 pr-10 text-xs rounded-lg bg-surface border border-border-subtle focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-foreground placeholder:text-foreground-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label
                htmlFor="login-remember"
                className="flex items-center gap-2 cursor-pointer select-none text-foreground-secondary"
              >
                <input
                  id="login-remember"
                  name="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border-subtle text-primary focus:ring-primary/40 bg-surface"
                />
                <span>Remember this session</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full text-xs font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Authenticating...
                </span>
              ) : (
                "Sign In to AIRWISE"
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-border-subtle text-center text-xs text-foreground-secondary">
            Don&apos;t have an account yet?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Create an account
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-foreground-muted">Loading login portal...</div>}>
      <LoginForm />
    </Suspense>
  );
}
