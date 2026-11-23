"""
AIRWISE AI — Saved Locations API Endpoints
GET    /api/v1/users/me/locations
POST   /api/v1/users/me/locations
PATCH  /api/v1/users/me/locations/{saved_location_id}
DELETE /api/v1/users/me/locations/{saved_location_id}
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import MongoSession as Session
from app.api.deps import require_authenticated_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.personalization import SavedLocationCreate, SavedLocationRead, SavedLocationUpdate
from app.services.saved_location_service import saved_location_service

router = APIRouter()


@router.get(
    "/locations",
    response_model=SuccessResponse[List[SavedLocationRead]],
    status_code=status.HTTP_200_OK,
    summary="List Saved Locations",
    description="Retrieve bookmarked environmental monitoring stations for the authenticated user.",
)
async def list_my_saved_locations(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    saved_list = saved_location_service.get_saved_locations(db, current_user.id)
    return SuccessResponse(
        success=True,
        message="Saved locations retrieved successfully",
        data=saved_list,
    )


@router.post(
    "/locations",
    response_model=SuccessResponse[SavedLocationRead],
    status_code=status.HTTP_201_CREATED,
    summary="Save a Location",
    description="Bookmark a monitoring location with an optional custom label and primary flag.",
)
async def add_saved_location(
    payload: SavedLocationCreate,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    saved = saved_location_service.add_saved_location(db, current_user.id, payload)
    # Refetch full formatted read object
    all_saved = saved_location_service.get_saved_locations(db, current_user.id)
    matched = next((item for item in all_saved if item.id == saved.id), None)
    return SuccessResponse(
        success=True,
        message="Location saved successfully",
        data=matched or SavedLocationRead.model_validate(saved),
    )


@router.patch(
    "/locations/{saved_location_id}",
    response_model=SuccessResponse[SavedLocationRead],
    status_code=status.HTTP_200_OK,
    summary="Update Saved Location",
    description="Update custom display name or primary status for a saved location.",
)
async def update_saved_location(
    saved_location_id: int,
    payload: SavedLocationUpdate,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    updated = saved_location_service.update_saved_location(db, current_user.id, saved_location_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Saved location #{saved_location_id} not found or unauthorized",
        )
    all_saved = saved_location_service.get_saved_locations(db, current_user.id)
    matched = next((item for item in all_saved if item.id == updated.id), None)
    return SuccessResponse(
        success=True,
        message="Saved location updated successfully",
        data=matched or SavedLocationRead.model_validate(updated),
    )


@router.delete(
    "/locations/{saved_location_id}",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Delete Saved Location",
    description="Remove a bookmarked location from the user's profile.",
)
async def delete_saved_location(
    saved_location_id: int,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    deleted = saved_location_service.delete_saved_location(db, current_user.id, saved_location_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Saved location #{saved_location_id} not found or unauthorized",
        )
    return SuccessResponse(
        success=True,
        message="Saved location removed successfully",
        data={"deleted_id": saved_location_id},
    )
