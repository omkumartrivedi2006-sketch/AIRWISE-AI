"""
AIRWISE AI — Message Schemas
Defines request and response schemas for conversational dialogues and AI messaging.
"""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class MessageBase(BaseModel):
    role: Literal["user", "assistant", "system"] = Field(..., description="Message author role")
    content: str = Field(..., min_length=1, max_length=5000, description="Message text content")


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    id: int
    conversation_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ChatMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000, description="User's environmental question or prompt")
    role: Optional[Literal["user", "assistant", "system"]] = Field(default="user")
    location_id: Optional[int] = Field(default=None, description="Optional location ID for localized observation grounding")


class ChatMessageResponse(BaseModel):
    id: Optional[int] = None
    role: Optional[str] = "assistant"
    user_message: MessageResponse
    assistant_message: MessageResponse
    conversation_id: int
    status: str = "completed"
    model_config = ConfigDict(from_attributes=True)
