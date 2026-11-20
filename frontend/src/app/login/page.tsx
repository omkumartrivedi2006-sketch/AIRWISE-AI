"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Wind, ArrowRight, ShieldCheck, Lock, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
          Sign In to Your Account
        </h1>
        <p className="text-xs text-[#A5B0BC]">
          Access personalized environmental exposure profiles and alerts.
        </p>
      </div>

      {/* Module Placeholder Notice */}
      <div className="p-3.5 rounded-lg bg-[#141B23] border border-amber-500/25 flex items-center gap-2 text-xs text-[#A5B0BC] font-mono">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span>
          <strong className="text-[#F5F7FA]">Authentication Placeholder:</strong> User account registration and authentication flows will be activated in upcoming modules.
        </span>
      </div>

      <Card className="p-6 bg-[#141B23] border-white/[0.09] space-y-5">
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
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A5B0BC] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#38E0B4]" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50"
            />
          </div>

          {submitted && (
            <div className="p-3 rounded-lg bg-[#28C7F5]/10 border border-[#28C7F5]/30 text-xs text-[#28C7F5] font-mono">
              ✓ UI Demonstration: In Module 05, this form signs into your PostgreSQL profile.
            </div>
          )}

          <Button type="submit" variant="primary" size="md" className="w-full">
            Sign In
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="pt-4 border-t border-white/[0.06] text-center text-xs text-[#A5B0BC]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#28C7F5] hover:underline font-medium">
            Create an account
          </Link>
        </div>
      </Card>

      <div className="text-center">
        <Link href="/" className="text-xs text-[#6B7A8D] hover:text-[#A5B0BC] transition-colors">
          ← Back to AIRWISE AI Homepage
        </Link>
      </div>
    </div>
  );
}
