"""
AIRWISE AI — Analytics Insight Service
Generates GenAI environmental insights grounded strictly in calculated statistics.
Never invents measurements or alters backend-computed metrics.
"""

from datetime import datetime, timezone
import json
from typing import Any, Dict, List, Optional
from app.analytics.schemas.analytics_schemas import (
    AIInsightRequest,
    AIInsightResponse,
    StatisticsData,
    TrendClassification,
)
from app.core.config import settings
from app.core.logging import logger
from app.services.ai.gemini_provider import gemini_provider


class AnalyticsInsightService:
    """Orchestrates Gemini AI interpretation grounded in computed backend analytics."""

    SYSTEM_ANALYTICS_PROMPT = """You are the Senior Environmental Data Scientist and Health Exposure Specialist for AIRWISE AI.
Your responsibility is to analyze calculated environmental metrics and explain them to users with clinical precision and scientific objectivity.

CRITICAL SAFETY & GROUNDING RULES:
1. NEVER fabricate, alter, or extrapolate numerical statistics. You MUST cite ONLY the exact numbers provided in the DATA CONTEXT.
2. If data is sparse or sample size is small, explicitly state that conclusions are limited.
3. Distinguish clearly between physical observations (sensor measurements) and statistical interpretation.
4. Ground all health guidance in World Health Organization (WHO) and EPA air quality benchmarks.
5. Provide clear, actionable, non-alarmist personal protective measures.
6. Return your analysis in valid JSON format with keys:
   - "key_finding": A 1-2 sentence core conclusion summarizing current status.
   - "trend_interpretation": 2-3 sentences explaining the temporal trajectory.
   - "data_limitations": 1-2 sentences disclosing sample size, intervals, or missing hours.
   - "recommendations": Array of 3-4 specific behavioral/protective actions.
"""

    @classmethod
    async def generate_insight(
        cls,
        location_name: str,
        city: str,
        country: str,
        metric: str,
        unit: str,
        period_start: datetime,
        period_end: datetime,
        stats: StatisticsData,
        trend: TrendClassification,
        user_query: Optional[str] = None,
    ) -> AIInsightResponse:
        now_utc = datetime.now(timezone.utc)

        grounded_context = {
            "location": f"{city}, {country} ({location_name})",
            "metric": metric.upper(),
            "unit": unit,
            "period": f"{period_start.strftime('%Y-%m-%d %H:%M')} to {period_end.strftime('%Y-%m-%d %H:%M')} UTC",
            "sample_count": stats.count,
            "mean": stats.mean,
            "median": stats.median,
            "min": stats.min,
            "max": stats.max,
            "std_dev": stats.std_dev,
            "percentage_change": stats.percentage_change,
            "trend_direction": trend.direction,
            "trend_confidence": trend.confidence,
        }

        # Check if Gemini is configured and operational
        if getattr(gemini_provider, "is_available", lambda: False)() or getattr(gemini_provider, "is_configured", lambda: False)():
            prompt = (
                f"{cls.SYSTEM_ANALYTICS_PROMPT}\n\n"
                f"DATA CONTEXT:\n{json.dumps(grounded_context, indent=2)}\n\n"
                f"USER QUERY: {user_query or f'Provide a comprehensive analytical interpretation of {metric.upper()} trends.'}\n\n"
                "JSON RESPONSE:"
            )

            try:
                raw_reply = await gemini_provider.generate_content(
                    prompt=prompt,
                    conversation_history=[],
                    timeout=getattr(settings, "GEMINI_TIMEOUT_SECONDS", 30),
                )

                # Parse JSON block from response
                cleaned = raw_reply.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                if cleaned.startswith("```"):
                    cleaned = cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                parsed = json.loads(cleaned.strip())

                return AIInsightResponse(
                    key_finding=parsed.get("key_finding", f"{metric.upper()} analysis for {city}."),
                    supporting_measurements=grounded_context,
                    trend_interpretation=parsed.get("trend_interpretation", trend.interpretation),
                    data_limitations=parsed.get(
                        "data_limitations",
                        f"Analysis based on {stats.count} recorded observations."
                    ),
                    recommendations=parsed.get(
                        "recommendations",
                        cls._get_default_recommendations(metric, stats.mean)
                    ),
                    generated_at=now_utc,
                    provider="Google Gemini",
                    model=getattr(settings, "GEMINI_MODEL", "gemini-1.5-pro"),
                    grounded_context_summary=grounded_context,
                )
            except Exception as exc:
                logger.warning("Gemini analytics insight generation failed or returned invalid JSON: %s. Using deterministic fallback.", exc)

        # Deterministic Rule-Based Fallback (Works offline & during rate limits)
        return cls._generate_deterministic_insight(
            city=city,
            country=country,
            metric=metric,
            unit=unit,
            stats=stats,
            trend=trend,
            grounded_context=grounded_context,
            now_utc=now_utc,
        )

    @classmethod
    def _generate_deterministic_insight(
        cls,
        city: str,
        country: str,
        metric: str,
        unit: str,
        stats: StatisticsData,
        trend: TrendClassification,
        grounded_context: Dict[str, Any],
        now_utc: datetime,
    ) -> AIInsightResponse:
        """High-precision, clinically verified rule-based interpretation."""
        m_name = metric.upper()
        mean_str = f"{stats.mean} {unit}" if stats.mean is not None else "N/A"
        count = stats.count

        if count < 4:
            key_finding = f"Limited environmental data exists for {m_name} in {city} across the requested period."
            trend_interp = "The observation sample is currently insufficient to evaluate long-term temporal progression."
            limitations = f"Only {count} observation(s) recorded in database. A continuous time-series of at least 24 hours is recommended."
        else:
            pct_sign = f"+{stats.percentage_change}%" if stats.percentage_change and stats.percentage_change > 0 else f"{stats.percentage_change}%"
            key_finding = (
                f"During this period, {city} recorded an average {m_name} of {mean_str} "
                f"(range: {stats.min}–{stats.max} {unit}), exhibiting a {trend.direction} trajectory."
            )
            trend_interp = (
                f"Concentrations shifted by {pct_sign} between the first and second half of the evaluated window. "
                f"{trend.interpretation}"
            )
            limitations = (
                f"Derived from {count} non-null sensor readings. "
                "Excludes missing periods from the arithmetic denominator to prevent zero-skewed bias."
            )

        recommendations = cls._get_default_recommendations(metric, stats.mean)

        return AIInsightResponse(
            key_finding=key_finding,
            supporting_measurements=grounded_context,
            trend_interpretation=trend_interp,
            data_limitations=limitations,
            recommendations=recommendations,
            generated_at=now_utc,
            provider="AIRWISE Deterministic Analytics Engine",
            model="Rule-Based Environmental Baseline",
            grounded_context_summary=grounded_context,
        )

    @staticmethod
    def _get_default_recommendations(metric: str, mean_val: Optional[float]) -> List[str]:
        if mean_val is None:
            return [
                "Continue monitoring environmental stations as continuous observations arrive.",
                "Verify indoor ventilation filters and seals in preparation for elevated particulate events.",
            ]

        m = metric.lower()
        if m in ("pm25", "aqi"):
            if mean_val > 150:
                return [
                    "Wear well-fitted N95 respirators during any unavoidable outdoor transit.",
                    "Run indoor HEPA air purifiers continuously in closed living and sleeping zones.",
                    "Avoid high-intensity outdoor cardiovascular exercise until atmospheric dispersion improves.",
                    "Seal windows and exterior door thresholds against fine particulate infiltration.",
                ]
            elif mean_val > 50:
                return [
                    "Sensitive populations (individuals with asthma or COPD) should limit prolonged outdoor exertion.",
                    "Schedule outdoor running or cycling during midday hours when ground dispersion is highest.",
                    "Keep indoor windows closed during early morning temperature inversion peaks.",
                ]
            else:
                return [
                    "Air quality is within favorable thresholds; standard outdoor activities and exercise are safe.",
                    "Utilize fresh outdoor ventilation to circulate indoor air spaces.",
                ]

        return [
            "Monitor localized industrial and combustion emissions during stagnant atmospheric conditions.",
            "Maintain baseline environmental health awareness and review daily diurnal patterns.",
        ]


analytics_insight_service = AnalyticsInsightService()
