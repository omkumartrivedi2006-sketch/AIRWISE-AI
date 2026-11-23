"""
AIRWISE AI — Analytics Service Coordinator
Central orchestrator for environmental statistics, time-series aggregations,
cross-location comparisons, data coverage auditing, map telemetry, and CSV exports.
"""

from collections import defaultdict
import csv
from datetime import datetime, timezone, timedelta
import io
from typing import Any, Dict, List, Optional
from app.core.database import MongoSession as Session

from app.analytics.repositories.analytics_repository import analytics_repository
from app.analytics.schemas.analytics_schemas import (
    AIInsightRequest,
    AIInsightResponse,
    AnalyticsOverviewResponse,
    AQICategoryDistribution,
    AQITrendsResponse,
    DataCoverageResponse,
    LocationComparisonResponse,
    MapObservationPoint,
    PollutantTrendsResponse,
    StatisticsData,
    TimeIntervalPoint,
)
from app.analytics.services.comparison_service import comparison_service
from app.analytics.services.insight_service import analytics_insight_service
from app.analytics.services.statistics_service import statistics_service
from app.analytics.services.trend_analysis_service import trend_analysis_service
from app.core.exceptions import AirwiseException
from app.integrations.environmental.services.data_normalization_service import data_normalization_service
from app.models.location import Location
from app.models.pollution import PollutionObservation


