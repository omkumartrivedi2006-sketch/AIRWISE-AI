"""
AIRWISE AI — Base Model & Shared Mixins
"""

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer
from app.core.database import Base


class TimeStampedModel(Base):
    """Abstract base model with autoincrement ID and UTC timestamps."""
    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
