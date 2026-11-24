"""
AIRWISE AI — Unit Tests for Indoor Air Quality & Community Insights
Tests risk scoring, CRUD persistence, privacy rounding, and API routers.
"""

import pytest
from app.schemas.indoor_air import IndoorAssessmentCreate, IndoorSensorInput
from app.services.indoor_air_service import indoor_air_service
from app.services.community_service import community_service
from app.schemas.community import CommunityReportCreate


def test_indoor_air_risk_evaluation():
    """Test deterministic risk scoring based on questionnaire answers."""
    # Test high risk scenario (biomass + smoking + poor ventilation)
    high_risk_data = IndoorAssessmentCreate(
        room_type="kitchen",
        ventilation="poor",
        cooking_fuel="biomass",
        smoking_exposure=True,
        air_purifier=False,
        dust_or_smoke=True,
        mold_dampness=True,
        occupants=4,
    )
    result = indoor_air_service.evaluate_risk(high_risk_data)
    assert result["risk_score"] >= 75
    assert result["risk_level"] == "High Risk"
    assert len(result["identified_sources"]) >= 3
    assert len(result["priority_actions"]) >= 1

    # Test low risk scenario (electric cooking + good ventilation + purifier)
    low_risk_data = IndoorAssessmentCreate(
        room_type="bedroom",
        ventilation="good",
        cooking_fuel="electricity",
        smoking_exposure=False,
        air_purifier=True,
        dust_or_smoke=False,
        mold_dampness=False,
        occupants=1,
    )
    low_result = indoor_air_service.evaluate_risk(low_risk_data)
    assert low_result["risk_score"] < 40
    assert low_result["risk_level"] in ("Low Risk", "Moderate Risk")


def test_community_reference_id_generation():
    """Test that community reference IDs follow REP-YYYY-XXXXX format."""
    ref_id = community_service._generate_reference_id()
    assert ref_id.startswith("REP-")
    parts = ref_id.split("-")
    assert len(parts) == 3
    assert len(parts[1]) == 4  # year
    assert len(parts[2]) == 5  # random code