class AnalyticsService:
    """Coordinates environmental analytical data processing, geospatial queries, and exports."""

    def __init__(self, repo=analytics_repository):
        self.repo = repo
        self.stats_service = statistics_service
        self.trend_service = trend_analysis_service
        self.comparison_service = comparison_service
        self.insight_service = analytics_insight_service
        self.normalizer = data_normalization_service

    def _resolve_location(
        self,
        db: Session,
        location_id: Optional[int] = None,
        city: Optional[str] = None,
    ) -> Location:
        """Finds a target location or raises 404."""
        loc = self.repo.get_location_by_id_or_city(db, location_id=location_id, city=city)
        if not loc:
            identifier = f"ID {location_id}" if location_id else f"City '{city}'"
            raise AirwiseException(
                message=f"Location {identifier} not found in environmental database.",
                code="LOCATION_NOT_FOUND",
                status_code=404,
            )
        return loc

    def _resolve_time_range(
        self,
        time_range: Optional[str] = "7d",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> (datetime, datetime):
        """Resolves UTC time window based on duration keyword or explicit bounds."""
        now_utc = datetime.now(timezone.utc)
        if start_date and end_date:
            return start_date, end_date

        range_map = {
            "24h": timedelta(hours=24),
            "7d": timedelta(days=7),
            "30d": timedelta(days=30),
            "90d": timedelta(days=90),
            "6m": timedelta(days=180),
        }
        delta = range_map.get(time_range.lower() if time_range else "7d", timedelta(days=7))
        return (now_utc - delta), now_utc

    def get_overview(
        self,
        db: Session,
        location_id: Optional[int] = None,
        city: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        time_range: str = "7d",
    ) -> AnalyticsOverviewResponse:
        loc = self._resolve_location(db, location_id=location_id, city=city)
        start_dt, end_dt = self._resolve_time_range(time_range, start_date, end_date)
        observations = self.repo.get_observations_in_range(db, loc.id, start_dt, end_dt)

        latest_obs = observations[-1] if observations else None
        aqi_vals = [obs.aqi for obs in observations if obs.aqi is not None]
        pm25_vals = [obs.pm25 for obs in observations if obs.pm25 is not None]
        pm10_vals = [obs.pm10 for obs in observations if obs.pm10 is not None]

        aqi_stats = self.stats_service.calculate_stats(aqi_vals)
        pm25_stats = self.stats_service.calculate_stats(pm25_vals)
        pm10_stats = self.stats_service.calculate_stats(pm10_vals)

        # Coverage evaluation
        expected_hours = max(1, int((end_dt - start_dt).total_seconds() / 3600))
        coverage_pct = min(100.0, (len(observations) / expected_hours) * 100.0)
        coverage_status = "good" if coverage_pct >= 75 else "partial" if coverage_pct >= 30 else "limited"

        freshness = "unavailable"
        if latest_obs and latest_obs.observed_at:
            freshness = self.normalizer.calculate_freshness(latest_obs.observed_at)

        latest_aqi_scale = latest_obs.aqi_scale if latest_obs and latest_obs.aqi_scale else "US_EPA"
        latest_category = (
            self.normalizer.get_aqi_category(latest_obs.aqi, latest_aqi_scale)
            if latest_obs and latest_obs.aqi is not None
            else None
        )

        return AnalyticsOverviewResponse(
            location_id=loc.id,
            location_name=loc.name,
            city=loc.city,
            country=loc.country,
            latitude=loc.latitude,
            longitude=loc.longitude,
            period_start=start_dt,
            period_end=end_dt,
            latest_aqi=latest_obs.aqi if latest_obs else None,
            latest_aqi_scale=latest_aqi_scale,
            latest_aqi_category=latest_category,
            average_aqi=aqi_stats.mean,
            latest_pm25=latest_obs.pm25 if latest_obs else None,
            average_pm25=pm25_stats.mean,
            latest_pm10=latest_obs.pm10 if latest_obs else None,
            average_pm10=pm10_stats.mean,
            observation_count=len(observations),
            data_coverage_status=coverage_status,
            freshness=freshness,
            provider=latest_obs.provider if latest_obs and latest_obs.provider else "sensor",
        )

    def get_aqi_trends(
        self,
        db: Session,
        location_id: Optional[int] = None,
        city: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        interval: str = "daily",
        time_range: str = "7d",
    ) -> AQITrendsResponse:
        loc = self._resolve_location(db, location_id=location_id, city=city)
        start_dt, end_dt = self._resolve_time_range(time_range, start_date, end_date)
        observations = self.repo.get_observations_in_range(db, loc.id, start_dt, end_dt)

        aqi_scale = "US_EPA"
        if observations and observations[-1].aqi_scale:
            aqi_scale = observations[-1].aqi_scale

        points = self._aggregate_interval_points(observations, "aqi", interval)
        raw_vals = [obs.aqi for obs in observations if obs.aqi is not None]
        stats = self.stats_service.calculate_stats(raw_vals)
        trend = self.trend_service.classify_trend(raw_vals, metric_name="AQI")

        # Category distribution on this scale
        cat_counts = defaultdict(int)
        for v in raw_vals:
            cat = self.normalizer.get_aqi_category(v, aqi_scale)
            cat_counts[cat] += 1

        dist = AQICategoryDistribution(
            scale=aqi_scale,
            categories=dict(cat_counts),
            total_classified=len(raw_vals),
        )

        return AQITrendsResponse(
            location_id=loc.id,
            city=loc.city,
            aqi_scale=aqi_scale,
            interval=interval,
            points=points,
            trend=trend,
            category_distribution=dist,
            statistics=stats,
        )

    def get_pollutant_trends(
        self,
        db: Session,
        pollutant: str,
        location_id: Optional[int] = None,
        city: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        interval: str = "daily",
        time_range: str = "7d",
    ) -> PollutantTrendsResponse:
        clean_pol = pollutant.lower().strip()
        if clean_pol not in ("pm25", "pm10", "no2", "so2", "co", "o3", "temperature", "humidity"):
            raise AirwiseException(
                message=f"Unsupported pollutant metric '{pollutant}'. Valid metrics: pm25, pm10, no2, so2, co, o3.",
                code="INVALID_POLLUTANT",
                status_code=400,
            )

        loc = self._resolve_location(db, location_id=location_id, city=city)
        start_dt, end_dt = self._resolve_time_range(time_range, start_date, end_date)
        observations = self.repo.get_observations_in_range(db, loc.id, start_dt, end_dt)

        points = self._aggregate_interval_points(observations, clean_pol, interval)
        raw_vals = [float(getattr(obs, clean_pol)) for obs in observations if getattr(obs, clean_pol, None) is not None]
        stats = self.stats_service.calculate_stats(raw_vals)
        trend = self.trend_service.classify_trend(raw_vals, metric_name=clean_pol.upper())
        unit = comparison_service.METRIC_UNITS.get(clean_pol, "µg/m³")

        return PollutantTrendsResponse(
            location_id=loc.id,
            city=loc.city,
            pollutant=clean_pol,
            unit=unit,
            interval=interval,
            points=points,
            trend=trend,
            statistics=stats,
        )

    def get_statistics(
        self,
        db: Session,
        metric: str = "aqi",
        location_id: Optional[int] = None,
        city: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        time_range: str = "7d",
    ) -> StatisticsData:
        clean_m = metric.lower().strip()
        loc = self._resolve_location(db, location_id=location_id, city=city)
        start_dt, end_dt = self._resolve_time_range(time_range, start_date, end_date)
        observations = self.repo.get_observations_in_range(db, loc.id, start_dt, end_dt)
        vals = [float(getattr(obs, clean_m)) for obs in observations if getattr(obs, clean_m, None) is not None]
        return self.stats_service.calculate_stats(vals)

    def compare_locations(
        self,
        db: Session,
        location_ids: Optional[List[int]] = None,
        cities: Optional[List[str]] = None,
        metric: str = "aqi",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        time_range: str = "7d",
    ) -> LocationComparisonResponse:
        start_dt, end_dt = self._resolve_time_range(time_range, start_date, end_date)

        target_locs: List[Location] = []
        if location_ids:
            for lid in location_ids:
                l = self.repo.get_location_by_id_or_city(db, location_id=lid)
                if l and l not in target_locs:
                    target_locs.append(l)
        if cities:
            for c in cities:
                l = self.repo.get_location_by_id_or_city(db, city=c)
                if l and l not in target_locs:
                    target_locs.append(l)

        if not target_locs:
            # Default to first 2 locations in database
            target_locs = db.query(Location).limit(2).all()

        if len(target_locs) < 2:
            raise AirwiseException(
                message="Comparison requires at least 2 distinct monitoring locations.",
                code="INSUFFICIENT_COMPARISON_LOCATIONS",
                status_code=400,
            )

        payload_dict = {}
        for loc in target_locs:
            obs = self.repo.get_observations_in_range(db, loc.id, start_dt, end_dt)
            payload_dict[loc.id] = {"location": loc, "observations": obs}

        return self.comparison_service.compare_locations(
            locations_data=payload_dict,
            metric=metric,
            period_start=start_dt,
            period_end=end_dt,
        )

    def get_data_coverage(
        self,
        db: Session,
        location_id: Optional[int] = None,
        city: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        time_range: str = "7d",
    ) -> DataCoverageResponse:
        loc = self._resolve_location(db, location_id=location_id, city=city)
        start_dt, end_dt = self._resolve_time_range(time_range, start_date, end_date)
        observations = self.repo.get_observations_in_range(db, loc.id, start_dt, end_dt)

        total_hours = max(1, int((end_dt - start_dt).total_seconds() / 3600))
        recorded = len(observations)
        coverage_pct = round(min(100.0, (recorded / total_hours) * 100.0), 1)
        missing_count = max(0, total_hours - recorded)

        stale_hours = None
        now_utc = datetime.now(timezone.utc)
        latest_obs = observations[-1] if observations else None
        if latest_obs and latest_obs.observed_at:
            obs_tz = latest_obs.observed_at if latest_obs.observed_at.tzinfo else latest_obs.observed_at.replace(tzinfo=timezone.utc)
            stale_hours = round(max(0.0, (now_utc - obs_tz).total_seconds() / 3600.0), 1)

        # Status determination
        if stale_hours is not None and stale_hours > 24:
            status = "stale"
        elif coverage_pct >= 80.0:
            status = "good"
        elif coverage_pct >= 50.0:
            status = "partial"
        elif coverage_pct >= 20.0:
            status = "limited"
        else:
            status = "insufficient"

        # Check available pollutants
        pols = []
        if any(o.aqi is not None for o in observations): pols.append("aqi")
        if any(o.pm25 is not None for o in observations): pols.append("pm25")
        if any(o.pm10 is not None for o in observations): pols.append("pm10")
        if any(o.no2 is not None for o in observations): pols.append("no2")
        if any(o.so2 is not None for o in observations): pols.append("so2")
        if any(o.co is not None for o in observations): pols.append("co")
        if any(o.o3 is not None for o in observations): pols.append("o3")

        return DataCoverageResponse(
            location_id=loc.id,
            city=loc.city,
            country=loc.country,
            period_start=start_dt,
            period_end=end_dt,
            total_expected_hours=total_hours,
            recorded_observations=recorded,
            coverage_percentage=coverage_pct,
            missing_intervals_count=missing_count,
            stale_hours=stale_hours,
            coverage_status=status, # type: ignore
            available_pollutants=pols,
            aqi_scale=latest_obs.aqi_scale if latest_obs else "US_EPA",
            primary_provider=latest_obs.provider if latest_obs and latest_obs.provider else "sensor",
        )

    def get_map_observations(self, db: Session) -> List[MapObservationPoint]:
        loc_obs_pairs = self.repo.get_latest_observations_all_locations(db)
        points: List[MapObservationPoint] = []

        for loc, obs in loc_obs_pairs:
            aqi_val = obs.aqi if obs else None
            aqi_scale = obs.aqi_scale if obs and obs.aqi_scale else "US_EPA"
            cat = self.normalizer.get_aqi_category(aqi_val, aqi_scale) if aqi_val is not None else "Unknown"
            freshness = self.normalizer.calculate_freshness(obs.observed_at) if obs and obs.observed_at else "unavailable"

            points.append(
                MapObservationPoint(
                    location_id=loc.id,
                    name=loc.name,
                    city=loc.city,
                    country=loc.country,
                    latitude=loc.latitude,
                    longitude=loc.longitude,
                    aqi=aqi_val,
                    aqi_scale=aqi_scale,
                    aqi_category=cat,
                    pm25=obs.pm25 if obs else None,
                    pm10=obs.pm10 if obs else None,
                    no2=obs.no2 if obs else None,
                    so2=obs.so2 if obs else None,
                    co=obs.co if obs else None,
                    o3=obs.o3 if obs else None,
                    temperature=obs.temperature if obs else None,
                    humidity=obs.humidity if obs else None,
                    observed_at=obs.observed_at if obs else None,
                    provider=obs.provider if obs and obs.provider else "sensor",
                    freshness=freshness,
                    is_demo=obs.is_demo if obs else False,
                )
            )
        return points

    def export_csv(
        self,
        db: Session,
        location_id: Optional[int] = None,
        city: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        time_range: str = "30d",
    ) -> str:
        loc = self._resolve_location(db, location_id=location_id, city=city)
        start_dt, end_dt = self._resolve_time_range(time_range, start_date, end_date)
        observations = self.repo.get_observations_in_range(db, loc.id, start_dt, end_dt)

        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

        # Header
        writer.writerow([
            "Location_ID",
            "Location_Name",
            "City",
            "Country",
            "Observed_At_UTC",
            "AQI",
            "AQI_Scale",
            "PM2.5_ug_m3",
            "PM10_ug_m3",
            "NO2_ug_m3",
            "SO2_ug_m3",
            "CO_ug_m3",
            "O3_ug_m3",
            "Temperature_C",
            "Humidity_pct",
            "Provider",
            "Data_Source",
            "Freshness",
        ])

        for obs in observations:
            freshness = self.normalizer.calculate_freshness(obs.observed_at)
            row = [
                obs.location_id,
                self._sanitize_csv_cell(loc.name),
                self._sanitize_csv_cell(loc.city),
                self._sanitize_csv_cell(loc.country),
                obs.observed_at.isoformat() if obs.observed_at else "",
                obs.aqi if obs.aqi is not None else "",
                self._sanitize_csv_cell(obs.aqi_scale or "US_EPA"),
                obs.pm25 if obs.pm25 is not None else "",
                obs.pm10 if obs.pm10 is not None else "",
                obs.no2 if obs.no2 is not None else "",
                obs.so2 if obs.so2 is not None else "",
                obs.co if obs.co is not None else "",
                obs.o3 if obs.o3 is not None else "",
                obs.temperature if obs.temperature is not None else "",
                obs.humidity if obs.humidity is not None else "",
                self._sanitize_csv_cell(obs.provider or "sensor"),
                self._sanitize_csv_cell(obs.source or "sensor"),
                freshness,
            ]
            writer.writerow(row)

        return output.getvalue()

    @staticmethod
    def _sanitize_csv_cell(value: Any) -> str:
        """Formula injection prevention: escapes =, +, -, @ to prevent spreadsheet macro execution."""
        s = str(value or "")
        if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
            return "'" + s
        return s

    async def generate_insights(self, db: Session, req: AIInsightRequest) -> AIInsightResponse:
        loc = self._resolve_location(db, location_id=req.location_id, city=req.city)
        start_dt, end_dt = self._resolve_time_range(req.time_range, req.start_date, req.end_date)
        observations = self.repo.get_observations_in_range(db, loc.id, start_dt, end_dt)

        clean_metric = req.pollutant.lower().strip()
        unit = comparison_service.METRIC_UNITS.get(clean_metric, "µg/m³")

        vals = [float(getattr(o, clean_metric)) for o in observations if getattr(o, clean_metric, None) is not None]
        stats = self.stats_service.calculate_stats(vals)
        trend = self.trend_service.classify_trend(vals, metric_name=clean_metric.upper())

        return await self.insight_service.generate_insight(
            location_name=loc.name,
            city=loc.city,
            country=loc.country,
            metric=clean_metric,
            unit=unit,
            period_start=start_dt,
            period_end=end_dt,
            stats=stats,
            trend=trend,
            user_query=req.query,
        )

    @staticmethod
    def _aggregate_interval_points(
        observations: List[PollutionObservation],
        metric_field: str,
        interval: str = "daily",
    ) -> List[TimeIntervalPoint]:
        """Groups observations into hourly, daily, weekly, or monthly discrete intervals."""
        buckets: Dict[datetime, List[float]] = defaultdict(list)

        for obs in observations:
            val = getattr(obs, metric_field, None)
            if val is None or not obs.observed_at:
                continue

            t = obs.observed_at
            if interval == "hourly":
                bucket_key = datetime(t.year, t.month, t.day, t.hour, tzinfo=timezone.utc)
            elif interval == "weekly":
                # Floor to Monday of that week
                monday = t - timedelta(days=t.weekday())
                bucket_key = datetime(monday.year, monday.month, monday.day, tzinfo=timezone.utc)
            elif interval == "monthly":
                bucket_key = datetime(t.year, t.month, 1, tzinfo=timezone.utc)
            else: # daily default
                bucket_key = datetime(t.year, t.month, t.day, tzinfo=timezone.utc)

            buckets[bucket_key].append(float(val))

        result_points: List[TimeIntervalPoint] = []
        for dt_key in sorted(buckets.keys()):
            b_vals = buckets[dt_key]
            mean_v = round(sum(b_vals) / len(b_vals), 2)
            min_v = round(min(b_vals), 2)
            max_v = round(max(b_vals), 2)

            if interval == "hourly":
                label = dt_key.strftime("%H:00")
            elif interval == "monthly":
                label = dt_key.strftime("%b %Y")
            else:
                label = dt_key.strftime("%b %d")

            result_points.append(
                TimeIntervalPoint(
                    timestamp=dt_key,
                    period_label=label,
                    value=mean_v,
                    min=min_v,
                    max=max_v,
                    count=len(b_vals),
                )
            )

        return result_points


analytics_service = AnalyticsService()
