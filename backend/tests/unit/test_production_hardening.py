"""
AIRWISE AI — Module 10 Production Hardening Unit Tests
Verifies:
1. Security headers injection (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
2. Request correlation ID attachment (X-Request-ID)
3. Latency timing header (X-Process-Time)
4. Liveness probe (/api/v1/health/live)
5. Readiness probe (/api/v1/health/ready)
6. Request size limiter guard (413 Payload Too Large)
"""

import pytest
from starlette.testclient import TestClient
from app.main import app
from app.core.config import settings


@pytest.fixture
def client():
    return TestClient(app)


def test_liveness_probe(client):
    """Verifies that /api/v1/health/live returns HTTP 200 with status 'live'."""
    res = client.get("/api/v1/health/live")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "live"
    assert "timestamp" in data


def test_readiness_probe(client):
    """Verifies that /api/v1/health/ready returns HTTP 200 with status 'ready'."""
    res = client.get("/api/v1/health/ready")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert "timestamp" in data


def test_security_headers_injected(client):
    """Verifies that OWASP security headers are present on API responses."""
    res = client.get("/api/v1/health/live")
    assert res.status_code == 200
    headers = res.headers

    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-XSS-Protection") == "1; mode=block"
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "camera=()" in headers.get("Permissions-Policy", "")


def test_request_correlation_id_and_timing(client):
    """Verifies that X-Request-ID and X-Process-Time are returned."""
    # Test auto-generated request ID
    res = client.get("/api/v1/health/live")
    assert "X-Request-ID" in res.headers
    assert "X-Process-Time" in res.headers
    assert res.headers["X-Process-Time"].endswith("ms")

    # Test honoring incoming request ID
    custom_id = "test-custom-trace-uuid-12345"
    res2 = client.get("/api/v1/health/live", headers={"X-Request-ID": custom_id})
    assert res2.headers.get("X-Request-ID") == custom_id


def test_request_size_limiter(client):
    """Verifies that requests exceeding MAX_REQUEST_SIZE_BYTES return HTTP 413."""
    oversized = settings.MAX_REQUEST_SIZE_BYTES + 1024
    res = client.post(
        "/api/v1/feedback",
        headers={"Content-Length": str(oversized)},
        content=b"test",
    )
    assert res.status_code == 413
    data = res.json()
    assert data["error"]["code"] == "PAYLOAD_TOO_LARGE"


def test_rate_limiter_throttles_auth(client):
    """Verifies that client IPs making excess requests to auth routes receive HTTP 429."""
    from app.core.middleware import SimpleRateLimiterMiddleware

    # Instantiate limiter directly to test sliding window logic
    limiter = SimpleRateLimiterMiddleware(app)
    ip = "198.51.100.42"
    limit = 3
    window = 60.0

    # First 3 should pass
    for _ in range(limit):
        allowed = limiter._clean_and_check(limiter._auth_history, ip, limit, window)
        assert allowed is True

    # 4th request must be rejected
    rejected = limiter._clean_and_check(limiter._auth_history, ip, limit, window)
    assert rejected is False
