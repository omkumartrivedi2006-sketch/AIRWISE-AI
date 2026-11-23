"""
AIRWISE AI — User Model (MongoDB Document)
Represents user profiles with email uniqueness, Argon2 password hashes, and RBAC roles.
"""

from datetime import datetime, timezone
from typing import Any, Optional
from app.models.base import Base, Boolean, Column, DateTime, Integer, String


class User(Base):
    __tablename__ = "users"
    __collection__ = "users"

    id = Column(name="id", type_hint=int, autoincrement=True)
    email = Column(name="email", type_hint=str, unique=True, index=True)
    full_name = Column(name="full_name", type_hint=str, default=None)
    password_hash = Column(name="password_hash", type_hint=str, default=None)
    profile_image = Column(name="profile_image", type_hint=str, default=None)
    is_active = Column(name="is_active", type_hint=bool, default=True)
    is_verified = Column(name="is_verified", type_hint=bool, default=False)
    role = Column(name="role", type_hint=str, default="USER")
    last_login_at = Column(name="last_login_at", type_hint=datetime, default=None)
    created_at = Column(name="created_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(name="updated_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))

    @property
    def preferences(self) -> Any:
        return getattr(self, "_preferences", None)

    @preferences.setter
    def preferences(self, val: Any) -> None:
        self._preferences = val
