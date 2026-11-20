"""
AIRWISE AI — Pollution Observation Repository
Database queries for atmospheric particulate telemetry, filtering, and metric aggregation.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.models.location import Location
from app.models.pollution import PollutionObservation
from app.schemas.pollution import PollutionObservationCreate


class PollutionRepository:
    @staticmethod
    def get_all(
        db: Session,
        location_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[PollutionObservation]:
        query = db.query(PollutionObservation).options(joinedload(PollutionObservation.location))
        if location_id is not None:
            query = query.filter(PollutionObservation.location_id == location_id)
        if start_date is not None:
            query = query.filter(PollutionObservation.observed_at >= start_date)
        if end_date is not None:
            query = query.filter(PollutionObservation.observed_at <= end_date)
        return query.order_by(PollutionObservation.observed_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, observation_id: int) -> Optional[PollutionObservation]:
        return db.query(PollutionObservation).options(
            joinedload(PollutionObservation.location)
        ).filter(PollutionObservation.id == observation_id).first()

    @staticmethod
    def get_latest_observations(db: Session, limit: int = 20) -> List[PollutionObservation]:
        """Returns the most recent observations across active monitoring stations."""
        return db.query(PollutionObservation).options(
            joinedload(PollutionObservation.location)
        ).order_by(PollutionObservation.observed_at.desc()).limit(limit).all()

    @staticmethod
    def get_latest_by_location(db: Session, location_id: int) -> Optional[PollutionObservation]:
        return db.query(PollutionObservation).options(
            joinedload(PollutionObservation.location)
        ).filter(PollutionObservation.location_id == location_id).order_by(
            PollutionObservation.observed_at.desc()
        ).first()

    @staticmethod
    def get_summary(
        db: Session,
        location_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Optional[Dict[str, Any]]:
        """Computes statistical averages and extremes for a monitoring station."""
        loc = db.query(Location).filter(Location.id == location_id).first()
        if not loc:
            return None

        query = db.query(
            func.count(PollutionObservation.id).label("total_count"),
            func.avg(PollutionObservation.aqi).label("avg_aqi"),
            func.min(PollutionObservation.aqi).label("min_aqi"),
            func.max(PollutionObservation.aqi).label("max_aqi"),
            func.avg(PollutionObservation.pm25).label("avg_pm25"),
            func.avg(PollutionObservation.pm10).label("avg_pm10"),
            func.avg(PollutionObservation.temperature).label("avg_temp"),
            func.avg(PollutionObservation.humidity).label("avg_hum"),
        ).filter(PollutionObservation.location_id == location_id)

        if start_date is not None:
            query = query.filter(PollutionObservation.observed_at >= start_date)
        if end_date is not None:
            query = query.filter(PollutionObservation.observed_at <= end_date)

        stats = query.first()
        count = stats.total_count if stats else 0

        return {
            "location_id": loc.id,
            "location_name": loc.name,
            "city": loc.city,
            "country": loc.country,
            "observation_count": count,
            "average_aqi": round(float(stats.avg_aqi), 1) if stats and stats.avg_aqi is not None else None,
            "min_aqi": int(stats.min_aqi) if stats and stats.min_aqi is not None else None,
            "max_aqi": int(stats.max_aqi) if stats and stats.max_aqi is not None else None,
            "average_pm25": round(float(stats.avg_pm25), 2) if stats and stats.avg_pm25 is not None else None,
            "average_pm10": round(float(stats.avg_pm10), 2) if stats and stats.avg_pm10 is not None else None,
            "average_temperature": round(float(stats.avg_temp), 1) if stats and stats.avg_temp is not None else None,
            "average_humidity": round(float(stats.avg_hum), 1) if stats and stats.avg_hum is not None else None,
            "start_date": start_date,
            "end_date": end_date,
        }

    @staticmethod
    def create(db: Session, observation_in: PollutionObservationCreate) -> PollutionObservation:
        db_obj = PollutionObservation(
            location_id=observation_in.location_id,
            aqi=observation_in.aqi,
            pm25=observation_in.pm25,
            pm10=observation_in.pm10,
            temperature=observation_in.temperature,
            humidity=observation_in.humidity,
            source=observation_in.source,
            observed_at=observation_in.observed_at,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def count(
        db: Session,
        location_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> int:
        query = db.query(PollutionObservation)
        if location_id is not None:
            query = query.filter(PollutionObservation.location_id == location_id)
        if start_date is not None:
            query = query.filter(PollutionObservation.observed_at >= start_date)
        if end_date is not None:
            query = query.filter(PollutionObservation.observed_at <= end_date)
        return query.count()


pollution_repository = PollutionRepository()
