"""
AIRWISE AI — Integration Tests for Health & Database Check Endpoints
"""

def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "components" in data["data"]
    assert "database" in data["data"]["components"]
    assert "ai_engine" in data["data"]["components"]


def test_database_health_endpoint(client):
    response = client.get("/api/v1/health/database")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] in ["connected", "development_fallback"]
