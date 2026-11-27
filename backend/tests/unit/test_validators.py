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
    # Valid exact boundaries
    validate_coordinates(28.6139, 77.2090)
    validate_coordinates(-90.0, -180.0)
    validate_coordinates(90.0, 180.0)
    validate_coordinates(0.0, 0.0)

    # Invalid latitude boundaries
    with pytest.raises(ValueError, match="Latitude"):
        validate_coordinates(90.0001, 0.0)
    with pytest.raises(ValueError, match="Latitude"):
        validate_coordinates(-90.0001, 0.0)
    with pytest.raises(ValueError, match="Latitude"):
        validate_coordinates(91.0, 0.0)
    with pytest.raises(ValueError, match="Latitude"):
        validate_coordinates(-90.5, 0.0)

    # Invalid longitude boundaries
    with pytest.raises(ValueError, match="Longitude"):
        validate_coordinates(0.0, 180.0001)
    with pytest.raises(ValueError, match="Longitude"):
        validate_coordinates(0.0, -180.0001)
    with pytest.raises(ValueError, match="Longitude"):
        validate_coordinates(0.0, 181.0)
    with pytest.raises(ValueError, match="Longitude"):
        validate_coordinates(0.0, -180.5)


def test_validate_measurement_ranges():
    # Valid boundary limits
    assert validate_aqi(0) == 0
    assert validate_aqi(500) == 500
    assert validate_pm25(0.0) == 0.0
    assert validate_pm25(1000.0) == 1000.0
    assert validate_pm10(0.0) == 0.0
    assert validate_pm10(1500.0) == 1500.0
    assert validate_temperature(-60.0) == -60.0
    assert validate_temperature(65.0) == 65.0
    assert validate_humidity(0.0) == 0.0
    assert validate_humidity(100.0) == 100.0
    assert validate_rating(1) == 1
    assert validate_rating(5) == 5

    # None / Empty input handling
    assert validate_aqi(None) is None
    assert validate_pm25(None) is None
    assert validate_pm10(None) is None
    assert validate_temperature(None) is None
    assert validate_humidity(None) is None

    # Out of range lower bounds
    with pytest.raises(ValueError, match="AQI"):
        validate_aqi(-1)
    with pytest.raises(ValueError, match="PM2.5"):
        validate_pm25(-0.1)
    with pytest.raises(ValueError, match="PM10"):
        validate_pm10(-0.1)
    with pytest.raises(ValueError, match="Temperature"):
        validate_temperature(-60.1)
    with pytest.raises(ValueError, match="Relative humidity"):
        validate_humidity(-0.1)
    with pytest.raises(ValueError, match="Rating"):
        validate_rating(0)

    # Out of range upper bounds
    with pytest.raises(ValueError, match="AQI"):
        validate_aqi(501)
    with pytest.raises(ValueError, match="PM2.5"):
        validate_pm25(1000.1)
    with pytest.raises(ValueError, match="PM10"):
        validate_pm10(1500.1)
    with pytest.raises(ValueError, match="Temperature"):
        validate_temperature(65.1)
    with pytest.raises(ValueError, match="Relative humidity"):
        validate_humidity(100.1)
    with pytest.raises(ValueError, match="Rating"):
        validate_rating(6)
