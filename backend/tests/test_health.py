"""
AIRWISE AI — General Backend Health & Root Endpoint Tests
"""

def test_root_endpoint(client):
    """Verify that root endpoint returns operational status and links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "version" in data
    assert "documentation" in data


def test_health_endpoint(client):
    """Verify that /api/v1/health returns standardized health payload."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["status"] in ["healthy", "degraded"]
    assert "components" in data["data"]
    assert "database" in data["data"]["components"]
    assert "ai_engine" in data["data"]["components"]


def test_ai_status_endpoint(client):
    """Verify that /api/v1/ai/status returns provider metadata."""
    response = client.get("/api/v1/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "google-gemini"
    assert "model" in data
    assert isinstance(data["is_configured"], bool)


def test_404_error_formatting(client):
    """Verify that 404 errors use the standardized JSON structure."""
    response = client.get("/api/v1/non-existent-endpoint")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "RESOURCE_NOT_FOUND"
