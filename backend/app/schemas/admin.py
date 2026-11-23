"""
AIRWISE AI — Admin Schemas
Request and response models for administrative operations, data reviews,
monitoring metrics, and audit logs.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


# ==========================================
# 1. Dashboard Overview & Activity
# ==========================================

class AdminDashboardMetrics(BaseModel):
    total_users: int = 0
    active_users: int = 0
    new_registrations_7d: int = 0
    total_conversations: int = 0
    total_ai_requests: int = 0
    total_observations: int = 0
    flagged_observations: int = 0
    active_alert_rules: int = 0
    total_notifications: int = 0
    failed_notifications: int = 0
    data_sources_healthy: int = 0
    data_sources_total: int = 0


class AdminDashboardOverviewResponse(BaseModel):
    metrics: AdminDashboardMetrics
    system_status: str = "operational"  # operational, degraded, maintenance
    last_updated: datetime


class AdminActivityPoint(BaseModel):
    date: str
    registrations: int = 0
    ai_requests: int = 0
    observations: int = 0
    notifications: int = 0


class AdminActivityMetricsResponse(BaseModel):
    range_days: int
    data_points: List[AdminActivityPoint]


# ==========================================
# 2. User Management
# ==========================================

class AdminUserRead(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None
    saved_locations_count: int = 0
    alert_rules_count: int = 0
    conversations_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class AdminUserUpdateStatus(BaseModel):
    is_active: bool
    reason: Optional[str] = Field(None, max_length=255, description="Administrative justification for status change")


class AdminUserUpdateRole(BaseModel):
    role: str = Field(..., description="Target role: USER or ADMIN")
    reason: Optional[str] = Field(None, max_length=255, description="Administrative justification for role elevation or demotion")


# ==========================================
# 3. Environmental Data Management
# ==========================================

class AdminObservationRead(BaseModel):
    id: int
    location_id: int
    city: Optional[str] = None
    country: Optional[str] = None
    aqi: Optional[int] = None
    aqi_scale: Optional[str] = "US_EPA"
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    so2: Optional[float] = None
    co: Optional[float] = None
    o3: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    provider: Optional[str] = None
    source: str
    is_verified: bool
    is_demo: bool
    is_flagged: bool
    review_status: str  # unreviewed, verified, flagged, rejected
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by_email: Optional[str] = None
    observed_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminObservationReview(BaseModel):
    review_status: str = Field(..., description="Target status: verified, flagged, or rejected")
    reason: str = Field(..., min_length=3, max_length=500, description="Mandatory reason for audit trail")


# ==========================================
# 4. Environmental Data Sources
# ==========================================

class AdminDataSourceStatus(BaseModel):
    id: str
    name: str
    type: str  # atmospheric_model, ground_stations, regulatory
    status: str  # operational, degraded, unavailable, unconfigured
    is_configured: bool
    last_successful_sync: Optional[datetime] = None
    last_failed_sync: Optional[datetime] = None
    latency_ms: Optional[float] = None
    error_count_24h: int = 0
    coverage_summary: str
    attribution: str


class AdminDataSourceHealth(BaseModel):
    id: str
    status: str
    ping_success: bool
    latency_ms: Optional[float] = None
    checked_at: datetime
    details: Optional[str] = None


# ==========================================
# 5. AI Usage & Performance
# ==========================================

class AdminAiUsageOverview(BaseModel):
    is_enabled: bool
    is_configured: bool
    provider_name: str
    model_name: str
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    avg_latency_ms: Optional[float] = None
    timeout_count: int = 0
    estimated_tokens_used: int = 0
    daily_quota_limit: int = 50
    daily_quota_consumed: int = 0


class AdminAiUsageTrendPoint(BaseModel):
    date: str
    request_count: int = 0
    error_count: int = 0
    avg_latency_ms: Optional[float] = None


class AdminAiUsageTrends(BaseModel):
    range_days: int
    data_points: List[AdminAiUsageTrendPoint]


# ==========================================
# 6. Notifications & Delivery Monitoring
# ==========================================

class AdminNotificationMetrics(BaseModel):
    total_notifications: int = 0
    delivered_count: int = 0
    pending_count: int = 0
    failed_count: int = 0
    in_app_count: int = 0
    email_count: int = 0
    web_push_count: int = 0


class AdminNotificationRead(BaseModel):
    id: int
    user_id: int
    user_email: Optional[str] = None
    title: str
    message: str
    severity: str
    notification_type: str
    metric: Optional[str] = None
    value: Optional[float] = None
    channels: List[str]
    delivery_status: str
    failure_reason: Optional[str] = None
    retry_count: int = 0
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminNotificationRetryResponse(BaseModel):
    notification_id: int
    delivery_status: str
    message: str
    retry_count: int


# ==========================================
# 7. System Health & Infrastructure
# ==========================================

class AdminDatabaseHealth(BaseModel):
    status: str  # connected, degraded, disconnected
    latency_ms: float
    dialect: str
    pool_size: Optional[int] = None
    checked_at: datetime
    table_counts: Dict[str, int] = {}


class AdminServiceHealth(BaseModel):
    fastapi_status: str = "healthy"
    database_status: str = "healthy"
    gemini_status: str = "ready"
    open_meteo_status: str = "operational"
    waqi_status: str = "operational"
    notifications_status: str = "operational"


class AdminSystemHealthResponse(BaseModel):
    platform_name: str = "AIRWISE AI"
    version: str = "1.0.0"
    environment: str = "development"
    uptime_seconds: float
    services: AdminServiceHealth
    database: AdminDatabaseHealth
    timestamp: datetime


# ==========================================
# 8. Audit Logs
# ==========================================

class AdminAuditLogRead(BaseModel):
    id: int
    admin_id: Optional[int] = None
    admin_email: Optional[str] = None
    action: str
    target_type: str
    target_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
