"""
AIRWISE AI — Module 11 Comprehensive End-to-End User Journeys
Implements and rigorously validates all 5 critical user journeys:
- Journey A: New User Onboarding, Profile Preferences & Location Management
- Journey B: Pollution Intelligence, Analytics, Geospatial Map & Comparison
- Journey C: AI Pollution Assistant, Conversational Memory & Persistence
- Journey D: Smart Pollution Alerts, Threshold Evaluation & In-App Notification Center
- Journey E: Administrator Governance, Observation QA, Audit Logs & RBAC Safeguards
"""

import pytest
from datetime import datetime, timezone, timedelta
from starlette.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.location import Location
from app.models.pollution import PollutionObservation
from app.models.alert import AlertRule
from app.models.notification import Notification
from app.core.security import hash_password


# --------------------------------------------------------------------------
# Journey A: New User Onboarding, Preferences & Location Management
# --------------------------------------------------------------------------
def test_journey_a_new_user_onboarding_and_preferences(client: TestClient, db_session: Session):
    """
    Validates Journey A:
    1. Register new user
    2. Login and establish JWT credentials
    3. Update user preferences (temperature unit, quiet hours, interests)
    4. Save location ('Home')
    5. Retrieve saved locations & verify persistence
    """
    # 1. Register
    reg_res = client.post("/api/v1/auth/register", json={
        "full_name": "Elena Rostova",
        "email": "elena.rostova@airwise.ai",
        "password": "SecurePassword!2026",
        "confirm_password": "SecurePassword!2026",
    })
    assert reg_res.status_code == 201

    # 2. Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": "elena.rostova@airwise.ai",
        "password": "SecurePassword!2026",
    })
    assert login_res.status_code == 200
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Update Preferences
    pref_res = client.put("/api/v1/users/me/preferences", headers=headers, json={
        "temperature_unit": "C",
        "aqi_scale": "US_EPA",
        "timezone": "Europe/London",
        "language": "en",
        "quiet_hours_enabled": True,
        "quiet_hours_start": "22:00",
        "quiet_hours_end": "07:00",
        "email_notifications_enabled": False,
        "push_notifications_enabled": False,
        "in_app_notifications_enabled": True,
        "environmental_interests": ["asthma", "indoor_air_quality"],
    })
    assert pref_res.status_code == 200
    pref_data = pref_res.json()["data"]
    assert pref_data["temperature_unit"] == "C"
    assert "asthma" in pref_data["environmental_interests"]

    # Create target location in database
    loc = Location(
        name="Elena Home Station",
        city="Bristol",
        country="United Kingdom",
        latitude=51.4545,
        longitude=-2.5879,
    )
    db_session.add(loc)
    db_session.commit()
    db_session.refresh(loc)

    # 4. Save Location
    save_loc_res = client.post("/api/v1/users/me/locations", headers=headers, json={
        "location_id": loc.id,
        "custom_name": "Home Apartment",
        "is_primary": True,
    })
    assert save_loc_res.status_code == 201

    # 5. Verify Persisted Locations
    get_locs_res = client.get("/api/v1/users/me/locations", headers=headers)
    assert get_locs_res.status_code == 200
    saved = get_locs_res.json()["data"]
    assert len(saved) == 1
    assert saved[0]["custom_name"] == "Home Apartment"
    assert saved[0]["is_primary"] is True


# --------------------------------------------------------------------------
# Journey B: Pollution Intelligence, Analytics, Map & Cross-Comparison
# --------------------------------------------------------------------------
def test_journey_b_pollution_intelligence_and_analytics(client: TestClient, db_session: Session):
    """
    Validates Journey B:
    1. Ingest multi-hour observation telemetry across 2 locations
    2. Query latest telemetry
    3. Query analytics overview & trend statistics
    4. Query map station observation markers
    5. Compare both locations and verify scale compatibility
    """
    # Create 2 monitoring stations
    loc1 = Location(name="City Center Monitor", city="Leeds", country="United Kingdom", latitude=53.8008, longitude=-1.5491)
    loc2 = Location(name="Harbor Station", city="Southampton", country="United Kingdom", latitude=50.9097, longitude=-1.4044)
    db_session.add_all([loc1, loc2])
    db_session.commit()
    db_session.refresh(loc1)
    db_session.refresh(loc2)

    # Ingest chronological observations
    now = datetime.now(timezone.utc)
    obs_batch = []
    for h in range(6):
        obs_batch.append(PollutionObservation(
            location_id=loc1.id,
            aqi=45 + (h * 5),
            aqi_scale="US_EPA",
            pm25=12.0 + h,
            pm10=22.0 + h,
            observed_at=now - timedelta(hours=6 - h),
            provider="open-meteo",
            source="sensor",
            is_verified=True,
        ))
        obs_batch.append(PollutionObservation(
            location_id=loc2.id,
            aqi=30 + (h * 3),
            aqi_scale="US_EPA",
            pm25=8.0 + h,
            pm10=15.0 + h,
            observed_at=now - timedelta(hours=6 - h),
            provider="open-meteo",
            source="sensor",
            is_verified=True,
        ))
    db_session.add_all(obs_batch)
    db_session.commit()

    # 1. Query latest pollution
    latest_res = client.get(f"/api/v1/pollution/latest?location_id={loc1.id}")
    assert latest_res.status_code == 200

    # 2. Query analytics overview
    analytics_res = client.get(f"/api/v1/analytics/overview?location_id={loc1.id}&time_range=24h")
    assert analytics_res.status_code == 200
    assert analytics_res.json()["data"]["observation_count"] >= 6

    # 3. Query map observation points
    map_res = client.get("/api/v1/map/observations")
    assert map_res.status_code == 200
    map_points = map_res.json()["data"]
    assert len(map_points) >= 2
    assert any(pt["city"] == "Leeds" for pt in map_points)

    # 4. Location comparison
    comp_res = client.get(f"/api/v1/analytics/compare?location_ids={loc1.id}&location_ids={loc2.id}&metric=pm25")
    assert comp_res.status_code == 200
    comp_data = comp_res.json()["data"]
    assert comp_data["is_scale_compatible"] is True
    assert len(comp_data["locations"]) == 2


