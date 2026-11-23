"""
AIRWISE AI — Admin Services Package
"""

from app.services.admin.audit_service import audit_service
from app.services.admin.admin_service import admin_service

__all__ = ["audit_service", "admin_service"]
