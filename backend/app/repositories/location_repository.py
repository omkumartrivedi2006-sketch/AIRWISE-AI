"""
AIRWISE AI — Location Repository
Database access operations for geographical monitoring stations.
"""

from typing import List, Optional
from app.core.database import MongoSession as Session
from app.models.location import Location
from app.schemas.location import LocationCreate


class LocationRepository:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 20) -> List[Location]:
        return db.query(Location).order_by(Location.city.asc(), Location.name.asc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, location_id: int) -> Optional[Location]:
        return db.query(Location).filter(Location.id == location_id).first()

    @staticmethod
    def get_by_name_and_city(db: Session, name: str, city: str, country: str) -> Optional[Location]:
        return db.query(Location).filter(
            Location.name == name,
            Location.city == city,
            Location.country == country,
        ).first()

    @staticmethod
    def create(db: Session, location_in: LocationCreate) -> Location:
        db_obj = Location(
            name=location_in.name,
            city=location_in.city,
            state=location_in.state,
            country=location_in.country,
            latitude=location_in.latitude,
            longitude=location_in.longitude,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def count(db: Session) -> int:
        return db.query(Location).count()


location_repository = LocationRepository()
