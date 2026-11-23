"""
AIRWISE AI — Feedback Repository
Stores ratings and user feedback for platform quality assessment.
"""

from typing import List, Optional
from app.core.database import MongoSession as Session
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate


class FeedbackRepository:
    @staticmethod
    def create(db: Session, feedback_in: FeedbackCreate) -> Feedback:
        db_obj = Feedback(
            rating=feedback_in.rating,
            comment=feedback_in.comment,
            conversation_id=feedback_in.conversation_id,
            user_id=feedback_in.user_id,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 20) -> List[Feedback]:
        return db.query(Feedback).order_by(Feedback.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def count(db: Session) -> int:
        return db.query(Feedback).count()


feedback_repository = FeedbackRepository()
