"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wind,
  Database,
  Bot,
  Bell,
  Activity,
  FileText,
  Settings,
  Shield,
  ArrowLeft,
  Menu,
  X,
  AlertTriangle,
} from "lucide-react";
import { ApiClient } from "@/services/api";
import { User } from "@/types/auth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/environmental-data", label: "Environmental Data", icon: Wind },
  { href: "/admin/data-sources", label: "Data Sources", icon: Database },
  { href: "/admin/ai-usage", label: "AI Usage & Quota", icon: Bot },
  { href: "/admin/notifications", label: "Notification Logs", icon: Bell },
  { href: "/admin/system-health", label: "System Health", icon: Activity },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
  { href: "/admin/settings", label: "Platform Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function verifyAdminAuth() {
      try {
        const res = await ApiClient.getMe();
        if (res.success && res.data) {
          if (res.data.role !== "ADMIN") {
            router.push("/dashboard");
            return;
          }
          setCurrentUser(res.data);
        } else {
          router.push("/login?redirect=/admin");
        }
      } catch (err) {
        router.push("/login?redirect=/admin");
      } finally {
        setIsLoading(false);
      }
    }
    verifyAdminAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080A0D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#28C7F5] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#A5B0BC]">Verifying administrative authorization...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#080A0D] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#10151B] border border-red-500/20 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#F5F7FA] mb-2">Access Restricted</h2>
          <p className="text-sm text-[#A5B0BC] mb-6">
            You do not have administrative privileges to access the AIRWISE AI Management Console.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#28C7F5] text-[#080A0D] font-semibold rounded-xl text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-surface border-r border-border-subtle flex flex-col z-40 transition-transform duration-200 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand header */}
        <div className="p-6 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-foreground">AIRWISE ADMIN</span>
              <p className="text-[10px] text-primary font-medium tracking-wider uppercase">Console v1.0</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-foreground-secondary hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-white dark:text-black font-semibold shadow-sm"
                    : "text-foreground-secondary hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white dark:text-black" : "text-primary"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-border-subtle bg-background-secondary/50 space-y-3">
          <div className="flex items-center justify-between text-[11px] text-foreground-muted">
            <span>Logged in as</span>
            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold text-[9px]">
              ADMIN
            </span>
          </div>
          <p className="text-xs text-foreground truncate font-medium">{currentUser.email}</p>
          <div className="flex items-center justify-between pt-1">
            <ThemeToggle showLabel className="text-xs" />
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-hover text-foreground-secondary hover:text-foreground rounded-lg text-xs transition-colors border border-border-subtle"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Platform
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border-subtle bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-foreground-secondary hover:text-foreground p-1"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-foreground-muted">
              <Link href="/admin" className="hover:text-foreground">Admin</Link>
              <span>/</span>
              <span className="text-foreground font-medium capitalize">
                {pathname.replace("/admin", "").replace("/", "") || "Overview"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/profile"
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-white dark:text-black"
            >
              {currentUser.full_name ? currentUser.full_name.charAt(0) : "A"}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
