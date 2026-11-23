"""
AIRWISE AI — Admin User Management Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from app.core.database import MongoSession as Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.admin import AdminUserRead, AdminUserUpdateRole, AdminUserUpdateStatus
from app.schemas.common import PaginationMeta, SuccessResponse
from app.services.admin.admin_service import admin_service

router = APIRouter()


@router.get(
    "",
    response_model=SuccessResponse[List[AdminUserRead]],
    status_code=status.HTTP_200_OK,
    summary="List Users",
    description="Paginated list of platform users with search and role/status filtering.",
)
async def list_users(
    query: Optional[str] = Query(None, description="Search by name or email"),
    role: Optional[str] = Query(None, description="Filter by role (USER/ADMIN)"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    items, total = admin_service.get_users(
        db, query=query, role=role, is_active=is_active, page=page, limit=limit
    )
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return SuccessResponse(
        success=True,
        message="Users retrieved successfully",
        data=items,
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages).model_dump(),
    )


@router.get(
    "/{user_id}",
    response_model=SuccessResponse[AdminUserRead],
    status_code=status.HTTP_200_OK,
    summary="Get User Details",
    description="Retrieves single user details with associated usage metrics.",
)
async def get_user(
    user_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user_data = admin_service.get_user_details(db, user_id)
    return SuccessResponse(
        success=True,
        message="User details retrieved successfully",
        data=user_data,
    )


@router.patch(
    "/{user_id}/status",
    response_model=SuccessResponse[AdminUserRead],
    status_code=status.HTTP_200_OK,
    summary="Update User Status",
    description="Activates or deactivates a user account. Protected against self-deactivation and last admin deactivation.",
)
async def update_user_status(
    user_id: int,
    payload: AdminUserUpdateStatus,
    request: Request,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ip_addr = request.client.host if request.client else None
    updated = admin_service.update_user_status(
        db,
        current_admin=current_admin,
        user_id=user_id,
        is_active=payload.is_active,
        reason=payload.reason,
        ip_address=ip_addr,
    )
    return SuccessResponse(
        success=True,
        message=f"User {'activated' if payload.is_active else 'deactivated'} successfully",
        data=updated,
    )


@router.patch(
    "/{user_id}/role",
    response_model=SuccessResponse[AdminUserRead],
    status_code=status.HTTP_200_OK,
    summary="Update User Role",
    description="Changes a user's role (USER <-> ADMIN). Protected against self-demotion and last admin demotion.",
)
async def update_user_role(
    user_id: int,
    payload: AdminUserUpdateRole,
    request: Request,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ip_addr = request.client.host if request.client else None
    updated = admin_service.update_user_role(
        db,
        current_admin=current_admin,
        user_id=user_id,
        new_role=payload.role,
        reason=payload.reason,
        ip_address=ip_addr,
    )
    return SuccessResponse(
        success=True,
        message=f"User role updated to '{payload.role}' successfully",
        data=updated,
    )
