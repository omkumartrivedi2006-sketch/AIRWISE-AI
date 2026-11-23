"""
AIRWISE AI — Admin Environmental Data Management Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from app.core.database import MongoSession as Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.admin import AdminObservationRead, AdminObservationReview
from app.schemas.common import PaginationMeta, SuccessResponse
from app.services.admin.admin_service import admin_service

router = APIRouter()


@router.get(
    "",
    response_model=SuccessResponse[List[AdminObservationRead]],
    status_code=status.HTTP_200_OK,
    summary="List Observations for Quality Review",
    description="Lists physical pollution telemetry with flags, review states, and provenance.",
)
async def list_environmental_data(
    query: Optional[str] = Query(None, description="Search by city or country"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    review_status: Optional[str] = Query(None, description="Filter by review status (unreviewed, verified, flagged, rejected)"),
    is_flagged: Optional[bool] = Query(None, description="Filter by flagged boolean"),
    is_demo: Optional[bool] = Query(None, description="Filter demo records"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    items, total = admin_service.get_environmental_data(
        db,
        query=query,
        location_id=location_id,
        review_status=review_status,
        is_flagged=is_flagged,
        is_demo=is_demo,
        page=page,
        limit=limit,
    )
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return SuccessResponse(
        success=True,
        message="Environmental observations retrieved successfully",
        data=items,
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages).model_dump(),
    )


@router.get(
    "/{observation_id}",
    response_model=SuccessResponse[AdminObservationRead],
    status_code=status.HTTP_200_OK,
    summary="Get Observation Details",
    description="Retrieves a single observation record with its data-quality status.",
)
async def get_observation(
    observation_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    obs = admin_service.get_observation_details(db, observation_id)
    return SuccessResponse(
        success=True,
        message="Observation details retrieved successfully",
        data=obs,
    )


@router.patch(
    "/{observation_id}/review",
    response_model=SuccessResponse[AdminObservationRead],
    status_code=status.HTTP_200_OK,
    summary="Review Observation Quality",
    description="Records a quality determination (verified, flagged, rejected) while strictly preserving physical readings.",
)
async def review_observation(
    observation_id: int,
    payload: AdminObservationReview,
    request: Request,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ip_addr = request.client.host if request.client else None
    reviewed = admin_service.review_observation(
        db,
        current_admin=current_admin,
        observation_id=observation_id,
        review_status=payload.review_status,
        reason=payload.reason,
        ip_address=ip_addr,
    )
    return SuccessResponse(
        success=True,
        message=f"Observation marked as '{payload.review_status}' successfully",
        data=reviewed,
    )
