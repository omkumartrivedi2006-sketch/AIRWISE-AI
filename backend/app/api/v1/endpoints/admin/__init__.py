"""
AIRWISE AI — Admin API Router Aggregator
Groups all administrative domain endpoints under the /api/v1/admin prefix.
"""

from fastapi import APIRouter
from app.api.v1.endpoints.admin import (
    ai_usage,
    audit,
    dashboard,
    data_sources,
    environmental,
    notifications,
    system,
    users,
)

admin_router = APIRouter()

admin_router.include_router(dashboard.router, prefix="/dashboard", tags=["Admin - Dashboard"])
admin_router.include_router(users.router, prefix="/users", tags=["Admin - Users"])
admin_router.include_router(environmental.router, prefix="/environmental-data", tags=["Admin - Environmental Data"])
admin_router.include_router(data_sources.router, prefix="/data-sources", tags=["Admin - Data Sources"])
admin_router.include_router(ai_usage.router, prefix="/ai-usage", tags=["Admin - AI Usage"])
admin_router.include_router(notifications.router, prefix="/notifications", tags=["Admin - Notifications"])
admin_router.include_router(system.router, prefix="/system", tags=["Admin - System Health"])
admin_router.include_router(audit.router, prefix="/audit-logs", tags=["Admin - Audit Logs"])
