"""
AIRWISE AI — Location Endpoints
GET /api/v1/locations
GET /api/v1/locations/{location_id}
POST /api/v1/locations
"""

from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.common import PaginationMeta, SuccessResponse
from app.schemas.location import LocationCreate, LocationResponse
from app.services.location_service import location_service

router = APIRouter()


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="List Monitoring Locations",
    description="Retrieve available geographical monitoring stations with pagination.",
)
async def list_locations(
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * limit
    locations = location_service.get_locations(db, skip=skip, limit=limit)
    total = location_service.count_locations(db)
    total_pages = (total + limit - 1) // limit if total > 0 else 0

    return SuccessResponse(
        success=True,
        message="Locations retrieved successfully",
        data=[LocationResponse.model_validate(loc) for loc in locations],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages).model_dump(),
    )


@router.get(
    "/{location_id}",
    status_code=status.HTTP_200_OK,
    summary="Get Location Details",
    description="Retrieve detailed metadata for a specific monitoring station.",
)
async def get_location(
    location_id: int,
    db: Session = Depends(get_db),
):
    location = location_service.get_location_by_id(db, location_id=location_id)
    return SuccessResponse(
        success=True,
        message="Location retrieved successfully",
        data=LocationResponse.model_validate(location),
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create Monitoring Location",
    description="Register a new environmental monitoring location station.",
)
async def create_location(
    location_in: LocationCreate,
    db: Session = Depends(get_db),
):
    created_loc = location_service.create_location(db, location_in=location_in)
    return SuccessResponse(
        success=True,
        message="Location registered successfully",
        data=LocationResponse.model_validate(created_loc),
    )
