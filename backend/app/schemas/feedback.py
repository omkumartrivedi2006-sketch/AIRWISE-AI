"""
AIRWISE AI — Feedback Schemas
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.utils.validators import validate_rating


class FeedbackBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Satisfaction rating scale 1 to 5")
    comment: Optional[str] = Field(None, max_length=1000, description="Qualitative feedback text")
    conversation_id: Optional[int] = Field(None, description="Optional associated conversation ID")
    user_id: Optional[int] = Field(None, description="Optional submitting user ID")

    @field_validator("rating")
    @classmethod
    def check_rating(cls, v):
        return validate_rating(v)


class FeedbackCreate(FeedbackBase):
    pass


class FeedbackResponse(FeedbackBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
