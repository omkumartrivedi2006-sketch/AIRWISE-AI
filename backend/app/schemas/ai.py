"""
AIRWISE AI — AI Request & Response Schemas
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AIQueryContext(BaseModel):
    location: Optional[str] = Field(None, description="City or coordinates context")
    aqi: Optional[int] = Field(None, description="Current AQI value")
    dominant_pollutant: Optional[str] = Field(None, description="e.g. PM2.5, PM10, NO2")
    user_sensitivity: Optional[str] = Field(None, description="e.g. asthma, elderly, child, athlete")
    temperature_c: Optional[float] = Field(None, description="Local ambient temperature")


class AIQueryRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=2000, description="User's environmental query or request")
    context: Optional[AIQueryContext] = Field(None, description="Optional environmental context for grounding")


class AIActionableInsight(BaseModel):
    severity: str = Field(..., description="e.g. low, moderate, elevated, severe, hazardous")
    precautions: List[str] = Field(default_factory=list, description="Immediate protective measures")
    outdoor_activity_recommendation: Optional[str] = Field(None, description="Advisory on outdoor exercise/commuting")


class AIQueryResponse(BaseModel):
    response: str = Field(..., description="AI-generated environmental guidance and analysis")
    provider: str = Field(default="google-gemini")
    model: str = Field(...)
    insights: Optional[AIActionableInsight] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AIProviderStatusResponse(BaseModel):
    status: str = Field(..., description="'ready', 'unconfigured', or 'service_error'")
    provider: str = Field(default="google-gemini")
    model: str = Field(...)
    is_configured: bool = Field(...)
    details: Optional[str] = Field(None)
