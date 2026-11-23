"""
AIRWISE AI — Saved Location Model (MongoDB Document)
Represents user-bookmarked monitoring stations with custom labels and primary flag.
"""

from datetime import datetime, timezone
from app.models.base import Base, Boolean, Column, DateTime, Integer, String


class SavedLocation(Base):
    __tablename__ = "saved_locations"
    __collection__ = "saved_locations"

    id = Column(name="id", type_hint=int, autoincrement=True)
    user_id = Column(name="user_id", type_hint=int, index=True)
    location_id = Column(name="location_id", type_hint=int, index=True)
    custom_name = Column(name="custom_name", type_hint=str, default=None)
    is_primary = Column(name="is_primary", type_hint=bool, default=False)
    created_at = Column(name="created_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
