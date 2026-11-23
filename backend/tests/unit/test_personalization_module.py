"""
AIRWISE AI — Module 08 Unit Tests
Tests for preferences, saved locations, alert rules, evaluation engine, notification dispatch, and recommendations.
"""

from datetime import datetime, timedelta, timezone
import pytest
from sqlalchemy.orm import Session
from app.models.alert import AlertRule
from app.models.location import Location
from app.models.notification import Notification
from app.models.pollution import PollutionObservation
from app.models.user import User
from app.models.user_preference import UserPreference
from app.notifications.services.notification_service import notification_service
from app.schemas.personalization import (
    AlertRuleCreate,
    AlertRuleUpdate,
    SavedLocationCreate,
    SavedLocationUpdate,
    UserPreferencesUpdate,
)
from app.services.alert_service import alert_service
from app.services.preference_service import preference_service
from app.services.recommendation_service import recommendation_service
from app.services.saved_location_service import saved_location_service


@pytest.fixture
def test_user(db_session: Session) -> User:
    user = User(
        email="test_personalization@airwise.ai",
        full_name="Personalization Tester",
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
        name="Test Sensor Alpha",
        city="Bristol",
        country="United Kingdom",
        latitude=51.4545,
        longitude=-2.5879,
    )
    db_session.add(loc)
    db_session.commit()
    db_session.refresh(loc)
    return loc


def test_preference_service_defaults_and_updates(db_session: Session, test_user: User):
    # 1. Get or create defaults
    pref = preference_service.get_or_create_preferences(db_session, test_user.id)
    assert pref.user_id == test_user.id
    assert pref.temperature_unit == "C"
    assert pref.preferred_aqi_scale == "US_EPA"
    assert "air_pollution" in pref.environmental_interests
    assert pref.quiet_hours_enabled is False

    # 2. Update preferences
    update_payload = UserPreferencesUpdate(
        temperature_unit="F",
        preferred_aqi_scale="IN_NAAQS",
        quiet_hours_enabled=True,
        quiet_hours_start="23:00",
        quiet_hours_end="06:30",
        environmental_interests=["noise_pollution", "sustainable_living"],
    )
    updated = preference_service.update_preferences(db_session, test_user.id, update_payload)
    assert updated.temperature_unit == "F"
    assert updated.preferred_aqi_scale == "IN_NAAQS"
    assert updated.quiet_hours_enabled is True
    assert updated.quiet_hours_start == "23:00"
    assert "noise_pollution" in updated.environmental_interests


def test_saved_location_service_operations(db_session: Session, test_user: User, test_location: Location):
    # 1. Add saved location
    payload = SavedLocationCreate(
        location_id=test_location.id,
        custom_name="Home Station",
        is_primary=True,
    )
    saved = saved_location_service.add_saved_location(db_session, test_user.id, payload)
    assert saved.custom_name == "Home Station"
    assert saved.is_primary is True

    # 2. Retrieve list
    loc_list = saved_location_service.get_saved_locations(db_session, test_user.id)
    assert len(loc_list) == 1
    assert loc_list[0].city == "Bristol"
    assert loc_list[0].custom_name == "Home Station"

    # 3. Update saved location
    update_payload = SavedLocationUpdate(custom_name="Office Station", is_primary=False)
    updated = saved_location_service.update_saved_location(db_session, test_user.id, saved.id, update_payload)
    assert updated.custom_name == "Office Station"
    assert updated.is_primary is False

    # 4. Delete saved location
    deleted = saved_location_service.delete_saved_location(db_session, test_user.id, saved.id)
    assert deleted is True
    assert len(saved_location_service.get_saved_locations(db_session, test_user.id)) == 0


@pytest.mark.asyncio
async def test_alert_rule_evaluation_threshold_triggered(db_session: Session, test_user: User, test_location: Location):
    # 1. Configure alert rule: AQI >= 100 with US_EPA scale
    rule_payload = AlertRuleCreate(
        location_id=test_location.id,
        metric="aqi",
        threshold_value=100.0,
        comparison_operator=">=",
        aqi_scale="US_EPA",
        cooldown_minutes=60,
        is_enabled=True,
        notification_channels=["in_app"],
    )
    rule = alert_service.create_rule(db_session, test_user.id, rule_payload)
    assert rule.id is not None

    # 2. Create real observation that breaches threshold (AQI=140)
    obs = PollutionObservation(
        location_id=test_location.id,
        observed_at=datetime.now(timezone.utc),
        aqi=140,
        aqi_scale="US_EPA",
        pm25=52.0,
        pm10=80.0,
        is_demo=False,
    )
    db_session.add(obs)
    db_session.commit()

    # 3. Evaluate observation
    notifs = await alert_service.evaluate_observation(db_session, obs)
    assert len(notifs) == 1
    notif = notifs[0]
    assert notif.user_id == test_user.id
    assert notif.severity == "advisory"
    assert notif.metric == "aqi"
    assert notif.value == 140.0
    assert notif.is_read is False

    # Verify rule last_triggered_at was set
    db_session.refresh(rule)
    assert rule.last_triggered_at is not None


