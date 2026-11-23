"""
AIRWISE AI — Module 09 Unit Tests
Tests for admin service metrics, user access guards, data quality reviews,
notification retry idempotency, and audit logging.
"""

from datetime import datetime, timezone
import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.environmental_review import EnvironmentalDataReview
from app.models.location import Location
from app.models.notification import Notification
from app.models.pollution import PollutionObservation
from app.models.user import User
from app.services.admin.admin_service import admin_service
from app.services.admin.audit_service import audit_service


@pytest.fixture
def admin_user(db_session: Session) -> User:
    admin = User(
        email="super.admin@airwise.ai",
        full_name="Super Administrator",
        role="ADMIN",
        is_active=True,
        is_verified=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture
def second_admin(db_session: Session) -> User:
    admin2 = User(
        email="backup.admin@airwise.ai",
        full_name="Backup Administrator",
        role="ADMIN",
        is_active=True,
        is_verified=True,
    )
    db_session.add(admin2)
    db_session.commit()
    db_session.refresh(admin2)
    return admin2


@pytest.fixture
def standard_user(db_session: Session) -> User:
    user = User(
        email="standard.user@airwise.ai",
        full_name="Standard Citizen",
        role="USER",
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_location(db_session: Session) -> Location:
    loc = Location(
        name="Manchester Central",
        city="Manchester",
        country="UK",
        latitude=53.4808,
        longitude=-2.2426,
    )
    db_session.add(loc)
    db_session.commit()
    db_session.refresh(loc)
    return loc


def test_dashboard_overview_and_activity_metrics(
    db_session: Session, admin_user: User, standard_user: User, test_location: Location
):
    # Seed observation
    obs = PollutionObservation(
        location_id=test_location.id,
        observed_at=datetime.now(timezone.utc),
        aqi=65,
        pm25=18.5,
        source="sensor_station",
        is_demo=False,
    )
    db_session.add(obs)

    # Seed notification
    notif = Notification(
        user_id=standard_user.id,
        title="Advisory Alert",
        message="AQI elevated",
        severity="advisory",
        delivery_status="delivered",
    )
    db_session.add(notif)
    db_session.commit()

    overview = admin_service.get_dashboard_overview(db_session)
    assert overview["metrics"]["total_users"] >= 2
    assert overview["metrics"]["active_users"] >= 2
    assert overview["metrics"]["total_observations"] >= 1
    assert overview["metrics"]["total_notifications"] >= 1
    assert overview["system_status"] in ("operational", "degraded")

    activity = admin_service.get_dashboard_activity(db_session, days=7)
    assert activity["range_days"] == 7
    assert len(activity["data_points"]) == 7


def test_user_status_self_deactivation_protection(
    db_session: Session, admin_user: User, standard_user: User
):
    # 1. Admin attempts to deactivate self -> Must fail with 400
    with pytest.raises(HTTPException) as exc_info:
        admin_service.update_user_status(db_session, admin_user, admin_user.id, is_active=False)
    assert exc_info.value.status_code == 400
    assert "cannot deactivate their own account" in str(exc_info.value.detail).lower()

    # 2. Admin deactivates regular user -> Succeeds
    updated_user = admin_service.update_user_status(
        db_session, admin_user, standard_user.id, is_active=False, reason="Terms violation"
    )
    assert updated_user["is_active"] is False


def test_last_active_admin_protection(
    db_session: Session, admin_user: User
):
    # Only 1 admin in DB right now
    # 1. Attempt to demote the sole admin -> Must fail
    with pytest.raises(HTTPException) as exc_demote:
        admin_service.update_user_role(db_session, admin_user, admin_user.id, new_role="USER")
    assert exc_demote.value.status_code == 400
    assert "cannot revoke their own admin role" in str(exc_demote.value.detail).lower()


def test_demote_admin_when_multiple_admins_exist(
    db_session: Session, admin_user: User, second_admin: User
):
    # Multiple admins exist, admin1 demotes admin2 -> Succeeds
    updated = admin_service.update_user_role(
        db_session, current_admin=admin_user, user_id=second_admin.id, new_role="USER", reason="Staff transition"
    )
    assert updated["role"] == "USER"


def test_observation_review_preserves_measurements_and_creates_audit(
    db_session: Session, admin_user: User, test_location: Location
):
    # 1. Create physical observation
    obs = PollutionObservation(
        location_id=test_location.id,
        observed_at=datetime.now(timezone.utc),
        aqi=140,
        aqi_scale="US_EPA",
        pm25=52.0,
        pm10=85.0,
        no2=30.0,
        source="sensor_alpha",
        is_demo=False,
    )
    db_session.add(obs)
    db_session.commit()
    db_session.refresh(obs)

    # 2. Admin marks observation as flagged
    reviewed = admin_service.review_observation(
        db_session,
        current_admin=admin_user,
        observation_id=obs.id,
        review_status="flagged",
        reason="Abnormal particulate spike during construction nearby",
    )

    # 3. Verify status updated
    assert reviewed["review_status"] == "flagged"
    assert reviewed["is_flagged"] is True
    assert reviewed["review_notes"] == "Abnormal particulate spike during construction nearby"
    assert reviewed["reviewed_by_email"] == admin_user.email

    # 4. STRICT REQUIREMENT: Physical readings must remain 100% untouched
    assert reviewed["pm25"] == 52.0
    assert reviewed["pm10"] == 85.0
    assert reviewed["aqi"] == 140

    # 5. Verify immutable review history recorded
    review_record = (
        db_session.query(EnvironmentalDataReview)
        .filter(EnvironmentalDataReview.observation_id == obs.id)
        .first()
    )
    assert review_record is not None
    assert review_record.new_status == "flagged"
    assert review_record.admin_id == admin_user.id


def test_notification_retry_idempotency_and_duplicate_prevention(
    db_session: Session, admin_user: User, standard_user: User
):
    # 1. Seed a failed notification
    failed_notif = Notification(
        user_id=standard_user.id,
        title="Failed Alert",
        message="Temporary upstream network drop",
        severity="critical",
        delivery_status="failed",
        failure_reason="SMTP socket timeout",
        retry_count=0,
    )
    db_session.add(failed_notif)
    db_session.commit()
    db_session.refresh(failed_notif)

    # 2. Retry failed notification -> Succeeds
    res = admin_service.retry_notification(db_session, admin_user, failed_notif.id)
    assert res["delivery_status"] == "delivered"
    assert res["retry_count"] == 1

    # 3. Duplicate delivery prevention: Retrying an already delivered notification must fail with 400
    with pytest.raises(HTTPException) as exc_dup:
        admin_service.retry_notification(db_session, admin_user, failed_notif.id)
    assert exc_dup.value.status_code == 400
    assert "already been delivered" in str(exc_dup.value.detail).lower()


def test_audit_service_secret_redaction_and_retrieval(
    db_session: Session, admin_user: User
):
    # Admin performs action with sensitive credentials in details dict
    entry = audit_service.log_action(
        db=db_session,
        admin_id=admin_user.id,
        action="CONFIG_UPDATE",
        target_type="system",
        target_id="settings",
        details={
            "app_name": "AIRWISE AI",
            "api_key": "AIzaSySecretKeyExample",
            "auth_token": "bearer.token.example",
            "safe_param": "high_contrast",
        },
    )

    # Verify sensitive fields were redacted
    assert entry.details["app_name"] == "AIRWISE AI"
    assert entry.details["api_key"] == "[REDACTED]"
    assert entry.details["auth_token"] == "[REDACTED]"
    assert entry.details["safe_param"] == "high_contrast"

    # Query audit logs
    logs, total = audit_service.get_audit_logs(db_session, action="CONFIG_UPDATE")
    assert total >= 1
    assert logs[0]["action"] == "CONFIG_UPDATE"
    assert logs[0]["admin_email"] == admin_user.email
