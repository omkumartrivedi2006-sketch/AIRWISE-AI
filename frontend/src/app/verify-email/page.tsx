"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Wind, CheckCircle2, AlertCircle, Mail, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ApiClient } from "@/services/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error" | "resend">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [resendEmail, setResendEmail] = useState<string>("");
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [resendSubmitted, setResendSubmitted] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (!token) {
      setStatus("resend");
      return;
    }

    async function executeVerification() {
      try {
        const res = await ApiClient.verifyEmail(token);
        if (isMounted && res.success) {
          setStatus("success");
        } else {
          if (isMounted) {
            setStatus("error");
            setErrorMessage(res.message || "Verification link is invalid or expired.");
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage(err instanceof Error ? err.message : "Email verification failed.");
        }
      }
    }

    executeVerification();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResendLoading(true);

    try {
      await ApiClient.resendVerification(resendEmail.trim());
      setResendSubmitted(true);
    } catch {
      setResendSubmitted(true);
    } finally {
      setResendLoading(false);
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
          Email Verification
        </h1>
        <p className="text-xs text-[#A5B0BC]">
          Securing your environmental intelligence access profile.
        </p>
      </div>

      <Card className="p-6 bg-[#141B23] border-white/[0.09] space-y-5 text-center">
        {status === "loading" && (
          <div className="py-8 space-y-3">
            <Loader2 className="w-8 h-8 text-[#28C7F5] animate-spin mx-auto" />
            <p className="text-xs font-mono text-[#A5B0BC]">Validating cryptographic token...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 py-4">
            <CheckCircle2 className="w-12 h-12 text-[#38E0B4] mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#F5F7FA]">Email Successfully Verified!</h3>
              <p className="text-xs text-[#A5B0BC]">
                Your account is confirmed and eligible for all platform capabilities.
              </p>
            </div>
            <Link href="/login" className="inline-block w-full pt-2">
              <Button variant="primary" size="md" className="w-full">
                Continue to Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        )}

        {(status === "error" || status === "resend") && (
          <div className="space-y-4 text-left">
            {status === "error" && (
              <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-400 font-mono">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage || "Verification link is invalid or has expired."}</span>
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#F5F7FA]">Request New Verification Link</h3>
              <p className="text-xs text-[#A5B0BC]">
                Enter your account email to receive a fresh verification link.
              </p>
            </div>

            {resendSubmitted ? (
              <div className="p-3 rounded-lg bg-[#38E0B4]/10 border border-[#38E0B4]/30 text-xs text-[#38E0B4] font-mono text-center">
                If an unverified account exists for this address, a new link has been dispatched.
              </div>
            ) : (
              <form onSubmit={handleResend} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#A5B0BC] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#28C7F5]" />
                    Account Email
                  </label>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    disabled={resendLoading}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50 disabled:opacity-50"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  disabled={!resendEmail.trim() || resendLoading}
                >
                  {resendLoading ? "Dispatching..." : "Resend Verification Email"}
                </Button>
              </form>
            )}

            <div className="pt-2 text-center">
              <Link href="/login" className="text-xs font-mono text-[#A5B0BC] hover:text-[#28C7F5]">
                Return to Sign In
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#28C7F5] animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
