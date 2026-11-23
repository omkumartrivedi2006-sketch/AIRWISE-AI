"""
AIRWISE AI — Environmental Data Normalization Service
Normalizes multi-provider measurements to standard units, resolves AQI scales,
and assigns accurate data freshness classifications.
"""

from datetime import datetime, timezone
from typing import Optional
from app.core.config import settings


class DataNormalizationService:
    """Standardizes disparate provider formats into coherent AIRWISE models."""

    @staticmethod
    def get_aqi_category(aqi: Optional[int], aqi_scale: str = "US_EPA") -> str:
        """
        Maps numerical AQI to standard health categorization based on the active scale.
        Supports US EPA (0-500) and Indian NAAQS (0-500).
        """
        if aqi is None:
            return "Unknown"

        scale = aqi_scale.upper() if aqi_scale else "US_EPA"

        if scale == "IN_NAAQS":
            # Indian National Air Quality Index
            if aqi <= 50:
                return "Good"
            elif aqi <= 100:
                return "Satisfactory"
            elif aqi <= 200:
                return "Moderate"
            elif aqi <= 300:
                return "Poor"
            elif aqi <= 400:
                return "Very Poor"
            else:
                return "Severe"

        # Default: US EPA Air Quality Index
        if aqi <= 50:
            return "Good"
        elif aqi <= 100:
            return "Moderate"
        elif aqi <= 150:
            return "Sensitive" # Unhealthy for Sensitive Groups
        elif aqi <= 200:
            return "Unhealthy"
        elif aqi <= 300:
            return "Very Unhealthy"
        else:
            return "Hazardous"

    @staticmethod
    def calculate_freshness(
        observed_at: Optional[datetime],
        max_fresh_minutes: Optional[int] = None,
    ) -> str:
        """
        Computes the freshness state of an observation.
        - 'live': observed within the last 60 minutes
        - 'cached': observed within fresh age threshold (<= max_fresh_minutes)
        - 'delayed': older than threshold
        - 'unavailable': no valid timestamp
        """
        if not observed_at:
            return "unavailable"

        max_minutes = max_fresh_minutes or getattr(settings, "MAX_FRESH_DATA_AGE_MINUTES", 120)
        now_utc = datetime.now(timezone.utc)
        obs_time = observed_at if observed_at.tzinfo else observed_at.replace(tzinfo=timezone.utc)

        age_seconds = (now_utc - obs_time).total_seconds()
        age_minutes = max(0, age_seconds / 60.0)

        if age_minutes <= 60:
            return "live"
        elif age_minutes <= max_minutes:
            return "cached"
        else:
            return "delayed"


data_normalization_service = DataNormalizationService()
