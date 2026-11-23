"""
AIRWISE AI — Alert Rule Model (MongoDB Document)
Stores user-configured environmental threshold rules, cooldown intervals, and triggering state.
"""

from datetime import datetime, timezone
from app.models.base import Base, Boolean, Column, DateTime, Float, Integer, JSON, String


class AlertRule(Base):
    __tablename__ = "alert_rules"
    __collection__ = "alert_rules"

    id = Column(name="id", type_hint=int, autoincrement=True)
    user_id = Column(name="user_id", type_hint=int, index=True)
    location_id = Column(name="location_id", type_hint=int, index=True, default=None)
    alert_type = Column(name="alert_type", type_hint=str, default="threshold_exceeded")
    metric = Column(name="metric", type_hint=str, default="pm25")
    threshold_value = Column(name="threshold_value", type_hint=float, default=35.0)
    comparison_operator = Column(name="comparison_operator", type_hint=str, default=">=")
    aqi_scale = Column(name="aqi_scale", type_hint=str, default="US_EPA")
    is_enabled = Column(name="is_enabled", type_hint=bool, default=True)
    notification_channels = Column(name="notification_channels", type_hint=list, default=lambda: ["in_app"])
    cooldown_minutes = Column(name="cooldown_minutes", type_hint=int, default=60)
    last_triggered_at = Column(name="last_triggered_at", type_hint=datetime, default=None)
    created_at = Column(name="created_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(name="updated_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
