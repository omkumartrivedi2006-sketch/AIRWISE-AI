"""
AIRWISE AI — User Preferences API Endpoints
GET /api/v1/users/me/preferences
PUT /api/v1/users/me/preferences
"""

from fastapi import APIRouter, Depends, status
from app.core.database import MongoSession as Session
from app.api.deps import require_authenticated_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.personalization import UserPreferencesRead, UserPreferencesUpdate
from app.services.preference_service import preference_service

router = APIRouter()


@router.get(
    "/preferences",
    response_model=SuccessResponse[UserPreferencesRead],
    status_code=status.HTTP_200_OK,
    summary="Get User Preferences",
    description="Retrieve personal environmental and notification settings for the authenticated user.",
)
async def get_my_preferences(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    prefs = preference_service.get_or_create_preferences(db, current_user.id)
    return SuccessResponse(
        success=True,
        message="Preferences retrieved successfully",
        data=UserPreferencesRead.model_validate(prefs),
    )


@router.put(
    "/preferences",
    response_model=SuccessResponse[UserPreferencesRead],
    status_code=status.HTTP_200_OK,
    summary="Update User Preferences",
    description="Update personal environmental interests, localization, quiet hours, and notification channels.",
)
async def update_my_preferences(
    payload: UserPreferencesUpdate,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    updated = preference_service.update_preferences(db, current_user.id, payload)
    return SuccessResponse(
        success=True,
        message="Preferences updated successfully",
        data=UserPreferencesRead.model_validate(updated),
    )
