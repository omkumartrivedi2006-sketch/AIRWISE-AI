"""
AIRWISE AI — Unit Tests for Service Layer Edge Cases & Boundary Conditions
Validates boundary values, default states, error conditions, and deterministic logic.
"""

import pytest
from fastapi import HTTPException
from app.models.location import Location
from app.models.user import User
from app.schemas.personalization import SavedLocationCreate, UserPreferencesUpdate
from app.services.saved_location_service import SavedLocationService
from app.services.preference_service import PreferenceService
from app.services.recommendation_service import RecommendationService


def test_derive_aqi_category_boundaries():
    """Verify exact categorical thresholds for AQI values."""
    assert RecommendationService._derive_aqi_category(None) is None
    assert RecommendationService._derive_aqi_category(0) == "Good"
    assert RecommendationService._derive_aqi_category(50) == "Good"
    assert RecommendationService._derive_aqi_category(51) == "Moderate"
    assert RecommendationService._derive_aqi_category(100) == "Moderate"
    assert RecommendationService._derive_aqi_category(101) == "Unhealthy for Sensitive Groups"
    assert RecommendationService._derive_aqi_category(150) == "Unhealthy for Sensitive Groups"
    assert RecommendationService._derive_aqi_category(151) == "Unhealthy"
    assert RecommendationService._derive_aqi_category(200) == "Unhealthy"
    assert RecommendationService._derive_aqi_category(201) == "Very Unhealthy"
    assert RecommendationService._derive_aqi_category(300) == "Very Unhealthy"
    assert RecommendationService._derive_aqi_category(301) == "Hazardous"
    assert RecommendationService._derive_aqi_category(500) == "Hazardous"
    assert RecommendationService._derive_aqi_category(999) == "Hazardous"


def test_saved_location_service_edge_cases(db_session):
    """Test saved location operations including primary toggling, duplicates, and deletions."""
    # Create test user & locations
    user = User(
        email="test_service_user@airwise.ai",
        full_name="Service Tester",
        role="USER",
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()

    loc1 = Location(
        name="Station Central",
        city="Ahmedabad",
        country="India",
        latitude=23.0225,
        longitude=72.5714,
    )
    loc2 = Location(
        name="Station North",
        city="Gandhinagar",
        country="India",
        latitude=23.2156,
        longitude=72.6369,
    )
    db_session.add(loc1)
    db_session.add(loc2)
    db_session.commit()

    # 1. Empty state
    initial_saved = SavedLocationService.get_saved_locations(db_session, user.id)
    assert len(initial_saved) == 0

    # 2. Add first location as primary
    item1 = SavedLocationService.add_saved_location(
        db_session,
        user.id,
        SavedLocationCreate(location_id=loc1.id, custom_name="Home Station", is_primary=True),
    )
    assert item1.id is not None
    assert item1.is_primary is True

    # 3. Add duplicate location -> should update custom_name idempotently without error
    dup = SavedLocationService.add_saved_location(
        db_session,
        user.id,
        SavedLocationCreate(location_id=loc1.id, custom_name="Home Updated"),
    )
    assert dup.id == item1.id
    assert dup.custom_name == "Home Updated"

    # 4. Add second location as primary -> should automatically demote first
    item2 = SavedLocationService.add_saved_location(
        db_session,
        user.id,
        SavedLocationCreate(location_id=loc2.id, custom_name="Office Station", is_primary=True),
    )
    assert item2.is_primary is True

    all_saved = SavedLocationService.get_saved_locations(db_session, user.id)
    assert len(all_saved) == 2
    # Verify primary status: item2 is primary, item1 is not
    saved_dict = {s.location_id: s.is_primary for s in all_saved}
    assert saved_dict[loc2.id] is True
    assert saved_dict[loc1.id] is False

    # 5. Delete location -> returns True
    deleted = SavedLocationService.delete_saved_location(db_session, user.id, item1.id)
    assert deleted is True
    remaining = SavedLocationService.get_saved_locations(db_session, user.id)
    assert len(remaining) == 1
    assert remaining[0].location_id == loc2.id

    # 6. Delete non-existent location -> returns False
    not_found_delete = SavedLocationService.delete_saved_location(db_session, user.id, 999999)
    assert not_found_delete is False


def test_preference_service_lifecycle(db_session):
    """Test preference creation, default generation, and updates."""
    user = User(
        email="pref_test_user@airwise.ai",
        full_name="Pref Tester",
        role="USER",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    # Get preferences (should automatically initialize default if none exist)
    prefs = PreferenceService.get_or_create_preferences(db_session, user.id)
    assert prefs.user_id == user.id
    assert prefs.email_notifications is False
    assert prefs.temperature_unit == "C"

    # Update preferences
    updated = PreferenceService.update_preferences(
        db_session,
        user.id,
        UserPreferencesUpdate(
            temperature_unit="F",
            email_notifications=True,
            preferred_aqi_scale="IN_NAAQS",
        ),
    )
    assert updated.temperature_unit == "F"
    assert updated.email_notifications is True
    assert updated.preferred_aqi_scale == "IN_NAAQS"
