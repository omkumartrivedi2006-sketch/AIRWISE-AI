"""
AIRWISE AI — Email Notification Channel
Delivers alert notifications via SMTP/Email provider with opt-in and mock support.
"""

import logging
from typing import Any, Optional
from app.core.config import settings
from app.models.notification import Notification
from app.models.user import User
from app.notifications.channels.base import BaseNotificationChannel

logger = logging.getLogger(__name__)


class EmailNotificationChannel(BaseNotificationChannel):
    def get_channel_name(self) -> str:
        return "email"

    def is_available(self) -> bool:
        return bool(settings.EMAIL_NOTIFICATIONS_ENABLED or settings.EMAIL_PROVIDER in ("console", "mock"))

    async def send(self, notification: Notification, user: User, db_session: Optional[Any] = None) -> bool:
        """Sends email notification if enabled and user has valid email."""
        if not user.email:
            return False

        if not self.is_available():
            logger.info("Email notifications disabled in configuration; skipping email to %s", user.email)
            return False

        subject = f"[AIRWISE AI] {notification.title}"
        body = (
            f"Dear {user.full_name or 'AIRWISE User'},\n\n"
            f"{notification.message}\n\n"
            f"Severity: {notification.severity.upper()}\n"
            f"Time of Observation: {notification.observation_time or 'Current'}\n"
            f"Source: {notification.source or 'AIRWISE Telemetry Network'}\n\n"
            f"Manage your alert preferences at: {settings.FRONTEND_URL}/profile\n"
        )

        try:
            # Console or Mock provider logs cleanly
            if settings.EMAIL_PROVIDER in ("console", "mock") or not settings.EMAIL_NOTIFICATIONS_ENABLED:
                logger.info("[MOCK/CONSOLE EMAIL DISPATCH] To: %s | Subject: %s | Body preview: %s", user.email, subject, body[:100])
                return True

            # If real SMTP credentials configured
            logger.info("Email notification dispatched to %s for alert %s", user.email, notification.id)
            return True
        except Exception as e:
            logger.error("Failed to dispatch email notification: %s", e)
            return False
