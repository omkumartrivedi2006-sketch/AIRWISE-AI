"""
AIRWISE AI — Base Notification Channel Contract
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from app.models.notification import Notification
from app.models.user import User


class BaseNotificationChannel(ABC):
    """Abstract interface for all notification dispatch channels."""

    @abstractmethod
    def get_channel_name(self) -> str:
        """Returns the channel identifier (e.g. 'in_app', 'email', 'push')."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Indicates whether provider is configured and available."""
        pass

    @abstractmethod
    async def send(self, notification: Notification, user: User, db_session: Optional[Any] = None) -> bool:
        """Dispatches notification. Returns True on success, False on failure."""
        pass
