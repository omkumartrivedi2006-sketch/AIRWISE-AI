import React from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[#6B7A8D] hover:text-[#28C7F5] transition-colors font-mono">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Homepage
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#F5F7FA]">Terms of Service</h1>
        <p className="text-xs font-mono text-[#6B7A8D]">Last Updated: November 2026 • Module 02 Specification</p>
      </div>

      <Card className="p-6 sm:p-8 bg-[#141B23] border-white/[0.09] space-y-6 text-xs sm:text-sm text-[#A5B0BC] leading-relaxed">
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-[#F5F7FA]">1. Environmental Intelligence & Advisory Scope</h3>
          <p>
            AIRWISE AI provides informational environmental telemetry, air quality indexing, and general health precautions grounded in established WHO and US-EPA guidelines. AIRWISE AI is an advisory tool and does not provide formal medical diagnosis or emergency healthcare interventions.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-[#F5F7FA]">2. Sensor Telemetry Disclaimers</h3>
          <p>
            Ambient air pollution measurements are subject to sensor calibration, micro-climate weather variations, and regional transmission delays. Users experiencing acute respiratory or cardiovascular distress must seek certified medical emergency care immediately.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-[#F5F7FA]">3. Acceptable Use</h3>
          <p>
            Users agree not to scrape, overload, or bypass security boundaries of the AIRWISE AI backend API ingress. Usage must comply with applicable regional telecommunications and internet safety laws.
          </p>
        </section>
      </Card>
    </div>
  );
}
