"""
AIRWISE AI — Email Verification Token Model (MongoDB Document)
Stores secure SHA-256 hashes of email verification tokens.
"""

from datetime import datetime, timezone
from app.models.base import Base, Column, DateTime, Integer, String


class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"
    __collection__ = "email_verification_tokens"

    id = Column(name="id", type_hint=int, autoincrement=True)
    user_id = Column(name="user_id", type_hint=int, index=True)
    token_hash = Column(name="token_hash", type_hint=str, unique=True, index=True)
    expires_at = Column(name="expires_at", type_hint=datetime, index=True)
    used_at = Column(name="used_at", type_hint=datetime, default=None)
    created_at = Column(name="created_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
