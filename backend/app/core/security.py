"""
AIRWISE AI — Cryptography & Security Core
Implements Argon2id password hashing, JWT encoding/decoding, and cryptographic token hashing.
"""

import hashlib
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
from app.core.config import settings

# Initialize Argon2id password hasher with secure production defaults
_hasher = PasswordHasher(
    time_cost=2,
    memory_cost=65536,  # 64 MiB
    parallelism=2,
    hash_len=32,
    salt_len=16,
)

COMMON_WEAK_PASSWORDS = {
    "password12345",
    "password123456",
    "admin12345678",
    "administrator",
    "123456789012",
    "airwise123456",
    "welcome123456",
    "qwertyuiop12",
}


def hash_password(password: str) -> str:
    """Hash a plaintext password using Argon2id."""
    return _hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against an Argon2id hash."""
    if not hashed_password or not plain_password:
        return False
    try:
        return _hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError):
        return False
    except Exception:
        return False


def validate_password_strength(password: str) -> Tuple[bool, Optional[str]]:
    """
    Validate password meets enterprise security standards:
    - Minimum length: 12 characters
    - Maximum length: 128 characters
    - Contains uppercase, lowercase, digit, and special character
    - Not in common weak password blocklist
    """
    if len(password) < 12:
        return False, "Password must be at least 12 characters in length"
    if len(password) > 128:
        return False, "Password cannot exceed 128 characters"
    if password.lower() in COMMON_WEAK_PASSWORDS:
        return False, "This password is too common and easily compromised. Please choose a unique passphrase."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"\d", password):
        return False, "Password must contain at least one numeric digit"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_=+\\\/~`]", password):
        return False, "Password must contain at least one special character"
    return True, None


def generate_secure_random_token(nbytes: int = 32) -> str:
    """Generate cryptographically secure URL-safe token."""
    return secrets.token_urlsafe(nbytes)


def hash_token(raw_token: str) -> str:
    """Hash sensitive tokens (refresh tokens, reset tokens) using SHA-256 before database storage."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def create_access_token(
    user_id: int,
    role: str,
    email: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a signed JWT access token.
    Default lifetime: 15 minutes.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": "airwise-auth-service",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Validate signature, expiration, and issuer of a JWT access token.
    Returns payload dictionary or None if invalid/expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            issuer="airwise-auth-service",
            options={"require": ["sub", "exp", "iat"]},
        )
        if payload.get("type") != "access":
            return None
        return payload
    except jwt.PyJWTError:
        return None
