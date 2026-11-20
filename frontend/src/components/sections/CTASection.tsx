import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Terminal, Cpu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const CTASection: React.FC = () => {
  return (
    <section className="py-16">
      {/* 
        SECTION H: Call to Action.
        Uses strong typography, spacing, and subtle background treatment.
        NO decorative hero artwork.
      */}
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 sm:p-14 text-center bg-gradient-to-b from-[#141B23] to-[#10151B] border-white/[0.12] shadow-2xl relative overflow-hidden space-y-8">
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-[#28C7F5]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2">
              <Badge variant="cyan" size="md" dot>
                EMPOWER YOUR ENVIRONMENTAL DECISIONS
              </Badge>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F5F7FA] tracking-tight font-sans leading-tight">
              Better Awareness. <br />
              <span className="text-gradient-cyan">A Smarter Tomorrow.</span>
            </h2>

            <p className="text-sm sm:text-base text-[#A5B0BC] max-w-xl mx-auto leading-relaxed">
              Start exploring environmental intelligence with AIRWISE AI. Understand your local air quality, mitigate particulate hazards, and make informed daily health decisions.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 relative z-10 pt-2">
            <Link href="/register">
              <Button variant="primary" size="lg" className="group">
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button variant="secondary" size="lg">
                Explore Dashboard
              </Button>
            </Link>

            <a
              href="http://localhost:8000/api/v1/health"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className="font-mono text-xs">
                <Terminal className="w-3.5 h-3.5 text-[#28C7F5]" />
                API Health
              </Button>
            </a>
          </div>

          {/* Trust points */}
          <div className="pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-[#6B7A8D] relative z-10">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#38E0B4]" />
              Zero Client Secret Exposure
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#28C7F5]" />
              Dedicated Server-Side Inference
            </span>
          </div>
        </Card>
      </div>
    </section>
  );
};
