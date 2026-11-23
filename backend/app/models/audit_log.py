"""
AIRWISE AI — Audit Log Model (MongoDB Document)
Records security and administrative operations for compliance, governance, and traceability.
"""

from datetime import datetime, timezone
from app.models.base import Base, Column, DateTime, Integer, JSON, String


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __collection__ = "audit_logs"

    id = Column(name="id", type_hint=int, autoincrement=True)
    admin_id = Column(name="admin_id", type_hint=int, index=True, default=None)
    action = Column(name="action", type_hint=str, index=True)
    target_type = Column(name="target_type", type_hint=str, index=True)
    target_id = Column(name="target_id", type_hint=str, index=True, default=None)
    details = Column(name="details", type_hint=dict, default=None)
    ip_address = Column(name="ip_address", type_hint=str, default=None)
    created_at = Column(name="created_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc), index=True)
