"""
AIRWISE AI — Message Model (MongoDB Document)
Stores messages within a conversation dialogue, supporting user, assistant, and system roles.
"""

from datetime import datetime, timezone
from app.models.base import Base, Column, DateTime, Integer, String, Text


class Message(Base):
    __tablename__ = "messages"
    __collection__ = "messages"

    id = Column(name="id", type_hint=int, autoincrement=True)
    conversation_id = Column(name="conversation_id", type_hint=int, index=True)
    role = Column(name="role", type_hint=str)
    content = Column(name="content", type_hint=str)
    created_at = Column(name="created_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
