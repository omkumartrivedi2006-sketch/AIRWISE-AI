"""
AIRWISE AI — Pollution Observation Model (MongoDB Document)
Stores physical particulate and chemical measurements, atmospheric telemetry,
and source attribution.
"""

from datetime import datetime, timezone
from typing import Any, Optional
from app.models.base import Base, Boolean, Column, DateTime, Float, Integer, String


class PollutionObservation(Base):
    __tablename__ = "pollution_observations"
    __collection__ = "pollution_observations"

    id = Column(name="id", type_hint=int, autoincrement=True)
    location_id = Column(name="location_id", type_hint=int, index=True)

    # Air Quality & Primary Pollutants
    aqi = Column(name="aqi", type_hint=int, default=None)
    aqi_scale = Column(name="aqi_scale", type_hint=str, default="US_EPA")
    aqi_category = Column(name="aqi_category", type_hint=str, default=None)
    pm25 = Column(name="pm25", type_hint=float, default=None)
    pm10 = Column(name="pm10", type_hint=float, default=None)
    no2 = Column(name="no2", type_hint=float, default=None)
    so2 = Column(name="so2", type_hint=float, default=None)
    co = Column(name="co", type_hint=float, default=None)
    o3 = Column(name="o3", type_hint=float, default=None)

    # Weather & Atmospheric Telemetry
    temperature = Column(name="temperature", type_hint=float, default=None)
    humidity = Column(name="humidity", type_hint=float, default=None)
    wind_speed = Column(name="wind_speed", type_hint=float, default=None)
    wind_direction = Column(name="wind_direction", type_hint=float, default=None)

    # Attribution & Provenance
    provider = Column(name="provider", type_hint=str, default="open-meteo")
    provider_observation_id = Column(name="provider_observation_id", type_hint=str, default=None)
    source = Column(name="source", type_hint=str, default="sensor")
    is_verified = Column(name="is_verified", type_hint=bool, default=True)
    is_demo = Column(name="is_demo", type_hint=bool, default=False)

    # Data Quality & Review (Module 09)
    is_flagged = Column(name="is_flagged", type_hint=bool, default=False)
    review_status = Column(name="review_status", type_hint=str, default="unreviewed")
    reviewed_by_id = Column(name="reviewed_by_id", type_hint=int, default=None)
    review_notes = Column(name="review_notes", type_hint=str, default=None)
    reviewed_at = Column(name="reviewed_at", type_hint=datetime, default=None)

    observed_at = Column(name="observed_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(name="created_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))

    @property
    def location(self) -> Any:
        return getattr(self, "_location", None)

    @location.setter
    def location(self, val: Any) -> None:
        self._location = val
