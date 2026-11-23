"""
AIRWISE AI — Module 07 Unit Tests
Validates mathematical calculations, trend classification, cross-location comparisons,
CSV formula sanitization, and deterministic AI grounding.
"""

from datetime import datetime, timezone
import pytest

from app.analytics.schemas.analytics_schemas import AIInsightRequest
from app.analytics.services.analytics_service import AnalyticsService
from app.analytics.services.comparison_service import ComparisonService
from app.analytics.services.insight_service import AnalyticsInsightService
from app.analytics.services.statistics_service import StatisticsService
from app.analytics.services.trend_analysis_service import TrendAnalysisService
from app.models.location import Location
from app.models.pollution import PollutionObservation


def test_statistics_service_calculations():
    # Odd number of observations
    vals = [10.0, 20.0, 30.0, 40.0, 50.0]
    stats = StatisticsService.calculate_stats(vals)
    assert stats.count == 5
    assert stats.mean == 30.0
    assert stats.median == 30.0
    assert stats.min == 10.0
    assert stats.max == 50.0
    assert stats.std_dev == 15.81
    # First half mean: (10+20)/2 = 15; second half: (30+40+50)/3 = 40; pct: ((40-15)/15)*100 = 166.7%
    assert stats.percentage_change is not None and stats.percentage_change > 0

    # Even number of observations
    vals_even = [10.0, 20.0, 30.0, 40.0]
    stats_even = StatisticsService.calculate_stats(vals_even)
    assert stats_even.count == 4
    assert stats_even.mean == 25.0
    assert stats_even.median == 25.0 # (20 + 30) / 2
    assert stats_even.min == 10.0
    assert stats_even.max == 40.0


def test_statistics_service_empty_and_null_exclusion():
    stats_empty = StatisticsService.calculate_stats([])
    assert stats_empty.count == 0
    assert stats_empty.mean is None
    assert stats_empty.median is None
    assert stats_empty.min is None

    # None and NaN values must be excluded from calculation, not treated as 0
    vals_with_none = [10.0, None, 20.0, float("nan"), 30.0]
    stats_clean = StatisticsService.calculate_stats(vals_with_none) # type: ignore
    assert stats_clean.count == 3
    assert stats_clean.mean == 20.0 # (10 + 20 + 30) / 3, NOT divided by 5


def test_moving_average_calculation():
    vals = [10.0, 20.0, 30.0, 40.0]
    ma = StatisticsService.calculate_moving_average(vals, window_size=2)
    assert len(ma) == 4
    assert ma[0] == 10.0 # first item window
    assert ma[1] == 15.0 # (10 + 20) / 2
    assert ma[2] == 25.0 # (20 + 30) / 2
    assert ma[3] == 35.0 # (30 + 40) / 2


def test_trend_classification_rules():
    # Insufficient data
    trend_sparse = TrendAnalysisService.classify_trend([10.0, 20.0])
    assert trend_sparse.direction == "insufficient_data"
    assert trend_sparse.confidence == "unsupported"

    # Upward trajectory (> +5%)
    trend_up = TrendAnalysisService.classify_trend([10.0, 12.0, 25.0, 30.0])
    assert trend_up.direction == "increasing"
    assert trend_up.percentage_change is not None and trend_up.percentage_change > 5.0

    # Downward trajectory (< -5%)
    trend_down = TrendAnalysisService.classify_trend([50.0, 45.0, 20.0, 15.0])
    assert trend_down.direction == "decreasing"
    assert trend_down.percentage_change is not None and trend_down.percentage_change < -5.0

    # Stable trajectory (within +/- 5%)
    trend_stable = TrendAnalysisService.classify_trend([20.0, 20.5, 20.1, 20.4])
    assert trend_stable.direction == "stable"


def test_comparison_service_scale_incompatibility():
    loc1 = Location(id=1, name="Station US", city="New York", country="USA", latitude=40.7, longitude=-74.0)
    loc2 = Location(id=2, name="Station IN", city="Delhi", country="India", latitude=28.6, longitude=77.2)

    obs1 = [
        PollutionObservation(location_id=1, aqi=45, aqi_scale="US_EPA", observed_at=datetime.now(timezone.utc)),
    ]
    obs2 = [
        PollutionObservation(location_id=2, aqi=120, aqi_scale="IN_NAAQS", observed_at=datetime.now(timezone.utc)),
    ]

    locations_data = {
        1: {"location": loc1, "observations": obs1},
        2: {"location": loc2, "observations": obs2},
    }

    res = ComparisonService.compare_locations(
        locations_data=locations_data,
        metric="aqi",
        period_start=datetime.now(timezone.utc),
        period_end=datetime.now(timezone.utc),
    )

    # Must flag scale incompatibility because US_EPA != IN_NAAQS
    assert res.is_scale_compatible is False
    assert "Scale Incompatibility Warning" in res.compatibility_notes


def test_csv_formula_injection_sanitization():
    # Formulas beginning with =, +, -, @ must be prepended with '
    assert AnalyticsService._sanitize_csv_cell("=1+1") == "'=1+1"
    assert AnalyticsService._sanitize_csv_cell("+cmd|' /C calc'!A0") == "'+cmd|' /C calc'!A0"
    assert AnalyticsService._sanitize_csv_cell("-5+2") == "'-5+2"
    assert AnalyticsService._sanitize_csv_cell("@SUM(A1:A10)") == "'@SUM(A1:A10)"
    # Standard values remain untouched
    assert AnalyticsService._sanitize_csv_cell("London Central") == "London Central"
    assert AnalyticsService._sanitize_csv_cell(45.2) == "45.2"


@pytest.mark.asyncio
async def test_deterministic_ai_insight_generation():
    stats = StatisticsService.calculate_stats([25.0, 30.0, 45.0, 50.0])
    trend = TrendAnalysisService.classify_trend([25.0, 30.0, 45.0, 50.0], metric_name="PM2.5")

    insight = await AnalyticsInsightService.generate_insight(
        location_name="Downtown Hub",
        city="London",
        country="UK",
        metric="pm25",
        unit="µg/m³",
        period_start=datetime.now(timezone.utc),
        period_end=datetime.now(timezone.utc),
        stats=stats,
        trend=trend,
    )

    assert insight.key_finding is not None
    assert "London" in insight.key_finding
    assert "37.5 µg/m³" in insight.key_finding or "37.5" in str(insight.supporting_measurements)
    assert len(insight.recommendations) >= 2
    assert insight.provider in ("Google Gemini", "AIRWISE Deterministic Analytics Engine")
