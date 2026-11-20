"""
AIRWISE AI — Conversation Endpoints
POST /api/v1/conversations
GET /api/v1/conversations
GET /api/v1/conversations/{conversation_id}
DELETE /api/v1/conversations/{conversation_id}
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.common import PaginationMeta, SuccessResponse
from app.schemas.conversation import ConversationCreate, ConversationResponse
from app.services.conversation_service import conversation_service

router = APIRouter()


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create Conversation Session",
    description="Initialize a new conversational interaction dialogue (supports anonymous or user sessions).",
)
async def create_conversation(
    conversation_in: ConversationCreate,
    db: Session = Depends(get_db),
):
    created_conv = conversation_service.create_conversation(db, conversation_in=conversation_in)
    return SuccessResponse(
        success=True,
        message="Conversation session created successfully",
        data=ConversationResponse.model_validate(created_conv),
    )


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="List Conversations",
    description="Retrieve conversation session history, optionally scoped by user ID.",
)
async def list_conversations(
    user_id: Optional[int] = Query(None, description="Optional user ID filter for authenticated sessions"),
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * limit
    conversations = conversation_service.get_conversations(db, user_id=user_id, skip=skip, limit=limit)
    total = conversation_service.count_conversations(db, user_id=user_id)
    total_pages = (total + limit - 1) // limit if total > 0 else 0

    return SuccessResponse(
        success=True,
        message="Conversations retrieved successfully",
        data=[ConversationResponse.model_validate(c) for c in conversations],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages).model_dump(),
    )


@router.get(
    "/{conversation_id}",
    status_code=status.HTTP_200_OK,
    summary="Get Conversation Details",
    description="Retrieve metadata for a specific conversation session.",
)
async def get_conversation(
    conversation_id: int,
    user_id: Optional[int] = Query(None, description="Requesting user ID for privacy verification"),
    db: Session = Depends(get_db),
):
    conv = conversation_service.get_conversation_by_id(
        db,
        conversation_id=conversation_id,
        authorized_user_id=user_id,
    )
    return SuccessResponse(
        success=True,
        message="Conversation retrieved successfully",
        data=ConversationResponse.model_validate(conv),
    )


@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Conversation",
    description="Remove a conversation and all its associated messages.",
)
async def delete_conversation(
    conversation_id: int,
    user_id: Optional[int] = Query(None, description="Requesting user ID for ownership verification"),
    db: Session = Depends(get_db),
):
    conversation_service.delete_conversation(
        db,
        conversation_id=conversation_id,
        authorized_user_id=user_id,
    )
    return SuccessResponse(
        success=True,
        message="Conversation deleted successfully",
        data={"deleted_id": conversation_id},
    )
