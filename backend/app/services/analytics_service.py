"""
AIRWISE AI — Analytics Service
Calculates multi-station comparisons, exposure hazard ratings, and diurnal trends.
"""

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.repositories.location_repository import location_repository
from app.repositories.pollution_repository import pollution_repository


class AnalyticsService:
    def __init__(self, pollution_repo=pollution_repository, loc_repo=location_repository):
        self.pollution_repo = pollution_repo
        self.loc_repo = loc_repo

    def get_station_comparison(self, db: Session) -> List[Dict[str, Any]]:
        """Returns comparison across active monitoring stations."""
        locations = self.loc_repo.get_all(db, skip=0, limit=50)
        results = []
        for loc in locations:
            latest = self.pollution_repo.get_latest_by_location(db, location_id=loc.id)
            results.append({
                "location_id": loc.id,
                "name": loc.name,
                "city": loc.city,
                "country": loc.country,
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "latest_aqi": latest.aqi if latest else None,
                "latest_pm25": latest.pm25 if latest else None,
                "latest_pm10": latest.pm10 if latest else None,
                "last_observed_at": latest.observed_at if latest else None,
                "has_data": latest is not None,
            })
        return results


analytics_service = AnalyticsService()
