"""
AIRWISE AI — Validation Utilities
Ensures strict validation of coordinates, measurement ranges, and input formats.
"""

from typing import Optional


def validate_coordinates(latitude: float, longitude: float) -> None:
    """Validate that latitude and longitude fall within geographical boundaries."""
    if not (-90.0 <= latitude <= 90.0):
        raise ValueError("Latitude must be between -90.0 and 90.0 degrees.")
    if not (-180.0 <= longitude <= 180.0):
        raise ValueError("Longitude must be between -180.0 and 180.0 degrees.")


def validate_aqi(aqi: Optional[int]) -> Optional[int]:
    """Validate AQI index value."""
    if aqi is not None and not (0 <= aqi <= 500):
        raise ValueError("AQI must be between 0 and 500.")
    return aqi


def validate_pm25(pm25: Optional[float]) -> Optional[float]:
    """Validate PM2.5 concentration in µg/m³."""
    if pm25 is not None and not (0.0 <= pm25 <= 1000.0):
        raise ValueError("PM2.5 concentration must be between 0.0 and 1000.0 µg/m³.")
    return pm25


def validate_pm10(pm10: Optional[float]) -> Optional[float]:
    """Validate PM10 concentration in µg/m³."""
    if pm10 is not None and not (0.0 <= pm10 <= 1500.0):
        raise ValueError("PM10 concentration must be between 0.0 and 1500.0 µg/m³.")
    return pm10


def validate_temperature(temp: Optional[float]) -> Optional[float]:
    """Validate ambient temperature in Celsius."""
    if temp is not None and not (-60.0 <= temp <= 65.0):
        raise ValueError("Temperature must be between -60.0°C and 65.0°C.")
    return temp


def validate_humidity(humidity: Optional[float]) -> Optional[float]:
    """Validate relative humidity percentage."""
    if humidity is not None and not (0.0 <= humidity <= 100.0):
        raise ValueError("Relative humidity must be between 0.0% and 100.0%..")
    return humidity


def validate_rating(rating: int) -> int:
    """Validate feedback rating scale (1 to 5)."""
    if not (1 <= rating <= 5):
        raise ValueError("Rating must be an integer between 1 and 5.")
    return rating
