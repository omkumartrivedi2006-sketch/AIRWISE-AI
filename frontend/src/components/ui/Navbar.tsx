"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wind, Menu, ArrowRight, ShieldCheck, User, LogOut, LayoutDashboard, Bell } from "lucide-react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNavigation } from "./MobileNavigation";
import { useAuth } from "@/hooks/useAuth";

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isLandingPage = pathname === "/";

  // Clean, dedicated navigation links based on context
  const navLinks = isLandingPage && !isAuthenticated
    ? [
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Pollution Map", href: "/map" },
      { label: "AI Assistant", href: "/assistant" },
    ]
    : [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Pollution Map", href: "/map" },
      { label: "Analytics & Trends", href: "/analytics" },
      { label: "Compare Stations", href: "/compare" },
      { label: "AI Assistant", href: "/assistant" },
    ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${isScrolled
          ? "border-b border-border-subtle bg-surface/90 backdrop-blur-md shadow-sm"
          : "border-b border-transparent bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand Logo & Wordmark */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white dark:text-black shadow-sm group-hover:scale-105 transition-transform duration-200">
              <Wind className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-foreground font-sans">
                  AIRWISE<span className="text-primary">.AI</span>
                </span>
                <Badge variant="good" size="sm">
                  v1.0
                </Badge>
              </div>
              <span className="text-[10px] text-foreground-muted uppercase tracking-widest -mt-1 font-mono">
                Pollution Intelligence
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-sm text-foreground-secondary" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`transition-colors duration-150 font-medium ${isActive ? "text-primary font-semibold" : "hover:text-foreground"
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Navigation & CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/notifications"
                  className="relative p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-surface-hover transition-colors"
                  title="Notification Center"
                >
                  <Bell className="w-4 h-4" />
                </Link>

                {user?.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-colors font-semibold"
                    title="Administrative Governance Portal"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </Link>
                )}

                <Link
                  href="/dashboard"
                  className="text-xs text-foreground-secondary hover:text-foreground flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-surface-hover transition-colors font-medium"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border-subtle hover:border-border-strong transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white dark:text-black font-bold text-xs">
                    {user?.full_name ? user.full_name[0].toUpperCase() : "U"}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-foreground max-w-[100px] truncate">
                      {user?.full_name || user?.email}
                    </span>
                    <span className="text-[9px] text-foreground-muted uppercase tracking-wider font-mono">
                      {user?.role || "USER"}
                    </span>
                  </div>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-foreground-muted hover:text-red-500 p-2"
                  onClick={() => logout()}
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-xs font-medium">
                    Sign In
                  </Button>
                </Link>

                <Link href="/register">
                  <Button variant="primary" size="sm" className="text-xs">
                    Get Started
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Navigation Trigger & Theme Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg text-foreground-secondary hover:text-foreground bg-surface border border-border-subtle transition-colors focus:outline-none"
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
