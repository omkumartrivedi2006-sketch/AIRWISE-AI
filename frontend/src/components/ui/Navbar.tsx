"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wind, Menu, ArrowRight, Activity, ShieldCheck } from "lucide-react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { MobileNavigation } from "./MobileNavigation";
import { ApiClient } from "@/services/api";

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    ApiClient.getHealth()
      .then((health) => {
        if (mounted) setBackendStatus(health.success ? "online" : "offline");
      })
      .catch(() => {
        if (mounted) setBackendStatus("offline");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const navLinks = [
    { label: "Home", href: "/#home" },
    { label: "Features", href: "/#features" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "About", href: "/about" },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          isScrolled
            ? "border-b border-white/[0.09] bg-[#080A0D]/90 backdrop-blur-xl shadow-lg"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand Logo & Wordmark */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#28C7F5] to-[#38E0B4] flex items-center justify-center shadow-cyan-glow group-hover:scale-105 transition-transform duration-200">
              <Wind className="w-5 h-5 text-[#080A0D]" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-[#F5F7FA] font-sans">
                  AIRWISE<span className="text-[#28C7F5]">.AI</span>
                </span>
                <Badge variant="cyan" size="sm">
                  v1.0
                </Badge>
              </div>
              <span className="text-[10px] text-[#A5B0BC] uppercase tracking-widest -mt-1 font-mono">
                Pollution Intelligence
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#A5B0BC]" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-[#28C7F5] transition-colors duration-150 font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Navigation & CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Live Backend Telemetry Indicator */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-[#141B23] border border-white/[0.09]">
              <Activity className="w-3.5 h-3.5 text-[#28C7F5]" />
              <span className="text-[#A5B0BC]">API:</span>
              {backendStatus === "checking" && <span className="text-amber-400">Checking...</span>}
              {backendStatus === "online" && (
                <span className="text-[#38E0B4] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38E0B4] animate-pulse" />
                  Operational
                </span>
              )}
              {backendStatus === "offline" && (
                <span className="text-[#A5B0BC] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  Standby
                </span>
              )}
            </div>

            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs">
                Sign In
              </Button>
            </Link>

            <Link href="/register">
              <Button variant="primary" size="sm" className="text-xs">
                Get Started
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg text-[#A5B0BC] hover:text-[#F5F7FA] hover:bg-[#141B23] border border-white/[0.09] transition-colors focus:outline-none"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Responsive Mobile Drawer */}
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};
