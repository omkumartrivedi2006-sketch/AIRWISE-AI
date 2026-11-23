"""
AIRWISE AI — Notification & Push Subscription Models (MongoDB Document)
Represents in-app notification records with measurement attribution and Web Push credentials.
"""

from datetime import datetime, timezone
from app.models.base import Base, Boolean, Column, DateTime, Float, Integer, JSON, String


class Notification(Base):
    __tablename__ = "notifications"
    __collection__ = "notifications"

    id = Column(name="id", type_hint=int, autoincrement=True)
    user_id = Column(name="user_id", type_hint=int, index=True)
    alert_rule_id = Column(name="alert_rule_id", type_hint=int, default=None)
    title = Column(name="title", type_hint=str, default="")
    message = Column(name="message", type_hint=str, default="")
    severity = Column(name="severity", type_hint=str, default="advisory")
    notification_type = Column(name="notification_type", type_hint=str, default="aqi_alert")
    location_id = Column(name="location_id", type_hint=int, default=None)
    metric = Column(name="metric", type_hint=str, default=None)
    value = Column(name="value", type_hint=float, default=None)
    unit = Column(name="unit", type_hint=str, default=None)
    aqi_scale = Column(name="aqi_scale", type_hint=str, default=None)
    observation_time = Column(name="observation_time", type_hint=datetime, default=None)
    source = Column(name="source", type_hint=str, default=None)
    is_read = Column(name="is_read", type_hint=bool, default=False, index=True)
    read_at = Column(name="read_at", type_hint=datetime, default=None)
    channels = Column(name="channels", type_hint=list, default=lambda: ["in_app"])
    delivery_status = Column(name="delivery_status", type_hint=str, default="delivered")
    failure_reason = Column(name="failure_reason", type_hint=str, default=None)
    retry_count = Column(name="retry_count", type_hint=int, default=0)
    created_at = Column(name="created_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc), index=True)


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"
    __collection__ = "push_subscriptions"

    id = Column(name="id", type_hint=int, autoincrement=True)
    user_id = Column(name="user_id", type_hint=int, index=True)
    endpoint = Column(name="endpoint", type_hint=str)
    p256dh_key = Column(name="p256dh_key", type_hint=str)
    auth_key = Column(name="auth_key", type_hint=str)
    user_agent = Column(name="user_agent", type_hint=str, default=None)
    created_at = Column(name="created_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
