"""
AIRWISE AI — In-App Notification Channel
Persists notifications to the PostgreSQL notifications table.
"""

import logging
from typing import Any, Optional
from app.models.notification import Notification
from app.models.user import User
from app.notifications.channels.base import BaseNotificationChannel

logger = logging.getLogger(__name__)


class InAppNotificationChannel(BaseNotificationChannel):
    def get_channel_name(self) -> str:
        return "in_app"

    def is_available(self) -> bool:
        return True

    async def send(self, notification: Notification, user: User, db_session: Optional[Any] = None) -> bool:
        """In-app notifications are persisted directly via SQLAlchemy session."""
        try:
            if db_session:
                db_session.add(notification)
                db_session.flush()
            logger.info("In-app notification persisted for user %s: %s", user.id, notification.title)
            return True
        except Exception as e:
            logger.error("Failed to persist in-app notification: %s", e)
            return False
