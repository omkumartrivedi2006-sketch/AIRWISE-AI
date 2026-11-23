"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors safely to console for debugging
    console.error("Uncaught application error:", error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#10151B] border border-white/[0.09] rounded-2xl p-8 text-center shadow-2xl space-y-6">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-[#F5F7FA]">Something went wrong</h1>
          <p className="text-sm text-[#A5B0BC]">
            An unexpected error occurred while rendering this view. Our telemetry service has logged the event.
          </p>
        </div>

        {error.digest && (
          <div className="p-3 bg-[#141B23] rounded-lg border border-white/[0.05] text-[11px] font-mono text-[#A5B0BC] break-all">
            Digest ID: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="primary" size="md" onClick={() => reset()} className="justify-center">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Link href="/">
            <Button variant="secondary" size="md" className="w-full justify-center">
              <Home className="w-4 h-4" />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
