"""
AIRWISE AI — Backend Health & Diagnostics Tests
"""

import pytest


def test_root_endpoint(client):
    """Verify that root endpoint returns operational status and links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "version" in data
    assert "documentation" in data


def test_health_endpoint(client):
    """Verify that /api/v1/health returns structured health payload."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert data["service"] == "AIRWISE AI Backend"
    assert "version" in data
    assert "environment" in data
    assert "components" in data
    assert "database" in data["components"]
    assert "ai_engine" in data["components"]
    assert "status" in data["components"]["database"]
    assert "status" in data["components"]["ai_engine"]


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
    assert "error" in data
    assert data["error"]["code"] == "RESOURCE_NOT_FOUND"
    assert "timestamp" in data["error"]
