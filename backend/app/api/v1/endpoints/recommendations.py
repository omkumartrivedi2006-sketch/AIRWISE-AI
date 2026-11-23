"""
AIRWISE AI — Personalized Environmental Recommendations API Endpoints
GET  /api/v1/recommendations
POST /api/v1/recommendations/refresh
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from app.core.database import MongoSession as Session
from app.api.deps import require_authenticated_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.personalization import RecommendationsResponse
from app.services.recommendation_service import recommendation_service

router = APIRouter()


@router.get(
    "",
    response_model=SuccessResponse[RecommendationsResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Personalized Recommendations",
    description="Retrieve personalized environmental guidance synthesized from user preferences and real observation telemetry.",
)
async def get_recommendations(
    location_id: Optional[int] = Query(None, description="Optional specific location ID to evaluate"),
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    recs = await recommendation_service.get_personalized_recommendations(
        db, current_user, location_id=location_id, force_refresh=False
    )
    return SuccessResponse(
        success=True,
        message="Personalized recommendations retrieved successfully",
        data=recs,
    )


@router.post(
    "/refresh",
    response_model=SuccessResponse[RecommendationsResponse],
    status_code=status.HTTP_200_OK,
    summary="Refresh Personalized Recommendations",
    description="Bypasses recommendation cache and regenerates fresh insights from latest observations.",
)
async def refresh_recommendations(
    location_id: Optional[int] = Query(None, description="Optional specific location ID to evaluate"),
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    recs = await recommendation_service.get_personalized_recommendations(
        db, current_user, location_id=location_id, force_refresh=True
    )
    return SuccessResponse(
        success=True,
        message="Personalized recommendations refreshed successfully",
        data=recs,
    )
