"""
AIRWISE AI — Message Endpoints
POST /api/v1/conversations/{conversation_id}/messages
GET /api/v1/conversations/{conversation_id}/messages
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from app.core.database import MongoSession as Session
from app.api.deps import get_optional_current_user
from app.core.database import get_db
from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.conversation import Conversation
from app.models.user import User
from app.schemas.common import PaginationMeta, SuccessResponse
from app.schemas.message import ChatMessageRequest, ChatMessageResponse, MessageCreate, MessageResponse
from app.services.ai.ai_service import ai_service
from app.services.message_service import message_service

router = APIRouter()


@router.post(
    "/{conversation_id}/messages",
    status_code=status.HTTP_201_CREATED,
    summary="Post Message or Chat with AI Assistant",
    description="Send a message to an active conversation. If content is posted, triggers Gemini AI inference.",
)
async def post_message(
    conversation_id: int,
    request: Request,
    message_in: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    # Verify conversation exists
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise NotFoundException(f"Conversation with ID {conversation_id} not found.")

    # Privacy verification
    if conv.user_id is not None and current_user is not None and conv.user_id != current_user.id:
        raise ForbiddenException("You do not have permission to post messages to this private conversation.")

    # Parse raw body to determine if this is a raw manual message insertion or an AI dialogue request
    body: Dict[str, Any] = {}
    try:
        body = await request.json()
    except Exception:
        body = {}

    has_explicit_role = "role" in body
    is_raw_mode = has_explicit_role and body.get("role") in ("assistant", "system")
    # If explicit user role without AI generation requested
    is_direct_user_save = has_explicit_role and body.get("role") == "user" and not body.get("generate_ai", False) and not (current_user and not is_raw_mode and "generate_ai" not in body and False)

    # 1. Raw message save path (backward compatible with administrative or migration logging)
    if is_raw_mode or (has_explicit_role and not body.get("generate_ai", False)):
        saved_msg = message_service.save_message(
            db,
            conversation_id=conversation_id,
            message_in=MessageCreate(role=body.get("role", "user"), content=message_in.content),
        )
        return SuccessResponse(
            success=True,
            message="Message saved to conversation dialogue",
            data=MessageResponse.model_validate(saved_msg),
        )

    # 2. AI Assistant conversation flow (Module 05)
    effective_user = current_user
    if not effective_user:
        # Fallback to owner or system user for anonymous demo sessions
        if conv.user_id:
            effective_user = db.query(User).filter(User.id == conv.user_id).first()
        if not effective_user:
            effective_user = db.query(User).first()
        if not effective_user:
            # Create a transient demo user if none exists
            effective_user = User(
                email="guest@airwise.ai",
                full_name="Guest Explorer",
                role="USER",
                is_active=True,
            )
            db.add(effective_user)
            db.commit()
            db.refresh(effective_user)

    result = await ai_service.process_chat_message(
        db=db,
        conversation_id=conversation_id,
        user=effective_user,
        content=message_in.content,
        location_id=message_in.location_id,
    )

    response_data = ChatMessageResponse(
        id=result["assistant_message"].id,
        role="assistant",
        user_message=MessageResponse.model_validate(result["user_message"]),
        assistant_message=MessageResponse.model_validate(result["assistant_message"]),
        conversation_id=conversation_id,
        status="completed",
    )

    return SuccessResponse(
        success=True,
        message="AI response generated successfully",
        data=response_data,
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
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    # Verify conversation exists and ownership
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise NotFoundException(f"Conversation with ID {conversation_id} not found.")

    if conv.user_id is not None and current_user is not None and conv.user_id != current_user.id:
        raise ForbiddenException("You do not have permission to view messages in this private conversation.")

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
