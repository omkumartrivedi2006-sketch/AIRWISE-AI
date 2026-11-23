"""
AIRWISE AI — Notification Center & Channel API Endpoints
GET    /api/v1/notifications
GET    /api/v1/notifications/unread-count
PATCH  /api/v1/notifications/{notification_id}/read
POST   /api/v1/notifications/mark-all-read
DELETE /api/v1/notifications/{notification_id}
GET    /api/v1/notifications/preferences
PUT    /api/v1/notifications/preferences
POST   /api/v1/notifications/push/subscribe
DELETE /api/v1/notifications/push/subscribe
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.database import MongoSession as Session
from app.api.deps import require_authenticated_user
from app.core.database import get_db
from app.models.notification import PushSubscription
from app.models.user import User
from app.models.user_preference import UserPreference
from app.notifications.services.notification_service import notification_service
from app.schemas.common import PaginationMeta, SuccessResponse
from app.schemas.personalization import (
    NotificationRead,
    NotificationUnreadCountResponse,
    PushSubscriptionCreate,
    UserPreferencesRead,
    UserPreferencesUpdate,
)
from app.services.preference_service import preference_service

router = APIRouter()


@router.get(
    "",
    response_model=SuccessResponse[List[NotificationRead]],
    status_code=status.HTTP_200_OK,
    summary="List Notifications",
    description="Retrieve paginated notifications for the authenticated user with optional read and type filters.",
)
async def list_notifications(
    is_read: Optional[bool] = Query(None, description="Filter by read/unread state"),
    notification_type: Optional[str] = Query(None, description="Filter by notification category"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    items, total = notification_service.get_notifications(
        db, current_user.id, is_read=is_read, notification_type=notification_type, page=page, limit=limit
    )
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return SuccessResponse(
        success=True,
        message="Notifications retrieved successfully",
        data=items,
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages).model_dump(),
    )


@router.get(
    "/unread-count",
    response_model=SuccessResponse[NotificationUnreadCountResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Unread Notification Count",
    description="Returns the total number of unread notifications for display in application navigation badges.",
)
async def get_unread_count(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    count = notification_service.get_unread_count(db, current_user.id)
    return SuccessResponse(
        success=True,
        message="Unread notification count retrieved",
        data=NotificationUnreadCountResponse(unread_count=count),
    )


@router.patch(
    "/{notification_id}/read",
    response_model=SuccessResponse[NotificationRead],
    status_code=status.HTTP_200_OK,
    summary="Mark Notification as Read",
    description="Mark a specific notification as read, recording the read timestamp.",
)
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    notif = notification_service.mark_as_read(db, current_user.id, notification_id)
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification #{notification_id} not found or unauthorized",
        )
    return SuccessResponse(
        success=True,
        message="Notification marked as read",
        data=NotificationRead.model_validate(notif),
    )


@router.post(
    "/mark-all-read",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Mark All Notifications as Read",
    description="Sets is_read to true on all unread notifications for the authenticated user.",
)
async def mark_all_notifications_read(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    updated_count = notification_service.mark_all_as_read(db, current_user.id)
    return SuccessResponse(
        success=True,
        message=f"Marked {updated_count} notification(s) as read",
        data={"updated_count": updated_count},
    )


@router.delete(
    "/{notification_id}",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Delete Notification",
    description="Permanently delete a notification.",
)
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    deleted = notification_service.delete_notification(db, current_user.id, notification_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification #{notification_id} not found or unauthorized",
        )
    return SuccessResponse(
        success=True,
        message="Notification deleted successfully",
        data={"deleted_id": notification_id},
    )


@router.get(
    "/preferences",
    response_model=SuccessResponse[UserPreferencesRead],
    status_code=status.HTTP_200_OK,
    summary="Get Notification Channel Preferences",
    description="Retrieve notification channel opt-ins (in-app, email, push) and quiet hours.",
)
async def get_notification_preferences(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    prefs = preference_service.get_or_create_preferences(db, current_user.id)
    return SuccessResponse(
        success=True,
        message="Notification preferences retrieved",
        data=UserPreferencesRead.model_validate(prefs),
    )


@router.put(
    "/preferences",
    response_model=SuccessResponse[UserPreferencesRead],
    status_code=status.HTTP_200_OK,
    summary="Update Notification Channel Preferences",
    description="Configure notification channels and quiet hour windows.",
)
async def update_notification_preferences(
    payload: UserPreferencesUpdate,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    updated = preference_service.update_preferences(db, current_user.id, payload)
    return SuccessResponse(
        success=True,
        message="Notification preferences updated",
        data=UserPreferencesRead.model_validate(updated),
    )


@router.post(
    "/push/subscribe",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_201_CREATED,
    summary="Register Web Push Subscription",
    description="Registers an authorized browser Web Push endpoint and public cryptographic keys.",
)
async def register_push_subscription(
    payload: PushSubscriptionCreate,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    # Upsert subscription
    sub = (
        db.query(PushSubscription)
        .filter(PushSubscription.user_id == current_user.id, PushSubscription.endpoint == payload.endpoint)
        .first()
    )
    if not sub:
        sub = PushSubscription(
            user_id=current_user.id,
            endpoint=payload.endpoint,
            p256dh_key=payload.p256dh_key,
            auth_key=payload.auth_key,
            user_agent=payload.user_agent,
        )
        db.add(sub)
    else:
        sub.p256dh_key = payload.p256dh_key
        sub.auth_key = payload.auth_key
        sub.user_agent = payload.user_agent

    # Enable push in preferences
    pref = preference_service.get_or_create_preferences(db, current_user.id)
    pref.push_notifications = True

    db.commit()
    return SuccessResponse(
        success=True,
        message="Web Push subscription registered successfully",
        data={"status": "subscribed"},
    )


@router.delete(
    "/push/subscribe",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Revoke Web Push Subscription",
    description="Deletes push subscriptions and disables browser push notifications.",
)
async def revoke_push_subscription(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    db.query(PushSubscription).filter(PushSubscription.user_id == current_user.id).delete()
    pref = preference_service.get_or_create_preferences(db, current_user.id)
    pref.push_notifications = False
    db.commit()
    return SuccessResponse(
        success=True,
        message="Web Push subscription revoked successfully",
        data={"status": "unsubscribed"},
    )
