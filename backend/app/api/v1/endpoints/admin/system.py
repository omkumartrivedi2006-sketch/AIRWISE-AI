"""
AIRWISE AI — Admin System Health & Diagnostic Endpoints
"""

from fastapi import APIRouter, Depends, status
from app.core.database import MongoSession as Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.admin import AdminDatabaseHealth, AdminServiceHealth, AdminSystemHealthResponse
from app.schemas.common import SuccessResponse
from app.services.admin.admin_service import admin_service

router = APIRouter()


@router.get(
    "/health",
    response_model=SuccessResponse[AdminSystemHealthResponse],
    status_code=status.HTTP_200_OK,
    summary="Platform System Health",
    description="Comprehensive runtime health inspection covering FastAPI, uptime, and database telemetry.",
)
async def get_system_health(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    health = admin_service.get_system_health(db)
    return SuccessResponse(
        success=True,
        message="System health retrieved successfully",
        data=health,
    )


@router.get(
    "/database",
    response_model=SuccessResponse[AdminDatabaseHealth],
    status_code=status.HTTP_200_OK,
    summary="Database Diagnostic Health",
    description="Inspects PostgreSQL connection latency, pool status, and table row counts safely.",
)
async def get_database_health(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    db_health = admin_service.get_database_health(db)
    return SuccessResponse(
        success=True,
        message="Database health retrieved successfully",
        data=db_health,
    )


@router.get(
    "/services",
    response_model=SuccessResponse[AdminServiceHealth],
    status_code=status.HTTP_200_OK,
    summary="Services Status",
    description="Operational status across AI providers, data ingestion, and notification channels.",
)
async def get_services_status(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    sys_health = admin_service.get_system_health(db)
    return SuccessResponse(
        success=True,
        message="Services status retrieved successfully",
        data=sys_health["services"],
    )
