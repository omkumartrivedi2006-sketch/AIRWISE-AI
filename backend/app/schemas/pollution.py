"""
AIRWISE AI — Pollution Observation Schemas
Pydantic contracts for observation ingestion, serialization, geocoding, and provider telemetry.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.location import LocationResponse
from app.utils.validators import (
    validate_aqi,
    validate_humidity,
    validate_pm10,
    validate_pm25,
    validate_temperature,
)


class PollutionObservationBase(BaseModel):
    location_id: int = Field(..., description="Foreign key to monitoring location")
    aqi: Optional[int] = Field(None, ge=0, le=500, description="Air Quality Index")
    aqi_scale: Optional[str] = Field("US_EPA", description="AQI standard scale (US_EPA, IN_NAAQS)")
    pm25: Optional[float] = Field(None, ge=0.0, le=1000.0, description="PM2.5 concentration in µg/m³")
    pm10: Optional[float] = Field(None, ge=0.0, le=1500.0, description="PM10 concentration in µg/m³")
    no2: Optional[float] = Field(None, ge=0.0, description="NO2 concentration in µg/m³")
    so2: Optional[float] = Field(None, ge=0.0, description="SO2 concentration in µg/m³")
    co: Optional[float] = Field(None, ge=0.0, description="CO concentration in µg/m³")
    o3: Optional[float] = Field(None, ge=0.0, description="O3 concentration in µg/m³")
    temperature: Optional[float] = Field(None, ge=-60.0, le=65.0, description="Ambient temperature in °C")
    humidity: Optional[float] = Field(None, ge=0.0, le=100.0, description="Relative humidity %")
    wind_speed: Optional[float] = Field(None, ge=0.0, description="Wind speed in m/s")
    wind_direction: Optional[float] = Field(None, ge=0.0, le=360.0, description="Wind direction in degrees")
    provider: Optional[str] = Field("open-meteo", max_length=50, description="Provider identifier")
    provider_observation_id: Optional[str] = Field(None, max_length=100, description="Upstream ID")
    source: str = Field(default="sensor", max_length=100, description="Attribution or station identifier")
    is_verified: bool = Field(True, description="Observation verification flag")
    is_demo: bool = Field(False, description="Flag indicating demonstration data")
    observed_at: datetime = Field(..., description="UTC timestamp of the observation")

    @field_validator("aqi")
    @classmethod
    def check_aqi(cls, v):
        return validate_aqi(v)

    @field_validator("pm25")
    @classmethod
    def check_pm25(cls, v):
        return validate_pm25(v)

    @field_validator("pm10")
    @classmethod
    def check_pm10(cls, v):
        return validate_pm10(v)

    @field_validator("temperature")
    @classmethod
    def check_temp(cls, v):
        return validate_temperature(v)

    @field_validator("humidity")
    @classmethod
    def check_hum(cls, v):
        return validate_humidity(v)


class PollutionObservationCreate(PollutionObservationBase):
    pass


class PollutionObservationResponse(PollutionObservationBase):
    id: int
    created_at: datetime
    location: Optional[LocationResponse] = None
    aqi_category: Optional[str] = None
    freshness: Optional[str] = "live"
    model_config = ConfigDict(from_attributes=True)


class PollutionSummaryResponse(BaseModel):
    location_id: int
    location_name: str
    city: str
    country: str
    observation_count: int
    average_aqi: Optional[float] = None
    min_aqi: Optional[int] = None
    max_aqi: Optional[int] = None
    average_pm25: Optional[float] = None
    average_pm10: Optional[float] = None
    average_temperature: Optional[float] = None
    average_humidity: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class LocationSearchItem(BaseModel):
    name: str
    city: str
    state: Optional[str] = None
    country: str
    country_code: Optional[str] = None
    latitude: float
    longitude: float
    source: str = "open-meteo"
    model_config = ConfigDict(from_attributes=True)


class HistoricalObservationItem(BaseModel):
    observed_at: datetime
    aqi: Optional[int] = None
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    so2: Optional[float] = None
    co: Optional[float] = None
    o3: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    freshness: str = "live"
    source: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class PollutionDataStatusResponse(BaseModel):
    environmental_data_enabled: bool
    primary_provider: str
    providers: List[Dict[str, Any]]
    cache_ttl_seconds: int
    max_fresh_data_age_minutes: int
