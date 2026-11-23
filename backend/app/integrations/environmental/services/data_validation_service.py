"""
AIRWISE AI — Environmental Data Validation Service
Enforces strict physical measurement boundaries, timestamp verification, and sensor sanity checks.
"""

from datetime import datetime, timezone
from typing import Optional
from app.core.logging import logger
from app.integrations.environmental.schemas.environmental_schemas import NormalizedObservation


class DataValidationService:
    """Validates raw and normalized environmental measurements against physical limits."""

    @staticmethod
    def validate_coordinates(latitude: float, longitude: float) -> bool:
        """Validates that latitude and longitude fall within geographical limits."""
        return -90.0 <= latitude <= 90.0 and -180.0 <= longitude <= 180.0

    @staticmethod
    def validate_observation(obs: NormalizedObservation) -> bool:
        """
        Validates that environmental metrics comply with realistic terrestrial sensor limits.
        Rejects impossible physics or corrupted payloads.
        """
        if not DataValidationService.validate_coordinates(obs.latitude, obs.longitude):
            logger.warning("Observation rejected: invalid coordinates (%s, %s)", obs.latitude, obs.longitude)
            return False

        # AQI: 0 to 500
        if obs.aqi is not None and not (0 <= obs.aqi <= 500):
            logger.warning("Observation rejected: AQI out of bounds (%s)", obs.aqi)
            return False

        # PM2.5: 0 to 1000 µg/m³
        if obs.pm25 is not None and not (0.0 <= obs.pm25 <= 1000.0):
            logger.warning("Observation rejected: PM2.5 out of bounds (%s)", obs.pm25)
            return False

        # PM10: 0 to 1500 µg/m³
        if obs.pm10 is not None and not (0.0 <= obs.pm10 <= 1500.0):
            logger.warning("Observation rejected: PM10 out of bounds (%s)", obs.pm10)
            return False

        # Temperature: -60°C to +65°C
        if obs.temperature is not None and not (-60.0 <= obs.temperature <= 65.0):
            logger.warning("Observation rejected: Temperature out of bounds (%s)", obs.temperature)
            return False

        # Relative Humidity: 0% to 100%
        if obs.humidity is not None and not (0.0 <= obs.humidity <= 100.0):
            logger.warning("Observation rejected: Humidity out of bounds (%s)", obs.humidity)
            return False

        # Timestamp: Not in the far future (allow up to 2 hours for server clock drift)
        now_utc = datetime.now(timezone.utc)
        obs_time = obs.observed_at if obs.observed_at.tzinfo else obs.observed_at.replace(tzinfo=timezone.utc)
        if (obs_time - now_utc).total_seconds() > 7200:
            logger.warning("Observation rejected: Timestamp in future (%s vs now %s)", obs_time, now_utc)
            return False

        return True


data_validation_service = DataValidationService()
