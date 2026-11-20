/**
 * AIRWISE AI — Frontend Shared Type Definitions
 */

export interface DatabaseHealth {
  status: "connected" | "unavailable" | "development_mock_fallback";
  dialect: string;
  latency_ms?: number;
  details?: string;
}

export interface AIHealth {
  status: "ready" | "unconfigured" | "sdk_pending" | "service_error";
  provider: string;
  model: string;
  details?: string;
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  components: {
    database: DatabaseHealth;
    ai_engine: AIHealth;
  };
}

export interface PollutantMeasurement {
  value: number;
  unit: string;
  label: string;
  status: "good" | "moderate" | "unhealthy" | "hazardous";
  standardLimit: number;
}

export interface TelemetryPreviewData {
  location: string;
  aqi: number;
  category: "Good" | "Moderate" | "Unhealthy for Sensitive Groups" | "Unhealthy" | "Very Unhealthy" | "Hazardous";
  dominantPollutant: string;
  updatedAt: string;
  temperatureC: number;
  humidityPercent: number;
  pollutants: Record<string, PollutantMeasurement>;
}

export interface AIQueryContext {
  location?: string;
  aqi?: number;
  dominant_pollutant?: string;
  user_sensitivity?: string;
  temperature_c?: number;
}

export interface AIQueryRequest {
  prompt: string;
  context?: AIQueryContext;
}

export interface AIActionableInsight {
  severity: "low" | "moderate" | "elevated" | "severe" | "hazardous";
  precautions: string[];
  outdoor_activity_recommendation?: string;
}

export interface AIQueryResponse {
  response: string;
  provider: string;
  model: string;
  insights?: AIActionableInsight;
  timestamp: string;
}
