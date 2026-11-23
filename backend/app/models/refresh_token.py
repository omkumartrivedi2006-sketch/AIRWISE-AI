"""
AIRWISE AI — Refresh Token Model (MongoDB Document)
Manages long-lived rotating refresh token sessions with cryptographic hashes.
"""

from datetime import datetime, timezone
from app.models.base import Base, Column, DateTime, Integer, String


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    __collection__ = "refresh_tokens"

    id = Column(name="id", type_hint=int, autoincrement=True)
    user_id = Column(name="user_id", type_hint=int, index=True)
    token_hash = Column(name="token_hash", type_hint=str, unique=True, index=True)
    expires_at = Column(name="expires_at", type_hint=datetime, index=True)
    revoked_at = Column(name="revoked_at", type_hint=datetime, default=None)
    replaced_by_token_id = Column(name="replaced_by_token_id", type_hint=int, default=None)
    created_at = Column(name="created_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
