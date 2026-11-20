"""
AIRWISE AI — Location Schemas
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class LocationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Station or area name")
    city: str = Field(..., min_length=2, max_length=100, description="City name")
    state: Optional[str] = Field(None, max_length=100, description="State / Province")
    country: str = Field(..., min_length=2, max_length=100, description="Country name")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")

    @field_validator("latitude", "longitude")
    @classmethod
    def check_coords(cls, v: float, info) -> float:
        return round(v, 6)


class LocationCreate(LocationBase):
    pass


class LocationResponse(LocationBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
