import React from "react";

export default function RootLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-300">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-white/[0.09] border-t-[#28C7F5] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#38E0B4] animate-pulse" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-[#F5F7FA]">Loading AIRWISE AI...</p>
        <p className="text-xs text-[#A5B0BC] font-mono">Synchronizing environmental telemetry</p>
      </div>
    </div>
  );
}
