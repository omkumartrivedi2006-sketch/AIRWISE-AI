"""
AIRWISE AI — Authentication & Authorization Dependencies
Provides request-scoped user extraction, token validation, and RBAC enforcement.
"""

from typing import Optional
from fastapi import Cookie, Depends, Header, HTTPException, Response, status
from app.core.config import settings
from app.core.database import Session, get_db
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_access_token
from app.models.user import User


def get_token_from_header_or_cookie(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    access_token_cookie: Optional[str] = Cookie(None, alias="access_token"),
) -> Optional[str]:
    """Extract access token from Bearer Authorization header or HttpOnly cookie."""
    if authorization and authorization.startswith("Bearer "):
        return authorization.split(" ", 1)[1].strip()
    if access_token_cookie:
        return access_token_cookie.strip()
    return None


def get_current_user(
    token: Optional[str] = Depends(get_token_from_header_or_cookie),
    db: Session = Depends(get_db),
) -> User:
    """
    Validate access token and retrieve current authenticated user.
    Raises 401 Unauthorized if missing, expired, or invalid.
    """
    if not token:
        raise UnauthorizedException("Authentication token is missing")

    payload = decode_access_token(token)
    if not payload:
        raise UnauthorizedException("Token is invalid, expired, or signature verification failed")

    user_id_str = payload.get("sub")
    if not user_id_str or not user_id_str.isdigit():
        raise UnauthorizedException("Invalid token subject")

    user_id = int(user_id_str)
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise UnauthorizedException("User associated with token no longer exists")

    if not user.is_active:
        raise ForbiddenException("Account is deactivated")

    return user


def get_optional_current_user(
    token: Optional[str] = Depends(get_token_from_header_or_cookie),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Retrieve authenticated user if valid token present; returns None otherwise."""
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        if not payload:
            return None
        user_id_str = payload.get("sub")
        if not user_id_str or not user_id_str.isdigit():
            return None
        user = db.query(User).filter(User.id == int(user_id_str)).first()
        if user and user.is_active:
            return user
    except Exception:
        return None
    return None


def require_authenticated_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Explicit dependency ensuring user is authenticated and active."""
    return current_user


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    RBAC dependency enforcing ADMIN privileges.
    Raises 403 Forbidden if user role is not ADMIN.
    """
    if current_user.role != "ADMIN":
        raise ForbiddenException("Administrative privileges required to access this resource")
    return current_user


# Cookie Helper Functions
def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Set secure HttpOnly cookies for access and refresh tokens."""
    # 1. Access Token Cookie (15 mins)
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=settings.COOKIE_SECURE or settings.is_production,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        path="/",
    )

    # 2. Refresh Token Cookie (7 days)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        httponly=True,
        secure=settings.COOKIE_SECURE or settings.is_production,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        path="/api/v1/auth",  # Restricted path for refresh token cookie
    )


def clear_auth_cookies(response: Response) -> None:
    """Delete access and refresh token cookies on logout."""
    response.delete_cookie(
        key="access_token",
        path="/",
        domain=settings.COOKIE_DOMAIN,
        samesite=settings.COOKIE_SAMESITE,
    )
    response.delete_cookie(
        key="refresh_token",
        path="/api/v1/auth",
        domain=settings.COOKIE_DOMAIN,
        samesite=settings.COOKIE_SAMESITE,
    )
