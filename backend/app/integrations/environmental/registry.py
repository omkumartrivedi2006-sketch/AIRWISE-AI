"""
AIRWISE AI — Environmental Provider Registry
Central registry managing external data providers, fallback priority chains, and operational status.
"""

from typing import Dict, List, Optional
from app.core.config import settings
from app.core.logging import logger
from app.integrations.environmental.base import BaseEnvironmentalProvider
from app.integrations.environmental.providers.open_meteo_provider import OpenMeteoProvider
from app.integrations.environmental.providers.waqi_provider import WaqiProvider
from app.integrations.environmental.schemas.environmental_schemas import ProviderStatus


class EnvironmentalProviderRegistry:
    """Registry maintaining active environmental data providers and fallback sequences."""

    def __init__(self):
        self._providers: Dict[str, BaseEnvironmentalProvider] = {}
        self._register_default_providers()

    def _register_default_providers(self) -> None:
        """Instantiates and registers supported environmental providers."""
        open_meteo = OpenMeteoProvider()
        waqi = WaqiProvider()

        self.register(open_meteo)
        self.register(waqi)

    def register(self, provider: BaseEnvironmentalProvider) -> None:
        """Registers a provider instance."""
        self._providers[provider.name] = provider
        logger.info("Registered environmental data provider: %s", provider.name)

    def get_provider(self, name: str) -> Optional[BaseEnvironmentalProvider]:
        """Retrieves a provider by its identifier."""
        return self._providers.get(name)

    def get_primary_provider(self) -> BaseEnvironmentalProvider:
        """
        Retrieves the primary configured provider.
        Defaults to Open-Meteo if configured primary is missing or unconfigured.
        """
        primary_name = getattr(settings, "PRIMARY_AIR_QUALITY_PROVIDER", "open-meteo").lower()
        provider = self.get_provider(primary_name)
        if provider and provider.is_configured():
            return provider
        
        # Fallback to open-meteo
        return self._providers.get("open-meteo") or next(iter(self._providers.values()))

    def get_provider_chain(self) -> List[BaseEnvironmentalProvider]:
        """
        Returns an ordered list of providers to attempt:
        1. Primary provider
        2. Secondary provider (if configured)
        3. Any remaining configured providers
        """
        chain: List[BaseEnvironmentalProvider] = []
        primary_name = getattr(settings, "PRIMARY_AIR_QUALITY_PROVIDER", "open-meteo").lower()
        secondary_name = getattr(settings, "SECONDARY_AIR_QUALITY_PROVIDER", "waqi").lower()

        primary = self.get_provider(primary_name)
        if primary and primary.is_configured():
            chain.append(primary)

        secondary = self.get_provider(secondary_name)
        if secondary and secondary.is_configured() and secondary not in chain:
            chain.append(secondary)

        for name, provider in self._providers.items():
            if provider.is_configured() and provider not in chain:
                chain.append(provider)

        return chain

    def get_status_summary(self) -> List[ProviderStatus]:
        """Returns the operational status of all registered environmental data providers."""
        primary_name = getattr(settings, "PRIMARY_AIR_QUALITY_PROVIDER", "open-meteo").lower()
        statuses = []
        for name, provider in self._providers.items():
            is_primary = (name == primary_name)
            is_cfg = provider.is_configured()
            statuses.append(
                ProviderStatus(
                    name=name,
                    is_primary=is_primary,
                    is_configured=is_cfg,
                    status="operational" if is_cfg else "not_configured",
                    details="Open-access global API (CAMS/SILAM)" if name == "open-meteo" else "Ground-station official network (WAQI)",
                )
            )
        return statuses


provider_registry = EnvironmentalProviderRegistry()
