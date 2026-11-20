"""
AIRWISE AI — Health Check Endpoint
GET /api/v1/health
Provides non-sensitive diagnostic telemetry for backend, database, and AI subsystems.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, status
from app.core.config import settings
from app.db.session import check_db_health
from app.schemas.health import AIHealth, DatabaseHealth, HealthComponents, HealthResponse
from app.services.ai.gemini_service import gemini_service

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Comprehensive Service Health Check",
    description="Returns backend operational status, version, and component liveliness without exposing credentials.",
)
async def get_health_status() -> HealthResponse:
    # 1. Inspect Database Subsystem
    db_info = check_db_health()
    db_health = DatabaseHealth(
        status=db_info["status"],
        dialect=db_info["dialect"],
        latency_ms=db_info.get("latency_ms"),
        details=db_info.get("details"),
    )

    # 2. Inspect AI Subsystem
    ai_status = gemini_service.get_status()
    ai_health = AIHealth(
        status=ai_status["status"],
        provider=ai_status["provider"],
        model=ai_status["model"],
        details=ai_status.get("details"),
    )

    # 3. Compute Composite Overall Health
    overall_status = "healthy"
    if db_health.status == "unavailable":
        overall_status = "degraded"

    return HealthResponse(
        status=overall_status,
        service=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc),
        components=HealthComponents(
            database=db_health,
            ai_engine=ai_health,
        ),
    )
