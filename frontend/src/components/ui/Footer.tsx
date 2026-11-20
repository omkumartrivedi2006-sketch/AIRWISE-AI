import React from "react";
import Link from "next/link";
import { Wind, ShieldCheck, Database, Cpu, ArrowUpRight } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/[0.09] bg-[#080A0D] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          {/* Brand Info & Mission */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#28C7F5] to-[#38E0B4] flex items-center justify-center shadow-cyan-glow">
                <Wind className="w-4.5 h-4.5 text-[#080A0D]" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-lg text-[#F5F7FA] tracking-tight font-sans">
                AIRWISE<span className="text-[#28C7F5]">.AI</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#A5B0BC] leading-relaxed max-w-sm">
              AIRWISE AI makes pollution-related information easier to understand and empowers individuals, families, and organizations to make informed environmental and health decisions through GenAI assistance.
            </p>
            <div className="text-xs font-mono text-[#6B7A8D]">
              Grounded in WHO 2021 & US EPA National Ambient Standards
            </div>
          </div>

          {/* Product Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F5F7FA] font-mono">
              Product
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A5B0BC]">
              <li>
                <Link href="/#home" className="hover:text-[#28C7F5] transition-colors">
                  Overview
                </Link>
              </li>
              <li>
                <Link href="/#overview" className="hover:text-[#28C7F5] transition-colors">
                  Air Quality Index
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[#28C7F5] transition-colors">
                  Core Features
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-[#28C7F5] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#assistant" className="hover:text-[#28C7F5] transition-colors">
                  AI Assistant Preview
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#28C7F5] transition-colors inline-flex items-center gap-1">
                  Dashboard <ArrowUpRight className="w-3 h-3 text-[#28C7F5]" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Educational */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F5F7FA] font-mono">
              Awareness
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A5B0BC]">
              <li>
                <Link href="/#awareness" className="hover:text-[#28C7F5] transition-colors">
                  Air Pollution
                </Link>
              </li>
              <li>
                <Link href="/#awareness" className="hover:text-[#28C7F5] transition-colors">
                  Water Pollution
                </Link>
              </li>
              <li>
                <Link href="/#awareness" className="hover:text-[#28C7F5] transition-colors">
                  Noise Pollution
                </Link>
              </li>
              <li>
                <Link href="/#awareness" className="hover:text-[#28C7F5] transition-colors">
                  Soil Pollution
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#28C7F5] transition-colors">
                  About Our Mission
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#28C7F5] transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Specifications & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F5F7FA] font-mono">
              System & Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A5B0BC]">
              <li>
                <a
                  href="http://localhost:8000/api/v1/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#28C7F5] transition-colors inline-flex items-center gap-1"
                >
                  FastAPI OpenAPI Docs <ArrowUpRight className="w-3 h-3 text-[#28C7F5]" />
                </a>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#28C7F5] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#28C7F5] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li className="pt-2 text-[11px] font-mono text-[#6B7A8D]">
                Port 3000 (UI) • Port 8000 (API)
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.09] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A5B0BC]">
          <p>© 2026 AIRWISE AI. All rights reserved.</p>
          <p className="font-mono text-[11px] text-[#6B7A8D]">
            Responsible Environmental Intelligence • Zero Fake Telemetry Guarantee
          </p>
        </div>
      </div>
    </footer>
  );
};
