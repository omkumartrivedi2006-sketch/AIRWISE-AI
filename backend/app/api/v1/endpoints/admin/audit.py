"""
AIRWISE AI — Admin Audit Logs Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.core.database import MongoSession as Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.admin import AdminAuditLogRead
from app.schemas.common import PaginationMeta, SuccessResponse
from app.services.admin.audit_service import audit_service

router = APIRouter()


@router.get(
    "",
    response_model=SuccessResponse[List[AdminAuditLogRead]],
    status_code=status.HTTP_200_OK,
    summary="List Administrative Audit Logs",
    description="Retrieves immutable records of sensitive administrative and data curation actions.",
)
async def list_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action code"),
    target_type: Optional[str] = Query(None, description="Filter by target type (user, observation, notification, system)"),
    admin_id: Optional[int] = Query(None, description="Filter by administrator ID"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    items, total = audit_service.get_audit_logs(
        db, action=action, target_type=target_type, admin_id=admin_id, page=page, limit=limit
    )
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return SuccessResponse(
        success=True,
        message="Audit logs retrieved successfully",
        data=items,
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages).model_dump(),
    )
