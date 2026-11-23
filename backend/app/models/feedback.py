"""
AIRWISE AI — Feedback Model (MongoDB Document)
Collects user ratings and qualitative feedback regarding assistant guidance and platform quality.
"""

from datetime import datetime, timezone
from app.models.base import Base, Column, DateTime, Integer, Text


class Feedback(Base):
    __tablename__ = "feedback"
    __collection__ = "feedback"

    id = Column(name="id", type_hint=int, autoincrement=True)
    user_id = Column(name="user_id", type_hint=int, default=None)
    conversation_id = Column(name="conversation_id", type_hint=int, default=None)
    rating = Column(name="rating", type_hint=int, default=5)
    comment = Column(name="comment", type_hint=str, default=None)
    created_at = Column(name="created_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
