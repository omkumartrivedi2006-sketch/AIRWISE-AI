"""
AIRWISE AI — Conversation Model (MongoDB Document)
Represents interactive environmental assistance dialogues.
"""

from datetime import datetime, timezone
from app.models.base import Base, Column, DateTime, Integer, String, relationship


class Conversation(Base):
    __tablename__ = "conversations"
    __collection__ = "conversations"

    id = Column(name="id", type_hint=int, autoincrement=True)
    user_id = Column(name="user_id", type_hint=int, default=None)
    title = Column(name="title", type_hint=str, default="New Conversation")
    created_at = Column(name="created_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(name="updated_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))

    messages = relationship("Message", back_populates="conversation")
