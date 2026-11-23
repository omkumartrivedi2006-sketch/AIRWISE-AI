"""
AIRWISE AI — Analytics Repository
Efficient SQL queries and aggregations for atmospheric telemetry and geospatial mapping.
"""

from datetime import datetime
from typing import List, Optional, Tuple
from app.models.base import func, joinedload
from app.core.database import MongoSession as Session
from app.models.location import Location
from app.models.pollution import PollutionObservation


class AnalyticsRepository:
    """Provides high-performance database access for analytical aggregations."""

    @staticmethod
    def get_observations_in_range(
        db: Session,
        location_id: int,
        start_date: datetime,
        end_date: datetime,
    ) -> List[PollutionObservation]:
        """Fetches chronological observations for a specific location within a UTC time window."""
        return (
            db.query(PollutionObservation)
            .filter(
                PollutionObservation.location_id == location_id,
                PollutionObservation.observed_at >= start_date,
                PollutionObservation.observed_at <= end_date,
            )
            .order_by(PollutionObservation.observed_at.asc())
            .all()
        )

    @staticmethod
    def get_multi_location_observations(
        db: Session,
        location_ids: List[int],
        start_date: datetime,
        end_date: datetime,
    ) -> List[PollutionObservation]:
        """Fetches chronological observations across multiple locations for comparative analysis."""
        return (
            db.query(PollutionObservation)
            .options(joinedload(PollutionObservation.location))
            .filter(
                PollutionObservation.location_id.in_(location_ids),
                PollutionObservation.observed_at >= start_date,
                PollutionObservation.observed_at <= end_date,
            )
            .order_by(PollutionObservation.observed_at.asc())
            .all()
        )

    @staticmethod
    def get_latest_observations_all_locations(db: Session) -> List[Tuple[Location, Optional[PollutionObservation]]]:
        """
        Retrieves all registered monitoring locations paired with their most recent observation.
        Used by the geospatial pollution map.
        """
        locations = db.query(Location).all()
        result: List[Tuple[Location, Optional[PollutionObservation]]] = []

        for loc in locations:
            latest_obs = (
                db.query(PollutionObservation)
                .filter(PollutionObservation.location_id == loc.id)
                .order_by(PollutionObservation.observed_at.desc())
                .first()
            )
            result.append((loc, latest_obs))

        return result

    @staticmethod
    def get_location_by_id_or_city(
        db: Session,
        location_id: Optional[int] = None,
        city: Optional[str] = None,
    ) -> Optional[Location]:
        """Resolves location by primary key or case-insensitive city name."""
        if location_id is not None:
            return db.query(Location).filter(Location.id == location_id).first()
        if city:
            return db.query(Location).filter(func.lower(Location.city) == city.strip().lower()).first()
        return None


analytics_repository = AnalyticsRepository()
