"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Terminal, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const CTASection: React.FC = () => {
  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 sm:p-12 text-center bg-surface border-border-subtle shadow-lg relative overflow-hidden space-y-6">
          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2">
              <Badge variant="good" size="md">
                ACTIONABLE ENVIRONMENTAL HEALTH
              </Badge>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight font-sans">
              Take Control of Your <span className="text-primary">Air Quality Exposure</span>
            </h2>

            <p className="text-sm sm:text-base text-foreground-secondary max-w-xl mx-auto leading-relaxed">
              Create a free account to save monitored stations, customize your personal respiratory sensitivity rules, and receive proactive pollution alerts before smog spikes.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 relative z-10 pt-2">
            <Link href="/register">
              <Button variant="primary" size="lg" className="shadow-md">
                Create Free Account
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button variant="secondary" size="lg">
                View Live Telemetry
              </Button>
            </Link>
          </div>

          {/* Supporting Standards Info */}
          <div className="pt-6 border-t border-border-subtle flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-foreground-muted">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> WHO 2021 Guidelines
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> US EPA Air Quality Index
            </span>
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> REST API v1
            </span>
          </div>
        </Card>
      </div>
    </section>
  );
};
