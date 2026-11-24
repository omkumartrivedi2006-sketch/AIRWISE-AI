/**
 * AIRWISE AI — Centralized API Client Service
 * Fully typed communication layer connecting Next.js frontend with FastAPI backend.
 * Supports HttpOnly cookie authentication and in-memory JWT bearer credentials.
 */

import {
  ApiResponse,
  HealthResponseData,
  DatabaseHealth,
  LocationItem,
  PollutionObservationItem,
  PollutionSummaryData,
  LocationSearchResult,
  HistoricalObservationPoint,
  EnvironmentalDataStatus,
  AnalyticsOverviewResponse,
  AQITrendsResponse,
  PollutantTrendsResponse,
  StatisticsData,
  LocationComparisonResponse,
  DataCoverageResponse,
  MapObservationPoint,
  AIInsightRequest,
  AIInsightResponse,
  ConversationItem,
  MessageItem,
  FeedbackSubmission,
  FeedbackItem,
  AIQueryRequest,
  AIQueryResponse,
} from "@/types";

import {
  User,
  TokenResponseData,
  RegisterPayload,
  LoginPayload,
  ChangePasswordPayload,
  ResetPasswordPayload,
  ProfileUpdatePayload,
} from "@/types/auth";

const API_BASE_URL = (() => {
  let base =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000/api/v1";

  base = base.replace(/\/+$/, "");

  if (!base.endsWith("/api/v1")) {
    if (base.endsWith("/api")) {
      base = `${base}/v1`;
    } else {
      base = `${base}/api/v1`;
    }
  }

  return base;
})();

export class ApiClient {
  private static accessToken: string | null = null;

  public static setAccessToken(token: string | null) {
    this.accessToken = token;
    if (typeof window !== "undefined") {
      try {
        if (token) {
          localStorage.setItem("airwise_token", token);
        } else {
          localStorage.removeItem("airwise_token");
        }
      } catch {}
    }
  }

  public static getAccessToken(): string | null {
    if (!this.accessToken && typeof window !== "undefined") {
      try {
        this.accessToken = localStorage.getItem("airwise_token");
      } catch {}
    }
    return this.accessToken;
  }

