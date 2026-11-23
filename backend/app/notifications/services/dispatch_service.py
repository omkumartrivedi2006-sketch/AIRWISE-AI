"""
AIRWISE AI — Notification Dispatch Orchestrator
Coordinates multi-channel delivery (in-app, email, web-push) respecting user preferences.
"""

import logging
from typing import Dict, List, Optional
from app.core.database import MongoSession as Session
from app.models.notification import Notification
from app.models.user import User
from app.notifications.channels.base import BaseNotificationChannel
from app.notifications.channels.in_app import InAppNotificationChannel
from app.notifications.channels.email import EmailNotificationChannel
from app.notifications.channels.web_push import WebPushNotificationChannel

logger = logging.getLogger(__name__)


class NotificationDispatchService:
    def __init__(self):
        self._channels: Dict[str, BaseNotificationChannel] = {
            "in_app": InAppNotificationChannel(),
            "email": EmailNotificationChannel(),
            "push": WebPushNotificationChannel(),
        }

    async def dispatch(
        self,
        notification: Notification,
        user: User,
        target_channels: Optional[List[str]] = None,
        db_session: Optional[Session] = None,
    ) -> Dict[str, bool]:
        """
        Dispatches notification across requested channels.
        In-app is always delivered first.
        """
        results: Dict[str, bool] = {}
        channels_to_use = target_channels or notification.channels or ["in_app"]

        for ch_name in channels_to_use:
            channel = self._channels.get(ch_name)
            if not channel:
                logger.warning("Unrecognized notification channel requested: %s", ch_name)
                results[ch_name] = False
                continue

            try:
                success = await channel.send(notification, user, db_session=db_session)
                results[ch_name] = success
            except Exception as e:
                logger.error("Exception during notification dispatch via %s: %s", ch_name, e)
                results[ch_name] = False

        return results


notification_dispatcher = NotificationDispatchService()
