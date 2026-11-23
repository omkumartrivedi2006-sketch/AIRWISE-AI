"""
AIRWISE AI — Pollution Observation Endpoints
REST interface for live air quality telemetry, atmospheric observations, geocoding search, and historical trends.
GET /api/v1/pollution
GET /api/v1/pollution/latest
GET /api/v1/pollution/search
GET /api/v1/pollution/history
GET /api/v1/pollution/sources
GET /api/v1/pollution/data-status
GET /api/v1/pollution/summary
GET /api/v1/pollution/{observation_id}
POST /api/v1/pollution
"""

from datetime import datetime
from typing import List, Optional, Union
from fastapi import APIRouter, Depends, Query, status
from app.core.database import MongoSession as Session
from app.core.database import get_db
from app.integrations.environmental.registry import provider_registry
from app.integrations.environmental.services.data_collection_service import data_collection_service
from app.schemas.common import PaginationMeta, SuccessResponse
from app.schemas.location import LocationResponse
from app.schemas.pollution import (
    HistoricalObservationItem,
    LocationSearchItem,
    PollutionDataStatusResponse,
    PollutionObservationCreate,
    PollutionObservationResponse,
    PollutionSummaryResponse,
)
from app.services.pollution_service import pollution_service

router = APIRouter()


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="List Pollution Observations",
    description="Retrieve pollution telemetry observations with filtering by location and date range.",
)
async def list_pollution_observations(
    location_id: Optional[int] = Query(None, description="Filter by location station ID"),
    start_date: Optional[datetime] = Query(None, description="Filter observations on or after this UTC timestamp"),
    end_date: Optional[datetime] = Query(None, description="Filter observations on or before this UTC timestamp"),
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * limit
    observations = pollution_service.get_observations(
        db,
        location_id=location_id,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )
    total = pollution_service.count_observations(
        db,
        location_id=location_id,
        start_date=start_date,
        end_date=end_date,
    )
    total_pages = (total + limit - 1) // limit if total > 0 else 0

    return SuccessResponse(
        success=True,
        message="Observations retrieved successfully",
        data=[PollutionObservationResponse.model_validate(obs) for obs in observations],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages).model_dump(),
    )


@router.get(
    "/latest",
    status_code=status.HTTP_200_OK,
    summary="Get Latest Pollution Observations",
    description="Retrieve real-time environmental observations for a specific city, coordinates, or station.",
)
async def get_latest_pollution_observations(
    location_id: Optional[int] = Query(None, description="Specific monitoring station location ID"),
    city: Optional[str] = Query(None, description="City name to retrieve live data for"),
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Latitude"),
    lon: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Longitude"),
    refresh: bool = Query(default=False, description="Bypass cache and force fresh provider query"),
    limit: int = Query(default=20, ge=1, le=100, description="Maximum observations when querying station list"),
    db: Session = Depends(get_db),
):
    # Targeted live query if location parameters supplied
    if location_id is not None or city or (lat is not None and lon is not None):
        live_obs = await data_collection_service.get_latest_observation(
            db=db,
            location_id=location_id,
            city=city,
            latitude=lat,
            longitude=lon,
            force_refresh=refresh,
        )
        if live_obs:
            loc_resp = None
            if live_obs.location_id:
                loc_resp = LocationResponse(
                    id=live_obs.location_id,
                    name=live_obs.location_name,
                    city=live_obs.city,
                    country=live_obs.country,
                    latitude=live_obs.latitude,
                    longitude=live_obs.longitude,
                    created_at=datetime.now(),
                )
            formatted = PollutionObservationResponse(
                id=live_obs.location_id or 1,
                location_id=live_obs.location_id or 1,
                aqi=live_obs.aqi,
                aqi_scale=live_obs.aqi_scale,
                aqi_category=live_obs.aqi_category,
                pm25=live_obs.pm25,
                pm10=live_obs.pm10,
                no2=live_obs.no2,
                so2=live_obs.so2,
                co=live_obs.co,
                o3=live_obs.o3,
                temperature=live_obs.temperature,
                humidity=live_obs.humidity,
                wind_speed=live_obs.wind_speed,
                wind_direction=live_obs.wind_direction,
                provider=live_obs.provider_name,
                provider_observation_id=live_obs.provider_observation_id,
                source=live_obs.data_source,
                is_verified=live_obs.is_verified,
                is_demo=live_obs.is_demo,
                observed_at=live_obs.observed_at,
                created_at=live_obs.fetched_at,
                freshness=live_obs.freshness,
                location=loc_resp,
            )
            return SuccessResponse(
                success=True,
                message="Real-time environmental observation retrieved successfully",
                data=formatted,
            )

    # Fallback to station list
    latest_obs = pollution_service.get_latest_observations(db, limit=limit)
    return SuccessResponse(
        success=True,
        message="Latest observations retrieved successfully",
        data=[PollutionObservationResponse.model_validate(obs) for obs in latest_obs],
    )


