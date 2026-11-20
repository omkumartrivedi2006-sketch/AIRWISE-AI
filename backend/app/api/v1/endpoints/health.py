"""
AIRWISE AI — Health Diagnostics Endpoints
GET /api/v1/health
GET /api/v1/health/database
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import check_database_connection, get_db
from app.schemas.common import SuccessResponse
from app.services.ai.gemini_service import gemini_service

router = APIRouter()


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Comprehensive Service Health Check",
    description="Returns backend operational status, version, and component liveliness without exposing internal secrets.",
)
async def get_health_status():
    db_info = check_database_connection()
    ai_status = gemini_service.get_status()

    overall_status = "healthy"
    if db_info["status"] == "unavailable":
        overall_status = "degraded"

    return SuccessResponse(
        success=True,
        message="Service health check evaluated",
        data={
            "status": overall_status,
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "components": {
                "database": db_info,
                "ai_engine": {
                    "status": ai_status["status"],
                    "provider": ai_status["provider"],
                    "model": ai_status["model"],
                    "is_configured": ai_status["is_configured"],
                },
            },
        },
    )


@router.get(
    "/health/database",
    status_code=status.HTTP_200_OK,
    summary="Database Subsystem Health Check",
    description="Verifies database engine connectivity without exposing credentials or internal connection strings.",
)
async def get_database_health():
    db_info = check_database_connection()
    is_healthy = db_info["status"] in ["connected", "development_fallback"]
    return SuccessResponse(
        success=is_healthy,
        message="Database connectivity check completed",
        data=db_info,
    )
