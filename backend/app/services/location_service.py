"""
AIRWISE AI — Location Service
Business logic layer for geographical monitoring stations.
"""

from typing import List, Optional
from app.core.database import MongoSession as Session
from app.core.exceptions import AirwiseException
from app.models.location import Location
from app.repositories.location_repository import location_repository
from app.schemas.location import LocationCreate


class LocationService:
    def __init__(self, repo=location_repository):
        self.repo = repo

    def get_locations(self, db: Session, skip: int = 0, limit: int = 20) -> List[Location]:
        return self.repo.get_all(db, skip=skip, limit=limit)

    def get_location_by_id(self, db: Session, location_id: int) -> Location:
        location = self.repo.get_by_id(db, location_id=location_id)
        if not location:
            raise AirwiseException(
                message=f"Location with ID {location_id} not found.",
                code="LOCATION_NOT_FOUND",
                status_code=404,
            )
        return location

    def create_location(self, db: Session, location_in: LocationCreate) -> Location:
        existing = self.repo.get_by_name_and_city(
            db,
            name=location_in.name,
            city=location_in.city,
            country=location_in.country,
        )
        if existing:
            raise AirwiseException(
                message=f"Location '{location_in.name}' in {location_in.city}, {location_in.country} already exists.",
                code="LOCATION_ALREADY_EXISTS",
                status_code=400,
            )
        return self.repo.create(db, location_in=location_in)

    def count_locations(self, db: Session) -> int:
        return self.repo.count(db)


location_service = LocationService()
