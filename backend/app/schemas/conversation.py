"""
AIRWISE AI — Conversation Schemas
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ConversationBase(BaseModel):
    title: str = Field(default="New Conversation", min_length=1, max_length=255)
    user_id: Optional[int] = Field(None, description="Nullable for anonymous conversations")


class ConversationCreate(ConversationBase):
    pass


class ConversationResponse(ConversationBase):
    id: int
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0
    model_config = ConfigDict(from_attributes=True)
