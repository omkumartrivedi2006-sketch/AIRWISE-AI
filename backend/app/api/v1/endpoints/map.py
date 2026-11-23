"""
AIRWISE AI — Geospatial Map Endpoints (Module 07)
REST interface providing geographical environmental observations and monitoring stations.
"""

from typing import List
from fastapi import APIRouter, Depends, status
from app.core.database import MongoSession as Session

from app.analytics.schemas.analytics_schemas import MapObservationPoint
from app.analytics.services.analytics_service import analytics_service
from app.core.database import get_db
from app.models.location import Location
from app.schemas.common import SuccessResponse
from app.schemas.location import LocationResponse

router = APIRouter()


@router.get(
    "/observations",
    status_code=status.HTTP_200_OK,
    summary="Get Geospatial Environmental Observations",
    description="Returns geographic coordinates, latest AQI, category, and multi-pollutants for all active monitoring stations.",
)
async def get_map_observations(
    db: Session = Depends(get_db),
):
    points = analytics_service.get_map_observations(db=db)
    return SuccessResponse(
        success=True,
        message=f"Retrieved {len(points)} geospatial observation marker(s)",
        data=points,
    )


@router.get(
    "/locations",
    status_code=status.HTTP_200_OK,
    summary="Get Monitored Map Locations",
    description="Returns all registered geographic monitoring locations with precise decimal coordinates.",
)
async def get_map_locations(
    db: Session = Depends(get_db),
):
    locations = db.query(Location).all()
    return SuccessResponse(
        success=True,
        message=f"Retrieved {len(locations)} monitoring location(s)",
        data=[LocationResponse.model_validate(loc) for loc in locations],
    )
