"""
AIRWISE AI — Integration Tests for Pollution Observation REST API
"""

from datetime import datetime, timezone


def test_pollution_observations_flow(client):
    # 1. Create a Location first
    loc_res = client.post(
        "/api/v1/locations",
        json={
            "name": "Tokyo Shinjuku Central",
            "city": "Tokyo",
            "country": "Japan",
            "latitude": 35.6895,
            "longitude": 139.6917,
        },
    )
    assert loc_res.status_code == 201
    loc_id = loc_res.json()["data"]["id"]

    # 2. Record Pollution Observation
    obs_payload = {
        "location_id": loc_id,
        "aqi": 42,
        "pm25": 10.2,
        "pm10": 18.5,
        "temperature": 19.4,
        "humidity": 52.0,
        "source": "sensor",
        "observed_at": datetime.now(timezone.utc).isoformat(),
    }
    create_obs_res = client.post("/api/v1/pollution", json=obs_payload)
    assert create_obs_res.status_code == 201
    obs_data = create_obs_res.json()["data"]
    obs_id = obs_data["id"]
    assert obs_data["aqi"] == 42
    assert obs_data["pm25"] == 10.2

    # 3. Retrieve Observation by ID
    get_obs_res = client.get(f"/api/v1/pollution/{obs_id}")
    assert get_obs_res.status_code == 200
    assert get_obs_res.json()["data"]["location_id"] == loc_id

    # 4. List Observations with location filter
    list_obs_res = client.get(f"/api/v1/pollution?location_id={loc_id}")
    assert list_obs_res.status_code == 200
    assert len(list_obs_res.json()["data"]) >= 1

    # 5. Get Latest Observations
    latest_res = client.get("/api/v1/pollution/latest")
    assert latest_res.status_code == 200
    assert len(latest_res.json()["data"]) >= 1

    # 6. Get Summary for Location
    summary_res = client.get(f"/api/v1/pollution/summary?location_id={loc_id}")
    assert summary_res.status_code == 200
    sum_data = summary_res.json()["data"]
    assert sum_data["observation_count"] >= 1
    assert sum_data["average_aqi"] == 42.0
    assert sum_data["city"] == "Tokyo"
