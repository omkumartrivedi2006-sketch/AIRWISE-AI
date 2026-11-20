"""
AIRWISE AI — User Schemas
Pydantic v2 schemas for user representations, safe profiles, and updates.
"""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


UserRole = Literal["USER", "ADMIN"]


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    full_name: Optional[str] = Field(None, max_length=255, description="User full name")


class UserProfileResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    role: UserRole
    profile_image: Optional[str] = None
    created_at: datetime
    last_login_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255, description="Updated full name")
    profile_image: Optional[str] = Field(None, max_length=500, description="URL or key of profile image")


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=1, description="Current account password")
    new_password: str = Field(..., min_length=12, max_length=128, description="New secure password")
    confirm_new_password: str = Field(..., min_length=12, max_length=128, description="Confirmation of new password")
