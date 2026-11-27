"""
AIRWISE AI — Indoor Air Quality Assessment Service
Performs risk analysis, source identification, personalized guidance,
and AI-assisted indoor environmental intelligence.
"""

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

    async def get_ai_advice(self, db, current_user: Optional[User], request: IndoorAIAdviceRequest) -> IndoorAIAdviceResponse:
        """Consults Gemini AI with grounded context from the user's latest indoor assessment, with deep environmental fallback."""
        assessment = None
        if current_user and db:
            if request.assessment_id:
                try:
                    assessment = (
                        db.query(IndoorAssessment)
                        .filter(IndoorAssessment.id == request.assessment_id, IndoorAssessment.user_id == current_user.id)
                        .first()
                    )
                except Exception:
                    assessment = None
            if not assessment:
                try:
                    assessment = await self.get_latest_assessment(db, current_user.id)
                except Exception:
                    assessment = None

        context_summary = {
            "room_type": request.room_type or (assessment.room_type if assessment else "bedroom"),
            "risk_score": assessment.risk_score if assessment else "Unassessed",
            "risk_level": assessment.risk_level if assessment else "Moderate Risk",
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
            "Format your answer with clear markdown: start with a ### Title, followed by **Simple Summary:**, "
            "**Scientific Mechanism:**, **Essential Action Steps:** (numbered), **Daily Routine:**, and **Weekly Maintenance:**. "
            "Provide grounded, actionable environmental advice in plain clear language."
        )

        prompt = (
            f"User Question: {request.question}\n\n"
            f"Indoor Assessment Context:\n"
            f"- Room Type: {context_summary['room_type']}\n"
            f"- Ventilation Condition: {context_summary['ventilation']}\n"
            f"- Air Purifier: {'Present' if context_summary['has_purifier'] else 'Not Available'}\n"
            f"- Smoking Exposure: {'Yes' if context_summary['has_smoking'] else 'None'}\n"
            f"- Moisture/Mold: {'Present' if context_summary['has_mold'] else 'None'}\n"
            f"- Cooking Fuel: {context_summary['cooking_fuel']}\n"
            f"- Overall Risk Level: {context_summary['risk_level']} (Score: {context_summary['risk_score']}/100)\n\n"
            "Generate a structured, authoritative, and practical indoor air consultation addressing the question."
        )

        try:
            if gemini_service.is_available():
                ai_text = await gemini_service.generate_response(
                    prompt=prompt,
                    context=context_summary,
                    system_instruction=system_instruction,
                )
                if ai_text and len(ai_text.strip()) > 30:
                    return IndoorAIAdviceResponse(
                        explanation=ai_text,
                        action_steps=[
                            f"Target primary risk factor: address {context_summary['ventilation']} ventilation in your {context_summary['room_type']}.",
                            "Wipe high-contact surfaces with damp microfiber cloths to capture settled particulates.",
                            "Regulate indoor relative humidity between 40% and 55% to inhibit fungal spores.",
                            "Position any air filtration unit in the central breathing zone, away from obstructions.",
                        ],
                        daily_routine=[
                            "Morning (7:00 AM): Check outdoor AQI on AIRWISE AI before opening exterior windows.",
                            "Midday (1:00 PM): Run kitchen exhaust fan for 5–10 minutes after any stove combustion.",
                            "Night (10:00 PM): Close exterior windows and activate air cleaner on quiet sleep mode.",
                        ],
                        weekly_maintenance=[
                            "Vacuum living areas using a vacuum cleaner with a sealed HEPA exhaust filter.",
                            "Inspect and wash the air purifier mesh pre-filter to preserve main filter longevity.",
                            "Check window frames and damp plumbing corners for condensation or fungal growth.",
                        ],
                        model="Google Gemini 2.5 Flash",
                    )
        except Exception:
            pass

        # Robust, scientifically grounded expert engine fallback
        return self._generate_grounded_indoor_fallback(request.question, context_summary)

    def _generate_grounded_indoor_fallback(self, question: str, ctx: Dict[str, Any]) -> IndoorAIAdviceResponse:
        """Produces comprehensive, domain-grounded responses covering core indoor air topics."""
        lower = question.lower().strip()
        room = ctx.get("room_type", "bedroom").lower()
        vent = ctx.get("ventilation", "moderate").lower()

        # 1. BEDROOM & SLEEP
        if any(k in lower for k in ["bedroom", "sleep", "sleeping", "night", "morning wake", "bed"]):
            explanation = (
                "### Bedroom Air Quality & Restorative Sleep Protocol\n\n"
                "**Simple Summary:**\n"
                "During 7 to 8 hours of sleep, closed bedroom doors and windows cause carbon dioxide (CO2) to accumulate above 1200 ppm and allow fine dust and microscopic allergens to settle in your direct breathing zone.\n\n"
                "**Scientific Mechanism:**\n"
                "Human metabolic respiration continuously depletes oxygen and expels CO2. Elevated nocturnal CO2 impairs sleep architecture, triggers micro-arousals, and leads to morning headaches. Furthermore, skin cell shedding sustains dust mite colonies in mattresses and pillows, emitting allergenic digestive enzymes.\n\n"
                "**Essential Action Steps:**\n"
                "1. **Continuous Overnight Filtration:** Place a True HEPA air purifier 3 to 5 feet from your bed and run it on quiet/medium mode throughout the night.\n"
                "2. **Allergen-Proof Encasements:** Encase pillows and mattresses in dense zippered barrier covers to block dust mite allergens from becoming airborne.\n"
                "3. **Staggered Door Air Exchange:** Keep the bedroom door cracked open 2 to 4 inches at night to facilitate gentle cross-room convective air exchange and cap CO2 below 1000 ppm.\n"
                "4. **Zero-Combustion Bedroom Rule:** Never burn incense, scented candles, or mosquito coils inside the bedroom, as they release toxic benzene and ultrafine soot."
            )
            action_steps = [
                "Keep the bedroom door cracked open 2–4 inches to prevent nocturnal CO2 buildup.",
                "Encase pillows and mattress in certified allergy-proof barrier covers.",
                "Run a True HEPA purifier in the bedroom continuously on sleep mode.",
            ]
            daily = [
                "Morning (7:30 AM): Open bedroom door and windows for 10 minutes if outdoor AQI is moderate or good.",
                "Afternoon (2:00 PM): Keep bedding turned back to let mattress moisture evaporate.",
                "Night (10:00 PM): Close exterior windows, turn on HEPA cleaner, and set bedroom temperature to 20–22°C.",
            ]
            weekly = [
                "Wash pillowcases and bed sheets in hot water (>55°C / 130°F) to eliminate dust mites.",
                "Wipe headboards, blinds, and baseboards with a damp microfiber cloth.",
                "Vacuum mattress surface and under-bed carpeting using a HEPA vacuum.",
            ]

        # 2. KITCHEN & COOKING
        elif any(k in lower for k in ["kitchen", "cooking", "stove", "gas", "lpg", "fry", "smoke", "exhaust", "chimney"]):
            explanation = (
                "### Kitchen Ventilation & Cooking Emission Control\n\n"
                "**Simple Summary:**\n"
                "Domestic cooking—especially frying, searing, and unvented gas combustion—is the single largest episodic source of indoor toxic air pollution, emitting high levels of nitrogen dioxide (NO2), carbon monoxide (CO), and ultrafine lipid aerosols.\n\n"
                "**Scientific Mechanism:**\n"
                "Gas burners combust air at temperatures exceeding 1,200°C, producing reactive nitrogen oxides (NOx) that irritate bronchial passages and exacerbate childhood asthma. High-heat cooking oils undergo thermal degradation, releasing volatile aldehydes and acrolein alongside PM2.5 particles.\n\n"
                "**Essential Action Steps:**\n"
                "1. **Pre-Ignition Exhaust Activation:** Turn on your kitchen range hood or exhaust fan 1 minute *before* igniting the stove and keep it running for 5 to 10 minutes *after* turning off the flame.\n"
                "2. **Kitchen Door Isolation:** Keep the kitchen door firmly closed to adjoining living spaces while cooking to prevent aerosol migration into bedrooms.\n"
                "3. **Cooktop Lids & Splatter Screens:** Cover pots and frying pans with fitted lids or splatter guards to trap evaporating grease droplets before they aerosolize.\n"
                "4. **Electric Induction Transition:** Transition to electric induction cooktops where feasible, completely eliminating nitrogen dioxide and gas combustion emissions."
            )
            action_steps = [
                "Run kitchen exhaust fan on maximum before igniting burners and for 10 min after cooking.",
                "Keep kitchen doors closed to isolate cooking emissions from living spaces.",
                "Use cookware lids to capture aerosolized oil droplets and volatile organic vapors.",
            ]
            daily = [
                "Morning: Ensure kitchen exhaust fan grilles are clear before preparing breakfast.",
                "Midday: Open kitchen exterior window and run exhaust fan simultaneously while cooking.",
                "Evening: Wipe stove surface and surrounding backsplash immediately after dinner preparation.",
            ]
            weekly = [
                "Degrease kitchen exhaust hood baffle filters in hot soapy water to maintain airflow rate.",
                "Wipe kitchen cabinets and overhead range hood exterior with a degreasing cloth.",
                "Inspect gas stove burner ports to ensure clean, blue-flame combustion without yellow soot.",
            ]

        # 3. DUST & ALLERGENS
        elif any(k in lower for k in ["dust", "allergen", "allergy", "vacuum", "mite", "dander", "pet"]):
            explanation = (
                "### Indoor Dust & Allergen Abatement Protocol\n\n"
                "**Simple Summary:**\n"
                "Household dust is a complex suspension of shed human skin flakes, pet dander, microscopic fabric lint, outdoor mineral soil, and dust mite fragments that continually resuspends into your breathing zone with everyday foot traffic.\n\n"
                "**Scientific Mechanism:**\n"
                "Dry sweeping and feather dusters break electrostatic adhesion, propelling settled particles into the air where PM2.5 can remain suspended for up to 6 hours. Inhaled dust mite fecal particles (Der p 1) cross the epithelial barrier, provoking allergic rhinitis and chronic airway hyperresponsiveness.\n\n"
                "**Essential Action Steps:**\n"
                "1. **Damp Microfiber Technique:** Always clean surfaces with a damp microfiber cloth; dry dusters merely redistribute fine particles into the room.\n"
                "2. **Sealed True HEPA Vacuuming:** Use a vacuum with a fully sealed HEPA filtration system so expelled motor exhaust does not discharge fine particles back into the room.\n"
                "3. **Thermal Linen Washing:** Wash all bed sheets, pillowcases, and duvet covers weekly in water at or above 55°C (130°F) to denature allergenic mite proteins.\n"
                "4. **Declutter Horizontal Surfaces:** Keep books, soft plush toys, and knick-knacks inside glass cabinets to reduce dust-gathering surface area."
            )
            action_steps = [
                "Switch exclusively to damp microfiber cloths for wiping furniture and surfaces.",
                "Use a certified sealed HEPA vacuum cleaner on carpets and upholstered sofas.",
                "Wash bed linens weekly at 55°C+ to neutralize dust mite allergens.",
            ]
            daily = [
                "Morning: Leave bedroom shoes at the front doorway to prevent outdoor soil tracking.",
                "Afternoon: Do a quick 2-minute damp wipe on the primary dining and desk surfaces.",
                "Evening: Run air purifier in active living zones to capture daytime resuspended dust.",
            ]
            weekly = [
                "Vacuum mattresses, upholstered chairs, and rugs thoroughly with slow, deliberate strokes.",
                "Launder pet bedding in hot water and brush pets outdoors to minimize indoor dander shedding.",
                "Vacuum air conditioner return grilles and ceiling fan blades.",
            ]

        # 4. SEVERE OUTDOOR SMOG & WILDFIRE SMOKE
        elif any(k in lower for k in ["smog", "outdoor", "wildfire", "stubble", "haze", "severe", "winter smog", "inversion"]):
            explanation = (
                "### Indoor Defense Strategy During Severe Outdoor Air Pollution\n\n"
                "**Simple Summary:**\n"
                "When ambient outdoor AQI enters Poor, Very Poor, or Severe categories (>200), toxic fine particulates (PM2.5) infiltrate indoor living spaces within 30 to 60 minutes through window crevices and door gaps unless physical sealing and mechanical filtration are actively maintained.\n\n"
                "**Scientific Mechanism:**\n"
                "Thermal stack effects and wind pressures force ambient air through micro-fissures in window sills and doors (the infiltration rate typically averages 0.5 to 1.5 air changes per hour). Without active indoor filtration, indoor particulate levels can rise to 70–80% of outdoor ambient concentrations.\n\n"
                "**Essential Action Steps:**\n"
                "1. **Seal Perimeter Entrances:** Apply silicone or adhesive rubber weatherstripping along exterior window sashes and place draft-stopper rolls at bottom door thresholds.\n"
                "2. **Designate a Clean Air Sanctuary:** Fortify one primary room (such as the main bedroom) with an appropriately sized True HEPA air purifier running on continuous medium mode.\n"
                "3. **HVAC Internal Recirculation:** Switch air conditioning or heat pumps strictly to internal recirculate mode to avoid drawing unfiltered outdoor smog.\n"
                "4. **Halt Natural Ventilation:** Keep all exterior windows closed during high smog periods; postpone airing rooms until regional winds improve or rain washes out atmospheric particulates."
            )
            action_steps = [
                "Keep all exterior windows and balconies firmly closed throughout severe pollution spells.",
                "Apply draft stoppers to exterior door thresholds to restrict outdoor smog infiltration.",
                "Run a True HEPA air purifier continuously on medium/high in a designated clean room.",
            ]
            daily = [
                "Morning (7:00 AM): Check real-time outdoor station AQI on AIRWISE AI before considering any ventilation.",
                "Midday (1:00 PM): Verify window seals and door draft stoppers are firmly in place.",
                "Night (9:00 PM): Keep all bedroom windows locked shut with air purifier set to medium sleep speed.",
            ]
            weekly = [
                "Inspect air purifier pre-filters; gently vacuum off heavy particulate coatings.",
                "Wipe down window sills with a damp cloth to remove settled infiltration dust.",
                "Inspect window weatherstripping gaskets for any gaps or detachment.",
            ]

        # 5. AIR PURIFIER & HEPA
        elif any(k in lower for k in ["purifier", "hepa", "filter", "cadr", "cleaner", "carbon", "ionizer"]):
            explanation = (
                "### Air Purifier Selection & Optimization Strategy\n\n"
                "**Simple Summary:**\n"
                "A mechanical True HEPA air purifier is the most rigorously validated technology for reducing indoor particulate pollution, capturing 99.97% of airborne particles down to 0.3 micrometers without producing chemical byproducts.\n\n"
                "**Scientific Mechanism:**\n"
                "True HEPA filters use dense borosilicate glass fiber matrices that capture particles through direct impaction, interception, and Brownian diffusion. Particles smaller than 0.1 microns and larger than 0.4 microns are captured with >99.9% efficiency, while 0.3 microns represents the Most Penetrating Particle Size (MPPS).\n\n"
                "**Essential Action Steps:**\n"
                "1. **Confirm True HEPA Certification:** Reject ambiguous labels like 'HEPA-type' or 'HEPA-grade'; verify certified H13 or H14 medical-grade HEPA media.\n"
                "2. **Check CADR Sizing:** Calculate room volume (length × width × height in meters) and ensure the purifier CADR provides at least 4 to 5 complete Air Changes per Hour (ACH).\n"
                "3. **Optimal Placement:** Position the unit centrally in the room with at least 1.5 to 2 feet of clear clearance on all sides; avoid placing it flush against walls or behind curtains.\n"
                "4. **Avoid Ozone Generators and Ionizers:** Avoid uncertified electrostatic precipitators or plasma ionizers that generate secondary ozone (O3), which is a potent lung irritant."
            )
            action_steps = [
                "Select an H13/H14 certified True HEPA purifier sized to provide 4–5 air changes per hour.",
                "Position the purifier centrally in the room with unobstructed airflow on all sides.",
                "Run the purifier on medium/sleep mode continuously rather than intermittent 10-minute bursts.",
            ]
            daily = [
                "Morning: Turn purifier from sleep mode up to medium speed as room activity begins.",
                "Midday: Ensure no clothing, papers, or toys are obstructing the air intake grilles.",
                "Night: Set purifier to low/sleep mode in the bedroom 30 minutes before retiring to bed.",
            ]
            weekly = [
                "Vacuum or rinse the front mesh pre-filter to stop coarse dust from clogging the main HEPA media.",
                "Check the unit's filter lifespan indicator on the console.",
                "Wipe the external plastic casing and particle sensor inlet with a dry microfiber cloth.",
            ]

        # 6. MOLD, MOISTURE & HUMIDITY
        elif any(k in lower for k in ["mold", "damp", "humidity", "moisture", "fungus", "mildew", "spore", "wet"]):
            explanation = (
                "### Mold Prevention & Indoor Moisture Management\n\n"
                "**Simple Summary:**\n"
                "Relative indoor humidity consistently above 60% creates the microclimate required for mold colonies (Aspergillus, Cladosporium) to flourish on drywall, bathroom grout, and behind furniture, releasing allergenic spores and mycotoxins.\n\n"
                "**Scientific Mechanism:**\n"
                "Fungal spores are ubiquitous in ambient air and require only liquid moisture or sustained high relative humidity (>60% RH) on organic substrates to germinate. Inhaled fungal glucans provoke chronic mucosal inflammation, nasal congestion, and asthma flare-ups.\n\n"
                "**Essential Action Steps:**\n"
                "1. **Maintain 40%–50% Relative Humidity:** Use a digital thermo-hygrometer to monitor moisture; deploy a compressor dehumidifier if indoor humidity exceeds 55%.\n"
                "2. **Bathroom Moisture Extraction:** Run bathroom exhaust fans during showers and for at least 20 minutes afterward with the bathroom door closed to outside rooms.\n"
                "3. **Eliminate Cold Thermal Bridges:** Pull furniture, wardrobes, and beds at least 3 to 4 inches away from exterior cold walls to allow thermal circulation and prevent condensation.\n"
                "4. **Non-Toxic Mold Remediation:** Clean minor surface mold using white distilled vinegar (5% acetic acid) or sodium percarbonate rather than household bleach, which fails to penetrate porous surfaces."
            )
            action_steps = [
                "Keep indoor relative humidity strictly between 40% and 50% using ventilation or dehumidifiers.",
                "Run bathroom exhaust fans for 20 minutes after bathing to exhaust moisture.",
                "Pull beds and wardrobes 3 inches away from cold exterior walls to prevent condensation.",
            ]
            daily = [
                "Morning: Wipe down any condensation droplets on bedroom window glass and frames.",
                "Midday: Check digital hygrometer reading; if humidity exceeds 60%, activate dehumidification.",
                "Evening: Ensure kitchen and bathroom exhaust dampers close securely to prevent reverse drafts.",
            ]
            weekly = [
                "Inspect under bathroom and kitchen sinks for slow pipe seepage or moisture stains.",
                "Wipe bathroom tile joints and silicone seals with an antifungal vinegar solution.",
                "Empty and rinse the dehumidifier water tank to prevent bacterial biofilm buildup.",
            ]

        # 7. GENERAL / ROOM-SPECIFIC SYNTHESIS
        else:
            explanation = (
                f"### Environmental Air Quality Protocol for {room.title()}\n\n"
                f"**Simple Summary:**\n"
                f"Improving air quality in your {room} requires an integrated approach: eliminating internal pollutant sources, managing {vent} ventilation strategically, and providing continuous mechanical particle filtration.\n\n"
                f"**Scientific Mechanism:**\n"
                f"Indoor environments concentrate airborne contaminants up to 5 times higher than outdoor air when air exchange is stagnant. Volatile organic compounds from cleaning agents and furniture, combined with particulate matter from domestic activities, degrade respiratory health without active management.\n\n"
                f"**Essential Action Steps:**\n"
                f"1. **Source Control First:** Remove or isolate indoor emission sources (combustion fuels, synthetic sprays, incense, open flame) before relying on filtration.\n"
                f"2. **Synchronized Ventilation:** Cross-ventilate your {room} for 15 minutes during early afternoon hours (1:00 PM – 3:00 PM) when atmospheric mixing is highest and outdoor AQI is at its daily minimum.\n"
                f"3. **Targeted True HEPA Filtration:** Run a certified H13 HEPA air purifier sized for your room volume to capture microscopic particulates (PM2.5, pollen, dander).\n"
                f"4. **Moisture & Microfiber Wiping:** Clean surfaces exclusively with damp microfiber towels to capture dust rather than dry sweeping."
            )
            action_steps = [
                f"Target primary risk factor: address {vent} ventilation and emissions in your {room}.",
                "Wipe furniture and surfaces with damp microfiber cloths to capture settled particulates.",
                "Position a True HEPA air purifier in the central breathing zone of the room.",
            ]
            daily = [
                "Morning (7:30 AM): Check outdoor AQI on AIRWISE AI before opening windows for ventilation.",
                "Midday (1:30 PM): Open opposing windows for 15 minutes of cross-ventilation if outdoor AQI is moderate.",
                "Evening (9:30 PM): Close exterior windows and run air cleaner on quiet mode overnight.",
            ]
            weekly = [
                "Vacuum room floors and carpets using a vacuum with a sealed HEPA exhaust filter.",
                "Rinse or vacuum air purifier mesh pre-filters to prolong main HEPA filter lifespan.",
                "Inspect corners and window seals for moisture accumulation or dust accumulation.",
            ]

        return IndoorAIAdviceResponse(
            explanation=explanation,
            action_steps=action_steps,
            daily_routine=daily,
            weekly_maintenance=weekly,
            model="AIRWISE Grounded Environmental Engine",
            disclaimer="Environmental recommendation advisory only. Not a medical diagnosis or hardware sensor measurement.",
        )


indoor_air_service = IndoorAirService()
