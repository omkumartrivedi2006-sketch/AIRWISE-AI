"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { X, Wind, ArrowRight, UserCheck, ShieldCheck, User, LogOut, LayoutDashboard, Map, BarChart3, Bot, Scale, Home, Users } from "lucide-react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, isAuthenticated, logout } = useAuth();

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
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Pollution Map", href: "/map", icon: Map },
    { label: "AI Assistant", href: "/assistant", icon: Bot },
    { label: "Analytics & Trends", href: "/analytics", icon: BarChart3 },
    { label: "Compare Stations", href: "/compare", icon: Scale },
    { label: "Indoor Air Quality", href: "/indoor", icon: Home },
    { label: "Community Insights", href: "/community", icon: Users },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-xs bg-surface border-l border-border-subtle shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-border-subtle">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white dark:text-black shadow-sm">
                <Wind className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-base tracking-tight text-foreground">
                AIRWISE<span className="text-primary">.AI</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-surface-hover transition-colors focus:outline-none"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 flex flex-col space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={onClose}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-surface-hover transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-primary" />
                    {link.label}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-border-subtle space-y-3">
          {isAuthenticated ? (
            <>
              <div className="p-3 rounded-lg bg-background-secondary border border-border-subtle flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white dark:text-black font-bold text-xs">
                  {user?.full_name ? user.full_name[0].toUpperCase() : "U"}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground truncate">
                    {user?.full_name || user?.email}
                  </span>
                  <span className="text-[10px] text-foreground-muted uppercase tracking-wider font-mono">
                    {user?.role || "USER"}
                  </span>
                </div>
              </div>

              <Link href="/profile" onClick={onClose} className="block w-full">
                <Button variant="secondary" size="md" className="w-full justify-start text-xs">
                  <User className="w-4 h-4 text-primary" />
                  Account Profile
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="md"
                className="w-full text-red-600 dark:text-red-400 hover:bg-red-500/10 justify-start text-xs"
                onClick={() => {
                  logout();
                  onClose();
                }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={onClose} className="block w-full">
                <Button variant="secondary" size="md" className="w-full text-xs">
                  <UserCheck className="w-4 h-4 text-primary" />
                  Sign In
                </Button>
              </Link>
              <Link href="/register" onClick={onClose} className="block w-full">
                <Button variant="primary" size="md" className="w-full text-xs">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
