"""
AIRWISE AI — Admin Notification Monitoring & Retry Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from app.core.database import MongoSession as Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.admin import (
    AdminNotificationMetrics,
    AdminNotificationRead,
    AdminNotificationRetryResponse,
)
from app.schemas.common import PaginationMeta, SuccessResponse
from app.services.admin.admin_service import admin_service

router = APIRouter()


@router.get(
    "",
    response_model=SuccessResponse[List[AdminNotificationRead]],
    status_code=status.HTTP_200_OK,
    summary="List Platform Notifications",
    description="Inspects platform notification logs with delivery status and channel breakdown.",
)
async def list_notifications(
    delivery_status: Optional[str] = Query(None, description="Filter by delivery status (delivered, pending, failed)"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    items, total = admin_service.get_notifications(
        db, delivery_status=delivery_status, severity=severity, page=page, limit=limit
    )
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return SuccessResponse(
        success=True,
        message="Notifications retrieved successfully",
        data=items,
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages).model_dump(),
    )


@router.get(
    "/metrics",
    response_model=SuccessResponse[AdminNotificationMetrics],
    status_code=status.HTTP_200_OK,
    summary="Notification Delivery Metrics",
    description="Aggregated counts of delivered, failed, and channel-specific notifications.",
)
async def get_notification_metrics(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    metrics = admin_service.get_notification_metrics(db)
    return SuccessResponse(
        success=True,
        message="Notification metrics retrieved successfully",
        data=metrics,
    )


@router.post(
    "/{notification_id}/retry",
    response_model=SuccessResponse[AdminNotificationRetryResponse],
    status_code=status.HTTP_200_OK,
    summary="Retry Notification Delivery",
    description="Retries delivery for an eligible failed notification with duplicate prevention.",
)
async def retry_notification(
    notification_id: int,
    request: Request,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ip_addr = request.client.host if request.client else None
    result = admin_service.retry_notification(
        db, current_admin=current_admin, notification_id=notification_id, ip_address=ip_addr
    )
    return SuccessResponse(
        success=True,
        message=result["message"],
        data=result,
    )
