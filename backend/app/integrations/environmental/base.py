"""
AIRWISE AI — Base Environmental Data Provider Interface
Abstract contract ensuring all third-party environmental APIs (Open-Meteo, WAQI, OpenAQ)
expose standardized methods for location search, observation retrieval, and metadata.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from app.integrations.environmental.schemas.environmental_schemas import (
    LocationSearchResult,
    NormalizedObservation,
)


class BaseEnvironmentalProvider(ABC):
    """Abstract interface for external environmental data providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider identifier, e.g. 'open-meteo', 'waqi', 'openaq'."""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if the provider is operational and credentials (if required) are valid."""
        pass

    @abstractmethod
    async def search_locations(self, query: str, limit: int = 5) -> List[LocationSearchResult]:
        """Geocodes a search string into standardized coordinates and administrative details."""
        pass

    @abstractmethod
    async def get_latest_observation(
        self,
        latitude: float,
        longitude: float,
        city: Optional[str] = None,
        location_name: Optional[str] = None,
        country: Optional[str] = None,
    ) -> Optional[NormalizedObservation]:
        """Retrieves and normalizes the latest available multi-pollutant and atmospheric telemetry."""
        pass

    @abstractmethod
    async def get_historical_observations(
        self,
        latitude: float,
        longitude: float,
        hours: int = 24,
        city: Optional[str] = None,
        location_name: Optional[str] = None,
        country: Optional[str] = None,
    ) -> List[NormalizedObservation]:
        """Retrieves historical time-series observations for exposure trend visualization."""
        pass
