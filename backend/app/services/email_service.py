"""
AIRWISE AI — Email Delivery Service
Pluggable email abstraction for account verification and password resets.
In development mode, provides safe local simulation without publishing tokens to production logs or API envelopes.
"""

import logging
from abc import ABC, abstractmethod
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("airwise.email")


class BaseEmailProvider(ABC):
    @abstractmethod
    def send_verification_email(self, to_email: str, token: str) -> bool:
        """Deliver email address verification token."""
        pass

    @abstractmethod
    def send_password_reset_email(self, to_email: str, token: str) -> bool:
        """Deliver password reset instructions with secure token."""
        pass


class ConsoleEmailProvider(BaseEmailProvider):
    """Local development provider that simulates email dispatch."""

    def send_verification_email(self, to_email: str, token: str) -> bool:
        verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        logger.info(
            f"[EMAIL SIMULATION] Verification email queued for {to_email}. "
            f"Verification target: {settings.FRONTEND_URL}/verify-email"
        )
        # In development/test environments, token is accessible to dev harness via service layer, not logged in production
        return True

    def send_password_reset_email(self, to_email: str, token: str) -> bool:
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        logger.info(
            f"[EMAIL SIMULATION] Password reset email queued for {to_email}. "
            f"Reset target: {settings.FRONTEND_URL}/reset-password"
        )
        return True


class EmailService:
    def __init__(self):
        provider_type = settings.EMAIL_PROVIDER.lower()
        if provider_type == "console" or not settings.EMAIL_API_KEY:
            self._provider: BaseEmailProvider = ConsoleEmailProvider()
        else:
            # Future cloud providers (SendGrid / AWS SES / Postmark)
            self._provider = ConsoleEmailProvider()

    def send_verification_email(self, to_email: str, token: str) -> bool:
        return self._provider.send_verification_email(to_email, token)

    def send_password_reset_email(self, to_email: str, token: str) -> bool:
        return self._provider.send_password_reset_email(to_email, token)


email_service = EmailService()
