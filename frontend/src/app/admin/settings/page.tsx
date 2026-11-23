"use client";

import React, { useState } from "react";
import {
  Settings,
  Shield,
  Database,
  Cpu,
  Bell,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Server,
  KeyRound,
  FileCode,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">Platform Configuration & Policy</h1>
        <p className="text-sm text-[#A5B0BC] mt-1">
          System parameters, security invariants, environmental ingestion limits, and runtime flags.
        </p>
      </div>

      {/* Security Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Zero Secret Exposure Policy:</strong> High-entropy cryptographic secrets (JWT private keys, Google Gemini API keys, WAQI tokens) are kept strictly server-side and never exposed over client administrative APIs.
          </span>
        </div>
        <span className="hidden sm:inline font-mono bg-amber-500/20 px-2 py-0.5 rounded text-[10px]">
          RBAC LEVEL: ADMIN
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Platform Identity */}
        <div className="p-5 rounded-xl bg-[#10151B] border border-white/[0.09] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.09]">
            <Server className="w-4 h-4 text-[#28C7F5]" />
            <h2 className="font-semibold text-sm text-[#F5F7FA]">Platform Identity & Environment</h2>
          </div>
          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-[#A5B0BC]">Application Name:</span>
              <span className="text-[#F5F7FA] font-medium">AIRWISE AI</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-[#A5B0BC]">API Version:</span>
              <span className="text-[#38E0B4]">v1.0.0 (FastAPI)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-[#A5B0BC]">Environment:</span>
              <span className="text-emerald-400 font-semibold">PRODUCTION / HYBRID</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-[#A5B0BC]">API Prefix:</span>
              <span className="text-[#F5F7FA]">/api/v1</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#A5B0BC]">Interactive OpenAPI:</span>
              <span className="text-[#28C7F5]">/docs & /redoc</span>
            </div>
          </div>
        </div>

        {/* Card 2: Security & Authentication */}
        <div className="p-5 rounded-xl bg-[#10151B] border border-white/[0.09] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.09]">
            <Shield className="w-4 h-4 text-[#38E0B4]" />
            <h2 className="font-semibold text-sm text-[#F5F7FA]">Security & Access Control (RBAC)</h2>
          </div>
          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-[#A5B0BC]">Token Scheme:</span>
              <span className="text-[#F5F7FA]">JWT Bearer (HS256)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-[#A5B0BC]">Access Token TTL:</span>
              <span className="text-[#F5F7FA]">60 Minutes</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-[#A5B0BC]">Password Hash:</span>
              <span className="text-[#F5F7FA]">Argon2id (Salted)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-[#A5B0BC]">Self-Deactivation Guard:</span>
              <span className="text-[#38E0B4]">ENFORCED</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#A5B0BC]">Last Admin Demotion Guard:</span>
              <span className="text-[#38E0B4]">ENFORCED</span>
            </div>
          </div>
        </div>

        {/* Card 3: Environmental Data Pipeline */}
        <div className="p-5 rounded-xl bg-[#10151B] border border-white/[0.09] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.09]">
            <Database className="w-4 h-4 text-cyan-400" />
            <h2 className="font-semibold text-sm text-[#F5F7FA]">Environmental Ingestion Pipelines</h2>
          </div>
          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-[#A5B0BC]">Primary Feed:</span>
              <span className="text-[#28C7F5]">Open-Meteo Air Quality</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-[#A5B0BC]">Secondary Ground Station:</span>
              <span className="text-[#28C7F5]">WAQI / AQICN Network</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-[#A5B0BC]">Cache Expiration (TTL):</span>
              <span className="text-[#F5F7FA]">900 Seconds (15 min)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-[#A5B0BC]">Physical Value Immutability:</span>
              <span className="text-[#38E0B4]">STRICT INVARIANT</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#A5B0BC]">Anomalous Outlier Filter:</span>
              <span className="text-[#38E0B4]">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Card 4: AI & Gemini Assistant Configuration */}
        <div className="p-5 rounded-xl bg-[#10151B] border border-white/[0.09] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.09]">
            <Cpu className="w-4 h-4 text-purple-400" />
            <h2 className="font-semibold text-sm text-[#F5F7FA]">AI Engine & Intelligence Guardrails</h2>
          </div>
          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-[#A5B0BC]">Primary LLM:</span>
              <span className="text-purple-300">Google Gemini 1.5 Flash</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-[#A5B0BC]">Heuristic Fallback Engine:</span>
              <span className="text-[#38E0B4]">ENABLED</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-[#A5B0BC]">Context Injection:</span>
              <span className="text-[#F5F7FA]">Live AQI + User Health Profile</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-[#A5B0BC]">Streaming Responses:</span>
              <span className="text-[#38E0B4]">ACTIVE (SSE)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#A5B0BC]">Daily API Consumption Ceiling:</span>
              <span className="text-[#F5F7FA]">1,500 Requests / 24h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Governance & Compliance Footer Note */}
      <div className="p-5 rounded-xl bg-[#10151B] border border-white/[0.09] text-xs text-[#A5B0BC] space-y-2">
        <div className="flex items-center gap-2 font-semibold text-[#F5F7FA]">
          <CheckCircle2 className="w-4 h-4 text-[#38E0B4]" />
          <span>Governance & Platform Compliance Summary</span>
        </div>
        <p>
          All administrative operations are permanently logged with authenticated actor attribution in the
          <code className="text-[#28C7F5] bg-[#141B23] px-1.5 py-0.5 rounded mx-1 font-mono">audit_logs</code>
          table. Any modifications to user privilege tiers or environmental observation quality status produce a tamper-evident audit trail with IP address tracking and state delta tracking.
        </p>
      </div>
    </div>
  );
}
