"""
AIRWISE AI — Pollution Observation Model
Stores physical particulate and chemical measurements, atmospheric telemetry,
and source attribution.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.models.base import Base


class PollutionObservation(Base):
    __tablename__ = "pollution_observations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), index=True, nullable=False)
    aqi = Column(Integer, nullable=True)
    pm25 = Column(Float, nullable=True)       # Concentration in µg/m³
    pm10 = Column(Float, nullable=True)       # Concentration in µg/m³
    temperature = Column(Float, nullable=True) # Ambient °C
    humidity = Column(Float, nullable=True)    # Relative Humidity %
    source = Column(String(100), default="sensor", nullable=False)  # e.g., 'demo_dataset', 'openaq', 'epa_sensor'
    observed_at = Column(DateTime(timezone=True), index=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    location = relationship("Location", back_populates="pollution_observations")
