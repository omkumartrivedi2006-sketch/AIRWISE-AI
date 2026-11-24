"""
AIRWISE AI — Community Pollution Report Model (MongoDB Document)
Stores citizen-submitted environmental observations, hotspot coordinates,
verification lifecycle, and moderation records.
"""

from datetime import datetime, timezone
from app.models.base import Base, Column, DateTime, Integer, String, Float, Boolean


class CommunityReport(Base):
    __tablename__ = "community_reports"
    __collection__ = "community_reports"

    id = Column(name="id", type_hint=int, autoincrement=True)
    reference_id = Column(name="reference_id", type_hint=str, index=True)  # e.g. REP-2026-X8Y9Z
    user_id = Column(name="user_id", type_hint=int, index=True)
    user_name = Column(name="user_name", type_hint=str, default="Community Member")

    category = Column(name="category", type_hint=str, index=True, default="other")
    # industrial_smoke, open_waste_burning, construction_dust, vehicle_emissions, road_dust, garbage_burning, unusual_odor, other

    title = Column(name="title", type_hint=str, default="")
    description = Column(name="description", type_hint=str, default="")
    location_name = Column(name="location_name", type_hint=str, default="")
    latitude = Column(name="latitude", type_hint=float, default=0.0)
    longitude = Column(name="longitude", type_hint=float, default=0.0)
    incident_time = Column(name="incident_time", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
    severity = Column(name="severity", type_hint=str, default="moderate")  # minor, moderate, severe

    image_url = Column(name="image_url", type_hint=str, default=None)

    # Verification Lifecycle: SUBMITTED -> UNDER_REVIEW -> VERIFIED | REJECTED | RESOLVED
    status = Column(name="status", type_hint=str, index=True, default="SUBMITTED")
    moderation_notes = Column(name="moderation_notes", type_hint=str, default=None)
    moderated_by = Column(name="moderated_by", type_hint=int, default=None)
    moderated_at = Column(name="moderated_at", type_hint=datetime, default=None)
    upvotes = Column(name="upvotes", type_hint=int, default=0)

    created_at = Column(name="created_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(name="updated_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
