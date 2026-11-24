"""
AIRWISE AI — Indoor Air Quality Assessment Schemas
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class IndoorSensorInput(BaseModel):
    pm25: Optional[float] = Field(default=None, description="Measured PM2.5 in µg/m³")
    pm10: Optional[float] = Field(default=None, description="Measured PM10 in µg/m³")
    co2: Optional[float] = Field(default=None, description="Measured CO2 in ppm")
    temperature: Optional[float] = Field(default=None, description="Temperature in °C")
    humidity: Optional[float] = Field(default=None, description="Relative Humidity in %")


class IndoorAssessmentCreate(BaseModel):
    room_type: str = Field(..., description="bedroom, living_room, kitchen, office, other")
    room_name: Optional[str] = Field(default=None, max_length=100)
    ventilation: str = Field(..., description="poor, moderate, good")
    cooking_fuel: str = Field(..., description="lpg, electricity, biomass, other, na")
    smoking_exposure: bool = Field(default=False)
    air_purifier: bool = Field(default=False)
    dust_or_smoke: bool = Field(default=False)
    mold_dampness: bool = Field(default=False)
    occupants: int = Field(default=2, ge=1, le=50)
    sensor_readings: Optional[IndoorSensorInput] = Field(default=None)


class IndoorAssessmentResponse(BaseModel):
    id: int
    user_id: int
    room_type: str
    room_name: str
    ventilation: str
    cooking_fuel: str
    smoking_exposure: bool
    air_purifier: bool
    dust_or_smoke: bool
    mold_dampness: bool
    occupants: int
    sensor_readings: Optional[Dict[str, Any]] = None
    risk_score: int
    risk_level: str
    identified_sources: List[str]
    risk_factors: List[str]
    recommendations: List[str]
    ventilation_tips: List[str]
    priority_actions: List[str]
    created_at: datetime
    updated_at: datetime


class IndoorAIAdviceRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)
    room_type: Optional[str] = Field(default="bedroom")
    assessment_id: Optional[int] = Field(default=None)


class IndoorAIAdviceResponse(BaseModel):
    explanation: str
    action_steps: List[str]
    daily_routine: List[str]
    weekly_maintenance: List[str]
    model: str = "Google Gemini"
    disclaimer: str = "Environmental recommendation advisory only. Not a medical diagnosis or hardware sensor measurement."
