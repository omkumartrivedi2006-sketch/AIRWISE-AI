"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Wind, Lock, Mail, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push(redirectPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed. Please verify your credentials.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-20 space-y-8">
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
          Welcome Back
        </h1>
        <p className="text-xs text-[#A5B0BC]">
          Sign in to continue exploring environmental intelligence with AIRWISE AI.
        </p>
      </div>

      <Card className="p-6 bg-[#141B23] border-white/[0.09] space-y-5">
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-400 font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A5B0BC] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#28C7F5]" />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-[#A5B0BC] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#38E0B4]" />
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-mono text-[#28C7F5] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A8D] hover:text-[#F5F7FA] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded bg-[#10151B] border-white/[0.12] text-[#28C7F5] focus:ring-0"
            />
            <label htmlFor="remember" className="text-xs font-mono text-[#A5B0BC] cursor-pointer">
              Remember session on this device
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
              </span>
            ) : (
              "Sign In to AIRWISE"
            )}
          </Button>
        </form>

        <div className="pt-4 border-t border-white/[0.06] text-center text-xs text-[#A5B0BC]">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="text-[#28C7F5] font-semibold hover:underline">
            Create an account
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#28C7F5] animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
