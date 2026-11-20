"""
AIRWISE AI — Pollution Service
Business logic layer for atmospheric observation retrieval, statistical summarization,
and sensor telemetry recording.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.core.exceptions import AirwiseException
from app.models.pollution import PollutionObservation
from app.repositories.location_repository import location_repository
from app.repositories.pollution_repository import pollution_repository
from app.schemas.pollution import PollutionObservationCreate


class PollutionService:
    def __init__(self, repo=pollution_repository, loc_repo=location_repository):
        self.repo = repo
        self.loc_repo = loc_repo

    def get_observations(
        self,
        db: Session,
        location_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[PollutionObservation]:
        if location_id is not None:
            location = self.loc_repo.get_by_id(db, location_id=location_id)
            if not location:
                raise AirwiseException(
                    message=f"Location with ID {location_id} not found.",
                    code="LOCATION_NOT_FOUND",
                    status_code=404,
                )
        return self.repo.get_all(
            db,
            location_id=location_id,
            start_date=start_date,
            end_date=end_date,
            skip=skip,
            limit=limit,
        )

    def get_observation_by_id(self, db: Session, observation_id: int) -> PollutionObservation:
        obs = self.repo.get_by_id(db, observation_id=observation_id)
        if not obs:
            raise AirwiseException(
                message=f"Pollution observation with ID {observation_id} not found.",
                code="OBSERVATION_NOT_FOUND",
                status_code=404,
            )
        return obs

    def get_latest_observations(self, db: Session, limit: int = 20) -> List[PollutionObservation]:
        return self.repo.get_latest_observations(db, limit=limit)

    def get_summary(
        self,
        db: Session,
        location_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        summary = self.repo.get_summary(
            db,
            location_id=location_id,
            start_date=start_date,
            end_date=end_date,
        )
        if not summary:
            raise AirwiseException(
                message=f"Location with ID {location_id} not found.",
                code="LOCATION_NOT_FOUND",
                status_code=404,
            )
        return summary

    def create_observation(self, db: Session, observation_in: PollutionObservationCreate) -> PollutionObservation:
        location = self.loc_repo.get_by_id(db, location_id=observation_in.location_id)
        if not location:
            raise AirwiseException(
                message=f"Cannot record observation. Location with ID {observation_in.location_id} not found.",
                code="LOCATION_NOT_FOUND",
                status_code=404,
            )
        return self.repo.create(db, observation_in=observation_in)

    def count_observations(
        self,
        db: Session,
        location_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> int:
        return self.repo.count(db, location_id=location_id, start_date=start_date, end_date=end_date)


pollution_service = PollutionService()
