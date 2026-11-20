"use client";

/**
 * AIRWISE AI — Protected Route Guard
 * Shields protected views (/dashboard, /assistant, /profile) and seamlessly redirects unauthenticated users.
 */

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "USER" | "ADMIN";
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-8 h-8 text-[#28C7F5] animate-spin" />
        <p className="text-xs font-mono text-[#A5B0BC]">Verifying authenticated session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto my-20 p-6">
        <Card className="p-6 bg-[#141B23] border-rose-500/30 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-[#F5F7FA]">Access Denied</h2>
          <p className="text-xs text-[#A5B0BC]">
            You do not possess the required ({requiredRole}) privileges to inspect this resource.
          </p>
          <Link href="/">
            <Button variant="primary" size="sm" className="mt-2">
              Return Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
