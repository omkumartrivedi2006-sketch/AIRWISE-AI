"""
AIRWISE AI — Environmental Data Schemas
Standardized data contracts for normalized observations, location search, and provider provenance.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class LocationSearchResult(BaseModel):
    name: str
    city: str
    state: Optional[str] = None
    country: str
    country_code: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    source: str = "open-meteo"
    model_config = ConfigDict(from_attributes=True)


class NormalizedObservation(BaseModel):
    # Location
    location_id: Optional[int] = None
    location_name: str
    city: str
    country: str
    latitude: float
    longitude: float

    # Air Quality & Pollutants
    aqi: Optional[int] = Field(None, ge=0, le=500)
    aqi_scale: str = "US_EPA" # e.g. US_EPA, IN_NAAQS, EU_CAQI
    aqi_category: str = "Unknown" # Good, Moderate, Sensitive, Unhealthy, Very Unhealthy, Hazardous, Unknown
    pm25: Optional[float] = Field(None, ge=0.0)
    pm10: Optional[float] = Field(None, ge=0.0)
    no2: Optional[float] = Field(None, ge=0.0)
    so2: Optional[float] = Field(None, ge=0.0)
    co: Optional[float] = Field(None, ge=0.0)
    o3: Optional[float] = Field(None, ge=0.0)

    # Weather & Atmosphere
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[float] = None

    # Attribution & Provenance
    provider_name: str
    provider_observation_id: Optional[str] = None
    data_source: str
    observed_at: datetime
    fetched_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    freshness: Literal["live", "cached", "delayed", "unavailable"] = "live"
    is_verified: bool = True
    is_demo: bool = False

    model_config = ConfigDict(from_attributes=True)


class ProviderStatus(BaseModel):
    name: str
    is_primary: bool
    is_configured: bool
    status: str
    details: Optional[str] = None
