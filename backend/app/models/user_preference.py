"""
AIRWISE AI — User Preference Model (MongoDB Document)
Stores individual user configuration: localization, physical measurement scales,
environmental interests, alert quiet hours, and notification channel opt-ins.
"""

from datetime import datetime, timezone
from app.models.base import Base, Boolean, Column, DateTime, Integer, JSON, String


class UserPreference(Base):
    __tablename__ = "user_preferences"
    __collection__ = "user_preferences"

    id = Column(name="id", type_hint=int, autoincrement=True)
    user_id = Column(name="user_id", type_hint=int, unique=True, index=True)
    preferred_language = Column(name="preferred_language", type_hint=str, default="en")
    preferred_location_id = Column(name="preferred_location_id", type_hint=int, default=None)
    timezone = Column(name="timezone", type_hint=str, default="UTC")
    temperature_unit = Column(name="temperature_unit", type_hint=str, default="C")
    preferred_aqi_scale = Column(name="preferred_aqi_scale", type_hint=str, default="US_EPA")

    # Stored as JSON arrays of strings
    environmental_interests = Column(name="environmental_interests", type_hint=list, default=lambda: ["air_pollution", "sustainable_living"])
    preferred_information = Column(name="preferred_information", type_hint=list, default=lambda: ["aqi_updates", "recommendations"])

    # Quiet hours settings
    quiet_hours_enabled = Column(name="quiet_hours_enabled", type_hint=bool, default=False)
    quiet_hours_start = Column(name="quiet_hours_start", type_hint=str, default="22:00")
    quiet_hours_end = Column(name="quiet_hours_end", type_hint=str, default="07:00")

    # Channel Opt-ins
    in_app_notifications = Column(name="in_app_notifications", type_hint=bool, default=True)
    email_notifications = Column(name="email_notifications", type_hint=bool, default=False)
    push_notifications = Column(name="push_notifications", type_hint=bool, default=False)

    created_at = Column(name="created_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(name="updated_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
