"""
AIRWISE AI — Feedback Endpoints
POST /api/v1/feedback
"""

from fastapi import APIRouter, Depends, Query, status
from app.core.database import MongoSession as Session
from app.core.database import get_db
from app.repositories.feedback_repository import feedback_repository
from app.schemas.common import PaginationMeta, SuccessResponse
from app.schemas.feedback import FeedbackCreate, FeedbackResponse

router = APIRouter()


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Submit Application Feedback",
    description="Submit user rating (1-5) and qualitative feedback for environmental guidance accuracy.",
)
async def submit_feedback(
    feedback_in: FeedbackCreate,
    db: Session = Depends(get_db),
):
    created = feedback_repository.create(db, feedback_in=feedback_in)
    return SuccessResponse(
        success=True,
        message="Feedback submitted successfully. Thank you for helping improve AIRWISE AI.",
        data=FeedbackResponse.model_validate(created),
    )


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="List Feedback",
    description="Retrieve feedback entries (administrative audit endpoint).",
)
async def list_feedback(
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * limit
    items = feedback_repository.get_all(db, skip=skip, limit=limit)
    total = feedback_repository.count(db)
    total_pages = (total + limit - 1) // limit if total > 0 else 0

    return SuccessResponse(
        success=True,
        message="Feedback entries retrieved successfully",
        data=[FeedbackResponse.model_validate(f) for f in items],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages).model_dump(),
    )