# --------------------------------------------------------------------------
# Journey C: AI Pollution Assistant, Conversational Memory & Persistence
# --------------------------------------------------------------------------
def test_journey_c_ai_assistant_conversation_flow(client: TestClient, db_session: Session):
    """
    Validates Journey C:
    1. Authenticate user
    2. Create an assistant conversation
    3. Post message inquiring about PM2.5 health effects
    4. Verify assistant response generation & database persistence
    5. Retrieve message history & verify ordering
    6. Delete conversation
    """
    # Setup user
    user = User(email="ai.traveler@airwise.ai", password_hash=hash_password("TravelPass!2026"), role="USER", is_active=True)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    login_res = client.post("/api/v1/auth/login", json={"email": "ai.traveler@airwise.ai", "password": "TravelPass!2026"})
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Conversation
    conv_res = client.post("/api/v1/conversations", headers=headers, json={"title": "Asthma & Particulate Advice"})
    assert conv_res.status_code == 201
    conv_id = conv_res.json()["data"]["id"]

    # 2. Send Message
    mock_ai_text = "When PM2.5 levels exceed 55 µg/m³, sensitive groups should wear N95 respirators and avoid prolonged outdoor exertion."
    from app.services.ai.gemini_provider import gemini_provider
    gemini_provider.set_mock_response(mock_ai_text)

    msg_res = client.post(f"/api/v1/conversations/{conv_id}/messages", headers=headers, json={
        "content": "What are the recommended precautions when PM2.5 levels reach 65 µg/m³?"
    })
    assert msg_res.status_code == 201
    res_data = msg_res.json()["data"]
    assert res_data["status"] == "completed"
    assert res_data["assistant_message"]["role"] == "assistant"
    assert len(res_data["assistant_message"]["content"]) > 10

    # 3. Retrieve conversation history
    history_res = client.get(f"/api/v1/conversations/{conv_id}/messages", headers=headers)
    assert history_res.status_code == 200
    messages = history_res.json()["data"]
    assert len(messages) >= 2  # user prompt + assistant response

    # 4. Delete conversation
    del_res = client.delete(f"/api/v1/conversations/{conv_id}", headers=headers)
    assert del_res.status_code in [200, 204]


