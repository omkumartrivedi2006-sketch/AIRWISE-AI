"""
AIRWISE AI — Module 08 Integration Tests
Tests for preferences, saved locations, alert rules, notification center, and recommendations API endpoints.
"""

from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from app.core.database import MongoSession as Session
from app.core.config import settings
from app.core.security import create_access_token
from app.models.location import Location
from app.models.notification import Notification
from app.models.pollution import PollutionObservation
from app.models.user import User


@pytest.fixture
def auth_user(db_session: Session) -> User:
    user = User(
        email="auth_user@airwise.ai",
        full_name="Authorized User",
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def other_user(db_session: Session) -> User:
    user = User(
        email="other_user@airwise.ai",
        full_name="Other User",
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(auth_user: User) -> dict:
    token = create_access_token(user_id=auth_user.id, role=auth_user.role, email=auth_user.email)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_auth_headers(other_user: User) -> dict:
    token = create_access_token(user_id=other_user.id, role=other_user.role, email=other_user.email)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_location(db_session: Session) -> Location:
    loc = Location(
        name="Glasgow Central",
        city="Glasgow",
        country="United Kingdom",
        latitude=55.8642,
        longitude=-4.2518,
    )
    db_session.add(loc)
    db_session.commit()
    db_session.refresh(loc)
    return loc


def test_preferences_api_endpoints(client: TestClient, auth_headers: dict):
    # 1. GET preferences
    res = client.get(f"{settings.API_V1_PREFIX}/users/me/preferences", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["temperature_unit"] == "C"

    # 2. PUT preferences
    put_res = client.put(
        f"{settings.API_V1_PREFIX}/users/me/preferences",
        headers=auth_headers,
        json={
            "temperature_unit": "F",
            "timezone": "Europe/London",
            "quiet_hours_enabled": True,
            "quiet_hours_start": "22:30",
            "quiet_hours_end": "07:15",
        },
    )
    assert put_res.status_code == 200
    updated = put_res.json()["data"]
    assert updated["temperature_unit"] == "F"
    assert updated["timezone"] == "Europe/London"
    assert updated["quiet_hours_enabled"] is True


def test_saved_locations_api_crud_and_isolation(
    client: TestClient, auth_headers: dict, other_auth_headers: dict, test_location: Location
):
    # 1. Save location
    post_res = client.post(
        f"{settings.API_V1_PREFIX}/users/me/locations",
        headers=auth_headers,
        json={
            "location_id": test_location.id,
            "custom_name": "My Workspace",
            "is_primary": True,
        },
    )
    assert post_res.status_code == 201
    saved_id = post_res.json()["data"]["id"]

    # 2. List saved locations
    list_res = client.get(f"{settings.API_V1_PREFIX}/users/me/locations", headers=auth_headers)
    assert list_res.status_code == 200
    items = list_res.json()["data"]
    assert len(items) >= 1
    assert items[0]["custom_name"] == "My Workspace"

    # 3. Privacy: other user cannot delete or access user's saved location
    del_unauthorized = client.delete(
        f"{settings.API_V1_PREFIX}/users/me/locations/{saved_id}",
        headers=other_auth_headers,
    )
    assert del_unauthorized.status_code == 404

    # 4. Authorized delete
    del_res = client.delete(
        f"{settings.API_V1_PREFIX}/users/me/locations/{saved_id}",
        headers=auth_headers,
    )
    assert del_res.status_code == 200
    assert del_res.json()["data"]["deleted_id"] == saved_id


def test_alert_rules_api_crud_and_isolation(
    client: TestClient, auth_headers: dict, other_auth_headers: dict, test_location: Location
):
    # 1. Create rule
    create_res = client.post(
        f"{settings.API_V1_PREFIX}/alerts/rules",
        headers=auth_headers,
        json={
            "location_id": test_location.id,
            "metric": "pm25",
            "threshold_value": 35.0,
            "comparison_operator": ">=",
            "cooldown_minutes": 30,
        },
    )
    assert create_res.status_code == 201
    rule_id = create_res.json()["data"]["id"]

    # 2. List rules
    list_res = client.get(f"{settings.API_V1_PREFIX}/alerts/rules", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) >= 1

    # 3. Update rule
    patch_res = client.patch(
        f"{settings.API_V1_PREFIX}/alerts/rules/{rule_id}",
        headers=auth_headers,
        json={"threshold_value": 45.0, "is_enabled": False},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["threshold_value"] == 45.0
    assert patch_res.json()["data"]["is_enabled"] is False

    # 4. Privacy: other user cannot delete this rule
    unauth_del = client.delete(
        f"{settings.API_V1_PREFIX}/alerts/rules/{rule_id}",
        headers=other_auth_headers,
    )
    assert unauth_del.status_code == 404

    # 5. Authorized delete
    del_res = client.delete(
        f"{settings.API_V1_PREFIX}/alerts/rules/{rule_id}",
        headers=auth_headers,
    )
    assert del_res.status_code == 200


def test_notifications_api_endpoints(client: TestClient, auth_headers: dict, db_session: Session, auth_user: User):
    # Seed an unread notification
    notif = Notification(
        user_id=auth_user.id,
        title="Test Critical Alert",
        message="PM2.5 elevated above threshold",
        severity="critical",
        is_read=False,
    )
    db_session.add(notif)
    db_session.commit()
    db_session.refresh(notif)

    # 1. Unread count
    count_res = client.get(f"{settings.API_V1_PREFIX}/notifications/unread-count", headers=auth_headers)
    assert count_res.status_code == 200
    assert count_res.json()["data"]["unread_count"] >= 1

    # 2. List notifications
    list_res = client.get(f"{settings.API_V1_PREFIX}/notifications", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) >= 1

    # 3. Mark read
    read_res = client.patch(
        f"{settings.API_V1_PREFIX}/notifications/{notif.id}/read",
        headers=auth_headers,
    )
    assert read_res.status_code == 200
    assert read_res.json()["data"]["is_read"] is True

    # 4. Mark all read
    mark_all_res = client.post(
        f"{settings.API_V1_PREFIX}/notifications/mark-all-read",
        headers=auth_headers,
    )
    assert mark_all_res.status_code == 200

    # 5. Delete notification
    del_res = client.delete(
        f"{settings.API_V1_PREFIX}/notifications/{notif.id}",
        headers=auth_headers,
    )
    assert del_res.status_code == 200


def test_recommendations_api_endpoints(
    client: TestClient, auth_headers: dict, test_location: Location, db_session: Session
):
    # Seed observation
    obs = PollutionObservation(
        location_id=test_location.id,
        observed_at=datetime.now(timezone.utc),
        aqi=55,
        aqi_scale="US_EPA",
        pm25=15.0,
        temperature=18.0,
        humidity=60.0,
        is_demo=False,
    )
    db_session.add(obs)
    db_session.commit()

    # 1. GET recommendations
    res = client.get(
        f"{settings.API_V1_PREFIX}/recommendations?location_id={test_location.id}",
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data["recommendations"]) >= 1
    assert data["city"] == "Glasgow"

    # 2. POST refresh
    refresh_res = client.post(
        f"{settings.API_V1_PREFIX}/recommendations/refresh?location_id={test_location.id}",
        headers=auth_headers,
    )
    assert refresh_res.status_code == 200
    assert len(refresh_res.json()["data"]["recommendations"]) >= 1


def test_push_subscription_api(client: TestClient, auth_headers: dict):
    # Subscribe
    sub_res = client.post(
        f"{settings.API_V1_PREFIX}/notifications/push/subscribe",
        headers=auth_headers,
        json={
            "endpoint": "https://push.example.com/test-endpoint",
            "p256dh_key": "BNcRdreAHzg...",
            "auth_key": "tBHItDYBs...",
        },
    )
    assert sub_res.status_code == 201
    assert sub_res.json()["data"]["status"] == "subscribed"

    # Unsubscribe
    unsub_res = client.delete(
        f"{settings.API_V1_PREFIX}/notifications/push/subscribe",
        headers=auth_headers,
    )
    assert unsub_res.status_code == 200
    assert unsub_res.json()["data"]["status"] == "unsubscribed"
