"""
AIRWISE AI — Analytics Trend Analysis Service
Classifies exposure trajectories using clear, objective statistical thresholds.
Avoids equating short-term fluctuations with long-term climate changes.
"""

from typing import List, Optional
from app.analytics.schemas.analytics_schemas import TrendClassification
from app.analytics.services.statistics_service import statistics_service


class TrendAnalysisService:
    """Classifies physical measurement trends into increasing, decreasing, or stable states."""

    # Threshold for percentage change to be considered a trend (+/- 5%)
    STABILITY_THRESHOLD_PCT = 5.0
    MIN_SAMPLE_THRESHOLD = 4

    @staticmethod
    def classify_trend(chronological_values: List[float], metric_name: str = "metric") -> TrendClassification:
        valid_vals = [float(v) for v in chronological_values if v is not None]
        n = len(valid_vals)

        if n < TrendAnalysisService.MIN_SAMPLE_THRESHOLD:
            return TrendClassification(
                direction="insufficient_data",
                percentage_change=None,
                interpretation=(
                    f"Insufficient observations (n={n}) to compute a statistically sound trend for {metric_name}. "
                    f"A minimum of {TrendAnalysisService.MIN_SAMPLE_THRESHOLD} points is required."
                ),
                confidence="unsupported",
            )

        pct_change = statistics_service.calculate_half_split_change(valid_vals)

        if pct_change is None:
            return TrendClassification(
                direction="insufficient_data",
                percentage_change=None,
                interpretation=f"Baseline mean for {metric_name} is near zero; percentage trajectory is undefined.",
                confidence="low",
            )

        if pct_change > TrendAnalysisService.STABILITY_THRESHOLD_PCT:
            direction = "increasing"
            interpretation = (
                f"{metric_name.upper()} exhibited an upward trajectory of +{pct_change}% across the evaluated window. "
                "This reflects higher particulate/chemical accumulation in the latter half of the observation period."
            )
        elif pct_change < -TrendAnalysisService.STABILITY_THRESHOLD_PCT:
            direction = "decreasing"
            interpretation = (
                f"{metric_name.upper()} exhibited a downward trajectory of {pct_change}% across the evaluated window. "
                "This indicates improving air conditions or stronger atmospheric dispersion in the latter half."
            )
        else:
            direction = "stable"
            interpretation = (
                f"{metric_name.upper()} remained relatively stable (drift {pct_change}%, within +/-{TrendAnalysisService.STABILITY_THRESHOLD_PCT}% threshold) "
                "across the evaluated observation window."
            )

        confidence = "high" if n >= 24 else "moderate"

        return TrendClassification(
            direction=direction, # type: ignore
            percentage_change=pct_change,
            interpretation=interpretation,
            confidence=confidence, # type: ignore
        )


trend_analysis_service = TrendAnalysisService()
