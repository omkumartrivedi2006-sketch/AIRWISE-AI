"""
AIRWISE AI — Notification Repository & Service
Handles database queries, pagination, read state, and deletions for user notifications.
"""

from datetime import datetime, timezone
from typing import List, Optional, Tuple
from app.models.base import desc, func
from app.core.database import MongoSession as Session
from app.models.location import Location
from app.models.notification import Notification
from app.schemas.personalization import NotificationRead


class NotificationService:
    @staticmethod
    def get_notifications(
        db: Session,
        user_id: int,
        is_read: Optional[bool] = None,
        notification_type: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[NotificationRead], int]:
        """Retrieves paginated notifications for the authenticated user."""
        query = db.query(Notification).filter(Notification.user_id == user_id)

        if is_read is not None:
            query = query.filter(Notification.is_read == is_read)

        if notification_type:
            query = query.filter(Notification.notification_type == notification_type)

        total = query.count()
        offset = (page - 1) * limit
        notifs = query.order_by(desc(Notification.created_at)).offset(offset).limit(limit).all()

        location_ids = {n.location_id for n in notifs if getattr(n, "location_id", None) is not None}
        city_map = {}
        if location_ids:
            locs = db.query(Location).filter(Location.id.in_(list(location_ids))).all()
            city_map = {loc.id: loc.city for loc in locs}

        results: List[NotificationRead] = []
        for notif in notifs:
            city = city_map.get(notif.location_id)
            item = NotificationRead(
                id=notif.id,
                user_id=notif.user_id,
                alert_rule_id=notif.alert_rule_id,
                title=notif.title,
                message=notif.message,
                severity=notif.severity,
                notification_type=notif.notification_type,
                location_id=notif.location_id,
                metric=notif.metric,
                value=notif.value,
                unit=notif.unit,
                aqi_scale=notif.aqi_scale,
                observation_time=notif.observation_time,
                source=notif.source,
                is_read=notif.is_read,
                read_at=notif.read_at,
                channels=notif.channels or ["in_app"],
                delivery_status=notif.delivery_status,
                created_at=notif.created_at,
                city=city,
            )
            results.append(item)

        return results, total

    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        """Counts unread notifications for a user."""
        return (
            db.query(func.count(Notification.id))
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .scalar()
            or 0
        )

    @staticmethod
    def mark_as_read(db: Session, user_id: int, notification_id: int) -> Optional[Notification]:
        """Marks a specific notification as read, validating ownership."""
        notif = (
            db.query(Notification)
            .filter(Notification.id == notification_id, Notification.user_id == user_id)
            .first()
        )
        if not notif:
            return None

        notif.is_read = True
        notif.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        """Marks all unread notifications for a user as read."""
        now = datetime.now(timezone.utc)
        updated_count = (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .update({"is_read": True, "read_at": now}, synchronize_session=False)
        )
        db.commit()
        return updated_count

    @staticmethod
    def delete_notification(db: Session, user_id: int, notification_id: int) -> bool:
        """Deletes a notification, validating ownership."""
        notif = (
            db.query(Notification)
            .filter(Notification.id == notification_id, Notification.user_id == user_id)
            .first()
        )
        if not notif:
            return False

        db.delete(notif)
        db.commit()
        return True


notification_service = NotificationService()
