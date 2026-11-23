"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Bot,
  BarChart3,
  Scale,
  Bell,
  ShieldCheck,
  User,
  LogOut,
  Wind,
  Activity,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Pollution Map", href: "/map", icon: Map },
  { label: "AI Assistant", href: "/assistant", icon: Bot, badge: "Gemini" },
  { label: "Analytics & Trends", href: "/analytics", icon: BarChart3 },
  { label: "Compare Stations", href: "/compare", icon: Scale },
  { label: "Alerts & Rules", href: "/notifications", icon: Bell },
  { label: "Admin Portal", href: "/admin", icon: ShieldCheck, adminOnly: true },
];

export const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 flex-shrink-0 bg-surface border-r border-border-subtle flex flex-col justify-between min-h-screen sticky top-0 z-30 select-none">
      {/* Top Header */}
      <div>
        <div className="p-5 border-b border-border-subtle flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white dark:text-black shadow-sm group-hover:scale-105 transition-transform">
              <Wind className="w-4.5 h-4.5" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-foreground font-sans leading-none">
                AIRWISE<span className="text-primary">.AI</span>
              </span>
              <span className="text-[9px] text-foreground-muted font-mono tracking-widest uppercase mt-0.5">
                Workspace
              </span>
            </div>
          </Link>

          <Badge variant="good" size="sm">
            v1.0
          </Badge>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1" aria-label="Authenticated Sidebar">
          {NAV_ITEMS.map((item) => {
            if (item.adminOnly && user?.role !== "ADMIN") return null;

            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-white dark:text-black font-semibold shadow-sm"
                    : "text-foreground-secondary hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white dark:text-black" : "text-primary"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                      isActive ? "bg-black/20 text-white dark:text-black" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Controls */}
      <div className="p-4 border-t border-border-subtle space-y-3 bg-background-secondary/50">
        {/* User Badge */}
        <Link
          href="/profile"
          className="flex items-center gap-2.5 p-2 rounded-lg bg-surface border border-border-subtle hover:border-border-strong transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white dark:text-black font-bold text-xs flex-shrink-0">
            {user?.full_name ? user.full_name[0].toUpperCase() : "U"}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {user?.full_name || user?.email}
            </span>
            <span className="text-[10px] text-foreground-muted uppercase tracking-wider font-mono">
              {user?.role || "USER"}
            </span>
          </div>
        </Link>

        {/* Theme Switching & Logout */}
        <div className="flex items-center justify-between pt-1">
          <ThemeToggle showLabel className="text-xs" />

          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-foreground-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sign out of AIRWISE AI"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
