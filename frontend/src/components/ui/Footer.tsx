import React from "react";
import { Wind, ShieldCheck, Database, Cpu, ExternalLink } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-surface/40 backdrop-blur-md mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-cyan-accent flex items-center justify-center">
                <Wind className="w-4 h-4 text-background" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-base text-white font-sans">
                AIRWISE<span className="text-cyan-accent">.AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise GenAI-driven environmental intelligence, precision AQI telemetry, and predictive health advisory platform.
            </p>
            <div className="text-[11px] font-mono text-slate-400">
              Module 01: System Foundation
            </div>
          </div>

          {/* Architecture Spec */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Core Stack
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-accent" />
                <span>Next.js 15 App Router & React 19</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>FastAPI & Pydantic v2 (Python)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>PostgreSQL & SQLAlchemy 2.0</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>Google Gemini AI Engine</span>
              </li>
            </ul>
          </div>

          {/* Architecture Documents */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Documentation
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a
                  href="file:///c:/Users/OM%20TRIVEDI/Desktop/AIRWISE-AI/docs/architecture.md"
                  className="hover:text-cyan-accent transition-colors inline-flex items-center gap-1"
                >
                  System Architecture <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="file:///c:/Users/OM%20TRIVEDI/Desktop/AIRWISE-AI/docs/api-documentation.md"
                  className="hover:text-cyan-accent transition-colors inline-flex items-center gap-1"
                >
                  REST API Specification <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="file:///c:/Users/OM%20TRIVEDI/Desktop/AIRWISE-AI/docs/development-roadmap.md"
                  className="hover:text-cyan-accent transition-colors inline-flex items-center gap-1"
                >
                  Development Roadmap <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Diagnostics */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Endpoints
            </h4>
            <div className="p-3 rounded-lg bg-surface border border-white/[0.06] text-[11px] font-mono text-slate-300 space-y-1">
              <div>
                <span className="text-emerald-400">GET</span> /api/v1/health
              </div>
              <div>
                <span className="text-emerald-400">GET</span> /api/v1/ai/status
              </div>
              <div>
                <span className="text-primary">POST</span> /api/v1/ai/query
              </div>
              <div className="text-slate-400 pt-1 text-[10px]">
                Port 8000 (Backend) | Port 3000 (Frontend)
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 AIRWISE AI Platform. All rights reserved.</p>
          <p className="font-mono text-[11px]">Strict Security Boundary: Zero Client Secrets</p>
        </div>
      </div>
    </footer>
  );
};
