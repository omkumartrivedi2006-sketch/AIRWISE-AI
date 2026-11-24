"""
AIRWISE AI — Indoor Air Quality Assessment Model (MongoDB Document)
Stores room-specific risk assessments, sensor readings, identified pollution sources,
and personalized environmental improvement recommendations.
"""

from datetime import datetime, timezone
from app.models.base import Base, Column, DateTime, Integer, String, Float, Boolean


class IndoorAssessment(Base):
    __tablename__ = "indoor_assessments"
    __collection__ = "indoor_assessments"

    id = Column(name="id", type_hint=int, autoincrement=True)
    user_id = Column(name="user_id", type_hint=int, index=True)
    room_type = Column(name="room_type", type_hint=str, default="bedroom")
    room_name = Column(name="room_name", type_hint=str, default="Primary Bedroom")
    ventilation = Column(name="ventilation", type_hint=str, default="moderate")  # poor, moderate, good
    cooking_fuel = Column(name="cooking_fuel", type_hint=str, default="lpg")  # lpg, electricity, biomass, other, na
    smoking_exposure = Column(name="smoking_exposure", type_hint=bool, default=False)
    air_purifier = Column(name="air_purifier", type_hint=bool, default=False)
    dust_or_smoke = Column(name="dust_or_smoke", type_hint=bool, default=False)
    mold_dampness = Column(name="mold_dampness", type_hint=bool, default=False)
    occupants = Column(name="occupants", type_hint=int, default=2)

    # Optional measured sensor readings (only when user has actual hardware)
    sensor_readings = Column(name="sensor_readings", type_hint=dict, default=None)

    # Analyzed Risk Factors and Scores
    risk_score = Column(name="risk_score", type_hint=int, default=25)  # 0 to 100
    risk_level = Column(name="risk_level", type_hint=str, default="low")  # low, moderate, elevated, high
    identified_sources = Column(name="identified_sources", type_hint=list, default=lambda: [])
    risk_factors = Column(name="risk_factors", type_hint=list, default=lambda: [])
    recommendations = Column(name="recommendations", type_hint=list, default=lambda: [])
    ventilation_tips = Column(name="ventilation_tips", type_hint=list, default=lambda: [])
    priority_actions = Column(name="priority_actions", type_hint=list, default=lambda: [])

    created_at = Column(name="created_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(name="updated_at", type_hint=datetime, default=lambda: datetime.now(timezone.utc))
