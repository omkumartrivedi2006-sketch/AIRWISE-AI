"""
AIRWISE AI — Personalization, Alerts, and Notification Schemas
Pydantic v2 schemas for user preferences, saved locations, alert rules, and notifications.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


# ==========================================
# User Preferences Schemas
# ==========================================
class UserPreferencesBase(BaseModel):
    preferred_language: str = Field(default="en", max_length=10)
    preferred_location_id: Optional[int] = None
    timezone: str = Field(default="UTC", max_length=50)
    temperature_unit: str = Field(default="C", pattern="^(C|F)$")
    preferred_aqi_scale: str = Field(default="US_EPA", pattern="^(US_EPA|IN_NAAQS)$")
    environmental_interests: List[str] = Field(default_factory=lambda: ["air_pollution", "sustainable_living"])
    preferred_information: List[str] = Field(default_factory=lambda: ["aqi_updates", "recommendations"])
    quiet_hours_enabled: bool = False
    quiet_hours_start: str = Field(default="22:00", pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    quiet_hours_end: str = Field(default="07:00", pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    in_app_notifications: bool = True
    email_notifications: bool = False
    push_notifications: bool = False


class UserPreferencesUpdate(BaseModel):
    preferred_language: Optional[str] = Field(default=None, max_length=10)
    preferred_location_id: Optional[int] = None
    timezone: Optional[str] = Field(default=None, max_length=50)
    temperature_unit: Optional[str] = Field(default=None, pattern="^(C|F)$")
    preferred_aqi_scale: Optional[str] = Field(default=None, pattern="^(US_EPA|IN_NAAQS)$")
    environmental_interests: Optional[List[str]] = None
    preferred_information: Optional[List[str]] = None
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = Field(default=None, pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    quiet_hours_end: Optional[str] = Field(default=None, pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    in_app_notifications: Optional[bool] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None


class UserPreferencesRead(UserPreferencesBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Saved Locations Schemas
# ==========================================
class SavedLocationCreate(BaseModel):
    location_id: int
    custom_name: Optional[str] = Field(default=None, max_length=100)
    is_primary: bool = False


class SavedLocationUpdate(BaseModel):
    custom_name: Optional[str] = Field(default=None, max_length=100)
    is_primary: Optional[bool] = None


class SavedLocationRead(BaseModel):
    id: int
    user_id: int
    location_id: int
    custom_name: Optional[str] = None
    is_primary: bool
    created_at: datetime
    # Attached location attributes for display
    location_name: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    latest_aqi: Optional[int] = None
    latest_category: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Alert Rules Schemas
# ==========================================
VALID_METRICS = {"aqi", "pm25", "pm10", "no2", "so2", "co", "o3"}
VALID_OPERATORS = {">=", ">", "<=", "<", "=="}
VALID_ALERT_TYPES = {"threshold_exceeded", "significant_increase", "stale_data"}


class AlertRuleCreate(BaseModel):
    location_id: Optional[int] = None
    alert_type: str = Field(default="threshold_exceeded")
    metric: str = Field(default="aqi")
    threshold_value: float
    comparison_operator: str = Field(default=">=")
    aqi_scale: str = Field(default="US_EPA")
    is_enabled: bool = True
    notification_channels: List[str] = Field(default_factory=lambda: ["in_app"])
    cooldown_minutes: int = Field(default=60, ge=5, le=1440)

    @field_validator("metric")
    @classmethod
    def validate_metric(cls, v: str) -> str:
        lowered = v.lower().strip()
        if lowered not in VALID_METRICS:
            raise ValueError(f"Invalid metric '{v}'. Supported: {sorted(list(VALID_METRICS))}")
        return lowered

    @field_validator("comparison_operator")
    @classmethod
    def validate_operator(cls, v: str) -> str:
        if v not in VALID_OPERATORS:
            raise ValueError(f"Invalid comparison operator '{v}'. Supported: {sorted(list(VALID_OPERATORS))}")
        return v

    @field_validator("alert_type")
    @classmethod
    def validate_alert_type(cls, v: str) -> str:
        if v not in VALID_ALERT_TYPES:
            raise ValueError(f"Invalid alert type '{v}'. Supported: {sorted(list(VALID_ALERT_TYPES))}")
        return v


class AlertRuleUpdate(BaseModel):
    location_id: Optional[int] = None
    alert_type: Optional[str] = None
    metric: Optional[str] = None
    threshold_value: Optional[float] = None
    comparison_operator: Optional[str] = None
    aqi_scale: Optional[str] = None
    is_enabled: Optional[bool] = None
    notification_channels: Optional[List[str]] = None
    cooldown_minutes: Optional[int] = Field(default=None, ge=5, le=1440)


class AlertRuleRead(BaseModel):
    id: int
    user_id: int
    location_id: Optional[int] = None
    alert_type: str
    metric: str
    threshold_value: float
    comparison_operator: str
    aqi_scale: str
    is_enabled: bool
    notification_channels: List[str]
    cooldown_minutes: int
    last_triggered_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    location_name: Optional[str] = None
    city: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Notification Schemas
# ==========================================
class NotificationRead(BaseModel):
    id: int
    user_id: int
    alert_rule_id: Optional[int] = None
    title: str
    message: str
    severity: str
    notification_type: str
    location_id: Optional[int] = None
    metric: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    aqi_scale: Optional[str] = None
    observation_time: Optional[datetime] = None
    source: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    channels: List[str]
    delivery_status: str
    created_at: datetime
    city: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class NotificationUnreadCountResponse(BaseModel):
    unread_count: int


class PushSubscriptionCreate(BaseModel):
    endpoint: str = Field(..., max_length=1000)
    p256dh_key: str = Field(..., max_length=255)
    auth_key: str = Field(..., max_length=255)
    user_agent: Optional[str] = Field(default=None, max_length=500)


# ==========================================
# Recommendation Schemas
# ==========================================
class RecommendationItem(BaseModel):
    id: str
    category: str  # air_quality_awareness, health_precaution, sustainable_habit, outdoor_activity, ventilation
    title: str
    description: str
    action_item: Optional[str] = None
    priority: str = "normal"  # high, normal, low
    source_attribution: str = "WHO Environmental Health Guidelines & AIRWISE AI Inference"


class RecommendationsResponse(BaseModel):
    user_id: int
    location_id: Optional[int] = None
    city: Optional[str] = None
    aqi: Optional[int] = None
    aqi_category: Optional[str] = None
    source: str  # "gemini_ai" or "deterministic_rule_engine"
    is_cached: bool
    generated_at: datetime
    recommendations: List[RecommendationItem]
