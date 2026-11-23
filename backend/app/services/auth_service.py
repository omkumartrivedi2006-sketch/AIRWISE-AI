"""
AIRWISE AI — Authentication & Session Management Service
Implements registration, authentication, atomic token rotation, reuse detection, and recovery.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from app.core.database import MongoSession as Session
from app.core.config import settings
from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
)
from app.core.security import (
    create_access_token,
    generate_secure_random_token,
    hash_password,
    hash_token,
    validate_password_strength,
    verify_password,
)
from app.models.email_verification_token import EmailVerificationToken
from app.models.password_reset_token import PasswordResetToken
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.services.email_service import email_service


def _ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class AuthService:
    def register_user(self, db: Session, req: RegisterRequest) -> Tuple[User, str]:
        """
        Register a new user account with Argon2id hashing.
        Returns newly created user and plain verification token.
        """
        normalized_email = req.email.strip().lower()

        # 1. Check password confirmation
        if req.password != req.confirm_password:
            raise BadRequestException("Passwords do not match")

        # 2. Validate password policy (min 12 chars, complexity, etc.)
        valid_pw, pw_err = validate_password_strength(req.password)
        if not valid_pw:
            raise BadRequestException(pw_err or "Password does not meet security requirements")

        # 3. Check for existing account
        existing = db.query(User).filter(User.email == normalized_email).first()
        if existing:
            raise ConflictException(f"An account with email '{normalized_email}' is already registered")

        # 4. Hash password with Argon2id
        pw_hash = hash_password(req.password)

        # 5. Persist user with default USER role
        user = User(
            full_name=req.full_name.strip(),
            email=normalized_email,
            password_hash=pw_hash,
            role="USER",
            is_active=True,
            is_verified=False,
        )
        db.add(user)
        db.flush()

        # 6. Generate and store email verification token
        raw_verify_token = generate_secure_random_token(32)
        token_entry = EmailVerificationToken(
            user_id=user.id,
            token_hash=hash_token(raw_verify_token),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=settings.EMAIL_VERIFICATION_EXPIRE_HOURS),
        )
        db.add(token_entry)
        db.commit()
        db.refresh(user)

        # 7. Dispatch verification email
        email_service.send_verification_email(user.email, raw_verify_token)

        return user, raw_verify_token

    def authenticate_user(self, db: Session, email: str, password: str) -> User:
        """
        Authenticate user credentials using generic errors to prevent enumeration.
        """
        normalized_email = email.strip().lower()
        user = db.query(User).filter(User.email == normalized_email).first()

        if not user or not user.password_hash:
            raise UnauthorizedException("Invalid email or password")

        if not verify_password(password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise ForbiddenException("Account is deactivated. Please contact support.")

        # Update last login timestamp directly
        user.last_login_at = datetime.now(timezone.utc)
        try:
            db._db.users.update_one({"id": user.id}, {"$set": {"last_login_at": user.last_login_at}})
        except Exception:
            pass
        return user

    def create_auth_session(self, db: Session, user: User) -> Tuple[str, str]:
        """
        Create a new authentication session:
        Generates access token (15 mins) and cryptographic refresh token (7 days).
        Returns (access_token, raw_refresh_token).
        """
        # Generate JWT access token
        access_token = create_access_token(
            user_id=user.id,
            role=user.role,
            email=user.email,
        )

        # Generate cryptographic random refresh token
        raw_refresh_token = generate_secure_random_token(48)
        refresh_hash = hash_token(raw_refresh_token)

        session_entry = RefreshToken(
            user_id=user.id,
            token_hash=refresh_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        db.add(session_entry)
        db.commit()

        return access_token, raw_refresh_token

    def refresh_auth_session(self, db: Session, raw_refresh_token: str) -> Tuple[str, str, User]:
        """
        Atomically rotate refresh token.
        Detects reuse attacks: if a revoked token is used, revoke all sessions for that user.
        Returns (new_access_token, new_raw_refresh_token, user).
        """
        if not raw_refresh_token:
            raise UnauthorizedException("Refresh token is required")

        hashed_input = hash_token(raw_refresh_token)
        session = db.query(RefreshToken).filter(RefreshToken.token_hash == hashed_input).first()

        if not session:
            raise UnauthorizedException("Invalid or unrecognized refresh token")

        # Reuse Detection: If token is already revoked, an adversary may be attempting replay
        if session.revoked_at is not None:
            # Revoke all active sessions for this user as a security measure
            self.revoke_all_user_sessions(db, session.user_id)
            raise UnauthorizedException("Revoked token reuse detected. All active sessions have been terminated for security.")

        # Expiration Check
        now = datetime.now(timezone.utc)
        if _ensure_utc(session.expires_at) < now:
            session.revoked_at = now
            db.commit()
            raise UnauthorizedException("Refresh token has expired. Please log in again.")

        user = db.query(User).filter(User.id == session.user_id).first()
        if not user or not user.is_active:
            raise UnauthorizedException("Account is invalid or inactive")

        # Atomic Rotation: create new token and link old token
        new_raw_token = generate_secure_random_token(48)
        new_session = RefreshToken(
            user_id=user.id,
            token_hash=hash_token(new_raw_token),
            expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        db.add(new_session)
        db.flush()

        session.revoked_at = now
        session.replaced_by_token_id = new_session.id
        db.commit()

        # Issue new access token
        new_access_token = create_access_token(
            user_id=user.id,
            role=user.role,
            email=user.email,
        )

        return new_access_token, new_raw_token, user

    def revoke_session(self, db: Session, raw_refresh_token: str) -> bool:
        """Revoke a single refresh token session upon logout."""
        if not raw_refresh_token:
            return False
        hashed_input = hash_token(raw_refresh_token)
        session = db.query(RefreshToken).filter(RefreshToken.token_hash == hashed_input).first()
        if session and session.revoked_at is None:
            session.revoked_at = datetime.now(timezone.utc)
            db.commit()
            return True
        return False

    def revoke_all_user_sessions(self, db: Session, user_id: int) -> int:
        """Revoke all active sessions belonging to the user."""
        now = datetime.now(timezone.utc)
        updated = (
            db.query(RefreshToken)
            .filter(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
            .update({RefreshToken.revoked_at: now}, synchronize_session=False)
        )
        db.commit()
        return updated

    def change_user_password(
        self,
        db: Session,
        user: User,
        current_password: str,
        new_password: str,
        confirm_new_password: str,
    ) -> None:
        """Change user password after verifying current credentials and revoking other sessions."""
        if not verify_password(current_password, user.password_hash or ""):
            raise BadRequestException("Current password verification failed")

        if new_password != confirm_new_password:
            raise BadRequestException("New password confirmation does not match")

        valid_pw, pw_err = validate_password_strength(new_password)
        if not valid_pw:
            raise BadRequestException(pw_err or "Password does not meet security requirements")

        # Update hash
        user.password_hash = hash_password(new_password)
        db.commit()

        # Revoke all sessions so all devices re-authenticate
        self.revoke_all_user_sessions(db, user.id)

    def request_password_reset(self, db: Session, email: str) -> Optional[str]:
        """
        Request password reset instructions.
        Always returns generic safe state to avoid account enumeration.
        """
        normalized_email = email.strip().lower()
        user = db.query(User).filter(User.email == normalized_email).first()

        if not user or not user.is_active:
            # Generic return to prevent enumeration
            return None

        # Invalidate previous unused reset tokens
        now = datetime.now(timezone.utc)
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        ).update({PasswordResetToken.used_at: now}, synchronize_session=False)

        raw_token = generate_secure_random_token(32)
        reset_entry = PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            expires_at=now + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES),
        )
        db.add(reset_entry)
        db.commit()

        email_service.send_password_reset_email(user.email, raw_token)
        return raw_token

    def reset_password_with_token(
        self,
        db: Session,
        raw_token: str,
        new_password: str,
        confirm_new_password: str,
    ) -> None:
        """Reset password using a valid, unexpired reset token."""
        if new_password != confirm_new_password:
            raise BadRequestException("Passwords do not match")

        valid_pw, pw_err = validate_password_strength(new_password)
        if not valid_pw:
            raise BadRequestException(pw_err or "Password does not meet security requirements")

        token_hash = hash_token(raw_token)
        now = datetime.now(timezone.utc)
        record = (
            db.query(PasswordResetToken)
            .filter(PasswordResetToken.token_hash == token_hash)
            .first()
        )

        if not record or record.used_at is not None or _ensure_utc(record.expires_at) < now:
            raise BadRequestException("Password reset link is invalid, already used, or expired")

        user = db.query(User).filter(User.id == record.user_id).first()
        if not user or not user.is_active:
            raise BadRequestException("Associated account is inactive or not found")

        # Update password hash
        user.password_hash = hash_password(new_password)
        record.used_at = now
        db.commit()

        # Invalidate all active sessions for security
        self.revoke_all_user_sessions(db, user.id)

    def verify_email_with_token(self, db: Session, raw_token: str) -> User:
        """Verify user email address using an email verification token."""
        token_hash = hash_token(raw_token)
        now = datetime.now(timezone.utc)
        record = (
            db.query(EmailVerificationToken)
            .filter(EmailVerificationToken.token_hash == token_hash)
            .first()
        )

        if not record or record.used_at is not None or _ensure_utc(record.expires_at) < now:
            raise BadRequestException("Email verification link is invalid, already used, or expired")

        user = db.query(User).filter(User.id == record.user_id).first()
        if not user:
            raise NotFoundException("User associated with verification token not found")

        user.is_verified = True
        record.used_at = now
        db.commit()
        db.refresh(user)
        return user

    def resend_email_verification(self, db: Session, email: str) -> Optional[str]:
        """Resend email verification token (generic return to prevent enumeration)."""
        normalized_email = email.strip().lower()
        user = db.query(User).filter(User.email == normalized_email).first()

        if not user or user.is_verified or not user.is_active:
            return None

        # Invalidate old tokens
        now = datetime.now(timezone.utc)
        db.query(EmailVerificationToken).filter(
            EmailVerificationToken.user_id == user.id,
            EmailVerificationToken.used_at.is_(None),
        ).update({EmailVerificationToken.used_at: now}, synchronize_session=False)

        raw_token = generate_secure_random_token(32)
        entry = EmailVerificationToken(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            expires_at=now + timedelta(hours=settings.EMAIL_VERIFICATION_EXPIRE_HOURS),
        )
        db.add(entry)
        db.commit()

        email_service.send_verification_email(user.email, raw_token)
        return raw_token


auth_service = AuthService()
