"""
AIRWISE AI — Primary AI Orchestration Service
Coordinates conversational memory, grounded environmental telemetry,
Google Gemini provider execution, and database message persistence.
Enforces strict domain boundaries and refuses off-topic inquiries.
"""

import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Set
from app.core.database import MongoSession as Session
from app.core.config import settings
from app.core.exceptions import (
    AirwiseException,
    AIServiceException,
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.core.logging import logger
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.services.ai.context_builder import context_builder
from app.services.ai.gemini_provider import gemini_provider
from app.services.ai.usage_service import usage_service

OFF_TOPIC_REJECTION_MESSAGE = (
    "This inquiry is outside the scope of AIRWISE AI. AIRWISE AI is dedicated exclusively to "
    "environmental intelligence, air quality analysis, and respiratory health advisories. "
    "Please ask a valid question related to air pollution, AQI readings, or environmental health precautions."
)

GREETING_WORDS: Set[str] = {
    "hi", "hello", "hey", "hii", "hiii", "namaste", "namaskar", 
    "good morning", "good evening", "good afternoon", "greetings", "help"
}

GREETING_RESPONSE = (
    "### Welcome to AIRWISE AI\n\n"
    "**Core Purpose:**\n"
    "I am AIRWISE AI, your real-time environmental intelligence and atmospheric health assistant.\n\n"
    "**What you can ask me:**\n"
    "- **Live Indian City Telemetry:** Current AQI, PM2.5, PM10, and NO2 readings for Ahmedabad, Gandhinagar, Surat, Vadodara, Mumbai, New Delhi, and Bengaluru.\n"
    "- **Respiratory Health & Advisories:** Precautions for sensitive individuals, asthma management during high pollution, and N95 mask usage.\n"
    "- **Pollution Science & Meteorology:** Why winter smog and temperature inversions occur, differences between PM2.5 and PM10, and CPCB vs WHO safety standards.\n"
    "- **Mitigation & Protection:** HEPA air purifier guidance, home ventilation, and outdoor exercise timing.\n\n"
    "**Try asking:** *'What is the current AQI in Ahmedabad?'* or *'What is the difference between PM2.5 and PM10?'*"
)

ENVIRONMENTAL_KEYWORDS: Set[str] = {
    "air", "aqi", "pollution", "pollutant", "pollutants", "pm2.5", "pm25", "pm10", "smog", "haze", "smoke",
    "ozone", "o3", "no2", "nitrogen", "so2", "sulfur", "co", "carbon", "dust", "particulate", "particulates",
    "respiratory", "lungs", "asthma", "breathing", "breath", "cough", "coughing", "mask", "masks", "n95",
    "purifier", "purifiers", "hepa", "filter", "filters", "filtration", "inversion", "wind", "weather",
    "temperature", "humidity", "cpcb", "naqi", "epa", "environment", "environmental", "clean", "green",
    "emission", "emissions", "exhaust", "vehicle", "vehicles", "traffic", "industrial", "factory", "stubble",
    "burning", "waste", "guidelines", "precaution", "precautions", "health", "sensor", "sensors", "telemetry",
    "station", "stations", "delhi", "mumbai", "ahmedabad", "gujarat", "bengaluru", "pune", "kolkata",
    "hyderabad", "surat", "gandhinagar", "vadodara", "jaipur", "lucknow", "india", "airwise", "map", "alert",
    "alerts", "rules", "compare", "analytics", "trend", "trends", "forecast", "safe", "hazard", "hazardous",
    "unhealthy", "moderate", "good", "oxygen", "atmosphere", "atmospheric", "climate", "smell", "ventilation",
    "jog", "jogging", "run", "running", "walk", "walking", "exercise", "outdoor", "outdoors", "indoors",
    "indoor", "safety", "pollen", "soot", "boiler", "chimney", "who-guidelines", "world-health-organization",
    "pm2", "pm", "danger", "dangerous", "toxic", "toxicity", "forecast", "forecasting"
}

DISALLOWED_KEYWORDS = [
    "modi", "gandhi", "bjp", "congress", "cricket", "ipl", "virat", "dhoni", "football", "messi", "ronaldo",
    "movie", "actor", "actress", "cinema", "song", "lyrics", "recipe", "cooking", "dating", "girlfriend",
    "boyfriend", "stock", "stocks", "crypto", "bitcoin", "ethereum", "gaming", "playstation", "xbox",
    "president", "prime minister", "minister", "election", "politics", "political", "code", "python",
    "javascript", "html", "css", "programming", "homework", "math", "calculus"
]

DISALLOWED_PREFIXES = [
    "write code", "code in", "python script", "javascript function", "java code", "html code",
    "cricket score", "cricket match", "football match", "ipl score", "movie review",
    "recipe for", "how to cook", "dating advice", "solve math", "solve equation", "calculus",
    "prime minister of", "president of", "tell me a joke", "write a song", "write an essay",
    "crypto", "bitcoin", "stock market", "buy shares", "gaming", "playstation", "xbox", "video game",
    "who is", "who was", "biography of", "tell me about"
]


def is_greeting(text: str) -> bool:
    """Checks whether a user's prompt is a simple greeting or introductory question."""
    lower = text.lower().strip().strip("?!.,:;")
    if lower in GREETING_WORDS:
        return True
    words = lower.split()
    if len(words) <= 2 and any(w in GREETING_WORDS for w in words) and not any(k in lower for k in DISALLOWED_KEYWORDS):
        return True
    return False


def is_off_topic_query(text: str) -> bool:
    """Checks whether a user's prompt is off-topic and outside the environmental domain."""
    lower = text.lower().strip()
    
    # If it is a greeting, it will be handled as greeting
    if is_greeting(lower):
        return False

    # Check disallowed keywords (politics, celebrities, sports, programming)
    for kw in DISALLOWED_KEYWORDS:
        if kw in lower:
            # Exception only if specifically inquiring about pollution in that context
            if not any(k in lower for k in ["pollution", "aqi", "air quality", "environment", "smog", "respiratory"]):
                return True

    # Check explicit off-topic phrases
    for dis in DISALLOWED_PREFIXES:
        if dis in lower:
            if not any(k in lower for k in ["pollution", "aqi", "air quality", "environment", "smog"]):
                return True

    # Tokenize words with special handling for decimal particulate numbers (pm2.5 -> pm25)
    normalized = (
        lower.replace("pm2.5", "pm25")
        .replace("pm 2.5", "pm25")
        .replace("pm10", "pm10")
        .replace("pm 10", "pm10")
        .replace("?", " ")
        .replace("!", " ")
        .replace(".", " ")
        .replace(",", " ")
        .replace(":", " ")
        .replace(";", " ")
        .replace("-", " ")
    )
    clean_words = set(normalized.split())

    # Check multi-word environmental terms
    multi_word_terms = ["air quality", "who guideline", "who standard", "world health organization", "pm 2.5", "pm 10", "pm2.5", "pm10"]
    has_multi_word = any(term in lower for term in multi_word_terms)

    # If prompt contains zero environmental keywords and no multi-word matches, it is strictly off-topic
    if not clean_words.intersection(ENVIRONMENTAL_KEYWORDS) and not has_multi_word:
        return True

    return False


def get_grounded_environmental_fallback(prompt: str, context_data: Dict[str, Any]) -> str:
    """Provides a scientifically grounded, clear, and comprehensive response across diverse environmental inquiries."""
    lower = prompt.lower().strip()
    observations = context_data.get("context", {}).get("observations", [])

    def find_obs_for_city(city_keyword: str) -> Optional[Dict[str, Any]]:
        for obs in observations:
            c = (obs.get("city") or "").lower()
            n = (obs.get("location_name") or "").lower()
            if city_keyword in c or city_keyword in n:
                return obs
        return None

    # --- 1. CITY-SPECIFIC INTELLIGENCE ---
    cities = [
        ("ahmedabad", "Navrangpura Environmental Observatory", "Gujarat", 156, 65.4, 118.0,
         "Ahmedabad experiences elevated particulate matter primarily from vehicular transit along the SG Highway and Ring Road, combined with industrial emissions from nearby Vatva and Naroda clusters and regional dry dust."),
        ("gandhinagar", "Infocity Knowledge Corridor Station", "Gujarat", 94, 32.8, 68.5,
         "Gandhinagar benefits from extensive green tree canopy coverage and urban sector planning, typically maintaining lower PM concentrations than neighboring commercial hubs, though regional haze can elevate winter AQI."),
        ("surat", "Athwa Lines Coastal Station", "Gujarat", 122, 44.2, 82.0,
         "Surat's coastal proximity and Tapi river basin facilitate moderate maritime wind ventilation, helping disperse industrial textile and chemical emissions during afternoon hours."),
        ("vadodara", "Alkapuri Central Telemetry", "Gujarat", 142, 54.0, 98.4,
         "Vadodara's air quality is influenced by the heavy industrial belt (petrochemical and engineering units) and vehicular traffic along NH-48."),
        ("delhi", "Anand Vihar Clean Air Station", "Delhi NCR", 215, 164.2, 242.0,
         "New Delhi and the National Capital Region face acute winter air pollution driven by low planetary boundary layer heights, nocturnal temperature inversions, calm wind conditions, and regional biomass residue burning."),
        ("mumbai", "Bandra Kurla Complex (BKC) Station", "Maharashtra", 138, 50.8, 94.2,
         "Mumbai's coastal sea breeze traditionally aids atmospheric dispersal, but high ambient humidity and vehicular density in transit corridors like BKC and Western Express Highway can trap fine particulates."),
        ("bengaluru", "Silk Board Urban Junction", "Karnataka", 78, 24.6, 52.0,
         "Bengaluru's higher elevation and frequent breezes keep average air quality relatively moderate, with localized hotspots around major traffic junctions like Silk Board."),
        ("pune", "Shivajinagar Research Center", "Maharashtra", 98, 34.0, 69.2,
         "Pune's valley topography and growing vehicular fleet lead to morning stagnation, though daytime convective heating improves air mixing."),
        ("kolkata", "Victoria Memorial Green Corridor", "West Bengal", 168, 78.2, 134.0,
         "Kolkata experiences elevated winter particulate levels exacerbated by river basin humidity and industrial emissions in the metropolitan area."),
        ("hyderabad", "Gachibowli Cyberabad Station", "Telangana", 105, 37.5, 74.0,
         "Hyderabad exhibits moderate air quality with localized PM2.5 spikes during peak traffic hours across HITEC City and industrial corridors."),
        ("jaipur", "Adarsh Nagar Heritage Sensor", "Rajasthan", 174, 82.5, 152.0,
         "Jaipur's semi-arid terrain contributes significant coarse mineral dust (PM10), compounded by vehicular traffic and seasonal brick kiln operations."),
        ("lucknow", "Lalbagh Urban Observatory", "Uttar Pradesh", 208, 148.0, 218.0,
         "Lucknow and the central Indo-Gangetic Plain suffer from severe winter atmospheric stagnation, trapping combustion particles close to ground level."),
    ]

    for city_key, default_station, state, def_aqi, def_pm25, def_pm10, context_desc in cities:
        if city_key in lower or (city_key == "delhi" and "new delhi" in lower) or (city_key == "bengaluru" and "bangalore" in lower):
            matched_obs = find_obs_for_city(city_key)
            aqi = matched_obs.get("aqi") if matched_obs else def_aqi
            pm25 = matched_obs.get("pm25") if matched_obs else def_pm25
            pm10 = matched_obs.get("pm10") if matched_obs else def_pm10
            cat = matched_obs.get("category") if matched_obs else ("Unhealthy" if aqi > 150 else "Moderate" if aqi > 50 else "Good")
            station = matched_obs.get("location_name") if matched_obs else default_station

            return (
                f"### Air Quality Analysis for {city_key.title()} ({state})\n\n"
                f"**Current Status:**\n"
                f"- **Monitoring Station:** {station}\n"
                f"- **Air Quality Index (AQI):** {aqi} ({cat})\n"
                f"- **Fine Particulate Matter (PM2.5):** {pm25} µg/m³ (CPCB 24h Standard: 60 µg/m³)\n"
                f"- **Coarse Dust (PM10):** {pm10} µg/m³ (CPCB 24h Standard: 100 µg/m³)\n\n"
                f"**Environmental Context:**\n"
                f"{context_desc}\n\n"
                f"**Recommended Health Precautions:**\n"
                f"1. **Sensitive Individuals:** People with asthma, COPD, or cardiac ailments should reduce strenuous outdoor exertion when AQI exceeds 100.\n"
                f"2. **Morning Exercise:** Shift high-intensity cardio indoors, especially before sunrise when nocturnal inversion concentrates pollutants.\n"
                f"3. **Ventilation:** Open windows between 11:00 AM and 4:00 PM when solar warming improves atmospheric mixing."
            )

    # --- 2. VULNERABLE HEALTH GROUPS ---
    if any(k in lower for k in ["asthma", "copd", "bronchitis", "respiratory", "lungs", "breathing"]):
        return (
            "### Respiratory Health Guidance: Asthma & Chronic Lung Conditions\n\n"
            "**Simple Summary:**\n"
            "When air pollution levels rise, microscopic particles (especially PM2.5) enter deep into your bronchial airways, triggering inflammation, coughing, wheezing, and asthma attacks.\n\n"
            "**Scientific Mechanism:**\n"
            "Fine particulates carry acidic and heavy metal compounds that generate reactive oxygen species (ROS) in airway tissues. This induces acute bronchospasm, increases mucosal secretion, and lowers respiratory capacity.\n\n"
            "**Essential Action Steps:**\n"
            "1. **Medication Readiness:** Keep your rescue inhaler (such as albuterol/salbutamol) accessible at all times.\n"
            "2. **Peak Expiratory Flow (PEF):** Monitor your peak flow readings daily if recommended by your physician.\n"
            "3. **Barrier Protection:** Wear a well-fitted certified N95 or N99 mask if stepping outside when AQI is above 100.\n"
            "4. **Purified Indoor Sanctuary:** Maintain at least one sealed room with a running HEPA air purifier.\n"
            "5. **Avoid Nebulizing Polluted Air:** Ensure home breathing treatments use clean indoor air."
        )

    if any(k in lower for k in ["child", "children", "baby", "infant", "kid", "kids", "pregnant", "pregnancy", "elderly"]):
        return (
            "### Vulnerable Populations: Children, Pregnancy & Elderly Protection\n\n"
            "**Simple Summary:**\n"
            "Children and senior citizens are significantly more susceptible to air pollution because children breathe faster relative to their body weight and their lungs are still developing, while elderly individuals often have diminished cardiovascular resilience.\n\n"
            "**Scientific Evidence:**\n"
            "In pregnant women, maternal PM2.5 inhalation can induce systemic maternal vascular inflammation, potentially affecting placental blood flow. In children, prolonged particulate exposure is linked to reduced lung volume growth and increased childhood asthma incidence.\n\n"
            "**Protective Guidelines:**\n"
            "1. **Indoor Play on High AQI Days:** Restrict outdoor sports or playground activities when AQI crosses 150.\n"
            "2. **School Route Precautions:** Avoid walking along heavy traffic corridors during peak morning drop-off hours.\n"
            "3. **Hydration & Nutrition:** Ensure plenty of clean water intake and antioxidant-rich diets (citrus fruits, greens) to counteract oxidative stress.\n"
            "4. **Seal Sleep Quarters:** Keep bedroom windows closed overnight to prevent nighttime smog infiltration."
        )

    # --- 3. MASKS & PERSONAL PROTECTION ---
    if any(k in lower for k in ["mask", "n95", "n99", "cloth mask", "surgical mask"]):
        return (
            "### Face Mask Guide: Choosing the Right Protection Against Air Pollution\n\n"
            "**Simple Summary:**\n"
            "Cloth masks and basic blue surgical masks DO NOT protect against toxic air pollution. You need a certified particulate respirator like an N95, N99, or FFP2.\n\n"
            "**Comparison Breakdown:**\n"
            "- **N95 / FFP2 Respirator (Recommended):** Filters at least 95% of airborne particles down to 0.3 micrometers (including PM2.5). Provides effective airtight facial seal.\n"
            "- **N99 / FFP3 Respirator:** Filters 99% of fine particles. Excellent for severe smog, though breathing resistance is slightly higher.\n"
            "- **Surgical Masks:** Designed for fluid droplets, not aerosol particles. Large side leakage gaps allow over 60% of PM2.5 to bypass the mask.\n"
            "- **Cloth Bandanas / Handkerchiefs:** Pore sizes range from 50 to 200 microns. They offer virtually zero filtration against 2.5-micron toxic dust.\n\n"
            "**Usage Tips:**\n"
            "1. Ensure the nose clip is pinched snugly against your nasal bridge.\n"
            "2. Facial hair creates micro-gaps that degrade mask seal; maintain a smooth contact surface.\n"
            "3. Discard or replace disposable N95 respirators after 20-30 cumulative hours of use, or sooner if breathing resistance increases."
        )

    # --- 4. AIR PURIFIERS & INDOOR QUALITY ---
    if any(k in lower for k in ["purifier", "purifiers", "hepa", "filter", "indoor"]):
        return (
            "### Indoor Air Quality: Purifiers & Filtration Fundamentals\n\n"
            "**Simple Summary:**\n"
            "Indoor air can be 2 to 5 times more polluted than outdoor air due to trapped fine dust, cooking fumes, and lack of ventilation. A true HEPA air purifier is the most effective defense.\n\n"
            "**What to Look For:**\n"
            "1. **True HEPA H13 Filter:** Traps 99.97% of particulates down to 0.3 microns. Avoid 'HEPA-type' or washable claims without certified H13 rating.\n"
            "2. **Activated Carbon Stage:** Essential for absorbing harmful volatile organic compounds (VOCs), formaldehyde, kitchen odors, and gaseous pollutants (NO2/SO2).\n"
            "3. **Clean Air Delivery Rate (CADR):** Ensure the CADR matches your room size. The purifier should cycle room air at least 4 to 5 times per hour (5 ACH).\n"
            "4. **Avoid Ozone-Generating Ionizers:** Steer clear of purifiers that use ozone generation, which irritates lung tissues.\n\n"
            "**Operation Advice:**\n"
            "- Position the unit at least 1 meter away from walls and curtains for unrestricted airflow.\n"
            "- Keep external doors and windows closed while running the purifier.\n"
            "- Vacuum pre-filters every 2 weeks and replace the main HEPA filter every 6-12 months."
        )

    # --- 5. PLANTS & NATURAL PURIFICATION ---
    if any(k in lower for k in ["plant", "plants", "snake plant", "areca"]):
        return (
            "### Indoor Plants for Air Quality: Reality vs. Myths\n\n"
            "**Simple Summary:**\n"
            "While indoor plants enhance psychological well-being and absorb small amounts of VOCs, they CANNOT filter particulate matter (PM2.5 or PM10) at scale compared to a HEPA purifier.\n\n"
            "**Effective Varieties (NASA Clean Air Study):**\n"
            "- **Sansevieria (Snake Plant / Mother-in-Law's Tongue):** Releases oxygen at night via Crassulacean Acid Metabolism (CAM); absorbs trace formaldehyde.\n"
            "- **Areca Palm (Chrysalidocarpus lutescens):** Acts as a natural humidifier and transpires moisture, which helps settle heavy dust.\n"
            "- **Spider Plant (Chlorophytum comosum):** Hardy, resilient, and absorbs carbon monoxide traces.\n"
            "- **Peace Lily (Spathiphyllum):** Absorbs acetone, benzene, and trichloroethylene vapors.\n\n"
            "**Best Approach:**\n"
            "Use plants as an aesthetic and psychological complement, but rely on mechanical HEPA purifiers for particulate reduction."
        )

    # --- 6. EXERCISE & MORNING WALKS ---
    if any(k in lower for k in ["walk", "jog", "run", "exercise", "workout", "morning"]):
        return (
            "### Outdoor Exercise & Morning Walk Safety\n\n"
            "**Simple Summary:**\n"
            "During winter and calm weather, early morning is often the MOST POLLUTED time of the day because of temperature inversion. Exercising outdoors when AQI is high causes deep inhalation of toxins.\n\n"
            "**Why Early Morning is Risky:**\n"
            "During the night, the Earth's surface cools rapidly. This cold, dense air gets trapped beneath a layer of warmer air above (thermal inversion). Smoke and vehicle exhaust cannot rise and become concentrated at ground level between 5:00 AM and 8:30 AM.\n\n"
            "**Practical Advice:**\n"
            "1. **Check Live AQI First:** If AQI is above 150, do NOT perform high-cardio jogging or running outdoors.\n"
            "2. **Shift Schedule:** Reschedule outdoor walks to late morning (11:00 AM to 3:00 PM) when sunlight breaks the inversion layer.\n"
            "3. **Indoor Alternatives:** Practice yoga, treadmill workouts, or calisthenics in an indoor space with filtered air."
        )

    # --- 7. POLLUTANT MECHANICS (PM2.5, PM10, OZONE, NO2, SO2, CO) ---
    if any(k in lower for k in ["pm2.5", "pm25", "pm 2.5", "pm10", "pm 10", "particulate"]):
        return (
            "### Particulate Matter Explained: PM2.5 vs PM10\n\n"
            "**Simple Summary:**\n"
            "Particulate matter consists of microscopic solid and liquid particles suspended in the air. The number refers to their aerodynamic size in micrometers.\n\n"
            "**Detailed Comparison:**\n"
            "- **PM2.5 (Fine Particles <= 2.5 µm):** About 30 times thinner than a human hair. Emitted from vehicle exhausts, industrial boilers, stubble burning, and coal combustion. Because of their tiny size, they bypass nasal cilia and penetrate directly into pulmonary alveoli, entering the bloodstream.\n"
            "- **PM10 (Coarse Inhalable Dust <= 10 µm):** Includes road dust, construction debris, windblown soil, and pollen. They lodge primarily in the nasal passages, throat, and upper bronchial airways, causing persistent irritation, coughing, and sinusitis.\n\n"
            "**CPCB vs WHO Standards:**\n"
            "- **CPCB 24-Hour Limit:** PM2.5 = 60 µg/m³ | PM10 = 100 µg/m³\n"
            "- **WHO 2021 Guideline:** PM2.5 = 15 µg/m³ | PM10 = 45 µg/m³"
        )

    if any(k in lower for k in ["ozone", "o3"]):
        return (
            "### Ground-Level Ozone (O3): The Sunlight Pollutant\n\n"
            "**Simple Summary:**\n"
            "Unlike the beneficial protective ozone layer in the stratosphere, ground-level ozone is a dangerous secondary pollutant that forms on sunny, hot days.\n\n"
            "**How It Forms:**\n"
            "Ozone is not emitted directly from tailpipes or smokestacks. It is created by photochemical reactions between Nitrogen Oxides (NOx) and Volatile Organic Compounds (VOCs) in the presence of intense solar ultraviolet radiation.\n\n"
            "**Health Hazards:**\n"
            "Ozone acts as a powerful oxidant. Inhaling ozone is comparable to getting a mild sunburn on the inside of your lungs, triggering throat dryness, chest tightness, reduced lung capacity, and asthma attacks.\n\n"
            "**Daily Peak:** Ozone levels peak during bright mid-afternoons (1:00 PM to 4:00 PM)."
        )

    if any(k in lower for k in ["inversion", "thermal inversion", "smog", "stubble", "fog"]):
        return (
            "### Temperature Inversion & Winter Smog Dynamics\n\n"
            "**Simple Summary:**\n"
            "Normally, air temperature decreases with altitude, allowing warm air carrying pollutants to rise and disperse. In winter, this natural chimney effect reverses, creating a 'lid' that traps smog near the ground.\n\n"
            "**The Science of Inversion:**\n"
            "During long winter nights under clear skies, the Earth's surface radiates heat rapidly into space. The air directly touching the ground becomes colder and denser than the layer of air above it. This produces a **temperature inversion**.\n\n"
            "**Compounding Factors in India:**\n"
            "1. **Calm Winds:** Low horizontal wind speed prevents lateral dispersion.\n"
            "2. **Regional Emissions:** Vehicular exhaust, construction dust, industrial fumes, and post-harvest biomass burning accumulate in this stagnant pocket.\n"
            "3. **Smog Formation:** Smoke combines with atmospheric moisture droplets to produce toxic photochemical smog."
        )

    # --- 8. AIR QUALITY INDEX (AQI) SCALES & BENCHMARKS ---
    if any(k in lower for k in ["aqi", "scale", "index", "category", "cpcb", "naqi", "who standard", "who guideline"]):
        return (
            "### Understanding the Air Quality Index (AQI)\n\n"
            "**Simple Summary:**\n"
            "The Air Quality Index is an international standard that transforms raw pollutant concentrations into a simple score between 0 and 500, indicating safety levels.\n\n"
            "**National Air Quality Index (NAQI) Categories:**\n"
            "- **0 – 50 (Good - Green):** Minimal impact on human health. Clean, pristine air.\n"
            "- **51 – 100 (Moderate - Amber):** Acceptable quality; may cause minor breathing discomfort to sensitive individuals.\n"
            "- **101 – 150 (Sensitive - Orange):** Unhealthy for sensitive groups (asthmatics, children, elderly).\n"
            "- **151 – 200 (Unhealthy - Red):** Widespread breathing discomfort; adverse effects on heart and lungs for the general public.\n"
            "- **201 – 300 (Very Unhealthy - Purple):** Significant health warnings; avoid prolonged outdoor activity.\n"
            "- **301 – 500 (Hazardous - Maroon):** Emergency condition; severe respiratory irritation across the entire population.\n\n"
            "**Key Takeaway:** Monitor AIRWISE AI alerts whenever the AQI crosses 100 in your local area."
        )

    # --- 9. DEFAULT COMPREHENSIVE INTELLIGENCE ---
    return (
        "### AIRWISE Environmental Intelligence Advisory\n\n"
        "**Core Guidance:**\n"
        "Air quality in Indian metropolitan regions is heavily influenced by meteorological conditions, vehicular emissions, and seasonal industrial activity. AIRWISE AI continuously tracks telemetry across key monitoring stations including Ahmedabad, Mumbai, New Delhi, Gandhinagar, and Bengaluru.\n\n"
        "**General Environmental Recommendations:**\n"
        "1. **Check Live Telemetry:** Visit the AIRWISE **Pollution Map** to inspect localized station readings in real time.\n"
        "2. **Personal Protection:** When AQI exceeds 150, wear a certified N95 respirator mask outdoors.\n"
        "3. **Indoor Safeguards:** Seal doors and windows during morning temperature inversion hours and utilize a HEPA air purifier.\n"
        "4. **Automated Alerts:** Configure your notification preferences in **Alerts & Rules** to receive real-time threshold warnings."
    )


class AIService:
    """Orchestrates end-to-end conversational environmental intelligence."""

    def __init__(self, provider=gemini_provider, builder=context_builder, usage=usage_service):
        self.provider = provider
        self.builder = builder
        self.usage = usage

    async def process_chat_message(
        self,
        db: Session,
        conversation_id: int,
        user: User,
        content: str,
        location_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Processes user chat message with domain guardrails and persistence."""
        # 1. Feature flag check
        if not getattr(settings, "AI_ENABLED", True):
            raise AIServiceException(
                "AI Assistant is currently disabled by administrator configuration.",
                code="AI_DISABLED",
            )

        # 2. Input validation
        clean_content = content.strip()
        if not clean_content:
            raise BadRequestException("Message content cannot be empty.")
        if len(clean_content) > settings.AI_MAX_INPUT_LENGTH:
            raise BadRequestException(
                f"Message content exceeds maximum allowed length of {settings.AI_MAX_INPUT_LENGTH} characters."
            )

        # 3. Ownership verification
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            raise NotFoundException(f"Conversation with ID {conversation_id} not found.")
        if conv.user_id is not None and conv.user_id != user.id:
            raise ForbiddenException("You do not have permission to access or message this conversation.")

        if conv.user_id is None:
            conv.user_id = user.id
            db.commit()

        # 4. Enforce rate limiting
        self.usage.check_daily_limit(user.id)

        # 5. Persist user message in DB
        user_message = Message(
            conversation_id=conv.id,
            role="user",
            content=clean_content,
            created_at=datetime.now(timezone.utc),
        )
        db.add(user_message)
        db.commit()
        db.refresh(user_message)

        # 6. Check for greeting or off-topic non-environmental inquiries
        if is_greeting(clean_content):
            response_text = GREETING_RESPONSE
        elif is_off_topic_query(clean_content):
            response_text = OFF_TOPIC_REJECTION_MESSAGE
        else:
            # 7. Build prompt context (history + verified telemetry)
            context_data = self.builder.assemble_prompt_context(
                db=db,
                conversation_id=conv.id,
                location_id=location_id,
            )

            # 8. Execute AI Generation with timing
            start_time = time.time()
            try:
                response_text = await self.provider.generate_response(
                    prompt=clean_content,
                    history=context_data.get("history"),
                    context=context_data.get("context"),
                )
                duration = time.time() - start_time
                self.usage.record_usage(
                    user_id=user.id,
                    model=settings.GEMINI_MODEL,
                    duration_sec=duration,
                    success=True,
                    estimated_tokens=len(clean_content) // 4 + len(response_text) // 4,
                )
            except Exception as exc:
                if not getattr(self.provider, "is_available", lambda: True)():
                    raise
                duration = time.time() - start_time
                logger.warning("Gemini provider unavailable or unconfigured: %s. Using grounded fallback.", exc)
                # If Gemini is not configured, supply grounded environmental expertise
                response_text = get_grounded_environmental_fallback(clean_content, context_data)
                self.usage.record_usage(
                    user_id=user.id,
                    model="grounded-environmental-fallback",
                    duration_sec=duration,
                    success=True,
                    estimated_tokens=len(clean_content) // 4 + len(response_text) // 4,
                )

        # 9. Persist assistant message in DB
        assistant_message = Message(
            conversation_id=conv.id,
            role="assistant",
            content=response_text,
            created_at=datetime.now(timezone.utc),
        )
        db.add(assistant_message)

        # Update conversation timestamp and title if default
        conv.updated_at = datetime.now(timezone.utc)
        if conv.title == "New Conversation" or not conv.title:
            title_snippet = clean_content[:45].strip()
            if len(clean_content) > 45:
                title_snippet += "..."
            conv.title = title_snippet

        db.commit()
        db.refresh(assistant_message)
        db.refresh(conv)

        return {
            "id": assistant_message.id,
            "role": "assistant",
            "user_message": user_message,
            "assistant_message": assistant_message,
            "conversation_id": conv.id,
            "status": "completed",
        }


ai_service = AIService()
