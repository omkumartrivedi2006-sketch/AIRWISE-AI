"""
AIRWISE AI — Indoor Air Quality Assessment Service
Performs risk analysis, source identification, personalized guidance,
and AI-assisted indoor environmental intelligence.
"""

import random
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.models.indoor_air import IndoorAssessment
from app.models.user import User
from app.schemas.indoor_air import (
    IndoorAIAdviceRequest,
    IndoorAIAdviceResponse,
    IndoorAssessmentCreate,
)
from app.services.ai.gemini_service import gemini_service


class IndoorAirService:
    """Core service for managing room assessments and environmental recommendations."""

    def evaluate_risk(self, data: IndoorAssessmentCreate) -> Dict[str, Any]:
        """Calculates deterministic risk score, sources, and actionable recommendations."""
        score = 15  # baseline indoor score
        sources = []
        risk_factors = []
        recommendations = []
        ventilation_tips = []
        priority_actions = []

        # 1. Room Type Evaluation
        room = (data.room_type or "").lower()
        if room == "kitchen":
            score += 15
            risk_factors.append("Kitchen environment with potential cooking emissions and combustion byproducts")
        elif room == "bedroom":
            score += 5
            risk_factors.append("Extended nocturnal exposure duration during sleep (6–8 hours)")
        elif room == "office":
            score += 5
            risk_factors.append("Enclosed work area with electronics and sedentary occupant loading")
        else:
            score += 5

        # 2. Ventilation Condition
        vent = (data.ventilation or "").lower()
        if vent == "poor":
            score += 30
            sources.append("Stagnant indoor air and inadequate air changes per hour (ACH)")
            risk_factors.append("Critical ventilation deficit causing VOC and CO2 accumulation")
            ventilation_tips.append("Open opposing doors/windows during low outdoor AQI hours to establish cross-ventilation.")
            ventilation_tips.append("Install an exhaust fan to mechanically pull stagnant air outdoors.")
            priority_actions.append("Establish active cross-ventilation or install mechanical extraction.")
        elif vent == "moderate":
            score += 15
            risk_factors.append("Limited natural airflow exchange")
            ventilation_tips.append("Crack open windows for 15–20 minutes in early afternoons when outdoor smog is lowest.")
        else:
            ventilation_tips.append("Maintain existing healthy ventilation routine, inspecting window seals periodically.")

        # 3. Cooking Fuel
        fuel = (data.cooking_fuel or "").lower()
        if fuel == "biomass":
            score += 35
            sources.append("Biomass combustion emitting high levels of PM2.5, carbon monoxide, and black carbon")
            risk_factors.append("Severe combustion smoke hazard from solid fuel burning")
            priority_actions.append("Transition to clean cooking fuels (LPG, induction) or cook exclusively in exterior/chimney-vented areas.")
            recommendations.append("Always operate dedicated range hood or cook near open exhaust windows.")
        elif fuel == "lpg":
            if room == "kitchen":
                score += 15
                sources.append("LPG combustion byproducts (NO2, trace CO)")
                recommendations.append("Ensure kitchen exhaust operates for at least 5 minutes after flame is extinguished.")
        elif fuel == "electricity":
            recommendations.append("Induction and electric cooking prevent hazardous indoor nitrogen dioxide combustion.")

        # 4. Smoking Exposure
        if data.smoking_exposure:
            score += 35
            sources.append("Environmental Tobacco Smoke (ETS) containing thousands of toxic fine particulates and PAHs")
            risk_factors.append("Direct second-hand smoke exposure to fine particulate toxins")
            priority_actions.append("Enforce a strict 100% smoke-free indoor policy; never smoke within enclosed rooms.")
            recommendations.append("Wash soft fabrics, curtains, and upholstery that absorb third-hand smoke chemicals.")

        # 5. Dust or Visible Smoke
        if data.dust_or_smoke:
            score += 20
            sources.append("Suspended coarse and fine particulate matter, dust mites, or ambient smoke infiltration")
            risk_factors.append("Elevated airborne particulate irritants")
            recommendations.append("Use damp microfiber cloths for surface dusting instead of dry sweeping which kicks up particles.")
            recommendations.append("Vacuum weekly using a vacuum cleaner equipped with a HEPA exhaust filter.")
            priority_actions.append("Adopt damp cleaning and reduce carpet/textile dust traps.")

        # 6. Mold or Dampness
        if data.mold_dampness:
            score += 25
            sources.append("Damp indoor building materials, fungal colonies, and airborne mold spores")
            risk_factors.append("Biological allergen and mycotoxin risk causing respiratory irritation")
            priority_actions.append("Fix underlying pipe or wall leaks and remediate mold with dilute vinegar or antifungal solution.")
            recommendations.append("Maintain indoor relative humidity strictly below 55% using dehumidification or exhaust fans.")

        # 7. Occupants Loading
        if data.occupants >= 4:
            score += 10
            risk_factors.append(f"Higher occupancy density ({data.occupants} persons) accelerating CO2 accumulation and humidity")
            recommendations.append("Increase ventilation frequency when multiple occupants occupy the room simultaneously.")

        # 8. Air Purifier Mitigation Factor
        if data.air_purifier:
            score = max(5, score - 25)
            recommendations.append("Ensure true HEPA filter is cleaned/replaced every 6 months to maintain filtration efficiency.")
        else:
            if score >= 45:
                recommendations.append("Consider deploying a True HEPA (H13) air purifier sized appropriately for the room's square footage.")

        # 9. Optional Sensor Data Influences
        if data.sensor_readings:
            readings = data.sensor_readings
            if readings.pm25 is not None and readings.pm25 > 60:
                score += 15
                risk_factors.append(f"Measured PM2.5 elevated at {readings.pm25} µg/m³")
            if readings.co2 is not None and readings.co2 > 1000:
                score += 10
                risk_factors.append(f"Measured CO2 elevated at {readings.co2} ppm indicating stale air")

        # Clamp score between 5 and 98
        final_score = max(5, min(98, score))

        if final_score < 30:
            risk_level = "Low Risk"
        elif final_score < 55:
            risk_level = "Moderate Risk"
        elif final_score < 75:
            risk_level = "Elevated Risk"
        else:
            risk_level = "High Risk"

        if not priority_actions:
            priority_actions.append("Maintain current indoor hygiene and inspect air filter performance periodically.")

        if not recommendations:
            recommendations.append("Keep indoor spaces clean, maintain moderate air exchange, and keep plants or air cleaners dust-free.")

        return {
            "risk_score": final_score,
            "risk_level": risk_level,
            "identified_sources": sources or ["Normal ambient background infiltration"],
            "risk_factors": risk_factors or ["General residential baseline exposure"],
            "recommendations": recommendations,
            "ventilation_tips": ventilation_tips or ["Crack open windows when outdoor air quality is moderate or satisfactory."],
            "priority_actions": priority_actions,
        }

    async def create_assessment(self, db, current_user: User, data: IndoorAssessmentCreate) -> IndoorAssessment:
        """Evaluates questionnaire and persists assessment document."""
        eval_result = self.evaluate_risk(data)

        readings_dict = None
        if data.sensor_readings:
            readings_dict = data.sensor_readings.model_dump(exclude_none=True)

        room_title = data.room_name or f"{data.room_type.replace('_', ' ').title()}"

        assessment = IndoorAssessment(
            user_id=current_user.id,
            room_type=data.room_type.lower(),
            room_name=room_title,
            ventilation=data.ventilation.lower(),
            cooking_fuel=data.cooking_fuel.lower(),
            smoking_exposure=bool(data.smoking_exposure),
            air_purifier=bool(data.air_purifier),
            dust_or_smoke=bool(data.dust_or_smoke),
            mold_dampness=bool(data.mold_dampness),
            occupants=int(data.occupants),
            sensor_readings=readings_dict,
            risk_score=eval_result["risk_score"],
            risk_level=eval_result["risk_level"],
            identified_sources=eval_result["identified_sources"],
            risk_factors=eval_result["risk_factors"],
            recommendations=eval_result["recommendations"],
            ventilation_tips=eval_result["ventilation_tips"],
            priority_actions=eval_result["priority_actions"],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        return assessment

    async def get_user_assessments(self, db, user_id: int, limit: int = 20) -> List[IndoorAssessment]:
        """Retrieves historical indoor assessments for a user."""
        return (
            db.query(IndoorAssessment)
            .filter(IndoorAssessment.user_id == user_id)
            .order_by(IndoorAssessment.created_at.desc())
            .limit(limit)
            .all()
        )

    async def get_latest_assessment(self, db, user_id: int) -> Optional[IndoorAssessment]:
        """Retrieves the most recent assessment for the user."""
        return (
            db.query(IndoorAssessment)
            .filter(IndoorAssessment.user_id == user_id)
            .order_by(IndoorAssessment.created_at.desc())
            .first()
        )

    async def get_ai_advice(self, db, current_user: User, request: IndoorAIAdviceRequest) -> IndoorAIAdviceResponse:
        """Consults Gemini AI with grounded context from the user's latest indoor assessment."""
        assessment = None
        if request.assessment_id:
            assessment = (
                db.query(IndoorAssessment)
                .filter(IndoorAssessment.id == request.assessment_id, IndoorAssessment.user_id == current_user.id)
                .first()
            )
        if not assessment:
            assessment = await self.get_latest_assessment(db, current_user.id)

        context_summary = {
            "room_type": request.room_type or (assessment.room_type if assessment else "bedroom"),
            "risk_score": assessment.risk_score if assessment else "Unassessed",
            "risk_level": assessment.risk_level if assessment else "Unknown",
            "ventilation": assessment.ventilation if assessment else "moderate",
            "has_purifier": assessment.air_purifier if assessment else False,
            "has_smoking": assessment.smoking_exposure if assessment else False,
            "has_mold": assessment.mold_dampness if assessment else False,
            "cooking_fuel": assessment.cooking_fuel if assessment else "lpg",
        }

        system_instruction = (
            "You are AIRWISE AI's Senior Indoor Air Quality Specialist. "
            "Help families make safe, scientific, and practical decisions to improve indoor air quality. "
            "NEVER invent sensor measurements. NEVER diagnose medical diseases. "
            "Provide grounded, actionable environmental advice in plain clear language."
        )

        prompt = (
            f"User Question: {request.question}\n\n"
            f"Indoor Assessment Context: Room={context_summary['room_type']}, "
            f"Risk Level={context_summary['risk_level']} (Score: {context_summary['risk_score']}/100), "
            f"Ventilation={context_summary['ventilation']}, Purifier={context_summary['has_purifier']}, "
            f"Smoking={context_summary['has_smoking']}, Mold/Dampness={context_summary['has_mold']}.\n\n"
            "Provide a clear practical explanation followed by concise action steps, a daily routine, and weekly maintenance."
        )

        try:
            if gemini_service.is_available():
                ai_text = await gemini_service.generate_response(
                    prompt=prompt,
                    context=context_summary,
                    system_instruction=system_instruction,
                )
                return IndoorAIAdviceResponse(
                    explanation=ai_text,
                    action_steps=[
                        f"Target primary risk factor: address {context_summary['ventilation']} ventilation and room sources.",
                        "Clean dust traps with damp microfiber cloths to prevent resuspension.",
                        "Inspect indoor humidity and keep levels between 40% and 55% to deter mold.",
                    ],
                    daily_routine=[
                        "Morning: Check outdoor AQI on AIRWISE AI before opening windows for ventilation.",
                        "Cooking: Keep kitchen door closed and run exhaust for 5 mins after cooking.",
                        "Evening: Run air purifier on medium/sleep mode in bedrooms during overnight rest.",
                    ],
                    weekly_maintenance=[
                        "Wipe fan blades, window sills, and blinds with a damp cloth.",
                        "Inspect air purifier pre-filter; vacuum surface dust buildup.",
                        "Check under bathroom and kitchen sinks for moisture or damp spots.",
                    ],
                    model="Google Gemini 2.5 Flash",
                )
        except Exception:
            pass

        # Robust, high-utility fallback when AI offline
        return IndoorAIAdviceResponse(
            explanation=(
                f"For your {context_summary['room_type']} with {context_summary['ventilation']} ventilation, "
                "prioritize isolating combustion pollutants and ensuring adequate air exchange. "
                "Indoor air frequently accumulates ultrafine particles and moisture if ventilation is restricted. "
                "Deploying targeted source elimination provides the fastest improvement in indoor air clarity."
            ),
            action_steps=[
                "Prevent indoor particulate generation: avoid burning incense, unvented fuel, or smoking indoors.",
                "Ventilate strategically: crack open windows when outdoor ambient AQI drops to moderate or good.",
                "Filtration: place a True HEPA purifier in the central breathing zone of the room.",
            ],
            daily_routine=[
                "7:00 AM: Check outdoor AQI on the AIRWISE dashboard before morning air exchange.",
                "1:00 PM: If outdoor PM2.5 is low, open opposing windows for 15 minutes of cross-ventilation.",
                "10:00 PM: Close exterior windows and set HEPA air cleaner to quiet night mode for restorative sleep.",
            ],
            weekly_maintenance=[
                "Vacuum living areas using a HEPA-sealed vacuum cleaner.",
                "Rinse or vacuum air purifier mesh pre-filters to prolong main HEPA filter lifespan.",
                "Inspect corners and window seals for any condensation, moisture accumulation, or fungal growth.",
            ],
            model="AIRWISE AI Environmental Expert Engine",
        )


indoor_air_service = IndoorAirService()
