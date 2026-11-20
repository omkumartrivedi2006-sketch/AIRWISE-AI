"""
AIRWISE AI — Pollution Observation Schemas
"""

from datetime import datetime
from typing import Optional
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
    pm25: Optional[float] = Field(None, ge=0.0, le=1000.0, description="PM2.5 concentration in µg/m³")
    pm10: Optional[float] = Field(None, ge=0.0, le=1500.0, description="PM10 concentration in µg/m³")
    temperature: Optional[float] = Field(None, ge=-60.0, le=65.0, description="Ambient temperature in °C")
    humidity: Optional[float] = Field(None, ge=0.0, le=100.0, description="Relative humidity %")
    source: str = Field(default="sensor", max_length=100, description="Observation source (e.g. openaq, demo_dataset)")
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
