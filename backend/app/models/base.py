"""
AIRWISE AI — Base SQLAlchemy Model
"""

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer
from app.db.session import Base


class TimeStampedModel(Base):
    """Abstract base model adding created_at and updated_at timestamps."""
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
