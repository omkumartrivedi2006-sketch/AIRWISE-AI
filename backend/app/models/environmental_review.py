"""
AIRWISE AI — Environmental Data Review Model (MongoDB Document)
Maintains an immutable audit trail of data-quality determinations, inspections,
and review notes for pollution observations without modifying source measurements.
"""

from datetime import datetime, timezone
from app.models.base import Base, Column, DateTime, Integer, String


class EnvironmentalDataReview(Base):
    __tablename__ = "environmental_data_reviews"
    __collection__ = "environmental_data_reviews"

    id = Column(name="id", type_hint=int, autoincrement=True)
    observation_id = Column(name="observation_id", type_hint=int, index=True)
    admin_id = Column(name="admin_id", type_hint=int, index=True, default=None)
    previous_status = Column(name="previous_status", type_hint=str)
    new_status = Column(name="new_status", type_hint=str)
    reason = Column(name="reason", type_hint=str)
    created_at = Column(name="created_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc), index=True)
