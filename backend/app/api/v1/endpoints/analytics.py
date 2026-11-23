"""
AIRWISE AI — Analytics Endpoints (Module 07)
REST interface for statistical aggregations, AQI trends, pollutant trajectories,
cross-location comparisons, data coverage auditing, CSV export, and AI insights.
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response, status
from app.core.database import MongoSession as Session

from app.analytics.schemas.analytics_schemas import (
    AIInsightRequest,
    AIInsightResponse,
    AnalyticsOverviewResponse,
    AQITrendsResponse,
    DataCoverageResponse,
    LocationComparisonResponse,
    PollutantTrendsResponse,
    StatisticsData,
)
from app.analytics.services.analytics_service import analytics_service
from app.core.database import get_db
from app.schemas.common import SuccessResponse

router = APIRouter()


@router.get(
    "/overview",
    status_code=status.HTTP_200_OK,
    summary="Get Environmental Analytics Overview",
    description="Returns aggregate environmental metrics, averages, observation counts, and data quality status.",
)
async def get_analytics_overview(
    location_id: Optional[int] = Query(None, description="Monitoring station location ID"),
    city: Optional[str] = Query(None, description="Target city name"),
    time_range: str = Query(default="7d", description="Predefined time range: 24h, 7d, 30d, 90d, 6m"),
    start_date: Optional[datetime] = Query(None, description="Custom start UTC timestamp"),
    end_date: Optional[datetime] = Query(None, description="Custom end UTC timestamp"),
    db: Session = Depends(get_db),
):
    overview = analytics_service.get_overview(
        db=db,
        location_id=location_id,
        city=city,
        start_date=start_date,
        end_date=end_date,
        time_range=time_range,
    )
    return SuccessResponse(
        success=True,
        message="Analytics overview computed successfully",
        data=overview,
    )


@router.get(
    "/aqi-trends",
    status_code=status.HTTP_200_OK,
    summary="Get AQI Trends & Tier Distribution",
    description="Aggregates AQI observations across specified time intervals with trend classification and tier distribution.",
)
async def get_aqi_trends(
    location_id: Optional[int] = Query(None, description="Location ID"),
    city: Optional[str] = Query(None, description="City name"),
    interval: str = Query(default="daily", description="Aggregation interval: hourly, daily, weekly, monthly"),
    time_range: str = Query(default="7d", description="Time range: 24h, 7d, 30d, 90d, 6m"),
    start_date: Optional[datetime] = Query(None, description="Custom start UTC timestamp"),
    end_date: Optional[datetime] = Query(None, description="Custom end UTC timestamp"),
    db: Session = Depends(get_db),
):
    trends = analytics_service.get_aqi_trends(
        db=db,
        location_id=location_id,
        city=city,
        start_date=start_date,
        end_date=end_date,
        interval=interval,
        time_range=time_range,
    )
    return SuccessResponse(
        success=True,
        message="AQI trends aggregated successfully",
        data=trends,
    )


@router.get(
    "/pollutant-trends",
    status_code=status.HTTP_200_OK,
    summary="Get Pollutant-Specific Time-Series Trends",
    description="Returns time-series aggregations, descriptive statistics, and trend classification for a designated pollutant.",
)
async def get_pollutant_trends(
    pollutant: str = Query(default="pm25", description="Pollutant metric: pm25, pm10, no2, so2, co, o3"),
    location_id: Optional[int] = Query(None, description="Location ID"),
    city: Optional[str] = Query(None, description="City name"),
    interval: str = Query(default="daily", description="Aggregation interval: hourly, daily, weekly, monthly"),
    time_range: str = Query(default="7d", description="Time range: 24h, 7d, 30d, 90d, 6m"),
    start_date: Optional[datetime] = Query(None, description="Custom start UTC timestamp"),
    end_date: Optional[datetime] = Query(None, description="Custom end UTC timestamp"),
    db: Session = Depends(get_db),
):
    trends = analytics_service.get_pollutant_trends(
        db=db,
        pollutant=pollutant,
        location_id=location_id,
        city=city,
        start_date=start_date,
        end_date=end_date,
        interval=interval,
        time_range=time_range,
    )
    return SuccessResponse(
        success=True,
        message=f"{pollutant.upper()} trends aggregated successfully",
        data=trends,
    )


@router.get(
    "/statistics",
    status_code=status.HTTP_200_OK,
    summary="Get Statistical Analysis for Metric",
    description="Computes sample mean, median, min, max, standard deviation, and trajectory percentage for a metric.",
)
async def get_statistics(
    metric: str = Query(default="aqi", description="Target metric: aqi, pm25, pm10, no2, so2, co, o3"),
    location_id: Optional[int] = Query(None, description="Location ID"),
    city: Optional[str] = Query(None, description="City name"),
    time_range: str = Query(default="7d", description="Time range: 24h, 7d, 30d, 90d, 6m"),
    start_date: Optional[datetime] = Query(None, description="Custom start UTC timestamp"),
    end_date: Optional[datetime] = Query(None, description="Custom end UTC timestamp"),
    db: Session = Depends(get_db),
):
    stats = analytics_service.get_statistics(
        db=db,
        metric=metric,
        location_id=location_id,
        city=city,
        start_date=start_date,
        end_date=end_date,
        time_range=time_range,
    )
    return SuccessResponse(
        success=True,
        message=f"Statistics for {metric.upper()} computed successfully",
        data=stats,
    )


@router.get(
    "/compare",
    status_code=status.HTTP_200_OK,
    summary="Compare Environmental Measurements Across Locations",
    description="Performs cross-location comparisons for a selected pollutant with explicit scale compatibility verification.",
)
async def compare_locations(
    metric: str = Query(default="pm25", description="Target metric: pm25, pm10, aqi, no2, etc."),
    location_ids: Optional[List[int]] = Query(None, description="List of location IDs to compare"),
    cities: Optional[List[str]] = Query(None, description="List of city names to compare"),
    time_range: str = Query(default="7d", description="Time range: 24h, 7d, 30d, 90d, 6m"),
    start_date: Optional[datetime] = Query(None, description="Custom start UTC timestamp"),
    end_date: Optional[datetime] = Query(None, description="Custom end UTC timestamp"),
    db: Session = Depends(get_db),
):
    comparison = analytics_service.compare_locations(
        db=db,
        location_ids=location_ids,
        cities=cities,
        metric=metric,
        start_date=start_date,
        end_date=end_date,
        time_range=time_range,
    )
    return SuccessResponse(
        success=True,
        message="Location comparison completed successfully",
        data=comparison,
    )


@router.get(
    "/data-coverage",
    status_code=status.HTTP_200_OK,
    summary="Get Data Coverage & Quality Audit",
    description="Audits data completeness, missing hours, observation frequency, and staleness for a station.",
)
async def get_data_coverage(
    location_id: Optional[int] = Query(None, description="Location ID"),
    city: Optional[str] = Query(None, description="City name"),
    time_range: str = Query(default="7d", description="Time range: 24h, 7d, 30d, 90d, 6m"),
    start_date: Optional[datetime] = Query(None, description="Custom start UTC timestamp"),
    end_date: Optional[datetime] = Query(None, description="Custom end UTC timestamp"),
    db: Session = Depends(get_db),
):
    coverage = analytics_service.get_data_coverage(
        db=db,
        location_id=location_id,
        city=city,
        start_date=start_date,
        end_date=end_date,
        time_range=time_range,
    )
    return SuccessResponse(
        success=True,
        message="Data coverage audit completed successfully",
        data=coverage,
    )


@router.get(
    "/export/csv",
    status_code=status.HTTP_200_OK,
    summary="Export Environmental Observations to CSV",
    description="Streams a sanitized RFC 4180 CSV export of observations with spreadsheet formula injection guards.",
)
async def export_csv(
    location_id: Optional[int] = Query(None, description="Location ID"),
    city: Optional[str] = Query(None, description="City name"),
    time_range: str = Query(default="30d", description="Time range: 24h, 7d, 30d, 90d, 6m"),
    start_date: Optional[datetime] = Query(None, description="Custom start UTC timestamp"),
    end_date: Optional[datetime] = Query(None, description="Custom end UTC timestamp"),
    db: Session = Depends(get_db),
):
    csv_content = analytics_service.export_csv(
        db=db,
        location_id=location_id,
        city=city,
        start_date=start_date,
        end_date=end_date,
        time_range=time_range,
    )
    loc_tag = city or (f"location_{location_id}" if location_id else "environmental_data")
    filename = f"airwise_{loc_tag}_{datetime.now().strftime('%Y%m%d')}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post(
    "/insights",
    status_code=status.HTTP_200_OK,
    summary="Generate AI-Powered Environmental Insights",
    description="Synthesizes Gemini GenAI insights strictly grounded in computed backend analytics and statistics.",
)
async def generate_ai_insights(
    req: AIInsightRequest,
    db: Session = Depends(get_db),
):
    insight = await analytics_service.generate_insights(db=db, req=req)
    return SuccessResponse(
        success=True,
        message="AI-grounded environmental insight generated successfully",
        data=insight,
    )
