"""
AIRWISE AI — Admin Dashboard Overview & Activity Endpoints
"""

from fastapi import APIRouter, Depends, Query, status
from app.core.database import MongoSession as Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.admin import AdminActivityMetricsResponse, AdminDashboardOverviewResponse
from app.schemas.common import SuccessResponse
from app.services.admin.admin_service import admin_service

router = APIRouter()


@router.get(
    "/overview",
    response_model=SuccessResponse[AdminDashboardOverviewResponse],
    status_code=status.HTTP_200_OK,
    summary="Admin Dashboard Overview",
    description="Calculates real platform metrics across users, observations, alert rules, and notifications.",
)
async def get_dashboard_overview(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    overview = admin_service.get_dashboard_overview(db)
    return SuccessResponse(
        success=True,
        message="Admin overview metrics retrieved successfully",
        data=overview,
    )


@router.get(
    "/activity",
    response_model=SuccessResponse[AdminActivityMetricsResponse],
    status_code=status.HTTP_200_OK,
    summary="Admin Activity Metrics",
    description="Retrieves chronological activity trends across registrations, AI requests, observations, and notifications.",
)
async def get_dashboard_activity(
    days: int = Query(7, ge=1, le=90, description="Trend duration in days"),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    activity = admin_service.get_dashboard_activity(db, days=days)
    return SuccessResponse(
        success=True,
        message="Activity metrics retrieved successfully",
        data=activity,
    )