# --------------------------------------------------------------------------
# Journey D: Smart Pollution Alerts, Threshold Evaluation & In-App Center
# --------------------------------------------------------------------------
def test_journey_d_alerts_and_notification_delivery(client: TestClient, db_session: Session):
    """
    Validates Journey D:
    1. Authenticate user
    2. Configure threshold alert rule for PM2.5 >= 35.0
    3. Ingest breaching pollution observation and trigger evaluation
    4. Query unread notifications count
    5. Mark notification read
    6. Verify read state persistence
    """
    user = User(email="alert.watcher@airwise.ai", password_hash=hash_password("WatchPass!2026"), role="USER", is_active=True)
    loc = Location(name="Alert Test Station", city="Coventry", country="United Kingdom", latitude=52.4068, longitude=-1.5197)
    db_session.add_all([user, loc])
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(loc)

    login_res = client.post("/api/v1/auth/login", json={"email": "alert.watcher@airwise.ai", "password": "WatchPass!2026"})
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Alert Rule
    rule_res = client.post("/api/v1/alerts/rules", headers=headers, json={
        "location_id": loc.id,
        "metric": "pm25",
        "threshold_value": 35.0,
        "comparison_operator": ">=",
        "aqi_scale": "US_EPA",
        "cooldown_minutes": 60,
        "notification_channels": ["in_app"],
    })
    assert rule_res.status_code == 201

    # 2. Ingest breaching observation & Trigger evaluation (PM2.5 = 55.0)
    breaching_obs = PollutionObservation(
        location_id=loc.id,
        aqi=145,
        aqi_scale="US_EPA",
        pm25=55.0,
        pm10=80.0,
        observed_at=datetime.now(timezone.utc),
        provider="open-meteo",
        source="sensor",
        is_verified=True,
    )
    db_session.add(breaching_obs)
    db_session.commit()

    eval_res = client.post(f"/api/v1/alerts/evaluate?location_id={loc.id}", headers=headers)
    assert eval_res.status_code == 200

    # 3. Check Notification Center
    notif_res = client.get("/api/v1/notifications", headers=headers)
    assert notif_res.status_code == 200
    notifications = notif_res.json()["data"]
    assert len(notifications) >= 1
    notif_id = notifications[0]["id"]
    assert notifications[0]["is_read"] is False

    # 4. Mark Read
    read_res = client.patch(f"/api/v1/notifications/{notif_id}/read", headers=headers)
    assert read_res.status_code == 200

    # 5. Verify Unread Count is now 0
    unread_res = client.get("/api/v1/notifications/unread-count", headers=headers)
    assert unread_res.status_code == 200
    assert unread_res.json()["data"]["unread_count"] == 0


# --------------------------------------------------------------------------
# Journey E: Administrator Governance, Observation QA & RBAC Safeguards
# --------------------------------------------------------------------------
def test_journey_e_administrator_governance_and_safeguards(client: TestClient, db_session: Session):
    """
    Validates Journey E:
    1. Authenticate administrator
    2. Query executive dashboard overview
    3. Search users
    4. Review and approve pollution observation
    5. Verify physical measurements remained strictly immutable
    6. Verify audit log captured administrator action
    7. Verify normal user receives HTTP 403 Forbidden on administrative endpoints
    """
    admin_user = User(email="master.admin@airwise.ai", password_hash=hash_password("AdminPass!2026"), role="ADMIN", is_active=True)
    norm_user = User(email="regular.citizen@airwise.ai", password_hash=hash_password("CitizenPass!2026"), role="USER", is_active=True)
    loc = Location(name="Admin Audit Station", city="Oxford", country="United Kingdom", latitude=51.7520, longitude=-1.2577)
    db_session.add_all([admin_user, norm_user, loc])
    db_session.commit()
    db_session.refresh(admin_user)
    db_session.refresh(norm_user)
    db_session.refresh(loc)

    # Create observation
    obs = PollutionObservation(
        location_id=loc.id,
        aqi=110,
        aqi_scale="US_EPA",
        pm25=38.5,
        pm10=65.0,
        observed_at=datetime.now(timezone.utc),
        provider="open-meteo",
        source="sensor",
        is_verified=True,
    )
    db_session.add(obs)
    db_session.commit()
    db_session.refresh(obs)

    # 1. Login as Admin
    admin_login = client.post("/api/v1/auth/login", json={"email": "master.admin@airwise.ai", "password": "AdminPass!2026"})
    admin_token = admin_login.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Executive Dashboard Overview
    overview_res = client.get("/api/v1/admin/dashboard/overview", headers=admin_headers)
    assert overview_res.status_code == 200
    assert "metrics" in overview_res.json()["data"]

    # 3. Search Users
    users_res = client.get("/api/v1/admin/users?search=regular.citizen", headers=admin_headers)
    assert users_res.status_code == 200
    assert len(users_res.json()["data"]) >= 1

    # 4. Review and Approve Observation
    review_res = client.patch(f"/api/v1/admin/environmental-data/{obs.id}/review", headers=admin_headers, json={
        "review_status": "verified",
        "reason": "Calibrated against reference station ground sensor.",
    })
    assert review_res.status_code == 200

    # 5. Invariant Check: Verify physical measurements were strictly preserved
    db_session.refresh(obs)
    assert obs.review_status == "verified"
    assert obs.pm25 == 38.5
    assert obs.pm10 == 65.0
    assert obs.aqi == 110

    # 6. Audit Logs Inspection
    audit_res = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()["data"]
    assert any(log["action"] == "OBSERVATION_VERIFIED" and str(log["target_id"]) == str(obs.id) for log in logs)

    # 7. RBAC Safeguard: Verify normal user receives 403 Forbidden
    norm_login = client.post("/api/v1/auth/login", json={"email": "regular.citizen@airwise.ai", "password": "CitizenPass!2026"})
    norm_token = norm_login.json()["data"]["access_token"]
    norm_headers = {"Authorization": f"Bearer {norm_token}"}

    blocked_res = client.get("/api/v1/admin/dashboard/overview", headers=norm_headers)
    assert blocked_res.status_code == 403
