"""
AIRWISE AI — Admin AI Assistant Usage & Performance Endpoints
"""

from fastapi import APIRouter, Depends, Query, status
from app.core.database import MongoSession as Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.admin import AdminAiUsageOverview, AdminAiUsageTrends
from app.schemas.common import SuccessResponse
from app.services.admin.admin_service import admin_service

router = APIRouter()


@router.get(
    "/overview",
    response_model=SuccessResponse[AdminAiUsageOverview],
    status_code=status.HTTP_200_OK,
    summary="AI Assistant Usage Overview",
    description="Monitors Google Gemini API generation metrics, quota limits, and token estimations.",
)
async def get_ai_usage_overview(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    overview = admin_service.get_ai_usage_overview(db)
    return SuccessResponse(
        success=True,
        message="AI usage overview retrieved successfully",
        data=overview,
    )


@router.get(
    "/trends",
    response_model=SuccessResponse[AdminAiUsageTrends],
    status_code=status.HTTP_200_OK,
    summary="AI Assistant Request Trends",
    description="Chronological AI request volume and latency trends.",
)
async def get_ai_usage_trends(
    days: int = Query(7, ge=1, le=90, description="Trend duration in days"),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    trends = admin_service.get_ai_usage_trends(db, days=days)
    return SuccessResponse(
        success=True,
        message="AI usage trends retrieved successfully",
        data=trends,
    )
