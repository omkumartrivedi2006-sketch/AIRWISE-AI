"""
AIRWISE AI — Saved Locations Service
Manages user bookmarks of environmental monitoring stations with primary flag management.
"""

from typing import List, Optional
from app.core.database import MongoSession as Session
from app.models.location import Location
from app.models.pollution import PollutionObservation
from app.models.saved_location import SavedLocation
from app.schemas.personalization import SavedLocationCreate, SavedLocationRead, SavedLocationUpdate


class SavedLocationService:
    @staticmethod
    def get_saved_locations(db: Session, user_id: int) -> List[SavedLocationRead]:
        """Lists all locations saved by the user with current telemetry highlights."""
        saved_list = (
            db.query(SavedLocation)
            .filter(SavedLocation.user_id == user_id)
            .order_by(SavedLocation.is_primary.desc(), SavedLocation.created_at.desc())
            .all()
        )

        results: List[SavedLocationRead] = []
        for item in saved_list:
            loc = db.query(Location).filter(Location.id == item.location_id).first()
            latest_obs = (
                db.query(PollutionObservation)
                .filter(PollutionObservation.location_id == item.location_id)
                .order_by(PollutionObservation.observed_at.desc())
                .first()
            )

            read_item = SavedLocationRead(
                id=item.id,
                user_id=item.user_id,
                location_id=item.location_id,
                custom_name=item.custom_name,
                is_primary=item.is_primary,
                created_at=item.created_at,
                location_name=loc.name if loc else None,
                city=loc.city if loc else None,
                country=loc.country if loc else None,
                latitude=loc.latitude if loc else None,
                longitude=loc.longitude if loc else None,
                latest_aqi=latest_obs.aqi if latest_obs else None,
                latest_category=latest_obs.category if latest_obs else None,
            )
            results.append(read_item)

        return results

    @staticmethod
    def add_saved_location(db: Session, user_id: int, payload: SavedLocationCreate) -> SavedLocation:
        """Saves a monitoring location for the user, handling primary flag atomicity."""
        # Check if already saved
        existing = (
            db.query(SavedLocation)
            .filter(SavedLocation.user_id == user_id, SavedLocation.location_id == payload.location_id)
            .first()
        )
        if existing:
            # Update existing custom_name or primary flag
            if payload.custom_name is not None:
                existing.custom_name = payload.custom_name
            if payload.is_primary:
                # Demote other primary locations
                db.query(SavedLocation).filter(SavedLocation.user_id == user_id).update({"is_primary": False})
                existing.is_primary = True
            db.commit()
            db.refresh(existing)
            return existing

        if payload.is_primary:
            db.query(SavedLocation).filter(SavedLocation.user_id == user_id).update({"is_primary": False})

        saved = SavedLocation(
            user_id=user_id,
            location_id=payload.location_id,
            custom_name=payload.custom_name,
            is_primary=payload.is_primary,
        )
        db.add(saved)
        db.commit()
        db.refresh(saved)
        return saved

    @staticmethod
    def update_saved_location(
        db: Session, user_id: int, saved_location_id: int, payload: SavedLocationUpdate
    ) -> Optional[SavedLocation]:
        """Updates a saved location's custom name or primary status."""
        saved = (
            db.query(SavedLocation)
            .filter(SavedLocation.id == saved_location_id, SavedLocation.user_id == user_id)
            .first()
        )
        if not saved:
            return None

        if payload.custom_name is not None:
            saved.custom_name = payload.custom_name

        if payload.is_primary is True:
            # Demote all other saved locations for this user
            db.query(SavedLocation).filter(
                SavedLocation.user_id == user_id, SavedLocation.id != saved_location_id
            ).update({"is_primary": False})
            saved.is_primary = True
        elif payload.is_primary is False:
            saved.is_primary = False

        db.commit()
        db.refresh(saved)
        return saved

    @staticmethod
    def delete_saved_location(db: Session, user_id: int, saved_location_id: int) -> bool:
        """Deletes a saved location record."""
        saved = (
            db.query(SavedLocation)
            .filter(SavedLocation.id == saved_location_id, SavedLocation.user_id == user_id)
            .first()
        )
        if not saved:
            return False

        db.delete(saved)
        db.commit()
        return True


saved_location_service = SavedLocationService()
