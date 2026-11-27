"""
AIRWISE AI — Personalized Environmental Recommendations Service
Synthesizes user preferences, saved locations, and real environmental telemetry to produce
context-grounded recommendations using Google Gemini or a deterministic clinical fallback.
"""

from datetime import datetime, timedelta, timezone
import json
import logging
from typing import List, Optional
from app.core.database import MongoSession as Session
from app.core.config import settings
from app.models.location import Location
from app.models.pollution import PollutionObservation
from app.models.recommendation import RecommendationCache
from app.models.saved_location import SavedLocation
from app.models.user import User
from app.models.user_preference import UserPreference
from app.schemas.personalization import RecommendationItem, RecommendationsResponse
from app.services.ai.gemini_provider import gemini_provider

logger = logging.getLogger(__name__)


class RecommendationService:
    @staticmethod
    def _derive_aqi_category(aqi: Optional[int]) -> Optional[str]:
        if aqi is None:
            return None
        if aqi <= 50:
            return "Good"
        elif aqi <= 100:
            return "Moderate"
        elif aqi <= 150:
            return "Unhealthy for Sensitive Groups"
        elif aqi <= 200:
            return "Unhealthy"
        elif aqi <= 300:
            return "Very Unhealthy"
        return "Hazardous"

    @classmethod
    async def get_personalized_recommendations(
        cls, db: Session, user: User, location_id: Optional[int] = None, force_refresh: bool = False
    ) -> RecommendationsResponse:
        """
        Generates or retrieves cached personalized recommendations for the user.
        """
        now = datetime.now(timezone.utc)

        # 1. Resolve Location
        resolved_location: Optional[Location] = None
        if location_id:
            resolved_location = db.query(Location).filter(Location.id == location_id).first()
        else:
            # Check user's preferred location in preferences
            pref = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
            if pref and pref.preferred_location_id:
                resolved_location = db.query(Location).filter(Location.id == pref.preferred_location_id).first()

            # If not in preferences, check primary saved location
            if not resolved_location:
                primary_saved = (
                    db.query(SavedLocation)
                    .filter(SavedLocation.user_id == user.id, SavedLocation.is_primary == True)
                    .first()
                )
                if primary_saved:
                    resolved_location = db.query(Location).filter(Location.id == primary_saved.location_id).first()

            # If still none, check any saved location
            if not resolved_location:
                first_saved = db.query(SavedLocation).filter(SavedLocation.user_id == user.id).first()
                if first_saved:
                    resolved_location = db.query(Location).filter(Location.id == first_saved.location_id).first()

            # Fallback to first available location in system
            if not resolved_location:
                resolved_location = db.query(Location).first()

        loc_id = resolved_location.id if resolved_location else None
        city_name = resolved_location.city if resolved_location else "Your Area"

        # 2. Check Cache
        cache_key = f"rec_user_{user.id}_loc_{loc_id or 0}"
        if not force_refresh:
            cached = (
                db.query(RecommendationCache)
                .filter(
                    RecommendationCache.cache_key == cache_key,
                    RecommendationCache.expires_at > now,
                )
                .first()
            )
            if cached and cached.recommendations:
                items = [RecommendationItem(**item) for item in cached.recommendations]
                # Fetch latest obs for header
                latest_obs = cls._get_latest_observation(db, loc_id)
                return RecommendationsResponse(
                    user_id=user.id,
                    location_id=loc_id,
                    city=city_name,
                    aqi=latest_obs.aqi if latest_obs else None,
                    aqi_category=cls._derive_aqi_category(latest_obs.aqi) if latest_obs else None,
                    source="cached",
                    is_cached=True,
                    generated_at=cached.created_at,
                    recommendations=items,
                )

        # 3. Retrieve Latest Observation
        latest_obs = cls._get_latest_observation(db, loc_id)

        # 4. Generate Recommendations (Gemini or Deterministic Fallback)
        user_pref = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
        interests = user_pref.environmental_interests if user_pref else ["air_pollution", "sustainable_living"]

        items: List[RecommendationItem] = []
        source_name = "deterministic_rule_engine"

        # Try Gemini if operational
        is_gemini_active = gemini_provider.is_available()
        if is_gemini_active and settings.RECOMMENDATIONS_ENABLED and latest_obs:
            try:
                items = await cls._generate_gemini_recommendations(user, city_name, latest_obs, interests)
                source_name = "gemini_ai"
            except Exception as e:
                logger.warning("Gemini recommendation generation failed, falling back to deterministic: %s", e)
                items = []

        if not items:
            items = cls._generate_deterministic_recommendations(city_name, latest_obs, interests)

        # 5. Persist to Cache
        ttl_seconds = getattr(settings, "RECOMMENDATION_CACHE_TTL_SECONDS", 3600)
        expires_at = now + timedelta(seconds=ttl_seconds)

        # Upsert cache entry
        existing_cache = db.query(RecommendationCache).filter(RecommendationCache.cache_key == cache_key).first()
        serialized_items = [item.model_dump() for item in items]
        if existing_cache:
            existing_cache.recommendations = serialized_items
            existing_cache.created_at = now
            existing_cache.expires_at = expires_at
        else:
            new_cache = RecommendationCache(
                user_id=user.id,
                location_id=loc_id,
                cache_key=cache_key,
                recommendations=serialized_items,
                created_at=now,
                expires_at=expires_at,
            )
            db.add(new_cache)

        db.commit()

        return RecommendationsResponse(
            user_id=user.id,
            location_id=loc_id,
            city=city_name,
            aqi=latest_obs.aqi if latest_obs else None,
            aqi_category=cls._derive_aqi_category(latest_obs.aqi) if latest_obs else None,
            source=source_name,
            is_cached=False,
            generated_at=now,
            recommendations=items,
        )

    @staticmethod
    def _get_latest_observation(db: Session, location_id: Optional[int]) -> Optional[PollutionObservation]:
        if not location_id:
            return None
        return (
            db.query(PollutionObservation)
            .filter(PollutionObservation.location_id == location_id)
            .order_by(PollutionObservation.observed_at.desc())
            .first()
        )

    @classmethod
    async def _generate_gemini_recommendations(
        cls, user: User, city: str, obs: PollutionObservation, interests: List[str]
    ) -> List[RecommendationItem]:
        prompt = (
            "You are AIRWISE AI's environmental recommendation engine. "
            "Generate 3 to 4 personalized, clinically grounded environmental and lifestyle recommendations. "
            "Format the response strictly as a JSON array of objects with keys: "
            "'id', 'category', 'title', 'description', 'action_item', 'priority', 'source_attribution'.\n\n"
            f"DATA CONTEXT:\n"
            f"- Location: {city}\n"
            f"- Current AQI: {obs.aqi} ({cls._derive_aqi_category(obs.aqi) or 'Normal'}, Scale: {getattr(obs, 'aqi_scale', 'US_EPA')})\n"
            f"- PM2.5: {obs.pm25} µg/m³\n"
            f"- PM10: {obs.pm10} µg/m³\n"
            f"- Temperature: {obs.temperature} °C, Humidity: {obs.humidity}%\n"
            f"- Observed At: {obs.observed_at} (Source: {getattr(obs, 'provider', 'AIRWISE Telemetry')})\n"
            f"- User Interests: {', '.join(interests)}\n\n"
            "JSON ARRAY RESPONSE:"
        )

        reply = await gemini_provider.generate_content(
            prompt=prompt,
            conversation_history=[],
            timeout=getattr(settings, "GEMINI_TIMEOUT_SECONDS", 30),
        )

        cleaned = reply.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]

        parsed = json.loads(cleaned.strip())
        if isinstance(parsed, list):
            return [RecommendationItem(**item) for item in parsed]
        return []

    @classmethod
    def _generate_deterministic_recommendations(
        cls, city: str, obs: Optional[PollutionObservation], interests: List[str]
    ) -> List[RecommendationItem]:
        """Provides reliable, clinically accurate recommendations without requiring external AI APIs."""
        aqi = obs.aqi if obs and obs.aqi is not None else 45
        if aqi <= 50:
            cat = "Good"
        elif aqi <= 100:
            cat = "Moderate"
        elif aqi <= 150:
            cat = "Unhealthy for Sensitive Groups"
        elif aqi <= 200:
            cat = "Unhealthy"
        elif aqi <= 300:
            cat = "Very Unhealthy"
        else:
            cat = "Hazardous"

        items: List[RecommendationItem] = []

        if aqi <= 50:
            items.append(
                RecommendationItem(
                    id="rec_air_good",
                    category="outdoor_activity",
                    title=f"Optimal Outdoor Conditions in {city}",
                    description=f"Air quality in {city} is satisfactory (AQI {aqi}, Category: {cat}). Ambient particulate concentrations pose minimal health risk.",
                    action_item="Ideal conditions for outdoor cardiovascular exercise, commuting, and opening windows for residential ventilation.",
                    priority="normal",
                    source_attribution="WHO Air Quality Guidelines & Ambient Telemetry",
                )
            )
            items.append(
                RecommendationItem(
                    id="rec_ventilation_good",
                    category="ventilation",
                    title="Recommended Indoor Air Refresh Window",
                    description="Take advantage of low ambient particulate levels to naturally ventilate indoor spaces and flush out indoor VOCs and CO2.",
                    action_item="Open cross-ventilation windows for 30–60 minutes during early morning or late evening.",
                    priority="normal",
                    source_attribution="Building Environmental Health Standards",
                )
            )
        elif aqi <= 100:
            items.append(
                RecommendationItem(
                    id="rec_air_moderate",
                    category="health_precaution",
                    title=f"Moderate Air Quality in {city}",
                    description=f"Air quality index is {aqi} ({cat}). While acceptable for the general public, individuals with heightened sensitivity may notice mild respiratory irritation.",
                    action_item="Sensitive individuals (asthma, COPD) should monitor symptoms and consider reducing prolonged heavy exertion outdoors.",
                    priority="normal",
                    source_attribution="EPA Air Quality Guide for Particle Pollution",
                )
            )
        elif aqi <= 150:
            items.append(
                RecommendationItem(
                    id="rec_air_sensitive",
                    category="health_precaution",
                    title=f"Elevated Particulates: Sensitive Groups Alert in {city}",
                    description=f"Current AQI is {aqi} ({cat}). Fine particulate matter (PM2.5) is elevated above safe long-term health thresholds.",
                    action_item="Children, elderly individuals, and those with cardiopulmonary conditions should avoid prolonged outdoor workouts.",
                    priority="high",
                    source_attribution="Clinical Environmental Health Guidelines",
                )
            )
            items.append(
                RecommendationItem(
                    id="rec_ventilation_mod",
                    category="ventilation",
                    title="Optimize Indoor Air Filtration",
                    description="Keep exterior windows closed during peak vehicular traffic hours to prevent outdoor particulate ingress.",
                    action_item="Operate indoor HEPA air purifiers on medium speed in bedrooms and main living spaces.",
                    priority="high",
                    source_attribution="Indoor Air Quality Management Protocols",
                )
            )
        else:
            items.append(
                RecommendationItem(
                    id="rec_air_unhealthy",
                    category="health_precaution",
                    title=f"Air Quality Alert for {city}: High Exposure Risk",
                    description=f"AQI is significantly elevated at {aqi} ({cat}). Continued exposure causes respiratory airway inflammation and oxidative stress.",
                    action_item="Wear a well-fitted N95/FFP2 respirator mask when outdoors. Suspend outdoor athletics and strenuous labor.",
                    priority="high",
                    source_attribution="WHO Global Environmental Health Alerts",
                )
            )
            items.append(
                RecommendationItem(
                    id="rec_indoor_hepa",
                    category="ventilation",
                    title="Activate Maximum Indoor HEPA Filtration",
                    description="Seal exterior draft points and set indoor HVAC or standalone purifiers to recirculation mode.",
                    action_item="Keep windows strictly sealed and verify purifier pre-filters are free of particulate accumulation.",
                    priority="high",
                    source_attribution="Environmental Health Emergency Protocols",
                )
            )

        # Sustainable habit item based on user interests
        if "sustainable_living" in interests or not items:
            items.append(
                RecommendationItem(
                    id="rec_habit_commute",
                    category="sustainable_habit",
                    title="Emissions Reduction: Active & Public Transit",
                    description="Transportation emissions account for a substantial percentage of urban PM2.5 and nitrogen dioxide (NO2) spikes.",
                    action_item="Choose electrified public transit, cycling, or shared rides for short urban commutes to reduce community tailpipe pollution.",
                    priority="normal",
                    source_attribution="UNEP Clean Air Initiatives",
                )
            )

        return items


recommendation_service = RecommendationService()
