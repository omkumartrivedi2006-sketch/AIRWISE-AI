"""
AIRWISE AI — Conversation Endpoints
POST /api/v1/conversations
GET /api/v1/conversations
GET /api/v1/conversations/{conversation_id}
DELETE /api/v1/conversations/{conversation_id}
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.core.database import MongoSession as Session
from app.api.deps import get_optional_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import PaginationMeta, SuccessResponse
from app.schemas.conversation import ConversationCreate, ConversationResponse
from app.services.conversation_service import conversation_service

router = APIRouter()


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create Conversation Session",
    description="Initialize a new conversational interaction dialogue (authenticated or anonymous).",
)
async def create_conversation(
    conversation_in: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    if current_user and conversation_in.user_id is None:
        conversation_in.user_id = current_user.id

    created_conv = conversation_service.create_conversation(db, conversation_in=conversation_in)
    conv_data = ConversationResponse.model_validate(created_conv)
    conv_data.message_count = len(created_conv.messages) if created_conv.messages else 0
    return SuccessResponse(
        success=True,
        message="Conversation session created successfully",
        data=conv_data,
    )


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="List Conversations",
    description="Retrieve conversation session history, scoped by authenticated user.",
)
async def list_conversations(
    user_id: Optional[int] = Query(None, description="Optional user ID filter"),
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=50, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    effective_user_id = current_user.id if current_user else user_id
    skip = (page - 1) * limit
    conversations = conversation_service.get_conversations(db, user_id=effective_user_id, skip=skip, limit=limit)
    total = conversation_service.count_conversations(db, user_id=effective_user_id)
    total_pages = (total + limit - 1) // limit if total > 0 else 0

    data = []
    for c in conversations:
        item = ConversationResponse.model_validate(c)
        item.message_count = len(c.messages) if c.messages else 0
        data.append(item)

    return SuccessResponse(
        success=True,
        message="Conversations retrieved successfully",
        data=data,
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages).model_dump(),
    )


@router.get(
    "/{conversation_id}",
    status_code=status.HTTP_200_OK,
    summary="Get Conversation Details",
    description="Retrieve metadata for a specific conversation session with ownership check.",
)
async def get_conversation(
    conversation_id: int,
    user_id: Optional[int] = Query(None, description="Requesting user ID for verification"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    auth_user_id = current_user.id if current_user else user_id
    conv = conversation_service.get_conversation_by_id(
        db,
        conversation_id=conversation_id,
        authorized_user_id=auth_user_id,
    )
    conv_data = ConversationResponse.model_validate(conv)
    conv_data.message_count = len(conv.messages) if conv.messages else 0
    return SuccessResponse(
        success=True,
        message="Conversation retrieved successfully",
        data=conv_data,
    )


@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Conversation",
    description="Remove a conversation and all its associated messages, verifying user ownership.",
)
async def delete_conversation(
    conversation_id: int,
    user_id: Optional[int] = Query(None, description="Requesting user ID for ownership verification"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    auth_user_id = current_user.id if current_user else user_id
    conversation_service.delete_conversation(
        db,
        conversation_id=conversation_id,
        authorized_user_id=auth_user_id,
    )
    return SuccessResponse(
        success=True,
        message="Conversation deleted successfully",
        data={"deleted_id": conversation_id},
    )
