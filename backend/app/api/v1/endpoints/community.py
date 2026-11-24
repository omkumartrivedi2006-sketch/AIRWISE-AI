"""
AIRWISE AI — Community Pollution Report API Endpoints
GET   /api/v1/community/overview
GET   /api/v1/community/reports
POST  /api/v1/community/reports
GET   /api/v1/community/reports/my
GET   /api/v1/community/reports/{id}
PATCH /api/v1/community/reports/{id}/status
GET   /api/v1/community/ai-insights
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.deps import require_admin, require_authenticated_user
from app.core.database import MongoSession as Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.community import (
    CommunityAIInsightsResponse,
    CommunityOverviewStats,
    CommunityReportCreate,
    CommunityReportResponse,
    CommunityReportStatusUpdate,
)
from app.services.community_service import community_service

router = APIRouter()


@router.get(
    "/overview",
    response_model=SuccessResponse[CommunityOverviewStats],
    status_code=status.HTTP_200_OK,
    summary="Community Environmental Overview",
    description="Returns aggregate report counts, category distribution, and official reference stations.",
)
async def get_community_overview(
    db: Session = Depends(get_db),
):
    stats = await community_service.get_community_overview(db)
    return SuccessResponse(
        success=True,
        message="Community overview retrieved successfully",
        data=stats,
    )


@router.get(
    "/reports",
    response_model=SuccessResponse[List[CommunityReportResponse]],
    status_code=status.HTTP_200_OK,
    summary="List Public Community Reports",
    description="Returns citizen reports with privacy-safe truncated coordinates (2 decimal places).",
)
async def list_public_reports(
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status (SUBMITTED, VERIFIED, etc.)"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    reports = await community_service.get_public_reports(
        db, category=category, status_filter=status, limit=limit, offset=offset
    )
    return SuccessResponse(
        success=True,
        message="Community reports retrieved successfully",
        data=reports,
    )


@router.post(
    "/reports",
    response_model=SuccessResponse[CommunityReportResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Submit Citizen Pollution Report",
    description="Submits a localized pollution observation with category, description, and optional coordinates.",
)
async def submit_report(
    data: CommunityReportCreate,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    report = await community_service.create_report(db, current_user, data)
    return SuccessResponse(
        success=True,
        message="Community report submitted successfully. Assigned reference ID for tracking.",
        data=report,
    )


@router.get(
    "/reports/my",
    response_model=SuccessResponse[List[CommunityReportResponse]],
    status_code=status.HTTP_200_OK,
    summary="List Current User's Reports",
    description="Returns all pollution reports submitted by the authenticated user with tracking status.",
)
async def list_my_reports(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    my_reports = await community_service.get_user_reports(db, current_user.id)
    return SuccessResponse(
        success=True,
        message="User reports retrieved successfully",
        data=my_reports,
    )


@router.get(
    "/reports/{report_id}",
    response_model=SuccessResponse[CommunityReportResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Specific Report Detail",
)
async def get_report_detail(
    report_id: int,
    db: Session = Depends(get_db),
):
    report = await community_service.get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Community report not found")
    return SuccessResponse(
        success=True,
        message="Report details retrieved successfully",
        data=report,
    )


@router.patch(
    "/reports/{report_id}/status",
    response_model=SuccessResponse[CommunityReportResponse],
    status_code=status.HTTP_200_OK,
    summary="Admin Moderate Report Status",
    description="Allows administrative review to verify, reject, or mark a report resolved.",
)
async def update_report_status(
    report_id: int,
    update_data: CommunityReportStatusUpdate,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    report = await community_service.update_report_status(db, report_id, admin_user, update_data)
    if not report:
        raise HTTPException(status_code=404, detail="Community report not found")
    return SuccessResponse(
        success=True,
        message="Report status updated successfully",
        data=report,
    )


@router.get(
    "/ai-insights",
    response_model=SuccessResponse[CommunityAIInsightsResponse],
    status_code=status.HTTP_200_OK,
    summary="Community AI Environmental Insights",
    description="Synthesizes citizen reports into actionable collective intelligence with Gemini AI.",
)
async def get_community_ai_insights(
    db: Session = Depends(get_db),
):
    insights = await community_service.get_community_ai_insights(db)
    return SuccessResponse(
        success=True,
        message="Community AI insights generated successfully",
        data=insights,
    )
