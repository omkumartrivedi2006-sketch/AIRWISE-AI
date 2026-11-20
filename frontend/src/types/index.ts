/**
 * AIRWISE AI — Frontend Shared Type Definitions (Module 03 Extended)
 */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    total_pages?: number;
  };
}

export interface ApiError {
  code: string;
  details?: Array<{ field: string; issue: string }> | string;
}

export interface LocationItem {
  id: number;
  name: string;
  city: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface PollutionObservationItem {
  id: number;
  location_id: number;
  aqi?: number;
  pm25?: number;
  pm10?: number;
  no2?: number;
  o3?: number;
  co?: number;
  so2?: number;
  temperature?: number;
  humidity?: number;
  source: string;
  observed_at: string;
  created_at: string;
  location?: LocationItem;
}

export interface PollutionSummaryData {
  location_id: number;
  location_name: string;
  city: string;
  country: string;
  observation_count: number;
  average_aqi?: number;
  min_aqi?: number;
  max_aqi?: number;
  average_pm25?: number;
  average_pm10?: number;
  average_temperature?: number;
  average_humidity?: number;
  start_date?: string;
  end_date?: string;
}

export interface ConversationItem {
  id: number;
  title: string;
  user_id?: number;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface MessageItem {
  id: number;
  conversation_id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface FeedbackSubmission {
  rating: number;
  comment?: string;
  conversation_id?: number;
  user_id?: number;
}

export interface FeedbackItem extends FeedbackSubmission {
  id: number;
  created_at: string;
}

export interface DatabaseHealth {
  status: "connected" | "unavailable" | "development_fallback";
  dialect: string;
  latency_ms?: number;
  details?: string;
}

export interface AIHealth {
  status: "ready" | "unconfigured" | "sdk_pending" | "service_error";
  provider: string;
  model: string;
  is_configured: boolean;
}

export interface HealthResponseData {
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
