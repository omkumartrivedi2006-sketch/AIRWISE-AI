"""
AIRWISE AI — Pollution Observation Endpoints
GET /api/v1/pollution
GET /api/v1/pollution/latest
GET /api/v1/pollution/summary
GET /api/v1/pollution/{observation_id}
POST /api/v1/pollution
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.common import PaginationMeta, SuccessResponse
from app.schemas.pollution import (
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
    description="Retrieve the latest available particulate observations across monitoring stations.",
)
async def get_latest_pollution_observations(
    limit: int = Query(default=20, ge=1, le=100, description="Maximum observations to return"),
    db: Session = Depends(get_db),
):
    latest_obs = pollution_service.get_latest_observations(db, limit=limit)
    return SuccessResponse(
        success=True,
        message="Latest observations retrieved successfully",
        data=[PollutionObservationResponse.model_validate(obs) for obs in latest_obs],
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
