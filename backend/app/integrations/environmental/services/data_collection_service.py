"""
AIRWISE AI — Environmental Data Collection Service
Orchestrates live provider polling, physical validation, cache management,
database deduplication, and graceful degradation fallback.
"""

from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from app.models.base import func
from app.core.database import MongoSession as Session

from app.core.config import settings
from app.core.exceptions import AirwiseException
from app.core.logging import logger
from app.integrations.environmental.registry import provider_registry
from app.integrations.environmental.schemas.environmental_schemas import (
    LocationSearchResult,
    NormalizedObservation,
)
from app.integrations.environmental.services.cache_service import environmental_cache
from app.integrations.environmental.services.data_normalization_service import data_normalization_service
from app.integrations.environmental.services.data_validation_service import data_validation_service
from app.models.location import Location
from app.models.pollution import PollutionObservation


class EnvironmentalDataCollectionService:
    """Core coordinator for real-time environmental telemetry acquisition and ingestion."""

    def __init__(self):
        self.cache = environmental_cache
        self.registry = provider_registry
        self.validator = data_validation_service
        self.normalizer = data_normalization_service

    async def search_locations(self, query: str, limit: int = 5) -> List[LocationSearchResult]:
        """Geocodes locations across active providers with deduplication."""
        clean_query = query.strip()
        if not clean_query:
            return []

        providers = self.registry.get_provider_chain()
        all_results: List[LocationSearchResult] = []
        seen = set()

        for provider in providers:
            try:
                results = await provider.search_locations(clean_query, limit=limit)
                for res in results:
                    key = (round(res.latitude, 2), round(res.longitude, 2))
                    if key not in seen:
                        seen.add(key)
                        all_results.append(res)
                    if len(all_results) >= limit:
                        return all_results
            except Exception as exc:
                logger.warning("Provider '%s' failed location search: %s", provider.name, exc)

        return all_results

    def _resolve_or_create_location(
        self,
        db: Session,
        name: str,
        city: str,
        country: str,
        latitude: float,
        longitude: float,
        state: Optional[str] = None,
    ) -> Location:
        """Finds an existing location matching (name, city, country) or creates a new one."""
        clean_name = (name or city).strip()
        clean_city = (city or clean_name).strip()
        clean_country = (country or "Global").strip()

        # Check by name, city, country
        loc = (
            db.query(Location)
            .filter(
                Location.name == clean_name,
                Location.city == clean_city,
                Location.country == clean_country,
            )
            .first()
        )

        if not loc:
            # Check by coordinate proximity (< ~2km)
            loc = (
                db.query(Location)
                .filter(
                    func.abs(Location.latitude - latitude) < 0.02,
                    func.abs(Location.longitude - longitude) < 0.02,
                )
                .first()
            )

        if not loc:
            loc = Location(
                name=clean_name,
                city=clean_city,
                state=state,
                country=clean_country,
                latitude=latitude,
                longitude=longitude,
            )
            db.add(loc)
            db.commit()
            db.refresh(loc)
            logger.info("Created new Location in database: %s, %s (ID %s)", loc.name, loc.city, loc.id)

        return loc

    def _persist_observation(self, db: Session, obs: NormalizedObservation, location_id: int) -> PollutionObservation:
        """Saves a normalized observation to the database if not already present."""
        # Deduplication check
        existing = (
            db.query(PollutionObservation)
            .filter(
                PollutionObservation.location_id == location_id,
                PollutionObservation.observed_at == obs.observed_at,
                PollutionObservation.provider == obs.provider_name,
            )
            .first()
        )
        if existing:
            return existing

        db_obs = PollutionObservation(
            location_id=location_id,
            aqi=obs.aqi,
            aqi_scale=obs.aqi_scale,
            pm25=obs.pm25,
            pm10=obs.pm10,
            no2=obs.no2,
            so2=obs.so2,
            co=obs.co,
            o3=obs.o3,
            temperature=obs.temperature,
            humidity=obs.humidity,
            wind_speed=obs.wind_speed,
            wind_direction=obs.wind_direction,
            provider=obs.provider_name,
            provider_observation_id=obs.provider_observation_id,
            source=obs.data_source,
            is_verified=obs.is_verified,
            is_demo=obs.is_demo,
            observed_at=obs.observed_at,
        )
        db.add(db_obs)
        db.commit()
        db.refresh(db_obs)
        return db_obs

    async def get_latest_observation(
        self,
        db: Session,
        location_id: Optional[int] = None,
        city: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        force_refresh: bool = False,
    ) -> Optional[NormalizedObservation]:
        """
        Retrieves real-time observation with caching, provider fallback, and DB persistence.
        """
        loc_name: Optional[str] = None
        loc_country: Optional[str] = None

        # 1. Resolve target coordinates and metadata
        if location_id is not None:
            db_loc = db.query(Location).filter(Location.id == location_id).first()
            if not db_loc:
                raise AirwiseException(
                    message=f"Location with ID {location_id} not found.",
                    code="LOCATION_NOT_FOUND",
                    status_code=404,
                )
            latitude = db_loc.latitude
            longitude = db_loc.longitude
            city = db_loc.city
            loc_name = db_loc.name
            loc_country = db_loc.country

        elif (latitude is None or longitude is None) and city:
            # Check city cache
            city_key = self.cache.city_key(city)
            if not force_refresh:
                cached_city_obs = self.cache.get(city_key)
                if cached_city_obs:
                    return cached_city_obs

            # Geocode city
            search_results = await self.search_locations(city, limit=1)
            if not search_results:
                # Try finding location in local DB
                db_loc = db.query(Location).filter(func.lower(Location.city) == city.strip().lower()).first()
                if db_loc:
                    latitude = db_loc.latitude
                    longitude = db_loc.longitude
                    loc_name = db_loc.name
                    loc_country = db_loc.country
                else:
                    return None
            else:
                top = search_results[0]
                latitude = top.latitude
                longitude = top.longitude
                city = top.city
                loc_name = top.name
                loc_country = top.country

        if latitude is None or longitude is None:
            return None

        # 2. Check Coordinate Cache
        coord_key = self.cache.coord_key(latitude, longitude)
        if not force_refresh:
            cached_obs = self.cache.get(coord_key)
            if cached_obs:
                return cached_obs

        # 3. Query Provider Chain
        providers = self.registry.get_provider_chain()
        live_obs: Optional[NormalizedObservation] = None

        for provider in providers:
            try:
                candidate = await provider.get_latest_observation(
                    latitude=latitude,
                    longitude=longitude,
                    city=city,
                    location_name=loc_name,
                    country=loc_country,
                )
                if candidate and self.validator.validate_observation(candidate):
                    live_obs = candidate
                    break
            except Exception as exc:
                logger.warning("Provider '%s' failed fetching observation: %s", provider.name, exc)

        # 4. Handle Successful Live Acquisition
        if live_obs:
            # Sync Location in DB
            db_loc = self._resolve_or_create_location(
                db=db,
                name=live_obs.location_name or loc_name or city or "Monitoring Station",
                city=live_obs.city or city or "Unknown",
                country=live_obs.country or loc_country or "Global",
                latitude=latitude,
                longitude=longitude,
            )
            live_obs.location_id = db_loc.id

            # Persist observation in DB
            self._persist_observation(db, live_obs, db_loc.id)

            # Update cache
            self.cache.set(coord_key, live_obs)
            if city:
                self.cache.set(self.cache.city_key(city), live_obs)

            return live_obs

        # 5. Fallback: Query Latest from Local Database
        logger.info("External providers unavailable for (%s, %s). Falling back to database.", latitude, longitude)
        db_obs_query = (
            db.query(PollutionObservation)
            .join(Location)
            .filter(
                func.abs(Location.latitude - latitude) < 0.05,
                func.abs(Location.longitude - longitude) < 0.05,
            )
            .order_by(PollutionObservation.observed_at.desc())
            .first()
        )

        if db_obs_query and db_obs_query.location:
            loc = db_obs_query.location
            freshness = self.normalizer.calculate_freshness(db_obs_query.observed_at)
            fallback_obs = NormalizedObservation(
                location_id=loc.id,
                location_name=loc.name,
                city=loc.city,
                country=loc.country,
                latitude=loc.latitude,
                longitude=loc.longitude,
                aqi=db_obs_query.aqi,
                aqi_scale=db_obs_query.aqi_scale or "US_EPA",
                aqi_category=self.normalizer.get_aqi_category(db_obs_query.aqi, db_obs_query.aqi_scale or "US_EPA"),
                pm25=db_obs_query.pm25,
                pm10=db_obs_query.pm10,
                no2=db_obs_query.no2,
                so2=db_obs_query.so2,
                co=db_obs_query.co,
                o3=db_obs_query.o3,
                temperature=db_obs_query.temperature,
                humidity=db_obs_query.humidity,
                wind_speed=db_obs_query.wind_speed,
                wind_direction=db_obs_query.wind_direction,
                provider_name=db_obs_query.provider or "database",
                provider_observation_id=db_obs_query.provider_observation_id,
                data_source=f"Persisted record from {db_obs_query.source}",
                observed_at=db_obs_query.observed_at,
                freshness=freshness, # type: ignore
                is_verified=db_obs_query.is_verified,
                is_demo=db_obs_query.is_demo,
            )
            return fallback_obs

        return None

    async def get_historical_observations(
        self,
        db: Session,
        location_id: Optional[int] = None,
        city: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        hours: int = 24,
    ) -> List[NormalizedObservation]:
        """
        Retrieves 24-hour historical observations.
        First checks database; if insufficient points (< 4), queries primary external provider.
        """
        loc_record: Optional[Location] = None

        if location_id is not None:
            loc_record = db.query(Location).filter(Location.id == location_id).first()
            if loc_record:
                latitude = loc_record.latitude
                longitude = loc_record.longitude
                city = loc_record.city

        elif (latitude is None or longitude is None) and city:
            search_results = await self.search_locations(city, limit=1)
            if search_results:
                latitude = search_results[0].latitude
                longitude = search_results[0].longitude
                city = search_results[0].city

        if latitude is None or longitude is None:
            return []

        # Check DB history within time window
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        db_history_query = (
            db.query(PollutionObservation)
            .join(Location)
            .filter(
                func.abs(Location.latitude - latitude) < 0.05,
                func.abs(Location.longitude - longitude) < 0.05,
                PollutionObservation.observed_at >= since,
            )
            .order_by(PollutionObservation.observed_at.asc())
            .all()
        )

        if len(db_history_query) >= 4:
            history_list: List[NormalizedObservation] = []
            for item in db_history_query:
                l = item.location
                history_list.append(
                    NormalizedObservation(
                        location_id=l.id if l else None,
                        location_name=l.name if l else (city or "Station"),
                        city=l.city if l else (city or "Unknown"),
                        country=l.country if l else "Global",
                        latitude=latitude,
                        longitude=longitude,
                        aqi=item.aqi,
                        aqi_scale=item.aqi_scale or "US_EPA",
                        aqi_category=self.normalizer.get_aqi_category(item.aqi, item.aqi_scale or "US_EPA"),
                        pm25=item.pm25,
                        pm10=item.pm10,
                        no2=item.no2,
                        so2=item.so2,
                        co=item.co,
                        o3=item.o3,
                        temperature=item.temperature,
                        humidity=item.humidity,
                        wind_speed=item.wind_speed,
                        wind_direction=item.wind_direction,
                        provider_name=item.provider or "database",
                        provider_observation_id=item.provider_observation_id,
                        data_source=item.source,
                        observed_at=item.observed_at,
                        freshness=self.normalizer.calculate_freshness(item.observed_at), # type: ignore
                        is_verified=item.is_verified,
                        is_demo=item.is_demo,
                    )
                )
            return history_list

        # If DB history is sparse, retrieve from primary external provider
        primary = self.registry.get_primary_provider()
        try:
            external_history = await primary.get_historical_observations(
                latitude=latitude,
                longitude=longitude,
                hours=hours,
                city=city,
            )
            if external_history:
                # Ensure location exists in DB
                db_loc = loc_record or self._resolve_or_create_location(
                    db=db,
                    name=city or "Monitoring Station",
                    city=city or "Unknown",
                    country="Global",
                    latitude=latitude,
                    longitude=longitude,
                )
                # Persist points to DB
                for pt in external_history:
                    pt.location_id = db_loc.id
                    self._persist_observation(db, pt, db_loc.id)

                return external_history
        except Exception as exc:
            logger.warning("Historical data retrieval from '%s' failed: %s", primary.name, exc)

        return []

    def get_data_status(self) -> Dict[str, Any]:
        """Provides status summary of environmental providers and caching."""
        return {
            "environmental_data_enabled": getattr(settings, "ENVIRONMENTAL_DATA_ENABLED", True),
            "primary_provider": getattr(settings, "PRIMARY_AIR_QUALITY_PROVIDER", "open-meteo"),
            "providers": [s.model_dump() for s in self.registry.get_status_summary()],
            "cache_ttl_seconds": getattr(settings, "AIR_QUALITY_CACHE_TTL_SECONDS", 900),
            "max_fresh_data_age_minutes": getattr(settings, "MAX_FRESH_DATA_AGE_MINUTES", 120),
        }


data_collection_service = EnvironmentalDataCollectionService()
