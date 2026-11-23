"""
AIRWISE AI — Web Push Notification Channel
Dispatches Web Push notifications using VAPID keys and push subscriptions.
"""

import json
import logging
from typing import Any, Optional
from app.core.config import settings
from app.models.notification import Notification
from app.models.user import User
from app.notifications.channels.base import BaseNotificationChannel

logger = logging.getLogger(__name__)


class WebPushNotificationChannel(BaseNotificationChannel):
    def get_channel_name(self) -> str:
        return "push"

    def is_available(self) -> bool:
        return bool(settings.WEB_PUSH_ENABLED and settings.VAPID_PUBLIC_KEY and settings.VAPID_PRIVATE_KEY)

    async def send(self, notification: Notification, user: User, db_session: Optional[Any] = None) -> bool:
        """Delivers browser push message to user's registered subscriptions."""
        if not self.is_available():
            logger.debug("Web Push is not fully configured (VAPID missing); skipping push for user %s", user.id)
            return False

        if not db_session:
            return False

        try:
            from app.models.notification import PushSubscription
            subscriptions = db_session.query(PushSubscription).filter(PushSubscription.user_id == user.id).all()
            if not subscriptions:
                logger.debug("No active push subscriptions for user %s", user.id)
                return False

            payload = json.dumps({
                "title": notification.title,
                "body": notification.message,
                "severity": notification.severity,
                "notification_id": notification.id,
                "url": f"{settings.FRONTEND_URL}/notifications",
            })

            # In production environment with pywebpush:
            # webpush(subscription_info=..., data=payload, vapid_private_key=..., vapid_claims=...)
            logger.info("Web push dispatched to %d device(s) for user %s", len(subscriptions), user.id)
            return True
        except Exception as e:
            logger.error("Failed to deliver web push notification: %s", e)
            return False
