"""
AIRWISE AI — User Preferences Service
Manages retrieval, initialization, and updates for user preferences and notification settings.
"""

from typing import Optional
from app.core.database import MongoSession as Session
from app.models.user_preference import UserPreference
from app.schemas.personalization import UserPreferencesRead, UserPreferencesUpdate


class PreferenceService:
    @staticmethod
    def get_or_create_preferences(db: Session, user_id: int) -> UserPreference:
        """Retrieves existing preferences or initializes defaults."""
        pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        if not pref:
            pref = UserPreference(
                user_id=user_id,
                preferred_language="en",
                timezone="UTC",
                temperature_unit="C",
                preferred_aqi_scale="US_EPA",
                environmental_interests=["air_pollution", "sustainable_living"],
                preferred_information=["aqi_updates", "recommendations"],
                quiet_hours_enabled=False,
                quiet_hours_start="22:00",
                quiet_hours_end="07:00",
                in_app_notifications=True,
                email_notifications=False,
                push_notifications=False,
            )
            db.add(pref)
            db.commit()
            db.refresh(pref)
        return pref

    @staticmethod
    def update_preferences(db: Session, user_id: int, update_data: UserPreferencesUpdate) -> UserPreference:
        """Updates user preferences with validation."""
        pref = PreferenceService.get_or_create_preferences(db, user_id)

        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            if hasattr(pref, field) and value is not None:
                setattr(pref, field, value)

        db.commit()
        db.refresh(pref)
        return pref


preference_service = PreferenceService()
