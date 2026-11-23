import React from "react";
import Link from "next/link";
import { Wind, ShieldCheck, Terminal, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-border-subtle bg-surface mt-16 sm:mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info & Mission */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white dark:text-black shadow-sm">
                <Wind className="w-4.5 h-4.5" strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-lg text-foreground tracking-tight font-sans">
                AIRWISE<span className="text-primary">.AI</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed max-w-sm">
              AIRWISE AI makes environmental intelligence accessible. Grounded in WHO 2021 air quality guidelines and US EPA standards, powered by Google Gemini AI.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-foreground-secondary">
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">
                  Live Dashboard
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-primary transition-colors">
                  Pollution Map
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="hover:text-primary transition-colors">
                  Analytics & Trends
                </Link>
              </li>
              <li>
                <Link href="/assistant" className="hover:text-primary transition-colors">
                  AI Pollution Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">
              Standards & Legal
            </h4>
            <ul className="space-y-2 text-xs text-foreground-secondary">
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <Terminal className="w-3 h-3 text-primary" /> API Documentation
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between text-xs text-foreground-muted gap-4">
          <p>&copy; {new Date().getFullYear()} AIRWISE AI. Environmental Intelligence Platform.</p>
          <p className="flex items-center gap-1">
            Built for cleaner living & proactive health protection.
          </p>
        </div>
      </div>
    </footer>
  );
};
