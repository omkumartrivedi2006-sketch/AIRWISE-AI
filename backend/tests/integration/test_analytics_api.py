"""
AIRWISE AI — Module 07 Integration Tests
Tests REST endpoints for environmental analytics overview, AQI/pollutant trends,
statistical distributions, cross-location comparisons, coverage audits, CSV export,
geospatial map feeds, and AI insights.
"""

from datetime import datetime, timezone, timedelta
import pytest


@pytest.fixture
def seed_analytics_data(client):
    """Seeds two monitored locations with chronological observations for analytical testing."""
    # Location 1: Tokyo
    loc1_res = client.post(
        "/api/v1/locations",
        json={
            "name": "Tokyo Metro Station 01",
            "city": "Tokyo",
            "country": "Japan",
            "latitude": 35.6895,
            "longitude": 139.6917,
        },
    )
    assert loc1_res.status_code == 201
    loc1_id = loc1_res.json()["data"]["id"]

    # Location 2: London
    loc2_res = client.post(
        "/api/v1/locations",
        json={
            "name": "London Urban Hub 01",
            "city": "London",
            "country": "United Kingdom",
            "latitude": 51.5074,
            "longitude": -0.1278,
        },
    )
    assert loc2_res.status_code == 201
    loc2_id = loc2_res.json()["data"]["id"]

    now = datetime.now(timezone.utc)
    # Seed 6 hourly observations for Tokyo
    for i in range(6):
        obs_time = now - timedelta(hours=6 - i)
        client.post(
            "/api/v1/pollution",
            json={
                "location_id": loc1_id,
                "aqi": 30 + (i * 5),
                "aqi_scale": "US_EPA",
                "pm25": 8.0 + (i * 2.0),
                "pm10": 15.0 + (i * 3.0),
                "temperature": 18.0 + (i * 0.5),
                "humidity": 60.0 - (i * 2.0),
                "source": "sensor",
                "observed_at": obs_time.isoformat(),
            },
        )

    # Seed 4 hourly observations for London
    for i in range(4):
        obs_time = now - timedelta(hours=4 - i)
        client.post(
            "/api/v1/pollution",
            json={
                "location_id": loc2_id,
                "aqi": 40 + (i * 3),
                "aqi_scale": "US_EPA",
                "pm25": 12.0 + (i * 1.5),
                "pm10": 20.0 + (i * 2.0),
                "temperature": 12.0 + (i * 0.5),
                "humidity": 70.0 - (i * 1.0),
                "source": "sensor",
                "observed_at": obs_time.isoformat(),
            },
        )

    return {"tokyo_id": loc1_id, "london_id": loc2_id}


def test_analytics_overview_endpoint(client, seed_analytics_data):
    res = client.get("/api/v1/analytics/overview?city=Tokyo&time_range=24h")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert data["city"] == "Tokyo"
    assert data["average_aqi"] is not None
    assert data["average_pm25"] is not None
    assert data["observation_count"] >= 6
    assert data["data_coverage_status"] in ("good", "partial", "limited")


def test_analytics_aqi_trends_endpoint(client, seed_analytics_data):
    res = client.get("/api/v1/analytics/aqi-trends?city=Tokyo&interval=hourly&time_range=24h")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert data["city"] == "Tokyo"
    assert len(data["points"]) >= 1
    assert data["statistics"]["mean"] is not None
    assert data["trend"]["direction"] in ("increasing", "decreasing", "stable", "insufficient_data")


def test_analytics_pollutant_trends_endpoint(client, seed_analytics_data):
    res = client.get("/api/v1/analytics/pollutant-trends?pollutant=pm25&city=Tokyo&interval=hourly&time_range=24h")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert data["pollutant"] == "pm25"
    assert data["unit"] == "µg/m³"
    assert len(data["points"]) >= 1


def test_analytics_statistics_endpoint(client, seed_analytics_data):
    res = client.get("/api/v1/analytics/statistics?metric=pm25&city=Tokyo&time_range=24h")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    stats = body["data"]
    assert stats["count"] >= 6
    assert stats["mean"] is not None
    assert stats["median"] is not None
    assert stats["min"] <= stats["max"]


def test_analytics_compare_endpoint(client, seed_analytics_data):
    res = client.get("/api/v1/analytics/compare?metric=pm25&cities=Tokyo&cities=London&time_range=24h")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    comp = body["data"]
    assert comp["metric"] == "pm25"
    assert len(comp["locations"]) == 2
    assert comp["is_scale_compatible"] is True
    assert comp["difference_summary"] is not None


def test_analytics_data_coverage_endpoint(client, seed_analytics_data):
    res = client.get("/api/v1/analytics/data-coverage?city=Tokyo&time_range=24h")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert data["city"] == "Tokyo"
    assert data["total_expected_hours"] == 24
    assert data["recorded_observations"] >= 6
    assert data["coverage_percentage"] > 0
    assert "pm25" in data["available_pollutants"]


def test_analytics_csv_export_endpoint(client, seed_analytics_data):
    res = client.get("/api/v1/analytics/export/csv?city=Tokyo&time_range=24h")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "attachment; filename=" in res.headers.get("content-disposition", "")
    content = res.text
    assert "Location_Name" in content
    assert "PM2.5_ug_m3" in content
    assert "Tokyo" in content


def test_analytics_insights_endpoint(client, seed_analytics_data):
    res = client.post(
        "/api/v1/analytics/insights",
        json={
            "city": "Tokyo",
            "pollutant": "pm25",
            "time_range": "24h",
            "query": "Evaluate fine particulate trends.",
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert data["key_finding"] is not None
    assert len(data["recommendations"]) >= 1
    assert data["provider"] is not None


def test_map_endpoints(client, seed_analytics_data):
    # 1. Map Observations
    obs_res = client.get("/api/v1/map/observations")
    assert obs_res.status_code == 200
    obs_body = obs_res.json()
    assert obs_body["success"] is True
    assert len(obs_body["data"]) >= 2
    first_pt = obs_body["data"][0]
    assert "latitude" in first_pt
    assert "longitude" in first_pt
    assert "aqi" in first_pt

    # 2. Map Locations
    loc_res = client.get("/api/v1/map/locations")
    assert loc_res.status_code == 200
    loc_body = loc_res.json()
    assert loc_body["success"] is True
    assert len(loc_body["data"]) >= 2
