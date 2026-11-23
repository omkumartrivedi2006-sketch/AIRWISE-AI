"use client";

import React from "react";
import Link from "next/link";
import { Bot, Map, Bell, Gauge, Activity, ArrowRight, ShieldCheck, Cpu } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const CoreFeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-12 sm:py-16 space-y-12">
      <SectionHeading
        badgeText="INTELLIGENCE ARCHITECTURE"
        badgeVariant="teal"
        title="Core Environmental"
        titleHighlight="Capabilities"
        description="Four foundational capabilities delivering precise, actionable pollution telemetry and AI-driven respiratory protection."
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto">
        {/* Feature 1: Multi-Pollutant Telemetry (Featured Span 7) */}
        <div className="md:col-span-7">
          <Card className="p-7 h-full flex flex-col justify-between hover:border-primary/40 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Gauge className="w-5 h-5" />
                </div>
                <Badge variant="good" size="sm">Standardized Telemetry</Badge>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                Hyperlocal Multi-Pollutant Tracking
              </h3>

              <p className="text-sm text-foreground-secondary leading-relaxed">
                Continuous ground-level and atmospheric monitoring covering particulate matter (PM2.5, PM10) alongside toxic gaseous compounds (NO2, SO2, CO, O3). Values are calibrated against WHO 2021 global guidelines and US EPA thresholds.
              </p>

              {/* Interactive Telemetry Sample Strip */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <div className="p-3 rounded-lg bg-background-secondary border border-border-subtle">
                  <span className="text-[11px] font-mono text-foreground-muted block">Fine PM2.5</span>
                  <span className="text-base font-bold font-mono text-foreground">12.4 <span className="text-[10px] font-normal text-foreground-muted">µg/m³</span></span>
                </div>
                <div className="p-3 rounded-lg bg-background-secondary border border-border-subtle">
                  <span className="text-[11px] font-mono text-foreground-muted block">Coarse PM10</span>
                  <span className="text-base font-bold font-mono text-foreground">28.1 <span className="text-[10px] font-normal text-foreground-muted">µg/m³</span></span>
                </div>
                <div className="p-3 rounded-lg bg-background-secondary border border-border-subtle">
                  <span className="text-[11px] font-mono text-foreground-muted block">Nitrogen NO2</span>
                  <span className="text-base font-bold font-mono text-foreground">18.5 <span className="text-[10px] font-normal text-foreground-muted">ppb</span></span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border-subtle flex items-center justify-between">
              <span className="text-xs text-foreground-muted font-mono">Updated hourly from CAMS & ground networks</span>
              <Link href="/dashboard" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                Explore Live Data <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>

        {/* Feature 2: Gemini AI Pollution Assistant (Span 5) */}
        <div className="md:col-span-5">
          <Card className="p-7 h-full flex flex-col justify-between hover:border-primary/40 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Bot className="w-5 h-5" />
                </div>
                <Badge variant="cyan" size="sm">Gemini Powered</Badge>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                AI Environmental Assistant
              </h3>

              <p className="text-sm text-foreground-secondary leading-relaxed">
                Ask natural questions about local haze, safe jog timings, ventilation strategies, and personal health precautions. Grounded in medical environmental research.
              </p>

              {/* Chat snippet preview */}
              <div className="p-3.5 rounded-lg bg-background-secondary border border-border-subtle space-y-2 text-xs">
                <div className="font-mono text-primary font-medium">User: &ldquo;Is it safe to run outdoors this morning?&rdquo;</div>
                <div className="text-foreground-secondary leading-snug">
                  AIRWISE: &ldquo;AQI is 142 (Sensitive). Sensitive individuals should substitute with indoor workouts until PM2.5 levels subside around 2 PM.&rdquo;
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border-subtle">
              <Link href="/assistant" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                Open AI Assistant <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>

        {/* Feature 3: Interactive Geospatial Map (Span 5) */}
        <div className="md:col-span-5">
          <Card className="p-7 h-full flex flex-col justify-between hover:border-primary/40 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <Map className="w-5 h-5" />
                </div>
                <Badge variant="teal" size="sm">Interactive Map</Badge>
              </div>

              <h3 className="text-xl font-bold text-foreground">
                Geospatial Pollution Map
              </h3>

              <p className="text-sm text-foreground-secondary leading-relaxed">
                Inspect global and regional monitoring stations. Color-coded markers highlight real-time AQI levels, dominant pollutants, and air quality categories at a glance.
              </p>
            </div>

            <div className="pt-6 border-t border-border-subtle">
              <Link href="/map" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                View Live Map <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>

        {/* Feature 4: Smart Notifications & Personalization (Span 7) */}
        <div className="md:col-span-7">
          <Card className="p-7 h-full flex flex-col justify-between hover:border-primary/40 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Bell className="w-5 h-5" />
                </div>
                <Badge variant="moderate" size="sm">Smart Notifications</Badge>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                Proactive Alerts & Health Sensitivity Rules
              </h3>

              <p className="text-sm text-foreground-secondary leading-relaxed">
                Configure custom alert thresholds for home, school, and work locations. Receive notifications before particulate levels spike so you can close windows, turn on air purifiers, or reschedule outdoor activities.
              </p>

              <div className="flex flex-wrap gap-2 pt-1 text-xs font-mono text-foreground-secondary">
                <span className="px-2.5 py-1 rounded-md bg-background-secondary border border-border-subtle">Threshold: AQI &gt; 100</span>
                <span className="px-2.5 py-1 rounded-md bg-background-secondary border border-border-subtle">Asthma & Respiratory Mode</span>
                <span className="px-2.5 py-1 rounded-md bg-background-secondary border border-border-subtle">Real-Time In-App & Email</span>
              </div>
            </div>

            <div className="pt-6 border-t border-border-subtle">
              <Link href="/notifications" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                Configure Alert Rules <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
