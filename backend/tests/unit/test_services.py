"""
AIRWISE AI — Unit Tests for Service Layer Business Logic
"""

import pytest
from datetime import datetime, timezone
from app.core.exceptions import AirwiseException
from app.schemas.location import LocationCreate
from app.schemas.pollution import PollutionObservationCreate
from app.services.location_service import location_service
from app.services.pollution_service import pollution_service


def test_location_service_create_and_duplicate(db_session):
    loc_in = LocationCreate(
        name="Connaught Place Air Station",
        city="New Delhi",
        country="India",
        latitude=28.6315,
        longitude=77.2167,
    )
    loc = location_service.create_location(db_session, loc_in)
    assert loc.id is not None
    assert loc.city == "New Delhi"

    # Attempt duplicate creation
    with pytest.raises(AirwiseException) as exc:
        location_service.create_location(db_session, loc_in)
    assert exc.value.code == "LOCATION_ALREADY_EXISTS"


def test_pollution_service_invalid_location(db_session):
    obs_in = PollutionObservationCreate(
        location_id=999999,  # Non-existent
        aqi=150,
        pm25=55.4,
        observed_at=datetime.now(timezone.utc),
    )
    with pytest.raises(AirwiseException) as exc:
        pollution_service.create_observation(db_session, obs_in)
    assert exc.value.code == "LOCATION_NOT_FOUND"
