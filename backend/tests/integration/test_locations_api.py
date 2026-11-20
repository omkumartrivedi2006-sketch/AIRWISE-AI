"""
AIRWISE AI — Integration Tests for Locations REST API
"""

def test_locations_crud(client):
    # 1. Create Location
    payload = {
        "name": "Hyde Park Monitoring Post",
        "city": "London",
        "country": "United Kingdom",
        "latitude": 51.5074,
        "longitude": -0.1657,
    }
    create_res = client.post("/api/v1/locations", json=payload)
    assert create_res.status_code == 201
    loc_data = create_res.json()["data"]
    loc_id = loc_data["id"]
    assert loc_data["city"] == "London"

    # 2. Get Location Details
    get_res = client.get(f"/api/v1/locations/{loc_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["name"] == "Hyde Park Monitoring Post"

    # 3. List Locations
    list_res = client.get("/api/v1/locations")
    assert list_res.status_code == 200
    items = list_res.json()["data"]
    assert len(items) >= 1
    assert any(item["id"] == loc_id for item in items)


def test_location_404_not_found(client):
    res = client.get("/api/v1/locations/999999")
    assert res.status_code == 404
    err = res.json()
    assert err["success"] is False
    assert err["error"]["code"] == "LOCATION_NOT_FOUND"
