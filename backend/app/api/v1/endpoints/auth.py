"""
AIRWISE AI — Authentication Endpoints
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/logout-all
GET  /api/v1/auth/me
POST /api/v1/auth/change-password
POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
"""

from typing import Optional
from fastapi import APIRouter, Cookie, Depends, Header, Response, status
from app.core.database import MongoSession as Session
from app.api.deps import (
    clear_auth_cookies,
    get_current_user,
    require_authenticated_user,
    set_auth_cookies,
)
from app.core.database import get_db
from app.core.exceptions import UnauthorizedException
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    ResendVerificationRequest,
    TokenResponse,
    VerifyEmailRequest,
)
from app.schemas.common import SuccessResponse
from app.schemas.user import PasswordChangeRequest, UserProfileResponse
from app.services.auth_service import auth_service

router = APIRouter()


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="User Registration",
    description="Register a new AIRWISE account with Argon2id password hashing, establish session, and default USER role.",
)
async def register(
    req: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    user, _ = auth_service.register_user(db, req)
    access_token, refresh_token = auth_service.create_auth_session(db, user)

    # Establish HttpOnly cookies for instant session activation
    set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token)

    user_prof = UserProfileResponse.model_validate(user)
    token_resp = TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=900,
        user=user_prof,
    )
    combined_data = {
        **user_prof.model_dump(),
        **token_resp.model_dump(),
    }

    return SuccessResponse(
        success=True,
        message="Account registered and authenticated successfully.",
        data=combined_data,
    )


@router.post(
    "/login",
    status_code=status.HTTP_200_OK,
    summary="User Login",
    description="Authenticate user credentials, issue JWT tokens, and establish secure session cookies.",
)
async def login(
    req: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    user = auth_service.authenticate_user(db, email=req.email, password=req.password)
    access_token, refresh_token = auth_service.create_auth_session(db, user)

    # Establish HttpOnly cookies
    set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token)

    return SuccessResponse(
        success=True,
        message="Authentication successful",
        data=TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=900,
            user=UserProfileResponse.model_validate(user),
        ),
    )


@router.post(
    "/refresh",
    status_code=status.HTTP_200_OK,
    summary="Refresh Session",
    description="Rotate refresh token atomically and issue a new access token.",
)
async def refresh_session(
    response: Response,
    req: Optional[RefreshTokenRequest] = None,
    refresh_token_cookie: Optional[str] = Cookie(None, alias="refresh_token"),
    db: Session = Depends(get_db),
):
    # Extract token from cookie or body
    raw_token = refresh_token_cookie or (req.refresh_token if req else None)
    if not raw_token:
        raise UnauthorizedException("Refresh token is required")

    new_access_token, new_refresh_token, user = auth_service.refresh_auth_session(db, raw_token)

    # Update cookies
    set_auth_cookies(response, access_token=new_access_token, refresh_token=new_refresh_token)

    return SuccessResponse(
        success=True,
        message="Session refreshed successfully",
        data=TokenResponse(
            access_token=new_access_token,
            token_type="bearer",
            expires_in=900,
            user=UserProfileResponse.model_validate(user),
        ),
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="User Logout",
    description="Revoke the current refresh token session and clear authentication cookies.",
)
async def logout(
    response: Response,
    req: Optional[RefreshTokenRequest] = None,
    refresh_token_cookie: Optional[str] = Cookie(None, alias="refresh_token"),
    db: Session = Depends(get_db),
):
    raw_token = refresh_token_cookie or (req.refresh_token if req else None)
    if raw_token:
        auth_service.revoke_session(db, raw_token)

    clear_auth_cookies(response)
    return SuccessResponse(
        success=True,
        message="Logged out successfully",
        data={"status": "logged_out"},
    )


@router.post(
    "/logout-all",
    status_code=status.HTTP_200_OK,
    summary="Logout From All Devices",
    description="Revoke all active refresh sessions belonging to the authenticated user.",
)
async def logout_all(
    response: Response,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    revoked_count = auth_service.revoke_all_user_sessions(db, current_user.id)
    clear_auth_cookies(response)

    return SuccessResponse(
        success=True,
        message="All active user sessions have been terminated",
        data={"revoked_sessions": revoked_count},
    )


@router.get(
    "/me",
    status_code=status.HTTP_200_OK,
    summary="Current User Profile",
    description="Retrieve safe profile attributes for the authenticated user.",
)
async def get_me(
    current_user: User = Depends(require_authenticated_user),
):
    return SuccessResponse(
        success=True,
        message="User profile retrieved",
        data=UserProfileResponse.model_validate(current_user),
    )


@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change Password",
    description="Verify current password and securely update to a new Argon2id password hash.",
)
async def change_password(
    req: PasswordChangeRequest,
    response: Response,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    auth_service.change_user_password(
        db,
        user=current_user,
        current_password=req.current_password,
        new_password=req.new_password,
        confirm_new_password=req.confirm_new_password,
    )
    clear_auth_cookies(response)

    return SuccessResponse(
        success=True,
        message="Password updated successfully. Please log in with your new password.",
        data={"status": "password_changed"},
    )


@router.post(
    "/verify-email",
    status_code=status.HTTP_200_OK,
    summary="Verify Email Address",
    description="Verify account email address using a cryptographic token.",
)
async def verify_email(
    req: VerifyEmailRequest,
    db: Session = Depends(get_db),
):
    user = auth_service.verify_email_with_token(db, req.token)
    return SuccessResponse(
        success=True,
        message="Email verified successfully",
        data=UserProfileResponse.model_validate(user),
    )


@router.post(
    "/resend-verification",
    status_code=status.HTTP_200_OK,
    summary="Resend Verification Email",
    description="Request a new email verification token (returns generic response to prevent account enumeration).",
)
async def resend_verification(
    req: ResendVerificationRequest,
    db: Session = Depends(get_db),
):
    auth_service.resend_email_verification(db, req.email)
    return SuccessResponse(
        success=True,
        message="If this account exists and is unverified, verification instructions have been dispatched.",
        data={"status": "verification_queued"},
    )


@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
    summary="Forgot Password",
    description="Initiate password recovery. Always returns a generic response to prevent account enumeration.",
)
async def forgot_password(
    req: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    auth_service.request_password_reset(db, req.email)
    return SuccessResponse(
        success=True,
        message="If an account with this email exists, recovery instructions have been sent.",
        data={"status": "reset_requested"},
    )


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Reset Password",
    description="Set a new password using a secure single-use recovery token.",
)
async def reset_password(
    req: ResetPasswordRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    auth_service.reset_password_with_token(
        db,
        raw_token=req.token,
        new_password=req.new_password,
        confirm_new_password=req.confirm_new_password,
    )
    clear_auth_cookies(response)
    return SuccessResponse(
        success=True,
        message="Password reset successfully. Please log in with your new credentials.",
        data={"status": "password_reset_complete"},
    )
