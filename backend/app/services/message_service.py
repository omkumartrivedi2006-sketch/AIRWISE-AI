"""
AIRWISE AI — Message Service
Persists user and assistant messages within a conversation dialogue.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.exceptions import AirwiseException
from app.models.message import Message
from app.repositories.conversation_repository import conversation_repository
from app.repositories.message_repository import message_repository
from app.schemas.message import MessageCreate


class MessageService:
    def __init__(self, repo=message_repository, conv_repo=conversation_repository):
        self.repo = repo
        self.conv_repo = conv_repo

    def get_messages(
        self,
        db: Session,
        conversation_id: int,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Message]:
        conv = self.conv_repo.get_by_id(db, conversation_id=conversation_id)
        if not conv:
            raise AirwiseException(
                message=f"Conversation with ID {conversation_id} not found.",
                code="CONVERSATION_NOT_FOUND",
                status_code=404,
            )
        return self.repo.get_by_conversation(db, conversation_id=conversation_id, skip=skip, limit=limit)

    def save_message(
        self,
        db: Session,
        conversation_id: int,
        message_in: MessageCreate,
    ) -> Message:
        conv = self.conv_repo.get_by_id(db, conversation_id=conversation_id)
        if not conv:
            raise AirwiseException(
                message=f"Conversation with ID {conversation_id} not found.",
                code="CONVERSATION_NOT_FOUND",
                status_code=404,
            )
        return self.repo.create(db, conversation_id=conversation_id, message_in=message_in)

    def count_messages(self, db: Session, conversation_id: int) -> int:
        return self.repo.count(db, conversation_id=conversation_id)


message_service = MessageService()
