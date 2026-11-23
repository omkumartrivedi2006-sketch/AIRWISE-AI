"""
AIRWISE AI — Location Model (MongoDB Document)
Represents geographical environmental monitoring coordinates and stations.
"""

from datetime import datetime, timezone
from app.models.base import Base, Column, DateTime, Float, Integer, String


class Location(Base):
    __tablename__ = "locations"
    __collection__ = "locations"

    id = Column(name="id", type_hint=int, autoincrement=True)
    name = Column(name="name", type_hint=str)
    city = Column(name="city", type_hint=str, index=True)
    state = Column(name="state", type_hint=str, default=None)
    country = Column(name="country", type_hint=str, index=True)
    latitude = Column(name="latitude", type_hint=float)
    longitude = Column(name="longitude", type_hint=float)
    created_at = Column(name="created_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
