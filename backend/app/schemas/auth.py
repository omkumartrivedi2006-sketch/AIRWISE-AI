"""
AIRWISE AI — Authentication Schemas
Defines request and response schemas for registration, login, token rotation, and recovery.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.schemas.user import UserProfileResponse


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255, description="Full name of the user")
    email: EmailStr = Field(..., description="Primary contact email")
    password: str = Field(..., min_length=12, max_length=128, description="Argon2id compliant password")
    confirm_password: str = Field(..., min_length=12, max_length=128, description="Confirmation password")


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User login email")
    password: str = Field(..., min_length=1, max_length=128, description="Plaintext password for verification")
    remember_me: bool = Field(default=False, description="Extend session persistence parameters")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 900  # 15 minutes
    user: UserProfileResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = Field(None, description="Explicit refresh token if cookies are disabled")


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered account email")


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10, description="Password reset token")
    new_password: str = Field(..., min_length=12, max_length=128, description="New secure password")
    confirm_new_password: str = Field(..., min_length=12, max_length=128, description="Password confirmation")


class VerifyEmailRequest(BaseModel):
    token: str = Field(..., min_length=10, description="Email verification token")


class ResendVerificationRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address for resending verification instructions")
