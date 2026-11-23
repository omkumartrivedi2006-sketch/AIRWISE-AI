"use client";

import { useState, useEffect, useCallback } from "react";

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export type GeolocationStatus =
  | "idle"
  | "prompting"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable"
  | "timeout"
  | "error";

interface UseGeolocationReturn {
  status: GeolocationStatus;
  coords: GeolocationCoordinates | null;
  error: string | null;
  requestLocation: () => void;
  dismissPrompt: () => void;
  reset: () => void;
}

const STORAGE_KEY = "airwise_geo_preference";

export function useGeolocation(): UseGeolocationReturn {
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "granted") {
        // Auto-refresh coordinates if user previously consented
        requestLocation();
      }
    } catch {
      // storage unavailable
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setStatus("requesting");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoords({ latitude, longitude, accuracy });
        setStatus("granted");
        try {
          localStorage.setItem(STORAGE_KEY, "granted");
        } catch {}
      },
      (err) => {
        let msg = "Failed to obtain live location.";
        let nextStatus: GeolocationStatus = "error";

        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission was denied. You can manually search for any city.";
          nextStatus = "denied";
          try {
            localStorage.setItem(STORAGE_KEY, "denied");
          } catch {}
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Location data is currently unavailable from your device.";
          nextStatus = "unavailable";
        } else if (err.code === err.TIMEOUT) {
          msg = "Location request timed out. Please try again or search manually.";
          nextStatus = "timeout";
        }

        setError(msg);
        setStatus(nextStatus);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Never use stale cached coordinates
      }
    );
  }, []);

  const dismissPrompt = useCallback(() => {
    setStatus("idle");
    try {
      localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {}
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setCoords(null);
    setError(null);
  }, []);

  return {
    status,
    coords,
    error,
    requestLocation,
    dismissPrompt,
    reset,
  };
}
