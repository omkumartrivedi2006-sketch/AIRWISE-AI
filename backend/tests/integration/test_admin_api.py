"""
AIRWISE AI — Module 09 Integration Tests
Tests for RBAC enforcement, administrative API endpoints, data quality reviews,
system health diagnostics, and audit trail retrieval.
"""

from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token
from app.models.location import Location
from app.models.notification import Notification
from app.models.pollution import PollutionObservation
from app.models.user import User


@pytest.fixture
def admin_user(db_session: Session) -> User:
    admin = User(
        email="api.admin@airwise.ai",
        full_name="API Admin",
        role="ADMIN",
        is_active=True,
        is_verified=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture
def standard_user(db_session: Session) -> User:
    user = User(
        email="citizen@airwise.ai",
        full_name="Regular Citizen",
        role="USER",
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_headers(admin_user: User) -> dict:
    token = create_access_token(user_id=admin_user.id, role=admin_user.role, email=admin_user.email)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user_headers(standard_user: User) -> dict:
    token = create_access_token(user_id=standard_user.id, role=standard_user.role, email=standard_user.email)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_location(db_session: Session) -> Location:
    loc = Location(
        name="Edinburgh Station",
        city="Edinburgh",
        country="UK",
        latitude=55.9533,
        longitude=-3.1883,
    )
    db_session.add(loc)
    db_session.commit()
    db_session.refresh(loc)
    return loc


def test_admin_authorization_enforcement(
    client: TestClient, admin_headers: dict, user_headers: dict
):
    # 1. Unauthenticated -> 401
    unauth_res = client.get(f"{settings.API_V1_PREFIX}/admin/dashboard/overview")
    assert unauth_res.status_code == 401

    # 2. Authenticated as non-admin -> 403 Forbidden
    forbidden_res = client.get(
        f"{settings.API_V1_PREFIX}/admin/dashboard/overview",
        headers=user_headers,
    )
    assert forbidden_res.status_code == 403

    # 3. Authenticated as admin -> 200 OK
    admin_res = client.get(
        f"{settings.API_V1_PREFIX}/admin/dashboard/overview",
        headers=admin_headers,
    )
    assert admin_res.status_code == 200
    assert admin_res.json()["success"] is True
    assert "metrics" in admin_res.json()["data"]


def test_admin_users_api_crud_and_status(
    client: TestClient, admin_headers: dict, standard_user: User
):
    # 1. List users
    list_res = client.get(f"{settings.API_V1_PREFIX}/admin/users", headers=admin_headers)
    assert list_res.status_code == 200
    data = list_res.json()["data"]
    assert len(data) >= 1
    assert "meta" in list_res.json()

    # 2. Get user details
    get_res = client.get(
        f"{settings.API_V1_PREFIX}/admin/users/{standard_user.id}",
        headers=admin_headers,
    )
    assert get_res.status_code == 200
    assert get_res.json()["data"]["email"] == standard_user.email

    # 3. Update status (deactivate)
    deact_res = client.patch(
        f"{settings.API_V1_PREFIX}/admin/users/{standard_user.id}/status",
        headers=admin_headers,
        json={"is_active": False, "reason": "Administrative suspension"},
    )
    assert deact_res.status_code == 200
    assert deact_res.json()["data"]["is_active"] is False

    # 4. Update role (promote)
    role_res = client.patch(
        f"{settings.API_V1_PREFIX}/admin/users/{standard_user.id}/role",
        headers=admin_headers,
        json={"role": "ADMIN", "reason": "Promotion to regional administrator"},
    )
    assert role_res.status_code == 200
    assert role_res.json()["data"]["role"] == "ADMIN"


def test_admin_environmental_review_api(
    client: TestClient, admin_headers: dict, test_location: Location, db_session: Session
):
    # Seed observation
    obs = PollutionObservation(
        location_id=test_location.id,
        observed_at=datetime.now(timezone.utc),
        aqi=160,
        aqi_scale="US_EPA",
        pm25=75.0,
        source="sensor_station_1",
        is_demo=False,
    )
    db_session.add(obs)
    db_session.commit()
    db_session.refresh(obs)

    # 1. List environmental data
    list_res = client.get(f"{settings.API_V1_PREFIX}/admin/environmental-data", headers=admin_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) >= 1

    # 2. Review observation as flagged
    review_res = client.patch(
        f"{settings.API_V1_PREFIX}/admin/environmental-data/{obs.id}/review",
        headers=admin_headers,
        json={"review_status": "flagged", "reason": "Sensor optical chamber saturation"},
    )
    assert review_res.status_code == 200
    data = review_res.json()["data"]
    assert data["review_status"] == "flagged"
    assert data["is_flagged"] is True
    assert data["pm25"] == 75.0  # Physical measurement strictly preserved


def test_admin_data_sources_api_and_ping(client: TestClient, admin_headers: dict):
    # List sources
    sources_res = client.get(f"{settings.API_V1_PREFIX}/admin/data-sources", headers=admin_headers)
    assert sources_res.status_code == 200
    sources = sources_res.json()["data"]
    assert any(s["id"] == "open-meteo" for s in sources)

    # Ping Open-Meteo
    ping_res = client.get(
        f"{settings.API_V1_PREFIX}/admin/data-sources/open-meteo/health",
        headers=admin_headers,
    )
    assert ping_res.status_code == 200
    assert ping_res.json()["data"]["ping_success"] is True


def test_admin_ai_usage_api(client: TestClient, admin_headers: dict):
    overview_res = client.get(f"{settings.API_V1_PREFIX}/admin/ai-usage/overview", headers=admin_headers)
    assert overview_res.status_code == 200
    assert "model_name" in overview_res.json()["data"]

    trends_res = client.get(f"{settings.API_V1_PREFIX}/admin/ai-usage/trends?days=7", headers=admin_headers)
    assert trends_res.status_code == 200
    assert len(trends_res.json()["data"]["data_points"]) == 7


def test_admin_notifications_api_and_retry(
    client: TestClient, admin_headers: dict, standard_user: User, db_session: Session
):
    # Seed a failed notification
    failed_notif = Notification(
        user_id=standard_user.id,
        title="Failed Alert Test",
        message="Delivery failure simulation",
        severity="high",
        delivery_status="failed",
        failure_reason="Simulated connection reset",
    )
    db_session.add(failed_notif)
    db_session.commit()
    db_session.refresh(failed_notif)

    # 1. Metrics
    metrics_res = client.get(f"{settings.API_V1_PREFIX}/admin/notifications/metrics", headers=admin_headers)
    assert metrics_res.status_code == 200
    assert metrics_res.json()["data"]["failed_count"] >= 1

    # 2. Retry failed notification
    retry_res = client.post(
        f"{settings.API_V1_PREFIX}/admin/notifications/{failed_notif.id}/retry",
        headers=admin_headers,
    )
    assert retry_res.status_code == 200
    assert retry_res.json()["data"]["delivery_status"] == "delivered"


def test_admin_system_health_and_database_api(client: TestClient, admin_headers: dict):
    # System Health
    health_res = client.get(f"{settings.API_V1_PREFIX}/admin/system/health", headers=admin_headers)
    assert health_res.status_code == 200
    data = health_res.json()["data"]
    assert data["platform_name"] == "AIRWISE AI"
    assert "uptime_seconds" in data

    # Database Diagnostics
    db_res = client.get(f"{settings.API_V1_PREFIX}/admin/system/database", headers=admin_headers)
    assert db_res.status_code == 200
    assert db_res.json()["data"]["status"] == "connected"


def test_admin_audit_logs_api(
    client: TestClient, admin_headers: dict, standard_user: User
):
    # Trigger an administrative action that writes to audit log
    client.patch(
        f"{settings.API_V1_PREFIX}/admin/users/{standard_user.id}/status",
        headers=admin_headers,
        json={"is_active": True, "reason": "Re-activation test for audit log"},
    )

    # Fetch audit logs
    audit_res = client.get(f"{settings.API_V1_PREFIX}/admin/audit-logs", headers=admin_headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()["data"]
    assert len(logs) >= 1
    assert any("USER" in l["action"] for l in logs)