@router.get(
    "/search",
    status_code=status.HTTP_200_OK,
    summary="Search Environmental Locations",
    description="Geocodes a search string to find atmospheric monitoring localities worldwide.",
)
async def search_pollution_locations(
    q: str = Query(..., min_length=2, description="Search keyword (e.g. city name, region)"),
    limit: int = Query(default=5, ge=1, le=20, description="Maximum suggestions"),
):
    results = await data_collection_service.search_locations(query=q, limit=limit)
    return SuccessResponse(
        success=True,
        message=f"Found {len(results)} location(s)",
        data=[LocationSearchItem.model_validate(r) for r in results],
    )


@router.get(
    "/history",
    status_code=status.HTTP_200_OK,
    summary="Get Pollution Historical Trend",
    description="Retrieve hourly historical air quality observations for exposure trend visualization.",
)
async def get_pollution_history(
    location_id: Optional[int] = Query(None, description="Location ID"),
    city: Optional[str] = Query(None, description="City name"),
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Latitude"),
    lon: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Longitude"),
    hours: int = Query(default=24, ge=1, le=168, description="Number of past hours"),
    db: Session = Depends(get_db),
):
    history = await data_collection_service.get_historical_observations(
        db=db,
        location_id=location_id,
        city=city,
        latitude=lat,
        longitude=lon,
        hours=hours,
    )
    return SuccessResponse(
        success=True,
        message=f"Retrieved {len(history)} historical points",
        data=[
            HistoricalObservationItem(
                observed_at=h.observed_at,
                aqi=h.aqi,
                pm25=h.pm25,
                pm10=h.pm10,
                no2=h.no2,
                so2=h.so2,
                co=h.co,
                o3=h.o3,
                temperature=h.temperature,
                humidity=h.humidity,
                freshness=h.freshness,
                source=h.data_source,
            )
            for h in history
        ],
    )


@router.get(
    "/sources",
    status_code=status.HTTP_200_OK,
    summary="List Environmental Data Sources",
    description="Returns active external atmospheric data providers, operational status, and attribution.",
)
async def list_environmental_sources():
    sources = provider_registry.get_status_summary()
    return SuccessResponse(
        success=True,
        message="Active environmental providers retrieved successfully",
        data=[s.model_dump() for s in sources],
    )


@router.get(
    "/data-status",
    status_code=status.HTTP_200_OK,
    summary="Get Environmental Telemetry Status",
    description="Returns telemetry caching metrics, primary provider configurations, and freshness policies.",
)
async def get_environmental_data_status():
    status_data = data_collection_service.get_data_status()
    return SuccessResponse(
        success=True,
        message="Environmental status retrieved successfully",
        data=PollutionDataStatusResponse.model_validate(status_data),
    )


@router.get(
    "/summary",
    status_code=status.HTTP_200_OK,
    summary="Get Pollution Summary",
    description="Return statistical summaries (averages, min, max, count) for a specified location.",
)
async def get_pollution_summary(
    location_id: int = Query(..., description="Target location ID"),
    start_date: Optional[datetime] = Query(None, description="Summary window start UTC timestamp"),
    end_date: Optional[datetime] = Query(None, description="Summary window end UTC timestamp"),
    db: Session = Depends(get_db),
):
    summary_data = pollution_service.get_summary(
        db,
        location_id=location_id,
        start_date=start_date,
        end_date=end_date,
    )
    return SuccessResponse(
        success=True,
        message="Pollution summary calculated successfully",
        data=PollutionSummaryResponse.model_validate(summary_data),
    )


@router.get(
    "/{observation_id}",
    status_code=status.HTTP_200_OK,
    summary="Get Specific Observation",
    description="Retrieve a single pollution observation record by its identifier.",
)
async def get_pollution_observation(
    observation_id: int,
    db: Session = Depends(get_db),
):
    obs = pollution_service.get_observation_by_id(db, observation_id=observation_id)
    return SuccessResponse(
        success=True,
        message="Observation retrieved successfully",
        data=PollutionObservationResponse.model_validate(obs),
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Record Pollution Observation",
    description="Persist a verified particulate measurement or demo observation.",
)
async def record_pollution_observation(
    observation_in: PollutionObservationCreate,
    db: Session = Depends(get_db),
):
    created_obs = pollution_service.create_observation(db, observation_in=observation_in)
    return SuccessResponse(
        success=True,
        message="Pollution observation recorded successfully",
        data=PollutionObservationResponse.model_validate(created_obs),
    )
