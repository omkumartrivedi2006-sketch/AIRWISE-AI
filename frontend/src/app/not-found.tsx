import React from "react";
import Link from "next/link";
import { Wind, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-[#10151B] border border-white/[0.09] rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#28C7F5]/20 to-[#38E0B4]/20 border border-[#28C7F5]/30 flex items-center justify-center mx-auto">
          <Wind className="w-8 h-8 text-[#28C7F5]" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-extrabold font-mono text-[#28C7F5]">404</span>
          <h1 className="text-xl font-bold text-[#F5F7FA]">Page Not Found</h1>
          <p className="text-sm text-[#A5B0BC]">
            The environmental intelligence route you requested does not exist or has moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="primary" size="md" className="w-full justify-center">
              <Home className="w-4 h-4" />
              Home Page
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary" size="md" className="w-full justify-center">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
