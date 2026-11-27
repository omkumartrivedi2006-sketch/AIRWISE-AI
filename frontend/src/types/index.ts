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
  aqi_scale?: string;
  aqi_category?: string;
  pm25?: number;
  pm10?: number;
  no2?: number;
  o3?: number;
  co?: number;
  so2?: number;
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
  wind_direction?: number;
  provider?: string;
  provider_observation_id?: string;
  source: string;
  is_verified?: boolean;
  is_demo?: boolean;
  freshness?: "live" | "cached" | "delayed" | "unavailable";
  observed_at: string;
  created_at: string;
  location?: LocationItem;
  location_name?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface LocationSearchResult {
  name: string;
  city: string;
  state?: string;
  country: string;
  country_code?: string;
  latitude: number;
  longitude: number;
  source: string;
}

export interface HistoricalObservationPoint {
  observed_at: string;
  aqi?: number;
  pm25?: number;
  pm10?: number;
  no2?: number;
  so2?: number;
  co?: number;
  o3?: number;
  temperature?: number;
  humidity?: number;
  freshness: string;
  source?: string;
}

export interface EnvironmentalDataStatus {
  environmental_data_enabled: boolean;
  primary_provider: string;
  providers: Array<{
    name: string;
    is_primary: boolean;
    is_configured: boolean;
    status: string;
    details?: string;
  }>;
  cache_ttl_seconds: number;
  max_fresh_data_age_minutes: number;
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

export interface ChatMessageRequest {
  content: string;
  role?: "user" | "assistant" | "system";
  location_id?: number;
}

export interface ChatMessageResponse {
  id: number;
  role: string;
  user_message: MessageItem;
  assistant_message: MessageItem;
  conversation_id: number;
  status: string;
}

export interface AIProviderStatusResponse {
  status: "ready" | "unconfigured" | "sdk_pending" | "service_error";
  provider: string;
  model: string;
  is_configured: boolean;
  details?: string;
}

// ==========================================
// Environmental Analytics & Geospatial Map (Module 07)
// ==========================================
export interface StatisticsData {
  count: number;
  mean?: number;
  median?: number;
  min?: number;
  max?: number;
  std_dev?: number;
  percentage_change?: number;
  methodology: string;
}

export interface TrendClassification {
  direction: "increasing" | "decreasing" | "stable" | "insufficient_data";
  percentage_change?: number;
  interpretation: string;
  confidence: "high" | "moderate" | "low" | "unsupported";
}

export interface AQICategoryDistribution {
  scale: string;
  categories: Record<string, number>;
  total_classified: number;
}

export interface TimeIntervalPoint {
  timestamp: string;
  period_label: string;
  value?: number;
  min?: number;
  max?: number;
  count: number;
}

export interface AnalyticsOverviewResponse {
  location_id: number;
  location_name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  period_start: string;
  period_end: string;
  latest_aqi?: number;
  latest_aqi_scale?: string;
  latest_aqi_category?: string;
  average_aqi?: number;
  latest_pm25?: number;
  average_pm25?: number;
  latest_pm10?: number;
  average_pm10?: number;
  observation_count: number;
  data_coverage_status: string;
  freshness: string;
  provider: string;
}

export interface AQITrendsResponse {
  location_id: number;
  city: string;
  aqi_scale: string;
  interval: string;
  points: TimeIntervalPoint[];
  trend: TrendClassification;
  category_distribution?: AQICategoryDistribution;
  statistics: StatisticsData;
}

export interface PollutantTrendsResponse {
  location_id: number;
  city: string;
  pollutant: string;
  unit: string;
  interval: string;
  points: TimeIntervalPoint[];
  trend: TrendClassification;
  statistics: StatisticsData;
}

export interface LocationComparisonItem {
  location_id: number;
  location_name: string;
  city: string;
  state?: string;
  country: string;
  observation_count: number;
  mean_value?: number;
  min_value?: number;
  max_value?: number;
  median_value?: number;
  latest_value?: number;
  latest_observed_at?: string;
  freshness: string;
  aqi_scale?: string;
  data_quality: string;
  provider: string;
}

export interface LocationComparisonResponse {
  metric: string;
  unit: string;
  period_start: string;
  period_end: string;
  locations: LocationComparisonItem[];
  is_scale_compatible: boolean;
  compatibility_notes: string;
  difference_summary?: string;
}

export interface DataCoverageResponse {
  location_id: number;
  city: string;
  country: string;
  period_start: string;
  period_end: string;
  total_expected_hours: number;
  recorded_observations: number;
  coverage_percentage: number;
  missing_intervals_count: number;
  stale_hours?: number;
  coverage_status: "good" | "partial" | "limited" | "insufficient" | "stale";
  available_pollutants: string[];
  aqi_scale?: string;
  primary_provider: string;
}

export interface MapObservationPoint {
  location_id: number;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  aqi?: number;
  aqi_scale?: string;
  aqi_category?: string;
  pm25?: number;
  pm10?: number;
  no2?: number;
  so2?: number;
  co?: number;
  o3?: number;
  temperature?: number;
  humidity?: number;
  observed_at?: string;
  provider: string;
  freshness: string;
  is_demo: boolean;
}

export interface AIInsightRequest {
  location_id?: number;
  city?: string;
  pollutant?: string;
  time_range?: string;
  start_date?: string;
  end_date?: string;
  query?: string;
}

export interface AIInsightResponse {
  key_finding: string;
  supporting_measurements: Record<string, any>;
  trend_interpretation: string;
  data_limitations: string;
  recommendations: string[];
  generated_at: string;
  provider: string;
  model: string;
  grounded_context_summary: Record<string, any>;
}

// ==========================================
// Module 08: Personalization, Alerts & Notifications
// ==========================================

export interface UserPreferences {
  id: number;
  user_id: number;
  preferred_language: string;
  preferred_location_id: number | null;
  timezone: string;
  temperature_unit: "C" | "F";
  preferred_aqi_scale: "US_EPA" | "IN_NAAQS";
  environmental_interests: string[];
  preferred_information: string[];
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  in_app_notifications: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferencesUpdatePayload {
  preferred_language?: string;
  preferred_location_id?: number | null;
  timezone?: string;
  temperature_unit?: "C" | "F";
  preferred_aqi_scale?: "US_EPA" | "IN_NAAQS";
  environmental_interests?: string[];
  preferred_information?: string[];
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  in_app_notifications?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
}

export interface SavedLocation {
  id: number;
  user_id: number;
  location_id: number;
  custom_name: string | null;
  is_primary: boolean;
  created_at: string;
  location_name?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  latest_aqi?: number | null;
  latest_category?: string | null;
}

export interface SavedLocationCreatePayload {
  location_id: number;
  custom_name?: string;
  is_primary?: boolean;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface SavedLocationUpdatePayload {
  custom_name?: string;
  is_primary?: boolean;
}

export interface AlertRule {
  id: number;
  user_id: number;
  location_id: number | null;
  alert_type: string;
  metric: string;
  threshold_value: number;
  comparison_operator: string;
  aqi_scale: string;
  is_enabled: boolean;
  notification_channels: string[];
  cooldown_minutes: number;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
  location_name?: string;
  city?: string;
}

export interface AlertRuleCreatePayload {
  location_id?: number | null;
  alert_type?: string;
  metric: string;
  threshold_value: number;
  comparison_operator?: string;
  aqi_scale?: string;
  is_enabled?: boolean;
  notification_channels?: string[];
  channels?: string[];
  cooldown_minutes?: number;
}

export interface AlertRuleUpdatePayload {
  location_id?: number | null;
  alert_type?: string;
  metric?: string;
  threshold_value?: number;
  comparison_operator?: string;
  aqi_scale?: string;
  is_enabled?: boolean;
  notification_channels?: string[];
  cooldown_minutes?: number;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  alert_rule_id: number | null;
  title: string;
  message: string;
  severity: "info" | "advisory" | "high" | "critical";
  notification_type: string;
  location_id: number | null;
  metric: string | null;
  value: number | null;
  unit: string | null;
  aqi_scale: string | null;
  observation_time: string | null;
  source: string | null;
  is_read: boolean;
  read_at: string | null;
  channels: string[];
  delivery_status: string;
  created_at: string;
  city?: string | null;
}

export interface RecommendationItem {
  id: string;
  category: string;
  title: string;
  description: string;
  action_item?: string | null;
  priority: "high" | "normal" | "low";
  source_attribution: string;
}

export interface RecommendationsResponse {
  user_id: number;
  location_id: number | null;
  city: string | null;
  aqi: number | null;
  aqi_category: string | null;
  source: string;
  is_cached: boolean;
  generated_at: string;
  recommendations: RecommendationItem[];
  general_guidance?: string;
}

// ==========================================
// Platform Administration & Monitoring (Module 09)
// ==========================================

export interface AdminDashboardMetrics {
  total_users: number;
  active_users: number;
  new_registrations_7d: number;
  total_conversations: number;
  total_ai_requests: number;
  total_observations: number;
  flagged_observations: number;
  active_alert_rules: number;
  total_notifications: number;
  failed_notifications: number;
  data_sources_healthy: number;
  data_sources_total: number;
}

export interface AdminDashboardOverview {
  metrics: AdminDashboardMetrics;
  system_status: "operational" | "degraded" | "maintenance";
  last_updated: string;
}

export interface AdminActivityPoint {
  date: string;
  registrations: number;
  ai_requests: number;
  observations: number;
  notifications: number;
}

export interface AdminActivityMetrics {
  range_days: number;
  data_points: AdminActivityPoint[];
}

export interface AdminUser {
  id: number;
  email: string;
  full_name: string | null;
  role: "USER" | "ADMIN";
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at: string | null;
  saved_locations_count: number;
  alert_rules_count: number;
  conversations_count: number;
}

export interface AdminObservation {
  id: number;
  location_id: number;
  city: string | null;
  country: string | null;
  aqi: number | null;
  aqi_scale: string;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  o3: number | null;
  temperature: number | null;
  humidity: number | null;
  provider: string | null;
  source: string;
  is_verified: boolean;
  is_demo: boolean;
  is_flagged: boolean;
  review_status: "unreviewed" | "verified" | "flagged" | "rejected";
  review_notes: string | null;
  reviewed_at: string | null;
  reviewed_by_email: string | null;
  observed_at: string;
  created_at: string;
}

export interface AdminDataSource {
  id: string;
  name: string;
  type: string;
  status: "operational" | "degraded" | "unavailable" | "unconfigured";
  is_configured: boolean;
  last_successful_sync: string | null;
  last_failed_sync: string | null;
  latency_ms: number | null;
  error_count_24h: number;
  coverage_summary: string;
  attribution: string;
}

export interface AdminDataSourceHealth {
  id: string;
  status: string;
  ping_success: boolean;
  latency_ms: number | null;
  checked_at: string;
  details?: string;
}

export interface AdminAiUsageOverview {
  is_enabled: boolean;
  is_configured: boolean;
  provider_name: string;
  model_name: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_latency_ms: number | null;
  timeout_count: number;
  estimated_tokens_used: number;
  daily_quota_limit: number;
  daily_quota_consumed: number;
}

export interface AdminAiUsageTrendPoint {
  date: string;
  request_count: number;
  error_count: number;
  avg_latency_ms: number | null;
}

export interface AdminAiUsageTrends {
  range_days: number;
  data_points: AdminAiUsageTrendPoint[];
}

export interface AdminNotification {
  id: number;
  user_id: number;
  user_email: string | null;
  title: string;
  message: string;
  severity: string;
  notification_type: string;
  metric: string | null;
  value: number | null;
  channels: string[];
  delivery_status: "delivered" | "failed" | "pending";
  failure_reason: string | null;
  retry_count: number;
  is_read: boolean;
  created_at: string;
}

export interface AdminNotificationMetrics {
  total_notifications: number;
  delivered_count: number;
  pending_count: number;
  failed_count: number;
  in_app_count: number;
  email_count: number;
  web_push_count: number;
}

export interface AdminDatabaseHealth {
  status: "connected" | "degraded" | "disconnected";
  latency_ms: number;
  dialect: string;
  pool_size: number;
  checked_at: string;
  table_counts: Record<string, number>;
}

export interface AdminServiceHealth {
  fastapi_status: string;
  database_status: string;
  gemini_status: string;
  open_meteo_status: string;
  waqi_status: string;
  notifications_status: string;
}

export interface AdminSystemHealth {
  platform_name: string;
  version: string;
  environment: string;
  uptime_seconds: number;
  services: AdminServiceHealth;
  database: AdminDatabaseHealth;
  timestamp: string;
}

export interface AdminAuditLog {
  id: number;
  admin_id: number | null;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent?: string | null;
  created_at: string;
}

// ==========================================
// Indoor Air Quality Types (Module 10)
// ==========================================
export interface IndoorSensorReadings {
  pm25?: number;
  pm10?: number;
  co2?: number;
  temperature?: number;
  humidity?: number;
}

export interface IndoorAssessment {
  id: number;
  user_id: number;
  room_type: string;
  room_name: string;
  ventilation: string;
  cooking_fuel: string;
  smoking_exposure: boolean;
  air_purifier: boolean;
  dust_or_smoke: boolean;
  mold_dampness: boolean;
  occupants: number;
  sensor_readings?: IndoorSensorReadings | null;
  risk_score: number;
  risk_level: string;
  identified_sources: string[];
  risk_factors: string[];
  recommendations: string[];
  ventilation_tips: string[];
  priority_actions: string[];
  created_at: string;
  updated_at: string;
}

export interface IndoorAssessmentCreatePayload {
  room_type: string;
  room_name?: string;
  ventilation: string;
  cooking_fuel: string;
  smoking_exposure: boolean;
  air_purifier: boolean;
  dust_or_smoke: boolean;
  mold_dampness: boolean;
  occupants: number;
  sensor_readings?: IndoorSensorReadings | null;
}

export interface IndoorAIAdviceRequest {
  question: string;
  room_type?: string;
  assessment_id?: number;
}

export interface IndoorAIAdviceResponse {
  explanation: string;
  action_steps: string[];
  daily_routine: string[];
  weekly_maintenance: string[];
  model: string;
  disclaimer: string;
}

// ==========================================
// Community Insights Types (Module 11)
// ==========================================
export interface CommunityReport {
  id: number;
  reference_id: string;
  user_name: string;
  category: string;
  title: string;
  description: string;
  location_name: string;
  latitude: number;
  longitude: number;
  incident_time: string;
  severity: "minor" | "moderate" | "severe";
  image_url?: string | null;
  status: "SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "RESOLVED";
  moderation_notes?: string | null;
  upvotes: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityReportCreatePayload {
  category: string;
  title: string;
  description: string;
  location_name: string;
  latitude: number;
  longitude: number;
  incident_time?: string;
  severity?: "minor" | "moderate" | "severe";
  image_url?: string;
}

export interface CommunityReportStatusUpdatePayload {
  status: string;
  moderation_notes?: string;
}

export interface CommunityOverviewStats {
  total_reports: number;
  verified_reports: number;
  under_review: number;
  resolved_reports: number;
  category_counts: Record<string, number>;
  nearby_stations: Array<{
    id: number;
    name: string;
    city: string;
    latitude: number;
    longitude: number;
    station_code: string;
    is_official: boolean;
  }>;
}

export interface CommunityAIInsights {
  reporting_period: string;
  total_analyzed: number;
  top_reported_categories: string[];
  identified_hotspots: string[];
  summary: string;
  community_actions: string[];
  disclaimer: string;
}
