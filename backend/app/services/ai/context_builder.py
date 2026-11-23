"""
AIRWISE AI — AI Context Builder
Assembles multi-turn dialogue memory and grounds inquiries with verified environmental observations.
"""

from typing import Any, Dict, List, Optional
from app.core.database import MongoSession as Session
from app.core.config import settings
from app.models.location import Location
from app.models.message import Message
from app.models.pollution import PollutionObservation


class ContextBuilder:
    """Builds conversation history and environmental grounding context for AI inference."""

    def __init__(self, max_history_messages: int = 20):
        self.max_history_messages = max_history_messages

    def extract_conversation_history(
        self,
        db: Session,
        conversation_id: int,
    ) -> List[Dict[str, str]]:
        """
        Retrieves the most recent dialogue history within the configured limit,
        preserving chronological flow while omitting system instructions from history.
        """
        recent_messages = (
            db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(self.max_history_messages)
            .all()
        )

        chronological = list(reversed(recent_messages))
        history: List[Dict[str, str]] = []
        for msg in chronological:
            if msg.role in ("user", "assistant"):
                history.append({
                    "role": msg.role,
                    "content": msg.content,
                })
        return history

    def get_grounding_observations(
        self,
        db: Session,
        location_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves verified environmental sensor observations for grounding.
        Prioritizes a specific requested location if provided; otherwise pulls latest verified observations.
        """
        query = (
            db.query(PollutionObservation)
            .join(Location, PollutionObservation.location_id == Location.id)
        )

        if location_id is not None:
            query = query.filter(PollutionObservation.location_id == location_id)

        observations = query.order_by(PollutionObservation.observed_at.desc()).limit(2).all()

        results: List[Dict[str, Any]] = []
        for obs in observations:
            loc = obs.location
            aqi_cat = "Unknown"
            if obs.aqi is not None:
                if obs.aqi <= 50:
                    aqi_cat = "Good"
                elif obs.aqi <= 100:
                    aqi_cat = "Moderate"
                elif obs.aqi <= 150:
                    aqi_cat = "Sensitive"
                elif obs.aqi <= 200:
                    aqi_cat = "Unhealthy"
                elif obs.aqi <= 300:
                    aqi_cat = "Very Unhealthy"
                else:
                    aqi_cat = "Hazardous"

            results.append({
                "location_name": loc.name if loc else "Regional Station",
                "city": loc.city if loc else "Unknown City",
                "country": loc.country if loc else "Unknown Country",
                "aqi": obs.aqi,
                "aqi_scale": getattr(obs, "aqi_scale", "US_EPA"),
                "category": aqi_cat,
                "pm25": obs.pm25,
                "pm10": obs.pm10,
                "no2": getattr(obs, "no2", None),
                "so2": getattr(obs, "so2", None),
                "co": getattr(obs, "co", None),
                "o3": getattr(obs, "o3", None),
                "temperature": obs.temperature,
                "humidity": obs.humidity,
                "wind_speed": getattr(obs, "wind_speed", None),
                "provider": getattr(obs, "provider", "open-meteo"),
                "source": obs.source or "AIRWISE Sensor Network",
                "timestamp": obs.observed_at.isoformat() if obs.observed_at else None,
                "is_verified": getattr(obs, "is_verified", True),
            })
        return results

    def assemble_prompt_context(
        self,
        db: Session,
        conversation_id: int,
        location_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Combines recent conversation history with relevant environmental telemetry."""
        history = self.extract_conversation_history(db, conversation_id=conversation_id)
        observations = self.get_grounding_observations(db, location_id=location_id)

        context: Dict[str, Any] = {}
        if observations:
            context["observations"] = observations

        return {
            "history": history,
            "context": context,
        }


context_builder = ContextBuilder(max_history_messages=settings.AI_MAX_HISTORY_MESSAGES)
