"""
AIRWISE AI — Environmental Data Integrations
Package exposing provider interfaces, registry, and collection service.
"""

from app.integrations.environmental.base import BaseEnvironmentalProvider
from app.integrations.environmental.registry import provider_registry
from app.integrations.environmental.schemas.environmental_schemas import (
    LocationSearchResult,
    NormalizedObservation,
    ProviderStatus,
)
from app.integrations.environmental.services.data_collection_service import (
    EnvironmentalDataCollectionService,
    data_collection_service,
)

__all__ = [
    "BaseEnvironmentalProvider",
    "provider_registry",
    "data_collection_service",
    "EnvironmentalDataCollectionService",
    "NormalizedObservation",
    "LocationSearchResult",
    "ProviderStatus",
]
