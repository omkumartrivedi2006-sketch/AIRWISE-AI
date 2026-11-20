import React from "react";
import Link from "next/link";
import { Wind, ShieldCheck, HeartPulse, Sparkles, Layers, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[#6B7A8D] hover:text-[#28C7F5] transition-colors font-mono">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
        </Link>
        <div className="inline-flex items-center gap-2">
          <Badge variant="cyan" size="sm">
            PRODUCT MISSION
          </Badge>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#F5F7FA] tracking-tight font-sans">
          About <span className="text-gradient-cyan">AIRWISE AI</span>
        </h1>
        <p className="text-base sm:text-lg text-[#A5B0BC] leading-relaxed">
          Democratizing environmental intelligence and safeguarding public health through scientifically-grounded GenAI assistance.
        </p>
      </div>

      {/* Core Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-[#141B23] border-white/[0.09] space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#10151B] border border-white/[0.09] flex items-center justify-center text-[#28C7F5]">
            <HeartPulse className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[#F5F7FA]">Human-Centered Protection</h3>
          <p className="text-xs sm:text-sm text-[#A5B0BC] leading-relaxed">
            Every year, ambient and household air pollution causes over 7 million premature deaths globally. AIRWISE AI translates dense sensor telemetry into clear, tailored protective steps for vulnerable individuals, families, and communities.
          </p>
        </Card>

        <Card className="p-6 bg-[#141B23] border-white/[0.09] space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#10151B] border border-white/[0.09] flex items-center justify-center text-[#38E0B4]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[#F5F7FA]">Grounded Science</h3>
          <p className="text-xs sm:text-sm text-[#A5B0BC] leading-relaxed">
            Our guidance strictly adheres to the World Health Organization (WHO) 2021 Global Air Quality Guidelines and US-EPA National Ambient Air Quality Standards (NAAQS). We never fabricate sensor readings or make unverified medical claims.
          </p>
        </Card>
      </div>

      {/* Architecture Principles */}
      <Card className="p-6 sm:p-8 bg-[#10151B] border-white/[0.09] space-y-6">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#28C7F5]" />
          <h2 className="text-xl font-bold text-[#F5F7FA]">
            Architectural Principles
          </h2>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-[#A5B0BC]">
          <div className="p-4 rounded-lg bg-[#141B23] border border-white/[0.06] space-y-1">
            <h4 className="font-semibold text-[#F5F7FA]">1. Strict Client-Side Security Boundary</h4>
            <p>
              Private API keys (such as `GEMINI_API_KEY`) and database credentials exist exclusively on the server. The frontend accesses capabilities only through verified, rate-limited `/api/v1` routes.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#141B23] border border-white/[0.06] space-y-1">
            <h4 className="font-semibold text-[#F5F7FA]">2. Zero Fake Telemetry Guarantee</h4>
            <p>
              When live sensor feeds are not yet active or during offline demonstration mode, data is transparently flagged as sample or simulated data. We never deceive users with invented environmental readings.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#141B23] border border-white/[0.06] space-y-1">
            <h4 className="font-semibold text-[#F5F7FA]">3. Progressive Multi-Module Lifecycle</h4>
            <p>
              AIRWISE AI is architected across 12 progressive phases: from project foundation (Module 01) and complete UI/UX (Module 02) to real-time ingestion, AI agent reasoning, geospatial mapping, and cloud deployment.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
