"""
AIRWISE AI — Message Endpoints
POST /api/v1/conversations/{conversation_id}/messages
GET /api/v1/conversations/{conversation_id}/messages
"""

from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.common import PaginationMeta, SuccessResponse
from app.schemas.message import MessageCreate, MessageResponse
from app.services.message_service import message_service

router = APIRouter()


@router.post(
    "/{conversation_id}/messages",
    status_code=status.HTTP_201_CREATED,
    summary="Post Message to Conversation",
    description="Save a user message to an active conversation and prepare it for AI processing.",
)
async def post_message(
    conversation_id: int,
    message_in: MessageCreate,
    db: Session = Depends(get_db),
):
    saved_msg = message_service.save_message(
        db,
        conversation_id=conversation_id,
        message_in=message_in,
    )
    return SuccessResponse(
        success=True,
        message="Message saved to conversation dialogue",
        data=MessageResponse.model_validate(saved_msg),
    )


@router.get(
    "/{conversation_id}/messages",
    status_code=status.HTTP_200_OK,
    summary="Get Conversation Messages",
    description="Retrieve all messages belonging to a conversation session in chronological order.",
)
async def list_messages(
    conversation_id: int,
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=50, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * limit
    messages = message_service.get_messages(
        db,
        conversation_id=conversation_id,
        skip=skip,
        limit=limit,
    )
    total = message_service.count_messages(db, conversation_id=conversation_id)
    total_pages = (total + limit - 1) // limit if total > 0 else 0

    return SuccessResponse(
        success=True,
        message="Messages retrieved successfully",
        data=[MessageResponse.model_validate(m) for m in messages],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages).model_dump(),
    )
