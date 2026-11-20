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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";

export class ApiClient {
  private static accessToken: string | null = null;

  public static setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  public static getAccessToken(): string | null {
    return this.accessToken;
  }

  private static async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
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
  public static async register(data: RegisterPayload): Promise<ApiResponse<User>> {
    return this.request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
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
  // Messages
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
  // AI Query (Module 01 Foundation)
  // ==========================================
  public static async queryAI(payload: AIQueryRequest): Promise<ApiResponse<AIQueryResponse>> {
    return this.request<AIQueryResponse>("/ai/query", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}
