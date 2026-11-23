"""
AIRWISE AI — Analytics Comparison Service
Cross-location environmental metric comparison. Enforces scale compatibility checks
and warns against scientifically invalid comparisons (e.g. US EPA vs IN NAAQS).
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from app.analytics.schemas.analytics_schemas import (
    LocationComparisonItem,
    LocationComparisonResponse,
)
from app.analytics.services.statistics_service import statistics_service
from app.integrations.environmental.services.data_normalization_service import data_normalization_service
from app.models.location import Location
from app.models.pollution import PollutionObservation


class ComparisonService:
    """Evaluates comparative air quality metrics across multiple monitoring stations."""

    METRIC_UNITS = {
        "aqi": "Index",
        "pm25": "µg/m³",
        "pm10": "µg/m³",
        "no2": "µg/m³",
        "so2": "µg/m³",
        "co": "µg/m³",
        "o3": "µg/m³",
        "temperature": "°C",
        "humidity": "%",
    }

    @classmethod
    def compare_locations(
        cls,
        locations_data: Dict[int, Dict[str, Any]],
        metric: str,
        period_start: datetime,
        period_end: datetime,
    ) -> LocationComparisonResponse:
        """
        locations_data: dict of location_id -> { "location": Location, "observations": List[PollutionObservation] }
        """
        clean_metric = metric.lower().strip()
        unit = cls.METRIC_UNITS.get(clean_metric, "µg/m³")

        items: List[LocationComparisonItem] = []
        scales_detected = set()

        for loc_id, payload in locations_data.items():
            loc: Location = payload["location"]
            obs_list: List[PollutionObservation] = payload["observations"]

            # Extract metric values
            vals: List[float] = []
            distinct_scales = set()
            latest_obs: Optional[PollutionObservation] = None

            for obs in obs_list:
                v = getattr(obs, clean_metric, None)
                if v is not None:
                    vals.append(float(v))
                if obs.aqi_scale:
                    distinct_scales.add(obs.aqi_scale)
                if latest_obs is None or (obs.observed_at and obs.observed_at > latest_obs.observed_at):
                    latest_obs = obs

            stats = statistics_service.calculate_stats(vals)
            primary_scale = next(iter(distinct_scales)) if distinct_scales else "US_EPA"
            if clean_metric == "aqi":
                scales_detected.add(primary_scale)

            freshness = "unavailable"
            latest_val = None
            latest_time = None
            if latest_obs:
                latest_time = latest_obs.observed_at
                latest_val = getattr(latest_obs, clean_metric, None)
                freshness = data_normalization_service.calculate_freshness(latest_time)

            quality = "good" if stats.count >= 20 else "partial" if stats.count >= 5 else "insufficient"

            items.append(
                LocationComparisonItem(
                    location_id=loc.id,
                    location_name=loc.name,
                    city=loc.city,
                    country=loc.country,
                    observation_count=stats.count,
                    mean_value=stats.mean,
                    min_value=stats.min,
                    max_value=stats.max,
                    median_value=stats.median,
                    latest_value=latest_val,
                    latest_observed_at=latest_time,
                    freshness=freshness,
                    aqi_scale=primary_scale if clean_metric == "aqi" else None,
                    data_quality=quality,
                    provider=latest_obs.provider if latest_obs and latest_obs.provider else "sensor",
                )
            )

        # Scale Compatibility Check
        is_compatible = True
        notes = f"All stations evaluated on compatible {unit} physical unit."
        if clean_metric == "aqi":
            if len(scales_detected) > 1:
                is_compatible = False
                notes = (
                    f"Scale Incompatibility Warning: Selected stations use different national index scales "
                    f"({', '.join(scales_detected)}). Direct mathematical comparison between different AQI scales "
                    "is scientifically invalid because their underlying breakpoint concentrations and categories differ."
                )
            else:
                scale_name = next(iter(scales_detected)) if scales_detected else "US_EPA"
                notes = f"All stations report under consistent {scale_name} AQI scale."

        # Difference summary for 2 stations
        diff_summary: Optional[str] = None
        if len(items) == 2 and items[0].mean_value is not None and items[1].mean_value is not None:
            a, b = items[0], items[1]
            diff = round(b.mean_value - a.mean_value, 2)
            pct = round((diff / a.mean_value) * 100.0, 1) if a.mean_value > 0 else 0.0
            sign = "+" if diff > 0 else ""
            diff_summary = (
                f"{b.city} averaged {b.mean_value} {unit} compared to {a.city}'s {a.mean_value} {unit} "
                f"({sign}{diff} {unit}, {sign}{pct}%) over the evaluated time window."
            )

        return LocationComparisonResponse(
            metric=clean_metric,
            unit=unit,
            period_start=period_start,
            period_end=period_end,
            locations=items,
            is_scale_compatible=is_compatible,
            compatibility_notes=notes,
            difference_summary=diff_summary,
        )


comparison_service = ComparisonService()
