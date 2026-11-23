"""
AIRWISE AI — Message Repository
Persists and retrieves user and assistant messages for conversational context.
"""

from typing import List, Optional
from app.core.database import MongoSession as Session
from app.models.message import Message
from app.schemas.message import MessageCreate


class MessageRepository:
    @staticmethod
    def get_by_conversation(
        db: Session,
        conversation_id: int,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Message]:
        return db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at.asc()).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, conversation_id: int, message_in: MessageCreate) -> Message:
        db_obj = Message(
            conversation_id=conversation_id,
            role=message_in.role,
            content=message_in.content,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def count(db: Session, conversation_id: int) -> int:
        return db.query(Message).filter(Message.conversation_id == conversation_id).count()


message_repository = MessageRepository()
