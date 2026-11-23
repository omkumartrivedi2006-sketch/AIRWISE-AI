"""
AIRWISE AI — Environmental Cache Service
In-memory thread-safe TTL cache reducing external upstream provider pressure and latencies.
"""

import time
from typing import Any, Dict, Optional, Tuple
from app.core.config import settings
from app.integrations.environmental.schemas.environmental_schemas import NormalizedObservation


class EnvironmentalCacheService:
    """Provides fast in-memory caching for observations and location results with TTL."""

    def __init__(self, default_ttl: int = 900):
        self.default_ttl = default_ttl
        # key -> (NormalizedObservation, expire_timestamp)
        self._cache: Dict[str, Tuple[NormalizedObservation, float]] = {}

    @staticmethod
    def coord_key(latitude: float, longitude: float) -> str:
        """Rounds coordinates to 2 decimal places (~1.1 km precision) to group proximal queries."""
        return f"geo:{round(latitude, 2)}:{round(longitude, 2)}"

    @staticmethod
    def city_key(city: str) -> str:
        return f"city:{city.strip().lower()}"

    def get(self, key: str) -> Optional[NormalizedObservation]:
        """Returns cached observation if not expired; otherwise None."""
        if key not in self._cache:
            return None

        obs, expires_at = self._cache[key]
        if time.time() > expires_at:
            del self._cache[key]
            return None

        # Return a copy marked with 'cached' freshness
        cached_copy = obs.model_copy()
        cached_copy.freshness = "cached"
        return cached_copy

    def set(self, key: str, obs: NormalizedObservation, ttl_seconds: Optional[int] = None) -> None:
        """Stores observation with TTL."""
        ttl = ttl_seconds if ttl_seconds is not None else getattr(settings, "AIR_QUALITY_CACHE_TTL_SECONDS", self.default_ttl)
        expires_at = time.time() + ttl
        self._cache[key] = (obs, expires_at)

    def clear(self) -> None:
        self._cache.clear()


environmental_cache = EnvironmentalCacheService()
