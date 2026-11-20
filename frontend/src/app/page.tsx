import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LiveTelemetryCard } from "@/components/preview/LiveTelemetryCard";
import { AIIntelligencePreview } from "@/components/preview/AIIntelligencePreview";
import { ArchitectureCard } from "@/components/preview/ArchitectureCard";
import {
  Terminal,
  ArrowRight,
  ShieldAlert,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-24">
      {/* 
        ========================================================================
        HERO SECTION: Strictly follows the NO HERO IMAGES / NO ARTWORK rule.
        Uses high-impact typography, crisp messaging, diagnostic badges,
        and direct system telemetry CTA.
        ========================================================================
      */}
      <section className="space-y-8 max-w-4xl mx-auto text-center">
        {/* Top Intelligence Tag */}
        <div className="inline-flex items-center gap-2">
          <Badge variant="cyan" size="md" dot>
            AIR QUALITY INTELLIGENCE & GENAI PLATFORM
          </Badge>
          <span className="hidden sm:inline-block text-slate-400 text-xs font-mono">
            | Module 01 Foundation
          </span>
        </div>

        {/* Core Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] font-sans">
          Precision Air Intelligence. <br />
          <span className="text-gradient-cyan">Contextualized by GenAI.</span>
        </h1>

        {/* Subtitle / Value Proposition */}
        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Transform raw particulate telemetry (PM2.5, PM10, NO2, O3) into
          clinically grounded health protection and predictive pollution insights
          powered by Google Gemini.
        </p>

        {/* Primary Call to Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <a href="#live-preview">
            <Button variant="cyan" size="lg" className="group">
              Explore Live Telemetry Preview
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </a>
          <a
            href="http://localhost:8000/api/v1/health"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" size="lg" className="font-mono">
              <Terminal className="w-4 h-4 text-cyan-accent" />
              Inspect /api/v1/health
            </Button>
          </a>
        </div>

        {/* Architectural Pillars / Foundation Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-3xl mx-auto text-left">
          <div className="p-3.5 rounded-lg bg-surface/60 border border-white/[0.06]">
            <div className="text-[11px] font-mono text-cyan-accent uppercase tracking-wider">
              Backend Engine
            </div>
            <div className="text-sm font-semibold text-white mt-1">FastAPI v1</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Pydantic v2 validated</div>
          </div>
          <div className="p-3.5 rounded-lg bg-surface/60 border border-white/[0.06]">
            <div className="text-[11px] font-mono text-primary uppercase tracking-wider">
              AI Provider
            </div>
            <div className="text-sm font-semibold text-white mt-1">Google Gemini</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Server-side isolation</div>
          </div>
          <div className="p-3.5 rounded-lg bg-surface/60 border border-white/[0.06]">
            <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">
              Persistence
            </div>
            <div className="text-sm font-semibold text-white mt-1">PostgreSQL & Alembic</div>
            <div className="text-[11px] text-slate-400 mt-0.5">SQLAlchemy 2.0 ORM</div>
          </div>
          <div className="p-3.5 rounded-lg bg-surface/60 border border-white/[0.06]">
            <div className="text-[11px] font-mono text-purple-400 uppercase tracking-wider">
              Design Standard
            </div>
            <div className="text-sm font-semibold text-white mt-1">Token System</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Zero hero image rule</div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SECTION 1: LIVE TELEMETRY INTERFACE PREVIEW
        ========================================================================
      */}
      <section id="live-preview" className="space-y-4 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-accent">
              Module 01 Real-Data Component
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Hyper-Local Telemetry Dial & Chemical Matrix
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            Interactive visualization showing multi-pollutant concentrations normalized to US-AQI standards.
          </p>
        </div>

        <LiveTelemetryCard />
      </section>

      {/* 
        ========================================================================
        SECTION 2: AI ASSISTANT ARCHITECTURE & PREVIEW
        ========================================================================
      */}
      <section id="ai-engine" className="space-y-4 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-primary">
              AI Intelligence Layer
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Context-Grounded Health Intelligence
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            Simulates the Gemini environmental prompt pipeline with clinical safety grounding and protective actions.
          </p>
        </div>

        <AIIntelligencePreview />
      </section>

      {/* 
        ========================================================================
        SECTION 3: SYSTEM ARCHITECTURE & REPOSITORY BOUNDARIES
        ========================================================================
      */}
      <section id="architecture" className="space-y-4 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-400">
              Clean Monorepo Foundation
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Production-Grade System Architecture
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            Separation of concerns between Next.js presentation, FastAPI ingress, domain services, and database.
          </p>
        </div>

        <ArchitectureCard />
      </section>

      {/* 
        ========================================================================
        SECTION 4: ROADMAP CONTINUITY
        ========================================================================
      */}
      <section id="roadmap" className="space-y-6 scroll-mt-24">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge variant="cyan" size="sm">
            DEVELOPMENT LIFECYCLE
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Seamless Progression Across Modules
          </h2>
          <p className="text-sm text-slate-400">
            Module 01 sets the architectural foundation so subsequent modules integrate without refactoring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-surface/60 border border-cyan-accent/30 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-accent">MODULE 01</span>
              <Badge variant="cyan" size="sm">
                Completed
              </Badge>
            </div>
            <h3 className="text-base font-semibold text-white mt-2">Architecture & Foundations</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Monorepo setup, Next.js app shell, FastAPI `/api/v1` backend, PostgreSQL & Alembic config, Gemini service abstraction.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-surface/40 border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400">MODULE 02</span>
              <Badge variant="outline" size="sm">
                Scheduled Next
              </Badge>
            </div>
            <h3 className="text-base font-semibold text-white mt-2">Live Pollution Ingestion</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              OpenAQ integration, regional sensor polling, caching pipelines, and automated multi-standard AQI computation.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-surface/40 border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400">MODULE 03</span>
              <Badge variant="outline" size="sm">
                Scheduled
              </Badge>
            </div>
            <h3 className="text-base font-semibold text-white mt-2">Gemini Assistant Engine</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Live streaming inference, conversational session memory, vulnerability triggers, and personalized clean air routing.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
