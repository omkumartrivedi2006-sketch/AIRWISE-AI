"""
AIRWISE AI — Recommendation Cache Model (MongoDB Document)
Caches personalized Gemini and rule-based environmental recommendations to minimize API spend.
"""

from datetime import datetime, timezone
from app.models.base import Base, Column, DateTime, Integer, JSON, String


class RecommendationCache(Base):
    __tablename__ = "recommendation_caches"
    __collection__ = "recommendation_caches"

    id = Column(name="id", type_hint=int, autoincrement=True)
    user_id = Column(name="user_id", type_hint=int, index=True)
    location_id = Column(name="location_id", type_hint=int, index=True, default=None)
    cache_key = Column(name="cache_key", type_hint=str, index=True)
    recommendations = Column(name="recommendations", type_hint=list)
    created_at = Column(name="created_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(name="expires_at", type_hint=datetime, index=True)
