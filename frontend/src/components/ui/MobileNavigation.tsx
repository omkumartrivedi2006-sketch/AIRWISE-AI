"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { X, Wind, ArrowRight, UserCheck, ShieldCheck } from "lucide-react";
import { Button } from "./Button";
import { Badge } from "./Badge";

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onClose,
  activeSection = "home",
}) => {
  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "auto";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navLinks = [
    { label: "Home", href: "/#home" },
    { label: "Air Quality", href: "/#overview" },
    { label: "Features", href: "/#features" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "AI Assistant", href: "/#assistant" },
    { label: "Environmental Awareness", href: "/#awareness" },
    { label: "About", href: "/about" },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#080A0D]/80 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-xs bg-[#10151B] border-l border-white/[0.09] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-white/[0.09]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#28C7F5] to-[#38E0B4] flex items-center justify-center shadow-cyan-glow">
                <Wind className="w-4 h-4 text-[#080A0D]" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-base tracking-tight text-[#F5F7FA]">
                AIRWISE<span className="text-[#28C7F5]">.AI</span>
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#A5B0BC] hover:text-[#F5F7FA] hover:bg-white/[0.05] transition-colors focus:outline-none"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={onClose}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#A5B0BC] hover:text-[#28C7F5] hover:bg-[#141B23] transition-all"
              >
                <span>{link.label}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-40" />
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-white/[0.09] space-y-3">
          <Link href="/login" onClick={onClose} className="block w-full">
            <Button variant="secondary" size="md" className="w-full">
              <UserCheck className="w-4 h-4 text-[#28C7F5]" />
              Sign In
            </Button>
          </Link>
          <Link href="/register" onClick={onClose} className="block w-full">
            <Button variant="primary" size="md" className="w-full">
              Get Started
            </Button>
          </Link>

          <div className="pt-2 text-center">
            <Badge variant="cyan" size="sm" dot>
              System Online (v1.0)
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