@pytest.mark.asyncio
async def test_alert_rule_scale_incompatibility_skipped(db_session: Session, test_user: User, test_location: Location):
    # Configure rule with US_EPA scale
    rule_payload = AlertRuleCreate(
        location_id=test_location.id,
        metric="aqi",
        threshold_value=100.0,
        comparison_operator=">=",
        aqi_scale="US_EPA",
        cooldown_minutes=60,
        is_enabled=True,
    )
    rule = alert_service.create_rule(db_session, test_user.id, rule_payload)

    # Create observation calculated under Indian NAAQS scale
    obs = PollutionObservation(
        location_id=test_location.id,
        observed_at=datetime.now(timezone.utc),
        aqi=250,
        aqi_scale="IN_NAAQS",
        is_demo=False,
    )
    db_session.add(obs)
    db_session.commit()

    # Evaluation should skip due to scale divergence
    notifs = await alert_service.evaluate_observation(db_session, obs)
    assert len(notifs) == 0


@pytest.mark.asyncio
async def test_alert_rule_cooldown_suppression(db_session: Session, test_user: User, test_location: Location):
    # Rule with 60-min cooldown that was triggered 10 mins ago
    rule = AlertRule(
        user_id=test_user.id,
        location_id=test_location.id,
        metric="pm25",
        threshold_value=35.0,
        comparison_operator=">=",
        cooldown_minutes=60,
        last_triggered_at=datetime.now(timezone.utc) - timedelta(minutes=10),
        is_enabled=True,
    )
    db_session.add(rule)
    db_session.commit()

    obs = PollutionObservation(
        location_id=test_location.id,
        observed_at=datetime.now(timezone.utc),
        pm25=60.0,
        is_demo=False,
    )
    db_session.add(obs)
    db_session.commit()

    # In cooldown: should generate 0 notifications
    notifs = await alert_service.evaluate_observation(db_session, obs)
    assert len(notifs) == 0


@pytest.mark.asyncio
async def test_alert_rule_demo_and_missing_data_exclusion(db_session: Session, test_user: User, test_location: Location):
    rule = AlertRule(
        user_id=test_user.id,
        location_id=test_location.id,
        metric="pm10",
        threshold_value=50.0,
        comparison_operator=">=",
        is_enabled=True,
    )
    db_session.add(rule)
    db_session.commit()

    # 1. Demo data observation: should be excluded
    demo_obs = PollutionObservation(
        location_id=test_location.id,
        observed_at=datetime.now(timezone.utc),
        pm10=200.0,
        is_demo=True,
    )
    db_session.add(demo_obs)
    db_session.commit()
    notifs = await alert_service.evaluate_observation(db_session, demo_obs)
    assert len(notifs) == 0

    # 2. Missing metric observation (pm10=None)
    missing_obs = PollutionObservation(
        location_id=test_location.id,
        observed_at=datetime.now(timezone.utc),
        pm10=None,
        is_demo=False,
    )
    db_session.add(missing_obs)
    db_session.commit()
    notifs2 = await alert_service.evaluate_observation(db_session, missing_obs)
    assert len(notifs2) == 0


def test_notification_service_read_and_unread_counts(db_session: Session, test_user: User):
    # 1. Create two unread notifications
    n1 = Notification(
        user_id=test_user.id,
        title="Alert 1",
        message="Message 1",
        severity="high",
        is_read=False,
    )
    n2 = Notification(
        user_id=test_user.id,
        title="Alert 2",
        message="Message 2",
        severity="advisory",
        is_read=False,
    )
    db_session.add_all([n1, n2])
    db_session.commit()

    # Count
    count = notification_service.get_unread_count(db_session, test_user.id)
    assert count == 2

    # Mark one as read
    notification_service.mark_as_read(db_session, test_user.id, n1.id)
    assert notification_service.get_unread_count(db_session, test_user.id) == 1

    # Mark all read
    notification_service.mark_all_as_read(db_session, test_user.id)
    assert notification_service.get_unread_count(db_session, test_user.id) == 0

    # Delete notification
    deleted = notification_service.delete_notification(db_session, test_user.id, n1.id)
    assert deleted is True


@pytest.mark.asyncio
async def test_recommendation_service_fallback_and_caching(db_session: Session, test_user: User, test_location: Location):
    # Create observation
    obs = PollutionObservation(
        location_id=test_location.id,
        observed_at=datetime.now(timezone.utc),
        aqi=45,
        aqi_scale="US_EPA",
        pm25=10.0,
        pm10=20.0,
        temperature=21.0,
        humidity=45.0,
        is_demo=False,
    )
    db_session.add(obs)
    db_session.commit()

    # Generate recommendations (will fall back to deterministic clinical guidelines in test env)
    recs = await recommendation_service.get_personalized_recommendations(
        db_session, test_user, location_id=test_location.id, force_refresh=True
    )
    assert recs.user_id == test_user.id
    assert recs.city == "Bristol"
    assert len(recs.recommendations) >= 2
    assert any("outdoor" in r.category.lower() or "ventilation" in r.category.lower() for r in recs.recommendations)

    # Second call without force_refresh should hit cache
    cached_recs = await recommendation_service.get_personalized_recommendations(
        db_session, test_user, location_id=test_location.id, force_refresh=False
    )
    assert cached_recs.is_cached is True
