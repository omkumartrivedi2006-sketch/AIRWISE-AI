"""
AIRWISE AI — Location Model
Represents geographical environmental monitoring coordinates and stations.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    city = Column(String(100), index=True, nullable=False)
    state = Column(String(100), nullable=True)
    country = Column(String(100), index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("name", "city", "country", name="uq_location_name_city_country"),
    )

    # Relationships
    pollution_observations = relationship(
        "PollutionObservation",
        back_populates="location",
        cascade="all, delete-orphan",
        order_by="desc(PollutionObservation.observed_at)",
    )
