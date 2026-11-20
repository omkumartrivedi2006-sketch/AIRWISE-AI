"""
AIRWISE AI — SQLAlchemy Models Package
Exposes all ORM models for unified Alembic discovery and relationship mapping.
"""

from app.models.base import Base, TimeStampedModel
from app.models.user import User
from app.models.location import Location
from app.models.pollution import PollutionObservation
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.feedback import Feedback

__all__ = [
    "Base",
    "TimeStampedModel",
    "User",
    "Location",
    "PollutionObservation",
    "Conversation",
    "Message",
    "Feedback",
]
