"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Wind, LayoutDashboard, Map, Bot, BarChart3, Bell, User, LogOut } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  // Close mobile sidebar on Escape key
  React.useEffect(() => {
    if (!mobileSidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileSidebarOpen]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Skip to Main Content Link for Keyboard Users (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary text-black font-bold rounded-lg shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        Skip to main content
      </a>

      {/* Desktop Left-Side Navigation Sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* Mobile Top Navigation Bar for Authenticated Views */}
      <div className="md:hidden flex items-center justify-between p-3.5 bg-surface border-b border-border-subtle sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 rounded-lg border border-border-subtle text-foreground-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Toggle Navigation Sidebar"
            aria-expanded={mobileSidebarOpen}
            aria-controls="mobile-sidebar-drawer"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white dark:text-black">
              <Wind className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm text-foreground">AIRWISE</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/profile"
            aria-label="View user profile"
            className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white dark:text-black font-bold text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {user?.full_name ? user.full_name[0].toUpperCase() : "U"}
          </Link>
        </div>
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileSidebarOpen && (
        <div
          id="mobile-sidebar-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Sidebar"
          className="md:hidden fixed inset-0 z-50 flex"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-64 bg-surface border-r border-border-subtle h-full overflow-y-auto">
            <AppSidebar />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto focus:outline-none">
        <div className="max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
};
