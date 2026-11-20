"""
AIRWISE AI — User Service
Manages user profiles, lookups, and safe attribute updates.
"""

from typing import Optional
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundException
from app.models.user import User
from app.schemas.user import UserProfileUpdate


class UserService:
    def get_user_by_id(self, db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        normalized = email.strip().lower()
        return db.query(User).filter(User.email == normalized).first()

    def update_profile(self, db: Session, user: User, update_data: UserProfileUpdate) -> User:
        """
        Safely update user profile attributes.
        Explicitly guards against modifying role, is_active, is_verified, or password_hash.
        """
        if update_data.full_name is not None:
            user.full_name = update_data.full_name.strip()
        if update_data.profile_image is not None:
            user.profile_image = update_data.profile_image.strip()

        db.commit()
        db.refresh(user)
        return user


user_service = UserService()
