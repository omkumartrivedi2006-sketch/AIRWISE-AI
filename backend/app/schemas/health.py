"""
AIRWISE AI — Health Diagnostics Schemas
"""

from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class DatabaseHealth(BaseModel):
    status: str = Field(..., description="'connected', 'unavailable', or 'development_mock_fallback'")
    dialect: str = Field(..., description="Engine dialect name (e.g. postgresql, sqlite)")
    latency_ms: Optional[float] = Field(None, description="Roundtrip query latency in milliseconds")
    details: Optional[str] = Field(None, description="Diagnostic message or troubleshooting guidance")


class AIHealth(BaseModel):
    status: str = Field(..., description="'ready', 'unconfigured', or 'service_error'")
    provider: str = Field(..., description="Active AI provider name (e.g. google-gemini)")
    model: str = Field(..., description="Model identifier configured in settings")
    details: Optional[str] = Field(None, description="Provider status note")


class HealthComponents(BaseModel):
    database: DatabaseHealth
    ai_engine: AIHealth


class HealthResponse(BaseModel):
    status: str = Field(..., description="Overall health: 'healthy', 'degraded', or 'unhealthy'")
    service: str = Field(default="airwise-ai-backend")
    version: str = Field(default="1.0.0")
    environment: str = Field(...)
    timestamp: datetime = Field(...)
    components: HealthComponents
