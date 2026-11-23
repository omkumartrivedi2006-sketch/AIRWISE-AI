"""
AIRWISE AI — Conversation Service
Business logic layer managing conversational sessions with privacy scoping.
"""

from typing import List, Optional
from app.core.database import MongoSession as Session
from app.core.exceptions import AirwiseException
from app.models.conversation import Conversation
from app.repositories.conversation_repository import conversation_repository
from app.schemas.conversation import ConversationCreate


class ConversationService:
    def __init__(self, repo=conversation_repository):
        self.repo = repo

    def get_conversations(
        self,
        db: Session,
        user_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Conversation]:
        return self.repo.get_all(db, user_id=user_id, skip=skip, limit=limit)

    def get_conversation_by_id(
        self,
        db: Session,
        conversation_id: int,
        authorized_user_id: Optional[int] = None,
    ) -> Conversation:
        conv = self.repo.get_by_id(db, conversation_id=conversation_id)
        if not conv:
            raise AirwiseException(
                message=f"Conversation with ID {conversation_id} not found.",
                code="CONVERSATION_NOT_FOUND",
                status_code=404,
            )
        # Privacy isolation: if conversation is assigned to a specific user, verify identity
        if conv.user_id is not None and authorized_user_id is not None and conv.user_id != authorized_user_id:
            raise AirwiseException(
                message="You do not have permission to access this private conversation.",
                code="FORBIDDEN_RESOURCE",
                status_code=403,
            )
        return conv

    def create_conversation(self, db: Session, conversation_in: ConversationCreate) -> Conversation:
        return self.repo.create(db, conversation_in=conversation_in)

    def delete_conversation(
        self,
        db: Session,
        conversation_id: int,
        authorized_user_id: Optional[int] = None,
    ) -> None:
        conv = self.get_conversation_by_id(db, conversation_id=conversation_id, authorized_user_id=authorized_user_id)
        self.repo.delete(db, conversation_id=conv.id)

    def count_conversations(self, db: Session, user_id: Optional[int] = None) -> int:
        return self.repo.count(db, user_id=user_id)


conversation_service = ConversationService()
