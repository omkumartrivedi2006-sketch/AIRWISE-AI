"""
AIRWISE AI — Analytics Module (Module 07)
Environmental statistics, trends, comparisons, geospatial mapping feeds, and AI insights.
"""

from app.analytics.repositories.analytics_repository import AnalyticsRepository, analytics_repository
from app.analytics.schemas.analytics_schemas import (
    AIInsightRequest,
    AIInsightResponse,
    AnalyticsOverviewResponse,
    AQICategoryDistribution,
    AQITrendsResponse,
    DataCoverageResponse,
    LocationComparisonItem,
    LocationComparisonResponse,
    MapObservationPoint,
    PollutantTrendsResponse,
    StatisticsData,
    TimeIntervalPoint,
    TrendClassification,
)
from app.analytics.services.analytics_service import AnalyticsService, analytics_service
from app.analytics.services.comparison_service import ComparisonService, comparison_service
from app.analytics.services.insight_service import AnalyticsInsightService, analytics_insight_service
from app.analytics.services.statistics_service import StatisticsService, statistics_service
from app.analytics.services.trend_analysis_service import TrendAnalysisService, trend_analysis_service

__all__ = [
    "analytics_service",
    "AnalyticsService",
    "statistics_service",
    "StatisticsService",
    "trend_analysis_service",
    "TrendAnalysisService",
    "comparison_service",
    "ComparisonService",
    "analytics_insight_service",
    "AnalyticsInsightService",
    "analytics_repository",
    "AnalyticsRepository",
    "StatisticsData",
    "TrendClassification",
    "AQICategoryDistribution",
    "TimeIntervalPoint",
    "AnalyticsOverviewResponse",
    "AQITrendsResponse",
    "PollutantTrendsResponse",
    "LocationComparisonItem",
    "LocationComparisonResponse",
    "DataCoverageResponse",
    "MapObservationPoint",
    "AIInsightRequest",
    "AIInsightResponse",
]
