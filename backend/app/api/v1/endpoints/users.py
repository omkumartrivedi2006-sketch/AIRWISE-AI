"""
AIRWISE AI — User Management Endpoints
GET   /api/v1/users/me
PATCH /api/v1/users/me
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import require_authenticated_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.user import UserProfileResponse, UserProfileUpdate
from app.services.user_service import user_service

router = APIRouter()


@router.get(
    "/me",
    status_code=status.HTTP_200_OK,
    summary="Get User Profile",
    description="Retrieve the profile of the currently authenticated user.",
)
async def get_my_profile(
    current_user: User = Depends(require_authenticated_user),
):
    return SuccessResponse(
        success=True,
        message="User profile retrieved successfully",
        data=UserProfileResponse.model_validate(current_user),
    )


@router.patch(
    "/me",
    status_code=status.HTTP_200_OK,
    summary="Update User Profile",
    description="Update permitted profile attributes (full_name, profile_image). Role, verification status, and password cannot be modified here.",
)
async def update_my_profile(
    update_data: UserProfileUpdate,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    updated_user = user_service.update_profile(db, user=current_user, update_data=update_data)
    return SuccessResponse(
        success=True,
        message="Profile updated successfully",
        data=UserProfileResponse.model_validate(updated_user),
    )
