"""
AIRWISE AI — Unit Tests for Input & Measurement Validators
"""

import pytest
from app.utils.validators import (
    validate_aqi,
    validate_coordinates,
    validate_humidity,
    validate_pm10,
    validate_pm25,
    validate_rating,
    validate_temperature,
)


def test_validate_coordinates():
    # Valid
    validate_coordinates(28.6139, 77.2090)
    validate_coordinates(-90.0, -180.0)
    validate_coordinates(90.0, 180.0)

    # Invalid latitude
    with pytest.raises(ValueError, match="Latitude"):
        validate_coordinates(91.0, 0.0)
    with pytest.raises(ValueError, match="Latitude"):
        validate_coordinates(-90.5, 0.0)

    # Invalid longitude
    with pytest.raises(ValueError, match="Longitude"):
        validate_coordinates(0.0, 181.0)
    with pytest.raises(ValueError, match="Longitude"):
        validate_coordinates(0.0, -180.5)


def test_validate_measurement_ranges():
    # Valid
    assert validate_aqi(0) == 0
    assert validate_aqi(500) == 500
    assert validate_pm25(15.5) == 15.5
    assert validate_pm10(45.0) == 45.0
    assert validate_temperature(-10.0) == -10.0
    assert validate_humidity(55.0) == 55.0
    assert validate_rating(5) == 5

    # Out of range
    with pytest.raises(ValueError, match="AQI"):
        validate_aqi(501)
    with pytest.raises(ValueError, match="PM2.5"):
        validate_pm25(1001.0)
    with pytest.raises(ValueError, match="PM10"):
        validate_pm10(-1.0)
    with pytest.raises(ValueError, match="Temperature"):
        validate_temperature(75.0)
    with pytest.raises(ValueError, match="Relative humidity"):
        validate_humidity(105.0)
    with pytest.raises(ValueError, match="Rating"):
        validate_rating(6)
