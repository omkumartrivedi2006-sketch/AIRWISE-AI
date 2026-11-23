"use client";

import React from "react";
import { MapPin, ShieldCheck, AlertCircle, RefreshCw, X, Navigation } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GeolocationStatus, GeolocationCoordinates } from "@/hooks/useGeolocation";

interface LocationPermissionProps {
  status: GeolocationStatus;
  coords: GeolocationCoordinates | null;
  error: string | null;
  onRequest: () => void;
  onDismiss: () => void;
  onManualSelect?: () => void;
}

export const LocationPermissionModal: React.FC<LocationPermissionProps> = ({
  status,
  coords,
  error,
  onRequest,
  onDismiss,
  onManualSelect,
}) => {
  // If granted and coordinates exist, show clean subtle status bar
  if (status === "granted" && coords) {
    return (
      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary animate-pulse" />
          <span className="font-semibold text-foreground">Live Geolocation Active:</span>
          <span className="font-mono text-foreground-secondary">
            {coords.latitude.toFixed(4)}°, {coords.longitude.toFixed(4)}°
          </span>
          {coords.accuracy && (
            <span className="text-foreground-muted font-mono text-[10px]">
              (±{Math.round(coords.accuracy)}m)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRequest}
            className="text-[11px] h-7 px-2 font-mono text-primary hover:text-primary-hover"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Update GPS
          </Button>
        </div>
      </div>
    );
  }

  // If denied or error, show clear polite notification with manual search action
  if (status === "denied" || status === "unavailable" || status === "timeout" || error) {
    return (
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error || "Location access is unavailable."}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRequest}
            className="text-[11px] h-7 px-2.5 font-medium"
          >
            Retry Permission
          </Button>
          {onManualSelect && (
            <Button
              variant="outline"
              size="sm"
              onClick={onManualSelect}
              className="text-[11px] h-7 px-2.5 font-medium"
            >
              Search City Manually
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Initial prompt modal / banner
  if (status === "idle" || status === "prompting" || status === "requesting") {
    return (
      <div className="p-4 rounded-xl bg-surface border border-border-subtle shadow-md space-y-3 relative overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">
                Enable Live Location for Hyperlocal Air Quality
              </h4>
              <p className="text-xs text-foreground-secondary leading-relaxed max-w-xl">
                AIRWISE AI uses your coordinates to connect to the nearest atmospheric monitoring station and calculate immediate respiratory health advisories. Your coordinates are never sold or stored for profiling.
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-foreground-muted hover:text-foreground p-1 rounded-md transition-colors"
            aria-label="Dismiss location request"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1 pl-12">
          <Button
            variant="primary"
            size="sm"
            onClick={onRequest}
            disabled={status === "requesting"}
            className="text-xs"
          >
            <Navigation className="w-3.5 h-3.5 mr-1.5" />
            {status === "requesting" ? "Requesting..." : "Allow Live Location"}
          </Button>

          {onManualSelect && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onManualSelect}
              className="text-xs"
            >
              Enter Location Manually
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-xs text-foreground-muted"
          >
            Not Now
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
