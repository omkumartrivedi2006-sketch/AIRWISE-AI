"""
AIRWISE AI — Message Schemas
"""

from datetime import datetime
from typing import Literal
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
