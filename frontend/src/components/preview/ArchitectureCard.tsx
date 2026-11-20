import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Layers, Server, Database, Sparkles, CheckCircle2 } from "lucide-react";

export const ArchitectureCard: React.FC = () => {
  return (
    <Card className="border-white/[0.1] bg-surface/80">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-white text-sm sm:text-base tracking-tight">
            System Architecture & Monorepo Boundaries
          </h3>
        </div>
        <Badge variant="cyan" size="sm">
          Clean Monolithic Separation
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-5">
        {/* Tier 1: Frontend */}
        <div className="p-4 rounded-xl bg-background/60 border border-white/[0.05] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-cyan-accent">01. CLIENT TIER</span>
            <span className="w-2 h-2 rounded-full bg-cyan-accent animate-pulse" />
          </div>
          <h4 className="text-sm font-semibold text-white">Next.js 15 App Router</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            TypeScript, Tailwind CSS design tokens, zero-hero-image compliance, responsive glassmorphism.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-400">
            Path: <code className="text-slate-300">frontend/src/app</code>
          </div>
        </div>

        {/* Tier 2: Ingress & Core */}
        <div className="p-4 rounded-xl bg-background/60 border border-white/[0.05] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-primary">02. API INGRESS</span>
            <Server className="w-3.5 h-3.5 text-primary" />
          </div>
          <h4 className="text-sm font-semibold text-white">FastAPI Core (/api/v1)</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Centralized error handling, CORS origins, Pydantic v2 schemas, structured logging, health probes.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-400">
            Path: <code className="text-slate-300">backend/app/main.py</code>
          </div>
        </div>

        {/* Tier 3: Business Services */}
        <div className="p-4 rounded-xl bg-background/60 border border-white/[0.05] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-purple-400">03. SERVICE LAYER</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <h4 className="text-sm font-semibold text-white">Domain Services</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Gemini AI provider abstraction, multi-standard AQI computation, user & analytics pipelines.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-400">
            Path: <code className="text-slate-300">backend/app/services</code>
          </div>
        </div>

        {/* Tier 4: Data & Migrations */}
        <div className="p-4 rounded-xl bg-background/60 border border-white/[0.05] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-400">04. DATA PERSISTENCE</span>
            <Database className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <h4 className="text-sm font-semibold text-white">PostgreSQL & Alembic</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            SQLAlchemy 2.0 connection pool, thread-local generator session dependency, revision scripts.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-400">
            Path: <code className="text-slate-300">backend/alembic</code>
          </div>
        </div>
      </div>

      <div className="mt-5 p-3 rounded-lg bg-surface border border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Security Guardrail: Private API keys restricted to server-side backend environment.</span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          Module 01 Complete Architecture Verification
        </div>
      </div>
    </Card>
  );
};
