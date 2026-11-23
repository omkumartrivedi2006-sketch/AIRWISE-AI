"""
AIRWISE AI — Conversation Repository
Manages dialogue session persistence and retrieval.
"""

from typing import List, Optional
from app.core.database import MongoSession as Session
from app.models.conversation import Conversation
from app.schemas.conversation import ConversationCreate


class ConversationRepository:
    @staticmethod
    def get_all(
        db: Session,
        user_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Conversation]:
        query = db.query(Conversation)
        if user_id is not None:
            query = query.filter(Conversation.user_id == user_id)
        return query.order_by(Conversation.updated_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, conversation_id: int) -> Optional[Conversation]:
        return db.query(Conversation).filter(Conversation.id == conversation_id).first()

    @staticmethod
    def create(db: Session, conversation_in: ConversationCreate) -> Conversation:
        db_obj = Conversation(
            title=conversation_in.title,
            user_id=conversation_in.user_id,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, conversation_id: int) -> bool:
        obj = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not obj:
            return False
        db.delete(obj)
        db.commit()
        return True

    @staticmethod
    def count(db: Session, user_id: Optional[int] = None) -> int:
        query = db.query(Conversation)
        if user_id is not None:
            query = query.filter(Conversation.user_id == user_id)
        return query.count()


conversation_repository = ConversationRepository()
