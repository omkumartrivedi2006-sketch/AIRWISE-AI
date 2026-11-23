"""
AIRWISE AI — Module 06 Unit Tests
Unit tests for data validation, normalization, in-memory caching, provider registry,
and provider response parsing.
"""

from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch, MagicMock
import pytest

from app.integrations.environmental.schemas.environmental_schemas import (
    LocationSearchResult,
    NormalizedObservation,
)
from app.integrations.environmental.services.data_validation_service import data_validation_service
from app.integrations.environmental.services.data_normalization_service import data_normalization_service
from app.integrations.environmental.services.cache_service import EnvironmentalCacheService
from app.integrations.environmental.registry import EnvironmentalProviderRegistry
from app.integrations.environmental.providers.open_meteo_provider import OpenMeteoProvider


def test_validation_coordinates():
    assert data_validation_service.validate_coordinates(28.61, 77.20) is True
    assert data_validation_service.validate_coordinates(-90.0, 180.0) is True
    assert data_validation_service.validate_coordinates(95.0, 77.0) is False
    assert data_validation_service.validate_coordinates(28.0, 200.0) is False


def test_validation_observation_boundaries():
    now = datetime.now(timezone.utc)
    valid_obs = NormalizedObservation(
        location_name="Valid Station",
        city="Delhi",
        country="India",
        latitude=28.61,
        longitude=77.20,
        aqi=150,
        pm25=55.0,
        pm10=120.0,
        temperature=25.0,
        humidity=60.0,
        provider_name="test",
        data_source="sensor",
        observed_at=now,
    )
    assert data_validation_service.validate_observation(valid_obs) is True

    # Out of bounds AQI
    bad_aqi = valid_obs.model_copy()
    bad_aqi.aqi = 650
    assert data_validation_service.validate_observation(bad_aqi) is False

    # Out of bounds PM2.5
    bad_pm = valid_obs.model_copy()
    bad_pm.pm25 = 1500.0
    assert data_validation_service.validate_observation(bad_pm) is False

    # Out of bounds temperature
    bad_temp = valid_obs.model_copy()
    bad_temp.temperature = 90.0
    assert data_validation_service.validate_observation(bad_temp) is False

    # Out of bounds future timestamp (> 2 hours)
    future_obs = valid_obs.model_copy()
    future_obs.observed_at = now + timedelta(hours=5)
    assert data_validation_service.validate_observation(future_obs) is False


def test_normalization_aqi_categories_us_epa():
    assert data_normalization_service.get_aqi_category(35, "US_EPA") == "Good"
    assert data_normalization_service.get_aqi_category(75, "US_EPA") == "Moderate"
    assert data_normalization_service.get_aqi_category(125, "US_EPA") == "Sensitive"
    assert data_normalization_service.get_aqi_category(175, "US_EPA") == "Unhealthy"
    assert data_normalization_service.get_aqi_category(250, "US_EPA") == "Very Unhealthy"
    assert data_normalization_service.get_aqi_category(350, "US_EPA") == "Hazardous"
    assert data_normalization_service.get_aqi_category(None) == "Unknown"


def test_normalization_aqi_categories_in_naaqs():
    assert data_normalization_service.get_aqi_category(40, "IN_NAAQS") == "Good"
    assert data_normalization_service.get_aqi_category(80, "IN_NAAQS") == "Satisfactory"
    assert data_normalization_service.get_aqi_category(150, "IN_NAAQS") == "Moderate"
    assert data_normalization_service.get_aqi_category(250, "IN_NAAQS") == "Poor"
    assert data_normalization_service.get_aqi_category(350, "IN_NAAQS") == "Very Poor"
    assert data_normalization_service.get_aqi_category(450, "IN_NAAQS") == "Severe"


def test_normalization_freshness_calculation():
    now = datetime.now(timezone.utc)
    live_time = now - timedelta(minutes=25)
    cached_time = now - timedelta(minutes=90)
    delayed_time = now - timedelta(hours=4)

    assert data_normalization_service.calculate_freshness(live_time) == "live"
    assert data_normalization_service.calculate_freshness(cached_time, max_fresh_minutes=120) == "cached"
    assert data_normalization_service.calculate_freshness(delayed_time, max_fresh_minutes=120) == "delayed"
    assert data_normalization_service.calculate_freshness(None) == "unavailable"


def test_cache_service():
    cache = EnvironmentalCacheService(default_ttl=5)
    now = datetime.now(timezone.utc)
    obs = NormalizedObservation(
        location_name="Cached Station",
        city="London",
        country="UK",
        latitude=51.5074,
        longitude=-0.1278,
        aqi=45,
        provider_name="test",
        data_source="test",
        observed_at=now,
    )

    key = cache.coord_key(51.5074, -0.1278)
    cache.set(key, obs, ttl_seconds=10)

    # Retrieval hit
    cached_val = cache.get(key)
    assert cached_val is not None
    assert cached_val.aqi == 45
    assert cached_val.freshness == "cached"

    # Coordinate rounding grouping check
    similar_key = cache.coord_key(51.509, -0.128)
    assert similar_key == key


def test_provider_registry():
    registry = EnvironmentalProviderRegistry()
    primary = registry.get_primary_provider()
    assert primary is not None
    assert primary.name in ("open-meteo", "waqi")

    statuses = registry.get_status_summary()
    assert len(statuses) >= 2
    names = [s.name for s in statuses]
    assert "open-meteo" in names
    assert "waqi" in names


@pytest.mark.asyncio
async def test_open_meteo_geocoding_parsing():
    provider = OpenMeteoProvider()
    mock_payload = {
        "results": [
            {
                "id": 1275339,
                "name": "Mumbai",
                "latitude": 19.07283,
                "longitude": 72.88261,
                "country": "India",
                "country_code": "IN",
                "admin1": "Maharashtra",
            }
        ]
    }

    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_payload
        mock_get.return_value = mock_resp

        results = await provider.search_locations("Mumbai", limit=1)
        assert len(results) == 1
        assert results[0].city == "Mumbai"
        assert results[0].country == "India"
        assert results[0].latitude == 19.07283
