"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Wind, Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ApiClient } from "@/services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setIsLoading(true);

    try {
      await ApiClient.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err: unknown) {
      // Return generic confirmation regardless of backend error to avoid enumeration
      setSubmitted(true);
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
          Reset Your Password
        </h1>
        <p className="text-xs text-[#A5B0BC]">
          Enter your registered email address to receive secure recovery instructions.
        </p>
      </div>

      <Card className="p-6 bg-[#141B23] border-white/[0.09] space-y-5">
        {error && (
          <div role="alert" aria-live="polite" className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-400 font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div role="status" className="p-4 rounded-lg bg-[#38E0B4]/10 border border-[#38E0B4]/30 space-y-3 text-center">
            <CheckCircle2 className="w-8 h-8 text-[#38E0B4] mx-auto" />
            <h3 className="text-sm font-bold text-[#F5F7FA]">Recovery Link Dispatched</h3>
            <p className="text-xs text-[#A5B0BC] leading-relaxed">
              If an account associated with <strong className="text-[#F5F7FA]">{email}</strong> exists, password reset instructions have been generated.
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button variant="outline" size="sm" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="forgot-email" className="text-xs font-mono text-[#A5B0BC] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#28C7F5]" />
                Registered Email
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                aria-required="true"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50 disabled:opacity-50"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              disabled={!email.trim() || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Dispatching...
                </span>
              ) : (
                "Send Recovery Instructions"
              )}
            </Button>
          </form>
        )}

        <div className="pt-4 border-t border-white/[0.06] text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#A5B0BC] hover:text-[#28C7F5] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}
