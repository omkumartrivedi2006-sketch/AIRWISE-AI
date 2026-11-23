"""
AIRWISE AI — Analytics Schemas (Module 07)
Standardized data contracts for environmental statistics, multi-pollutant trends,
location comparisons, data coverage auditing, map feeds, and AI-grounded insights.
"""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class StatisticsData(BaseModel):
    """Rigorous descriptive statistics for continuous physical measurements."""
    count: int = Field(..., description="Number of valid non-null observations")
    mean: Optional[float] = Field(None, description="Arithmetic mean of values")
    median: Optional[float] = Field(None, description="50th percentile (median) value")
    min: Optional[float] = Field(None, description="Minimum observed measurement")
    max: Optional[float] = Field(None, description="Maximum observed measurement")
    std_dev: Optional[float] = Field(None, description="Sample standard deviation")
    percentage_change: Optional[float] = Field(
        None, description="Percentage change between first half and second half of time window"
    )
    methodology: str = Field(
        default="Sample statistics calculated on non-null measurements with zero-exclusion for missing records.",
        description="Calculation transparency statement",
    )
    model_config = ConfigDict(from_attributes=True)


class TrendClassification(BaseModel):
    """Classification of temporal exposure trajectory."""
    direction: Literal["increasing", "decreasing", "stable", "insufficient_data"]
    percentage_change: Optional[float] = None
    interpretation: str
    confidence: Literal["high", "moderate", "low", "unsupported"] = "moderate"
    model_config = ConfigDict(from_attributes=True)


class AQICategoryDistribution(BaseModel):
    """Distribution breakdown of AQI values across standard tiers on a single scale."""
    scale: str = "US_EPA"
    categories: Dict[str, int] = Field(default_factory=dict)
    total_classified: int = 0
    model_config = ConfigDict(from_attributes=True)


class TimeIntervalPoint(BaseModel):
    """Discrete time aggregated bucket point."""
    timestamp: datetime
    period_label: str
    value: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    count: int = 0
    model_config = ConfigDict(from_attributes=True)


class AnalyticsOverviewResponse(BaseModel):
    """High-level summary of station environmental metrics across a selected duration."""
    location_id: int
    location_name: str
    city: str
    country: str
    latitude: float
    longitude: float
    period_start: datetime
    period_end: datetime
    latest_aqi: Optional[int] = None
    latest_aqi_scale: Optional[str] = "US_EPA"
    latest_aqi_category: Optional[str] = None
    average_aqi: Optional[float] = None
    latest_pm25: Optional[float] = None
    average_pm25: Optional[float] = None
    latest_pm10: Optional[float] = None
    average_pm10: Optional[float] = None
    observation_count: int
    data_coverage_status: str
    freshness: str
    provider: str
    model_config = ConfigDict(from_attributes=True)


class AQITrendsResponse(BaseModel):
    """Time-series trajectory and tier distribution for AQI."""
    location_id: int
    city: str
    aqi_scale: str
    interval: str # hourly, daily, weekly, monthly
    points: List[TimeIntervalPoint]
    trend: TrendClassification
    category_distribution: Optional[AQICategoryDistribution] = None
    statistics: StatisticsData
    model_config = ConfigDict(from_attributes=True)


class PollutantTrendsResponse(BaseModel):
    """Time-series trajectory for specific physical or chemical particulate concentration."""
    location_id: int
    city: str
    pollutant: str
    unit: str
    interval: str
    points: List[TimeIntervalPoint]
    trend: TrendClassification
    statistics: StatisticsData
    model_config = ConfigDict(from_attributes=True)


class LocationComparisonItem(BaseModel):
    """Comparative environmental metrics for a specific monitored location."""
    location_id: int
    location_name: str
    city: str
    country: str
    observation_count: int
    mean_value: Optional[float] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    median_value: Optional[float] = None
    latest_value: Optional[float] = None
    latest_observed_at: Optional[datetime] = None
    freshness: str
    aqi_scale: Optional[str] = None
    data_quality: str
    provider: str
    model_config = ConfigDict(from_attributes=True)


class LocationComparisonResponse(BaseModel):
    """Side-by-side comparative analysis across two or more locations."""
    metric: str # e.g. aqi, pm25, pm10, no2, so2, co, o3
    unit: str
    period_start: datetime
    period_end: datetime
    locations: List[LocationComparisonItem]
    is_scale_compatible: bool
    compatibility_notes: str
    difference_summary: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class DataCoverageResponse(BaseModel):
    """Data quality and completeness audit for a monitoring location."""
    location_id: int
    city: str
    country: str
    period_start: datetime
    period_end: datetime
    total_expected_hours: int
    recorded_observations: int
    coverage_percentage: float
    missing_intervals_count: int
    stale_hours: Optional[float] = None
    coverage_status: Literal["good", "partial", "limited", "insufficient", "stale"]
    available_pollutants: List[str]
    aqi_scale: Optional[str] = None
    primary_provider: str
    model_config = ConfigDict(from_attributes=True)


class MapObservationPoint(BaseModel):
    """Geospatial environmental telemetry marker item."""
    location_id: int
    name: str
    city: str
    country: str
    latitude: float
    longitude: float
    aqi: Optional[int] = None
    aqi_scale: Optional[str] = "US_EPA"
    aqi_category: Optional[str] = "Unknown"
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    so2: Optional[float] = None
    co: Optional[float] = None
    o3: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    observed_at: Optional[datetime] = None
    provider: str = "open-meteo"
    freshness: str = "live"
    is_demo: bool = False
    model_config = ConfigDict(from_attributes=True)


class AIInsightRequest(BaseModel):
    """User request for AI-grounded environmental analytics interpretation."""
    location_id: Optional[int] = None
    city: Optional[str] = None
    pollutant: str = Field(default="aqi", description="Target metric: aqi, pm25, pm10, etc.")
    time_range: str = Field(default="7d", description="Time window: 24h, 7d, 30d, 90d, 6m")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    query: Optional[str] = None


class AIInsightResponse(BaseModel):
    """AI-synthesized environmental insight grounded strictly in calculated statistics."""
    key_finding: str
    supporting_measurements: Dict[str, Any]
    trend_interpretation: str
    data_limitations: str
    recommendations: List[str]
    generated_at: datetime
    provider: str
    model: str
    grounded_context_summary: Dict[str, Any]
    model_config = ConfigDict(from_attributes=True)
