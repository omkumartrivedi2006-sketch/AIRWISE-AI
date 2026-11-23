"""
AIRWISE AI — Open-Meteo Environmental Data Provider
Primary air quality, atmospheric telemetry, and geocoding provider.
Uses high-resolution Copernicus Atmosphere Monitoring Service (CAMS) and SILAM models.
Operates without mandatory API keys, providing reliable global coverage.
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


class OpenMeteoProvider(BaseEnvironmentalProvider):
    """Integrates Open-Meteo Air Quality and Geocoding APIs."""

    def __init__(self):
        self.timeout = getattr(settings, "ENVIRONMENTAL_API_TIMEOUT_SECONDS", 15)
        self.geocoding_base_url = "https://geocoding-api.open-meteo.com/v1"
        self.air_quality_base_url = "https://air-quality-api.open-meteo.com/v1"
        self.weather_base_url = "https://api.open-meteo.com/v1"

    @property
    def name(self) -> str:
        return "open-meteo"

    def is_configured(self) -> bool:
        # Open-Meteo is open access, always configured and available
        return getattr(settings, "ENVIRONMENTAL_DATA_ENABLED", True)

    async def search_locations(self, query: str, limit: int = 5) -> List[LocationSearchResult]:
        """Geocodes a search string into geographical locations using Open-Meteo Geocoding API."""
        clean_query = query.strip()
        if not clean_query:
            return []

        url = f"{self.geocoding_base_url}/search"
        params = {
            "name": clean_query,
            "count": limit,
            "language": "en",
            "format": "json",
        }

        try:
            async with httpx.AsyncClient(timeout=float(self.timeout)) as client:
                resp = await client.get(url, params=params)
                if resp.status_code != 200:
                    logger.warning("Open-Meteo geocoding error: HTTP %s", resp.status_code)
                    return []

                data = resp.json()
                results = data.get("results", [])
                output: List[LocationSearchResult] = []

                for item in results:
                    loc_name = item.get("name", clean_query)
                    country = item.get("country", "")
                    state = item.get("admin1")

                    output.append(
                        LocationSearchResult(
                            name=loc_name,
                            city=loc_name,
                            state=state,
                            country=country,
                            country_code=item.get("country_code"),
                            latitude=float(item.get("latitude")),
                            longitude=float(item.get("longitude")),
                            source="open-meteo",
                        )
                    )
                return output
        except Exception as exc:
            logger.error("Open-Meteo geocoding search failed: %s", exc)
            return []

    async def get_latest_observation(
        self,
        latitude: float,
        longitude: float,
        city: Optional[str] = None,
        location_name: Optional[str] = None,
        country: Optional[str] = None,
    ) -> Optional[NormalizedObservation]:
        """Fetches both real-time air quality pollutants and ambient weather telemetry."""
        air_url = f"{self.air_quality_base_url}/air-quality"
        air_params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "us_aqi,european_aqi,pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide",
        }

        weather_url = f"{self.weather_base_url}/forecast"
        weather_params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m",
        }

        try:
            async with httpx.AsyncClient(timeout=float(self.timeout)) as client:
                air_resp, weather_resp = await client.get(air_url, params=air_params), await client.get(weather_url, params=weather_params)

                if air_resp.status_code != 200:
                    logger.warning("Open-Meteo air-quality request failed: HTTP %s", air_resp.status_code)
                    return None

                air_data = air_resp.json().get("current", {})
                weather_data = weather_resp.json().get("current", {}) if weather_resp.status_code == 200 else {}

                time_str = air_data.get("time")
                if time_str:
                    try:
                        observed_at = datetime.fromisoformat(time_str).replace(tzinfo=timezone.utc)
                    except Exception:
                        observed_at = datetime.now(timezone.utc)
                else:
                    observed_at = datetime.now(timezone.utc)

                us_aqi = air_data.get("us_aqi")
                aqi_val = int(us_aqi) if us_aqi is not None else None
                aqi_cat = data_normalization_service.get_aqi_category(aqi_val, "US_EPA")
                freshness = data_normalization_service.calculate_freshness(observed_at)

                return NormalizedObservation(
                    location_name=location_name or city or f"Coord ({latitude:.2f}, {longitude:.2f})",
                    city=city or location_name or "Local Area",
                    country=country or "International",
                    latitude=latitude,
                    longitude=longitude,
                    aqi=aqi_val,
                    aqi_scale="US_EPA",
                    aqi_category=aqi_cat,
                    pm25=air_data.get("pm2_5"),
                    pm10=air_data.get("pm10"),
                    no2=air_data.get("nitrogen_dioxide"),
                    so2=air_data.get("sulphur_dioxide"),
                    co=air_data.get("carbon_monoxide"),
                    o3=air_data.get("ozone"),
                    temperature=weather_data.get("temperature_2m"),
                    humidity=weather_data.get("relative_humidity_2m"),
                    wind_speed=weather_data.get("wind_speed_10m"),
                    wind_direction=weather_data.get("wind_direction_10m"),
                    provider_name=self.name,
                    provider_observation_id=f"om_{round(latitude, 3)}_{round(longitude, 3)}_{observed_at.strftime('%Y%m%d%H')}",
                    data_source="Open-Meteo Air Quality & Weather API (CAMS / ECMWF Models)",
                    observed_at=observed_at,
                    fetched_at=datetime.now(timezone.utc),
                    freshness=freshness,
                    is_verified=True,
                    is_demo=False,
                )
        except Exception as exc:
            logger.error("Failed to retrieve Open-Meteo observation: %s", exc)
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
        """Retrieves past 24-hour time-series observations from Open-Meteo."""
        url = f"{self.air_quality_base_url}/air-quality"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "past_days": 1,
            "hourly": "us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone",
        }

        try:
            async with httpx.AsyncClient(timeout=float(self.timeout)) as client:
                resp = await client.get(url, params=params)
                if resp.status_code != 200:
                    return []

                hourly = resp.json().get("hourly", {})
                times = hourly.get("time", [])
                aqis = hourly.get("us_aqi", [])
                pm25s = hourly.get("pm2_5", [])
                pm10s = hourly.get("pm10", [])

                # Slice to the requested number of most recent hours
                start_idx = max(0, len(times) - hours)
                output: List[NormalizedObservation] = []

                for i in range(start_idx, len(times)):
                    t_str = times[i]
                    try:
                        obs_time = datetime.fromisoformat(t_str).replace(tzinfo=timezone.utc)
                    except Exception:
                        obs_time = datetime.now(timezone.utc)

                    aqi_v = aqis[i] if i < len(aqis) and aqis[i] is not None else None
                    aqi_cat = data_normalization_service.get_aqi_category(aqi_v, "US_EPA")

                    output.append(
                        NormalizedObservation(
                            location_name=location_name or city or "Station",
                            city=city or location_name or "Area",
                            country=country or "",
                            latitude=latitude,
                            longitude=longitude,
                            aqi=int(aqi_v) if aqi_v is not None else None,
                            aqi_scale="US_EPA",
                            aqi_category=aqi_cat,
                            pm25=pm25s[i] if i < len(pm25s) else None,
                            pm10=pm10s[i] if i < len(pm10s) else None,
                            provider_name=self.name,
                            provider_observation_id=f"om_hist_{round(latitude, 3)}_{round(longitude, 3)}_{obs_time.strftime('%Y%m%d%H')}",
                            data_source="Open-Meteo Historical Model Archive",
                            observed_at=obs_time,
                            fetched_at=datetime.now(timezone.utc),
                            freshness="live" if i == len(times) - 1 else "cached",
                            is_verified=True,
                            is_demo=False,
                        )
                    )
                return output
        except Exception as exc:
            logger.error("Failed to retrieve Open-Meteo historical observations: %s", exc)
            return []


open_meteo_provider = OpenMeteoProvider()