  private static async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${cleanEndpoint}`;

    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string> || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers,
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg =
          responseData?.message ||
          responseData?.error?.code ||
          `HTTP ${response.status}: Request failed`;
        throw new Error(errorMsg);
      }

      return responseData as ApiResponse<T>;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown network error";
      throw new Error(`API ${endpoint} Error: ${message}`);
    }
  }

  // ==========================================
  // Authentication & Session Management (Module 04)
  // ==========================================
  public static async register(data: RegisterPayload): Promise<ApiResponse<TokenResponseData>> {
    const res = await this.request<TokenResponseData>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.success && res.data?.access_token) {
      this.setAccessToken(res.data.access_token);
    }
    return res;
  }

  public static async login(data: LoginPayload): Promise<ApiResponse<TokenResponseData>> {
    const res = await this.request<TokenResponseData>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.success && res.data?.access_token) {
      this.setAccessToken(res.data.access_token);
    }
    return res;
  }

  public static async refreshSession(): Promise<ApiResponse<TokenResponseData>> {
    const res = await this.request<TokenResponseData>("/auth/refresh", {
      method: "POST",
    });
    if (res.success && res.data?.access_token) {
      this.setAccessToken(res.data.access_token);
    }
    return res;
  }

  public static async logout(): Promise<ApiResponse<{ status: string }>> {
    try {
      const res = await this.request<{ status: string }>("/auth/logout", {
        method: "POST",
      });
      this.setAccessToken(null);
      return res;
    } catch (err) {
      this.setAccessToken(null);
      throw err;
    }
  }

  public static async logoutAll(): Promise<ApiResponse<{ revoked_sessions: number }>> {
    const res = await this.request<{ revoked_sessions: number }>("/auth/logout-all", {
      method: "POST",
    });
    this.setAccessToken(null);
    return res;
  }

  public static async getMe(): Promise<ApiResponse<User>> {
    return this.request<User>("/auth/me");
  }

  public static async updateMe(data: ProfileUpdatePayload): Promise<ApiResponse<User>> {
    return this.request<User>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  public static async changePassword(data: ChangePasswordPayload): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public static async forgotPassword(email: string): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  public static async resetPassword(data: ResetPasswordPayload): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public static async verifyEmail(token: string): Promise<ApiResponse<User>> {
    return this.request<User>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  public static async resendVerification(email: string): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  // ==========================================
  // Health & Diagnostics
  // ==========================================
  public static async getHealth(): Promise<ApiResponse<HealthResponseData>> {
    return this.request<HealthResponseData>("/health");
  }

  public static async getDatabaseHealth(): Promise<ApiResponse<DatabaseHealth>> {
    return this.request<DatabaseHealth>("/health/database");
  }

  // ==========================================
  // Monitoring Locations
  // ==========================================
  public static async getLocations(page = 1, limit = 50): Promise<ApiResponse<LocationItem[]>> {
    return this.request<LocationItem[]>(`/locations?page=${page}&limit=${limit}`);
  }

  public static async getLocation(locationId: number): Promise<ApiResponse<LocationItem>> {
    return this.request<LocationItem>(`/locations/${locationId}`);
  }

  public static async createLocation(
    data: Omit<LocationItem, "id" | "created_at">
  ): Promise<ApiResponse<LocationItem>> {
    return this.request<LocationItem>("/locations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ==========================================
  // Pollution Telemetry Observations
  // ==========================================
  public static async getPollutionObservations(params?: {
    location_id?: number;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PollutionObservationItem[]>> {
    const query = new URLSearchParams();
    if (params?.location_id) query.append("location_id", params.location_id.toString());
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const qs = query.toString() ? `?${query.toString()}` : "";
    return this.request<PollutionObservationItem[]>(`/pollution${qs}`);
  }

  public static async getLatestPollution(limit = 20): Promise<ApiResponse<PollutionObservationItem[]>> {
    return this.request<PollutionObservationItem[]>(`/pollution/latest?limit=${limit}`);
  }

  public static async getPollutionSummary(
    locationId: number,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<PollutionSummaryData>> {
    const query = new URLSearchParams({ location_id: locationId.toString() });
    if (startDate) query.append("start_date", startDate);
    if (endDate) query.append("end_date", endDate);
    return this.request<PollutionSummaryData>(`/pollution/summary?${query.toString()}`);
  }

  public static async recordPollutionObservation(
    data: Omit<PollutionObservationItem, "id" | "created_at" | "location">
  ): Promise<ApiResponse<PollutionObservationItem>> {
    return this.request<PollutionObservationItem>("/pollution", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ==========================================
  // Live Environmental Data Integration (Module 06)
  // ==========================================
  public static async getLatestPollutionForLocation(params: {
    city?: string;
    location_id?: number;
    lat?: number;
    lon?: number;
    refresh?: boolean;
  }): Promise<ApiResponse<PollutionObservationItem>> {
    const query = new URLSearchParams();
    if (params.city) query.append("city", params.city);
    if (params.location_id) query.append("location_id", params.location_id.toString());
    if (params.lat !== undefined) query.append("lat", params.lat.toString());
    if (params.lon !== undefined) query.append("lon", params.lon.toString());
    if (params.refresh) query.append("refresh", "true");

    return this.request<PollutionObservationItem>(`/pollution/latest?${query.toString()}`);
  }

  public static async searchLocations(query: string, limit = 5): Promise<ApiResponse<LocationSearchResult[]>> {
    return this.request<LocationSearchResult[]>(
      `/pollution/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  }

  public static async getPollutionHistory(params: {
    city?: string;
    location_id?: number;
    lat?: number;
    lon?: number;
    hours?: number;
  }): Promise<ApiResponse<HistoricalObservationPoint[]>> {
    const query = new URLSearchParams();
    if (params.city) query.append("city", params.city);
    if (params.location_id) query.append("location_id", params.location_id.toString());
    if (params.lat !== undefined) query.append("lat", params.lat.toString());
    if (params.lon !== undefined) query.append("lon", params.lon.toString());
    if (params.hours) query.append("hours", params.hours.toString());

    return this.request<HistoricalObservationPoint[]>(`/pollution/history?${query.toString()}`);
  }

  public static async getPollutionSources(): Promise<ApiResponse<Array<{
    name: string;
    is_primary: boolean;
    is_configured: boolean;
    status: string;
    details?: string;
  }>>> {
    return this.request<Array<{
      name: string;
      is_primary: boolean;
      is_configured: boolean;
      status: string;
      details?: string;
    }>>("/pollution/sources");
  }

  public static async getPollutionDataStatus(): Promise<ApiResponse<EnvironmentalDataStatus>> {
    return this.request<EnvironmentalDataStatus>("/pollution/data-status");
  }

  // ==========================================
  // Conversations & Dialogue Sessions
  // ==========================================
  public static async getConversations(userId?: number, page = 1, limit = 20): Promise<ApiResponse<ConversationItem[]>> {
    const qs = userId ? `?user_id=${userId}&page=${page}&limit=${limit}` : `?page=${page}&limit=${limit}`;
    return this.request<ConversationItem[]>(`/conversations${qs}`);
  }

  public static async createConversation(data: {
    title: string;
    user_id?: number;
  }): Promise<ApiResponse<ConversationItem>> {
    return this.request<ConversationItem>("/conversations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public static async deleteConversation(conversationId: number, userId?: number): Promise<ApiResponse<{ deleted_id: number }>> {
    const qs = userId ? `?user_id=${userId}` : "";
    return this.request<{ deleted_id: number }>(`/conversations/${conversationId}${qs}`, {
      method: "DELETE",
    });
  }

  // ==========================================
  // Messages & AI Chat (Module 05)
  // ==========================================
  public static async getMessages(conversationId: number, page = 1, limit = 50): Promise<ApiResponse<MessageItem[]>> {
    return this.request<MessageItem[]>(`/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
  }

  public static async postMessage(
    conversationId: number,
    data: { role: string; content: string }
  ): Promise<ApiResponse<MessageItem>> {
    return this.request<MessageItem>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public static async sendChatMessage(
    conversationId: number,
    content: string,
    locationId?: number
  ): Promise<ApiResponse<import("@/types").ChatMessageResponse>> {
    return this.request<import("@/types").ChatMessageResponse>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, location_id: locationId }),
    });
  }

  public static async getAIStatus(): Promise<ApiResponse<import("@/types").AIProviderStatusResponse>> {
    return this.request<import("@/types").AIProviderStatusResponse>("/ai/status");
  }

  // ==========================================
  // Feedback
  // ==========================================
  public static async submitFeedback(data: FeedbackSubmission): Promise<ApiResponse<FeedbackItem>> {
    return this.request<FeedbackItem>("/feedback", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ==========================================
  // AI Query (Module 01 Foundation & Preview)
  // ==========================================
  public static async queryAI(data: {
    prompt: string;
    context?: Record<string, unknown>;
  }): Promise<ApiResponse<{ response: string }>> {
    return this.request<{ response: string }>("/ai/query", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ==========================================
  // Environmental Analytics & Visualizations (Module 07)
  // ==========================================
  public static async getAnalyticsOverview(params?: {
    location_id?: number;
    city?: string;
    time_range?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<AnalyticsOverviewResponse>> {
    const q = new URLSearchParams();
    if (params?.location_id) q.append("location_id", params.location_id.toString());
    if (params?.city) q.append("city", params.city);
    if (params?.time_range) q.append("time_range", params.time_range);
    if (params?.start_date) q.append("start_date", params.start_date);
    if (params?.end_date) q.append("end_date", params.end_date);
    return this.request<AnalyticsOverviewResponse>(`/analytics/overview?${q.toString()}`);
  }

  public static async getAqiTrends(params?: {
    location_id?: number;
    city?: string;
    interval?: string;
    time_range?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<AQITrendsResponse>> {
    const q = new URLSearchParams();
    if (params?.location_id) q.append("location_id", params.location_id.toString());
    if (params?.city) q.append("city", params.city);
    if (params?.interval) q.append("interval", params.interval);
    if (params?.time_range) q.append("time_range", params.time_range);
    if (params?.start_date) q.append("start_date", params.start_date);
    if (params?.end_date) q.append("end_date", params.end_date);
    return this.request<AQITrendsResponse>(`/analytics/aqi-trends?${q.toString()}`);
  }

  public static async getPollutantTrends(params: {
    pollutant: string;
    location_id?: number;
    city?: string;
    interval?: string;
    time_range?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<PollutantTrendsResponse>> {
    const q = new URLSearchParams({ pollutant: params.pollutant });
    if (params.location_id) q.append("location_id", params.location_id.toString());
    if (params.city) q.append("city", params.city);
    if (params.interval) q.append("interval", params.interval);
    if (params.time_range) q.append("time_range", params.time_range);
    if (params.start_date) q.append("start_date", params.start_date);
    if (params.end_date) q.append("end_date", params.end_date);
    return this.request<PollutantTrendsResponse>(`/analytics/pollutant-trends?${q.toString()}`);
  }

  public static async getStatistics(params?: {
    metric?: string;
    location_id?: number;
    city?: string;
    time_range?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<StatisticsData>> {
    const q = new URLSearchParams();
    if (params?.metric) q.append("metric", params.metric);
    if (params?.location_id) q.append("location_id", params.location_id.toString());
    if (params?.city) q.append("city", params.city);
    if (params?.time_range) q.append("time_range", params.time_range);
    if (params?.start_date) q.append("start_date", params.start_date);
    if (params?.end_date) q.append("end_date", params.end_date);
    return this.request<StatisticsData>(`/analytics/statistics?${q.toString()}`);
  }

  public static async compareLocations(params: {
    metric?: string;
    location_ids?: number[];
    cities?: string[];
    time_range?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<LocationComparisonResponse>> {
    const q = new URLSearchParams();
    if (params.metric) q.append("metric", params.metric);
    if (params.time_range) q.append("time_range", params.time_range);
    if (params.start_date) q.append("start_date", params.start_date);
    if (params.end_date) q.append("end_date", params.end_date);
    if (params.location_ids) {
      params.location_ids.forEach((id) => q.append("location_ids", id.toString()));
    }
    if (params.cities) {
      params.cities.forEach((c) => q.append("cities", c));
    }
    return this.request<LocationComparisonResponse>(`/analytics/compare?${q.toString()}`);
  }

  public static async getDataCoverage(params?: {
    location_id?: number;
    city?: string;
    time_range?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<DataCoverageResponse>> {
    const q = new URLSearchParams();
    if (params?.location_id) q.append("location_id", params.location_id.toString());
    if (params?.city) q.append("city", params.city);
    if (params?.time_range) q.append("time_range", params.time_range);
    if (params?.start_date) q.append("start_date", params.start_date);
    if (params?.end_date) q.append("end_date", params.end_date);
    return this.request<DataCoverageResponse>(`/analytics/data-coverage?${q.toString()}`);
  }

  public static async generateAiInsight(data: AIInsightRequest): Promise<ApiResponse<AIInsightResponse>> {
    return this.request<AIInsightResponse>("/analytics/insights", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public static async downloadCsvExport(params?: {
    location_id?: number;
    city?: string;
    time_range?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<string> {
    const q = new URLSearchParams();
    if (params?.location_id) q.append("location_id", params.location_id.toString());
    if (params?.city) q.append("city", params.city);
    if (params?.time_range) q.append("time_range", params.time_range);
    if (params?.start_date) q.append("start_date", params.start_date);
    if (params?.end_date) q.append("end_date", params.end_date);

    const url = `${API_BASE_URL}/analytics/export/csv?${q.toString()}`;
    const headers: Record<string, string> = {
      ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
    };
    const res = await fetch(url, { headers, credentials: "include" });
    if (!res.ok) throw new Error("Failed to export analytics CSV");
    return res.text();
  }

  // ==========================================
  // Geospatial Map (Module 07)
  // ==========================================
  public static async getMapObservations(): Promise<ApiResponse<MapObservationPoint[]>> {
    return this.request<MapObservationPoint[]>("/map/observations");
  }

  public static async getMapLocations(): Promise<ApiResponse<LocationItem[]>> {
    return this.request<LocationItem[]>("/map/locations");
  }

  // ==========================================
  // Personalization, Alerts & Notifications (Module 08)
  // ==========================================

  // Preferences
  public static async getMyPreferences(): Promise<ApiResponse<import("@/types").UserPreferences>> {
    return this.request<import("@/types").UserPreferences>("/users/me/preferences");
  }

  public static async updateMyPreferences(
    data: import("@/types").UserPreferencesUpdatePayload
  ): Promise<ApiResponse<import("@/types").UserPreferences>> {
    return this.request<import("@/types").UserPreferences>("/users/me/preferences", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Saved Locations
  public static async getSavedLocations(): Promise<ApiResponse<import("@/types").SavedLocation[]>> {
    return this.request<import("@/types").SavedLocation[]>("/users/me/locations");
  }

  public static async addSavedLocation(
    data: import("@/types").SavedLocationCreatePayload
  ): Promise<ApiResponse<import("@/types").SavedLocation>> {
    return this.request<import("@/types").SavedLocation>("/users/me/locations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public static async updateSavedLocation(
    savedLocationId: number,
    data: import("@/types").SavedLocationUpdatePayload
  ): Promise<ApiResponse<import("@/types").SavedLocation>> {
    return this.request<import("@/types").SavedLocation>(`/users/me/locations/${savedLocationId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  public static async deleteSavedLocation(savedLocationId: number): Promise<ApiResponse<{ deleted_id: number }>> {
    return this.request<{ deleted_id: number }>(`/users/me/locations/${savedLocationId}`, {
      method: "DELETE",
    });
  }

  // Alert Rules
  public static async getAlertRules(): Promise<ApiResponse<import("@/types").AlertRule[]>> {
    return this.request<import("@/types").AlertRule[]>("/alerts/rules");
  }

  public static async createAlertRule(
    data: import("@/types").AlertRuleCreatePayload
  ): Promise<ApiResponse<import("@/types").AlertRule>> {
    return this.request<import("@/types").AlertRule>("/alerts/rules", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public static async updateAlertRule(
    ruleId: number,
    data: import("@/types").AlertRuleUpdatePayload
  ): Promise<ApiResponse<import("@/types").AlertRule>> {
    return this.request<import("@/types").AlertRule>(`/alerts/rules/${ruleId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  public static async deleteAlertRule(ruleId: number): Promise<ApiResponse<{ deleted_id: number }>> {
    return this.request<{ deleted_id: number }>(`/alerts/rules/${ruleId}`, {
      method: "DELETE",
    });
  }

  public static async evaluateAlerts(locationId: number): Promise<ApiResponse<{ triggered_count: number; location_id: number }>> {
    return this.request<{ triggered_count: number; location_id: number }>(`/alerts/evaluate?location_id=${locationId}`, {
      method: "POST",
    });
  }

  // Notifications
  public static async getNotifications(params?: {
    is_read?: boolean;
    notification_type?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<import("@/types").NotificationItem[]>> {
    const q = new URLSearchParams();
    if (params?.is_read !== undefined) q.append("is_read", params.is_read.toString());
    if (params?.notification_type) q.append("notification_type", params.notification_type);
    if (params?.page) q.append("page", params.page.toString());
    if (params?.limit) q.append("limit", params.limit.toString());

    return this.request<import("@/types").NotificationItem[]>(`/notifications?${q.toString()}`);
  }

  public static async getUnreadNotificationCount(): Promise<ApiResponse<{ unread_count: number }>> {
    return this.request<{ unread_count: number }>("/notifications/unread-count");
  }

  public static async markNotificationRead(notificationId: number): Promise<ApiResponse<import("@/types").NotificationItem>> {
    return this.request<import("@/types").NotificationItem>(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
  }

  public static async markAllNotificationsRead(): Promise<ApiResponse<{ updated_count: number }>> {
    return this.request<{ updated_count: number }>("/notifications/mark-all-read", {
      method: "POST",
    });
  }

  public static async deleteNotification(notificationId: number): Promise<ApiResponse<{ deleted_id: number }>> {
    return this.request<{ deleted_id: number }>(`/notifications/${notificationId}`, {
      method: "DELETE",
    });
  }

  public static async subscribeWebPush(data: {
    endpoint: string;
    p256dh_key: string;
    auth_key: string;
    user_agent?: string;
  }): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>("/notifications/push/subscribe", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public static async unsubscribeWebPush(): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>("/notifications/push/subscribe", {
      method: "DELETE",
    });
  }

  // Recommendations
  public static async getPersonalizedRecommendations(
    locationId?: number
  ): Promise<ApiResponse<import("@/types").RecommendationsResponse>> {
    const qs = locationId ? `?location_id=${locationId}` : "";
    return this.request<import("@/types").RecommendationsResponse>(`/recommendations${qs}`);
  }

  public static async refreshPersonalizedRecommendations(
    locationId?: number
  ): Promise<ApiResponse<import("@/types").RecommendationsResponse>> {
    const qs = locationId ? `?location_id=${locationId}` : "";
    return this.request<import("@/types").RecommendationsResponse>(`/recommendations/refresh${qs}`, {
      method: "POST",
    });
  }

  // Compatibility aliases for Dashboard and Telemetry
  public static async getRecommendations(locationId?: number): Promise<ApiResponse<import("@/types").RecommendationsResponse>> {
    return this.getPersonalizedRecommendations(locationId);
  }

  public static async saveLocation(data: import("@/types").SavedLocationCreatePayload): Promise<ApiResponse<import("@/types").SavedLocation>> {
    return this.addSavedLocation(data);
  }

  public static async getPollutionObservation(params: {
    city?: string;
    location_id?: number;
    lat?: number;
    lon?: number;
    force_refresh?: boolean;
  }): Promise<ApiResponse<import("@/types").PollutionObservationItem>> {
    return this.getLatestPollutionForLocation({
      city: params.city,
      location_id: params.location_id,
      lat: params.lat,
      lon: params.lon,
      refresh: params.force_refresh,
    });
  }

  public static async getHistoricalObservations(params: {
    city?: string;
    location_id?: number;
    lat?: number;
    lon?: number;
    limit?: number;
  }): Promise<ApiResponse<import("@/types").HistoricalObservationPoint[]>> {
    return this.getPollutionHistory({
      city: params.city,
      location_id: params.location_id,
      lat: params.lat,
      lon: params.lon,
      hours: params.limit,
    });
  }

  // ==========================================
  // Platform Administration (Module 09)
  // ==========================================

  public static async getAdminOverview(): Promise<ApiResponse<import("@/types").AdminDashboardOverview>> {
    return this.request<import("@/types").AdminDashboardOverview>("/admin/dashboard/overview");
  }

  public static async getAdminActivity(days = 7): Promise<ApiResponse<import("@/types").AdminActivityMetrics>> {
    return this.request<import("@/types").AdminActivityMetrics>(`/admin/dashboard/activity?days=${days}`);
  }

  public static async getAdminUsers(params?: {
    query?: string;
    role?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<import("@/types").AdminUser[]>> {
    const q = new URLSearchParams();
    if (params?.query) q.append("query", params.query);
    if (params?.role) q.append("role", params.role);
    if (params?.is_active !== undefined) q.append("is_active", String(params.is_active));
    if (params?.page) q.append("page", params.page.toString());
    if (params?.limit) q.append("limit", params.limit.toString());
    return this.request<import("@/types").AdminUser[]>(`/admin/users?${q.toString()}`);
  }

  public static async getAdminUser(userId: number): Promise<ApiResponse<import("@/types").AdminUser>> {
    return this.request<import("@/types").AdminUser>(`/admin/users/${userId}`);
  }

  public static async updateAdminUserStatus(
    userId: number,
    is_active: boolean,
    reason?: string
  ): Promise<ApiResponse<import("@/types").AdminUser>> {
    return this.request<import("@/types").AdminUser>(`/admin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ is_active, reason }),
    });
  }

  public static async updateAdminUserRole(
    userId: number,
    role: string,
    reason?: string
  ): Promise<ApiResponse<import("@/types").AdminUser>> {
    return this.request<import("@/types").AdminUser>(`/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role, reason }),
    });
  }

  public static async getAdminEnvironmentalData(params?: {
    query?: string;
    location_id?: number;
    review_status?: string;
    is_flagged?: boolean;
    is_demo?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<import("@/types").AdminObservation[]>> {
    const q = new URLSearchParams();
    if (params?.query) q.append("query", params.query);
    if (params?.location_id) q.append("location_id", params.location_id.toString());
    if (params?.review_status) q.append("review_status", params.review_status);
    if (params?.is_flagged !== undefined) q.append("is_flagged", String(params.is_flagged));
    if (params?.is_demo !== undefined) q.append("is_demo", String(params.is_demo));
    if (params?.page) q.append("page", params.page.toString());
    if (params?.limit) q.append("limit", params.limit.toString());
    return this.request<import("@/types").AdminObservation[]>(`/admin/environmental-data?${q.toString()}`);
  }

  public static async getAdminObservation(
    observationId: number
  ): Promise<ApiResponse<import("@/types").AdminObservation>> {
    return this.request<import("@/types").AdminObservation>(`/admin/environmental-data/${observationId}`);
  }

  public static async reviewAdminObservation(
    observationId: number,
    review_status: string,
    reason: string
  ): Promise<ApiResponse<import("@/types").AdminObservation>> {
    return this.request<import("@/types").AdminObservation>(`/admin/environmental-data/${observationId}/review`, {
      method: "PATCH",
      body: JSON.stringify({ review_status, reason }),
    });
  }

  public static async getAdminDataSources(): Promise<ApiResponse<import("@/types").AdminDataSource[]>> {
    return this.request<import("@/types").AdminDataSource[]>("/admin/data-sources");
  }

  public static async pingAdminDataSource(
    sourceId: string
  ): Promise<ApiResponse<import("@/types").AdminDataSourceHealth>> {
    return this.request<import("@/types").AdminDataSourceHealth>(`/admin/data-sources/${sourceId}/health`);
  }

  public static async getAdminAiUsage(): Promise<ApiResponse<import("@/types").AdminAiUsageOverview>> {
    return this.request<import("@/types").AdminAiUsageOverview>("/admin/ai-usage/overview");
  }

  public static async getAdminAiTrends(
    days = 7
  ): Promise<ApiResponse<import("@/types").AdminAiUsageTrends>> {
    return this.request<import("@/types").AdminAiUsageTrends>(`/admin/ai-usage/trends?days=${days}`);
  }

  public static async getAdminNotifications(params?: {
    delivery_status?: string;
    severity?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<import("@/types").AdminNotification[]>> {
    const q = new URLSearchParams();
    if (params?.delivery_status) q.append("delivery_status", params.delivery_status);
    if (params?.severity) q.append("severity", params.severity);
    if (params?.page) q.append("page", params.page.toString());
    if (params?.limit) q.append("limit", params.limit.toString());
    return this.request<import("@/types").AdminNotification[]>(`/admin/notifications?${q.toString()}`);
  }

  public static async getAdminNotificationMetrics(): Promise<ApiResponse<import("@/types").AdminNotificationMetrics>> {
    return this.request<import("@/types").AdminNotificationMetrics>("/admin/notifications/metrics");
  }

  public static async retryAdminNotification(
    notificationId: number
  ): Promise<ApiResponse<{ notification_id: number; delivery_status: string; message: string; retry_count: number }>> {
    return this.request<{ notification_id: number; delivery_status: string; message: string; retry_count: number }>(
      `/admin/notifications/${notificationId}/retry`,
      { method: "POST" }
    );
  }

  public static async getAdminSystemHealth(): Promise<ApiResponse<import("@/types").AdminSystemHealth>> {
    return this.request<import("@/types").AdminSystemHealth>("/admin/system/health");
  }

  public static async getAdminDatabaseHealth(): Promise<ApiResponse<import("@/types").AdminDatabaseHealth>> {
    return this.request<import("@/types").AdminDatabaseHealth>("/admin/system/database");
  }

  public static async getAdminAuditLogs(params?: {
    action?: string;
    target_type?: string;
    admin_id?: number;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<import("@/types").AdminAuditLog[]>> {
    const q = new URLSearchParams();
    if (params?.action) q.append("action", params.action);
    if (params?.target_type) q.append("target_type", params.target_type);
    if (params?.admin_id) q.append("admin_id", params.admin_id.toString());
    if (params?.page) q.append("page", params.page.toString());
    if (params?.limit) q.append("limit", params.limit.toString());
    return this.request<import("@/types").AdminAuditLog[]>(`/admin/audit-logs?${q.toString()}`);
  }

  // ==========================================
  // Indoor Air Quality (Module 10)
  // ==========================================
  public static async submitIndoorAssessment(
    data: import("@/types").IndoorAssessmentCreatePayload
  ): Promise<ApiResponse<import("@/types").IndoorAssessment>> {
    return this.request<import("@/types").IndoorAssessment>("/indoor/assessments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public static async getIndoorAssessments(
    limit = 20
  ): Promise<ApiResponse<import("@/types").IndoorAssessment[]>> {
    return this.request<import("@/types").IndoorAssessment[]>(`/indoor/assessments?limit=${limit}`);
  }

  public static async getLatestIndoorAssessment(): Promise<ApiResponse<import("@/types").IndoorAssessment | null>> {
    return this.request<import("@/types").IndoorAssessment | null>("/indoor/assessments/latest");
  }

  public static async consultIndoorAi(
    data: import("@/types").IndoorAIAdviceRequest
  ): Promise<ApiResponse<import("@/types").IndoorAIAdviceResponse>> {
    return this.request<import("@/types").IndoorAIAdviceResponse>("/indoor/ai-consult", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ==========================================
  // Community Insights (Module 11)
  // ==========================================
  public static async getCommunityOverview(): Promise<ApiResponse<import("@/types").CommunityOverviewStats>> {
    return this.request<import("@/types").CommunityOverviewStats>("/community/overview");
  }

  public static async getCommunityReports(params?: {
    category?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<import("@/types").CommunityReport[]>> {
    const q = new URLSearchParams();
    if (params?.category) q.append("category", params.category);
    if (params?.status) q.append("status", params.status);
    if (params?.limit) q.append("limit", params.limit.toString());
    if (params?.offset) q.append("offset", params.offset.toString());
    const qs = q.toString() ? `?${q.toString()}` : "";
    return this.request<import("@/types").CommunityReport[]>(`/community/reports${qs}`);
  }

  public static async submitCommunityReport(
    data: import("@/types").CommunityReportCreatePayload
  ): Promise<ApiResponse<import("@/types").CommunityReport>> {
    return this.request<import("@/types").CommunityReport>("/community/reports", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public static async getMyCommunityReports(): Promise<ApiResponse<import("@/types").CommunityReport[]>> {
    return this.request<import("@/types").CommunityReport[]>("/community/reports/my");
  }

  public static async getCommunityReport(
    id: number
  ): Promise<ApiResponse<import("@/types").CommunityReport>> {
    return this.request<import("@/types").CommunityReport>(`/community/reports/${id}`);
  }

  public static async updateCommunityReportStatus(
    id: number,
    data: import("@/types").CommunityReportStatusUpdatePayload
  ): Promise<ApiResponse<import("@/types").CommunityReport>> {
    return this.request<import("@/types").CommunityReport>(`/community/reports/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  public static async getCommunityAiInsights(): Promise<ApiResponse<import("@/types").CommunityAIInsights>> {
    return this.request<import("@/types").CommunityAIInsights>("/community/ai-insights");
  }
}
