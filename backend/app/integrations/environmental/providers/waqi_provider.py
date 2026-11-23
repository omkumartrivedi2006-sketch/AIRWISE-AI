"""
AIRWISE AI — World Air Quality Index (WAQI / aqicn) Provider
Secondary ground station provider connecting directly to government monitoring networks
(CPCB in India, US EPA, European Environment Agency).
Requires WAQI_API_TOKEN (free tier at https://aqicn.org/data-platform/token/).
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings
from app.core.logging import logger
from app.integrations.environmental.base import BaseEnvironmentalProvider
from app.integrations.environmental.schemas.environmental_schemas import (
    LocationSearchResult,
    NormalizedObservation,
)
from app.integrations.environmental.services.data_normalization_service import data_normalization_service


class WaqiProvider(BaseEnvironmentalProvider):
    """Integrates World Air Quality Index (WAQI) ground station API."""

    def __init__(self):
        self.api_token = getattr(settings, "WAQI_API_TOKEN", "")
        self.timeout = getattr(settings, "ENVIRONMENTAL_API_TIMEOUT_SECONDS", 15)
        self.base_url = "https://api.waqi.info"

    @property
    def name(self) -> str:
        return "waqi"

    def is_configured(self) -> bool:
        """Verifies if WAQI API token is provided."""
        token = (self.api_token or "").strip()
        return bool(token and token != "your_waqi_api_token_here")

    async def search_locations(self, query: str, limit: int = 5) -> List[LocationSearchResult]:
        """Searches ground stations by city/station name using WAQI search API."""
        if not self.is_configured():
            return []

        clean_query = query.strip()
        if not clean_query:
            return []

        url = f"{self.base_url}/search/"
        params = {"token": self.api_token, "keyword": clean_query}

        try:
            async with httpx.AsyncClient(timeout=float(self.timeout)) as client:
                resp = await client.get(url, params=params)
                if resp.status_code != 200:
                    return []

                data = resp.json()
                if data.get("status") != "ok":
                    return []

                results = data.get("data", [])
                output: List[LocationSearchResult] = []

                for item in results[:limit]:
                    station = item.get("station", {})
                    geo = station.get("geo", [])
                    if len(geo) >= 2:
                        name = station.get("name", clean_query)
                        output.append(
                            LocationSearchResult(
                                name=name,
                                city=name.split(",")[0].strip(),
                                country=station.get("country", ""),
                                latitude=float(geo[0]),
                                longitude=float(geo[1]),
                                source="waqi",
                            )
                        )
                return output
        except Exception as exc:
            logger.error("WAQI location search failed: %s", exc)
            return []

    async def get_latest_observation(
        self,
        latitude: float,
        longitude: float,
        city: Optional[str] = None,
        location_name: Optional[str] = None,
        country: Optional[str] = None,
    ) -> Optional[NormalizedObservation]:
        """Retrieves ground station measurement nearest to coordinates."""
        if not self.is_configured():
            return None

        url = f"{self.base_url}/feed/geo:{latitude};{longitude}/"
        params = {"token": self.api_token}

        try:
            async with httpx.AsyncClient(timeout=float(self.timeout)) as client:
                resp = await client.get(url, params=params)
                if resp.status_code != 200:
                    return None

                data = resp.json()
                if data.get("status") != "ok":
                    return None

                payload = data.get("data", {})
                raw_aqi = payload.get("aqi")
                aqi_val = int(raw_aqi) if isinstance(raw_aqi, (int, float)) else None

                iaqi = payload.get("iaqi", {})
                time_info = payload.get("time", {})
                time_s = time_info.get("s")

                try:
                    observed_at = datetime.fromisoformat(time_s).replace(tzinfo=timezone.utc) if time_s else datetime.now(timezone.utc)
                except Exception:
                    observed_at = datetime.now(timezone.utc)

                aqi_cat = data_normalization_service.get_aqi_category(aqi_val, "US_EPA")
                freshness = data_normalization_service.calculate_freshness(observed_at)

                attributions = payload.get("attributions", [])
                source_name = attributions[0].get("name") if attributions else "Government Environmental Monitoring Network"

                return NormalizedObservation(
                    location_name=payload.get("city", {}).get("name") or location_name or city or "Ground Monitoring Station",
                    city=city or "Local Station",
                    country=country or "",
                    latitude=latitude,
                    longitude=longitude,
                    aqi=aqi_val,
                    aqi_scale="US_EPA",
                    aqi_category=aqi_cat,
                    pm25=iaqi.get("pm25", {}).get("v"),
                    pm10=iaqi.get("pm10", {}).get("v"),
                    no2=iaqi.get("no2", {}).get("v"),
                    so2=iaqi.get("so2", {}).get("v"),
                    co=iaqi.get("co", {}).get("v"),
                    o3=iaqi.get("o3", {}).get("v"),
                    temperature=iaqi.get("t", {}).get("v"),
                    humidity=iaqi.get("h", {}).get("v"),
                    wind_speed=iaqi.get("w", {}).get("v"),
                    provider_name=self.name,
                    provider_observation_id=f"waqi_{payload.get('idx')}_{observed_at.strftime('%Y%m%d%H')}",
                    data_source=f"WAQI Ground Station ({source_name})",
                    observed_at=observed_at,
                    fetched_at=datetime.now(timezone.utc),
                    freshness=freshness,
                    is_verified=True,
                    is_demo=False,
                )
        except Exception as exc:
            logger.error("Failed to retrieve WAQI observation: %s", exc)
            return None

    async def get_historical_observations(
        self,
        latitude: float,
        longitude: float,
        hours: int = 24,
        city: Optional[str] = None,
        location_name: Optional[str] = None,
        country: Optional[str] = None,
    ) -> List[NormalizedObservation]:
        # WAQI free tier only returns current observation without full historical hourly array
        latest = await self.get_latest_observation(latitude, longitude, city, location_name, country)
        return [latest] if latest else []


waqi_provider = WaqiProvider()
