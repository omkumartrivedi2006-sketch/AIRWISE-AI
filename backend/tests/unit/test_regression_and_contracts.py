"""
AIRWISE AI — Regression & API Contract Invariant Tests
Verifies that response structures, status codes, error schemas, and security invariants
remain 100% compliant and uncorrupted.
"""

import pytest
from fastapi.testclient import TestClient


def test_health_check_contract(client: TestClient):
    """Ensure /api/v1/health returns consistent status and schema invariants."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "components" in data["data"]
    assert "database" in data["data"]["components"]
    assert "ai_engine" in data["data"]["components"]


def test_unauthenticated_protected_route_rejection(client: TestClient):
    """Ensure protected routes consistently return 401 Unauthorized with proper error schema."""
    protected_endpoints = [
        "/api/v1/users/me",
        "/api/v1/users/me/preferences",
        "/api/v1/users/me/locations",
        "/api/v1/community/reports/my",
        "/api/v1/indoor/assessments",
    ]

    for endpoint in protected_endpoints:
        response = client.get(endpoint)
        assert response.status_code == 401, f"Expected 401 for {endpoint}, got {response.status_code}"
        body = response.json()
        assert "error" in body or "detail" in body or "message" in body


def test_public_pollution_observation_contract(client: TestClient, db_session):
    """Ensure public pollution endpoints adhere to contract."""
    response = client.get("/api/v1/pollution/latest")
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert "success" in data


def test_invalid_input_validation_contract(client: TestClient):
    """Ensure Pydantic validation errors return standard 422 Unprocessable Content format."""
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "invalid-email-format", "password": "short"},
    )
    assert response.status_code == 422
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert len(body["error"]["details"]) > 0
