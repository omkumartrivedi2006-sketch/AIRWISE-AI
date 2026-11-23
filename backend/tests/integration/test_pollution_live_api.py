"""
AIRWISE AI — Integration Tests for Live Environmental REST APIs (Module 06)
Verifies external provider endpoints, geocoding search, live telemetry queries,
historical time-series, and provider status metrics.
"""

from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock
import pytest


def test_pollution_sources_endpoint(client):
    res = client.get("/api/v1/pollution/sources")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert isinstance(data, list)
    assert len(data) >= 1
    names = [s["name"] for s in data]
    assert "open-meteo" in names


def test_pollution_data_status_endpoint(client):
    res = client.get("/api/v1/pollution/data-status")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert data["environmental_data_enabled"] is True
    assert data["primary_provider"] in ("open-meteo", "waqi")
    assert "cache_ttl_seconds" in data
    assert "max_fresh_data_age_minutes" in data


def test_pollution_search_endpoint(client):
    mock_payload = {
        "results": [
            {
                "id": 1273294,
                "name": "Delhi",
                "latitude": 28.65195,
                "longitude": 77.23149,
                "country": "India",
                "country_code": "IN",
                "admin1": "Delhi",
            }
        ]
    }

    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_payload
        mock_get.return_value = mock_resp

        res = client.get("/api/v1/pollution/search?q=Delhi&limit=3")
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert len(body["data"]) >= 1
        first = body["data"][0]
        assert first["city"] == "Delhi"
        assert first["country"] == "India"


def test_pollution_latest_for_city_endpoint(client):
    current_hour_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:00")
    mock_geo = {
        "results": [
            {
                "name": "London",
                "latitude": 51.50853,
                "longitude": -0.12574,
                "country": "United Kingdom",
            }
        ]
    }
    mock_air = {
        "current": {
            "time": current_hour_iso,
            "us_aqi": 38,
            "pm2_5": 9.2,
            "pm10": 15.4,
            "nitrogen_dioxide": 22.1,
            "sulphur_dioxide": 3.4,
            "ozone": 34.0,
            "carbon_monoxide": 180.0,
        }
    }
    mock_weather = {
        "current": {
            "temperature_2m": 12.5,
            "relative_humidity_2m": 68,
            "wind_speed_10m": 3.4,
            "wind_direction_10m": 210,
        }
    }

    async def mock_async_get(url, **kwargs):
        resp = MagicMock()
        resp.status_code = 200
        if "geocoding-api" in str(url):
            resp.json.return_value = mock_geo
        elif "air-quality-api" in str(url):
            resp.json.return_value = mock_air
        else:
            resp.json.return_value = mock_weather
        return resp

    with patch("httpx.AsyncClient.get", side_effect=mock_async_get):
        res = client.get("/api/v1/pollution/latest?city=London&refresh=true")
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        obs = body["data"]
        assert obs["aqi"] == 38
        assert obs["pm25"] == 9.2
        assert obs["temperature"] == 12.5
        assert obs["freshness"] in ("live", "cached")
        assert obs["location"]["city"] == "London"


def test_pollution_history_endpoint(client):
    now_utc = datetime.now(timezone.utc)
    mock_geo = {
        "results": [
            {
                "name": "Paris",
                "latitude": 48.85341,
                "longitude": 2.3488,
                "country": "France",
            }
        ]
    }
    mock_history = {
        "hourly": {
            "time": [
                (now_utc - timedelta(hours=3)).strftime("%Y-%m-%dT%H:00"),
                (now_utc - timedelta(hours=2)).strftime("%Y-%m-%dT%H:00"),
                (now_utc - timedelta(hours=1)).strftime("%Y-%m-%dT%H:00"),
                now_utc.strftime("%Y-%m-%dT%H:00"),
            ],
            "us_aqi": [40, 42, 45, 48],
            "pm2_5": [10.1, 10.5, 11.2, 12.0],
            "pm10": [18.0, 19.2, 20.1, 21.5],
            "nitrogen_dioxide": [25.0, 26.0, 28.0, 30.0],
            "sulphur_dioxide": [2.0, 2.1, 2.3, 2.5],
            "ozone": [30.0, 28.0, 26.0, 25.0],
            "carbon_monoxide": [150.0, 160.0, 170.0, 180.0],
        }
    }

    async def mock_async_get(url, **kwargs):
        resp = MagicMock()
        resp.status_code = 200
        if "geocoding-api" in str(url):
            resp.json.return_value = mock_geo
        else:
            resp.json.return_value = mock_history
        return resp

    with patch("httpx.AsyncClient.get", side_effect=mock_async_get):
        res = client.get("/api/v1/pollution/history?city=Paris&hours=4")
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        history_points = body["data"]
        assert len(history_points) >= 4
        assert history_points[0]["aqi"] == 40
        assert history_points[0]["pm25"] == 10.1
