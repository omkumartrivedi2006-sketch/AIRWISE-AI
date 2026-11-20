/**
 * AIRWISE AI — API Client Service
 * Centralized, type-safe communication layer with the FastAPI backend.
 */

import { HealthResponse } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiClient {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options?.headers,
        },
        // Cache revalidation for health/status
        next: { revalidate: 10 },
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: { message: response.statusText, code: `HTTP_${response.status}` } };
        }
        throw new Error(errorData.error?.message || `HTTP ${response.status}: Request failed`);
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown network error";
      // In development or when backend is starting, return graceful error wrapper
      throw new Error(`API Request to ${endpoint} failed: ${message}`);
    }
  }

  /**
   * Diagnostic probe fetching backend health & status
   */
  public static async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/health");
  }

  /**
   * Check AI service engine configuration status
   */
  public static async getAIStatus(): Promise<{ status: string; provider: string; model: string; is_configured: boolean }> {
    return this.request("/ai/status");
  }
}
