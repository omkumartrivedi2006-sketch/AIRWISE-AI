"""
AIRWISE AI — Admin Environmental Data Source Monitoring Endpoints
"""

from typing import List
from fastapi import APIRouter, Depends, status
from app.core.database import MongoSession as Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.admin import AdminDataSourceHealth, AdminDataSourceStatus
from app.schemas.common import SuccessResponse
from app.services.admin.admin_service import admin_service

router = APIRouter()


@router.get(
    "",
    response_model=SuccessResponse[List[AdminDataSourceStatus]],
    status_code=status.HTTP_200_OK,
    summary="List Data Sources Status",
    description="Inspects operational health, coverage, and sync status for environmental providers.",
)
async def list_data_sources(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    sources = admin_service.get_data_sources_status(db)
    return SuccessResponse(
        success=True,
        message="Data sources status retrieved successfully",
        data=sources,
    )


@router.get(
    "/{source_id}/health",
    response_model=SuccessResponse[AdminDataSourceHealth],
    status_code=status.HTTP_200_OK,
    summary="Ping Data Source",
    description="Executes a live ping / connectivity check against a specific provider.",
)
async def ping_data_source(
    source_id: str,
    current_admin: User = Depends(require_admin),
):
    health = admin_service.ping_data_source(source_id)
    return SuccessResponse(
        success=True,
        message=f"Data source '{source_id}' ping completed",
        data=health,
    )
