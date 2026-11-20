import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[#6B7A8D] hover:text-[#28C7F5] transition-colors font-mono">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Homepage
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#F5F7FA]">Privacy Policy</h1>
        <p className="text-xs font-mono text-[#6B7A8D]">Last Updated: November 2026 • Module 02 Specification</p>
      </div>

      <Card className="p-6 sm:p-8 bg-[#141B23] border-white/[0.09] space-y-6 text-xs sm:text-sm text-[#A5B0BC] leading-relaxed">
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-[#F5F7FA]">1. Data Minimization & Security First</h3>
          <p>
            AIRWISE AI collects only the minimal environmental telemetry context necessary to calibrate air pollution advisories. We do not sell, rent, or monetize personal health condition information to third-party data brokers or advertisers.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-[#F5F7FA]">2. Server-Side AI Inference Boundary</h3>
          <p>
            All generative environmental intelligence queries are processed through server-side abstraction layers. Your personal credentials and sensitive parameters are never packaged into client-side browser bundles.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-[#F5F7FA]">3. Local Preference Storage</h3>
          <p>
            Vulnerability presets (such as asthma thresholds) are retained securely in session or persistent database stores with explicit user consent. You can modify or purge your sensitivity settings at any time.
          </p>
        </section>
      </Card>
    </div>
  );
}
