"""
AIRWISE AI — Models Package Initialization
Exports all SQLAlchemy ORM models for Alembic metadata inspection.
"""

from app.models.base import Base, TimeStampedModel
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.password_reset_token import PasswordResetToken
from app.models.email_verification_token import EmailVerificationToken
from app.models.location import Location
from app.models.pollution import PollutionObservation
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.feedback import Feedback
from app.models.user_preference import UserPreference
from app.models.saved_location import SavedLocation
from app.models.alert import AlertRule
from app.models.notification import Notification, PushSubscription
from app.models.recommendation import RecommendationCache
from app.models.audit_log import AuditLog
from app.models.environmental_review import EnvironmentalDataReview

__all__ = [
    "Base",
    "TimeStampedModel",
    "User",
    "RefreshToken",
    "PasswordResetToken",
    "EmailVerificationToken",
    "Location",
    "PollutionObservation",
    "Conversation",
    "Message",
    "Feedback",
    "UserPreference",
    "SavedLocation",
    "AlertRule",
    "Notification",
    "PushSubscription",
    "RecommendationCache",
    "AuditLog",
    "EnvironmentalDataReview",
]
