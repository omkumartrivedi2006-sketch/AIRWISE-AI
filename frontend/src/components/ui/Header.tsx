"use client";

import React, { useEffect, useState } from "react";
import { ApiClient } from "@/services/api";
import { Badge } from "./Badge";
import { Wind, ShieldCheck, Activity } from "lucide-react";

export const Header: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    let mounted = true;
    ApiClient.getHealth()
      .then((health) => {
        if (mounted) {
          setBackendStatus(health.success ? "online" : "offline");
        }
      })
      .catch(() => {
        if (mounted) {
          setBackendStatus("offline");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-cyan-accent flex items-center justify-center shadow-blue-glow">
            <Wind className="w-5 h-5 text-background" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white font-sans">
                AIRWISE<span className="text-cyan-accent">.AI</span>
              </span>
              <Badge variant="cyan" size="sm">
                v1.0
              </Badge>
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest -mt-1 font-mono">
              Pollution Intelligence Platform
            </span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          <a
            href="#live-preview"
            className="hover:text-cyan-accent transition-colors duration-150"
          >
            Live Telemetry
          </a>
          <a
            href="#ai-engine"
            className="hover:text-cyan-accent transition-colors duration-150"
          >
            AI Assistant
          </a>
          <a
            href="#architecture"
            className="hover:text-cyan-accent transition-colors duration-150"
          >
            System Specs
          </a>
          <a
            href="#roadmap"
            className="hover:text-cyan-accent transition-colors duration-150"
          >
            Roadmap
          </a>
        </nav>

        {/* Backend Status Telemetry Indicator */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-surface border border-white/[0.06]">
            <Activity className="w-3.5 h-3.5 text-cyan-accent" />
            <span className="text-slate-400">API:</span>
            {backendStatus === "checking" && (
              <span className="text-amber-400">Checking...</span>
            )}
            {backendStatus === "online" && (
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operational
              </span>
            )}
            {backendStatus === "offline" && (
              <span className="text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                Standby (Local)
              </span>
            )}
          </div>

          <a
            href="http://localhost:8000/api/v1/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/[0.1] hover:border-cyan-accent/40 bg-surface/60 transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-accent" />
            <span>FastAPI Docs</span>
          </a>
        </div>
      </div>
    </header>
  );
};
