"""
AIRWISE AI — Administrative Audit Logging Service
Provides persistent, immutable audit tracking for sensitive platform events and operations.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from app.models.base import desc
from app.core.database import MongoSession as Session
from app.models.audit_log import AuditLog
from app.models.user import User

logger = logging.getLogger("airwise")


class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        admin_id: Optional[int],
        action: str,
        target_type: str,
        target_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """
        Record a privileged administrative operation to the persistent audit log.
        Safely strips any accidental token or password exposures.
        """
        safe_details = {}
        if details:
            for k, v in details.items():
                if any(secret_term in k.lower() for secret_term in ("token", "password", "secret", "key", "auth")):
                    safe_details[k] = "[REDACTED]"
                else:
                    safe_details[k] = v

        entry = AuditLog(
            admin_id=admin_id,
            action=action.upper().strip(),
            target_type=target_type.lower().strip(),
            target_id=str(target_id) if target_id is not None else None,
            details=safe_details if safe_details else None,
            ip_address=ip_address,
            created_at=datetime.now(timezone.utc),
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        logger.info(
            "AUDIT LOG: Admin %s performed '%s' on %s (ID: %s)",
            admin_id,
            action,
            target_type,
            target_id,
        )
        return entry

    @staticmethod
    def get_audit_logs(
        db: Session,
        action: Optional[str] = None,
        target_type: Optional[str] = None,
        admin_id: Optional[int] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Retrieve paginated audit logs with optional filters."""
        query = db.query(AuditLog)

        if action:
            query = query.filter(AuditLog.action == action.upper().strip())
        if target_type:
            query = query.filter(AuditLog.target_type == target_type.lower().strip())
        if admin_id:
            query = query.filter(AuditLog.admin_id == admin_id)

        total = query.count()
        logs = (
            query.order_by(desc(AuditLog.created_at))
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        admin_ids = {entry.admin_id for entry in logs if getattr(entry, "admin_id", None) is not None}
        admin_map = {}
        if admin_ids:
            admins = db.query(User).filter(User.id.in_(list(admin_ids))).all()
            admin_map = {admin.id: admin.email for admin in admins}

        results = []
        for log_entry in logs:
            admin_email = admin_map.get(log_entry.admin_id)
            results.append({
                "id": log_entry.id,
                "admin_id": log_entry.admin_id,
                "admin_email": admin_email or "System / Deleted Admin",
                "action": log_entry.action,
                "target_type": log_entry.target_type,
                "target_id": log_entry.target_id,
                "details": log_entry.details,
                "ip_address": log_entry.ip_address,
                "created_at": log_entry.created_at,
            })

        return results, total


audit_service = AuditService()
