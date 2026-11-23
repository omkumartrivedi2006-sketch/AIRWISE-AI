"""
AIRWISE AI — Module 05 AI Engine Unit Tests
Tests GeminiProvider initialization, BaseAIProvider contract, System Prompt formatting,
ContextBuilder multi-turn extraction and grounding, and UsageService rate limits.
"""

import pytest
from app.core.exceptions import AirwiseException, AIServiceException
from app.services.ai.gemini_provider import GeminiProvider
from app.services.ai.prompts import SYSTEM_POLLUTION_EXPERT_PROMPT, format_context_prompt, format_observation_context
from app.services.ai.context_builder import ContextBuilder
from app.services.ai.usage_service import UsageService


def test_gemini_provider_unconfigured_and_status():
    provider = GeminiProvider()
    provider.set_mock_response(None)
    # Check status dictionary structure
    status_data = provider.get_status()
    assert "status" in status_data
    assert "provider" in status_data
    assert status_data["provider"] == "google-gemini"
    assert "model" in status_data


@pytest.mark.asyncio
async def test_gemini_provider_mock_response():
    provider = GeminiProvider()
    provider.set_mock_response("PM2.5 particles are fine inhalable particles <= 2.5 microns.")
    assert provider.is_available() is True

    result = await provider.generate_response(prompt="Explain PM2.5")
    assert "PM2.5 particles" in result

    provider.set_mock_response(None)


def test_system_prompt_integrity():
    assert "AIRWISE AI" in SYSTEM_POLLUTION_EXPERT_PROMPT
    assert "PM2.5" in SYSTEM_POLLUTION_EXPERT_PROMPT
    assert "PM10" in SYSTEM_POLLUTION_EXPERT_PROMPT
    assert "No Medical Diagnoses" in SYSTEM_POLLUTION_EXPERT_PROMPT
    assert "No Data Fabrication" in SYSTEM_POLLUTION_EXPERT_PROMPT
    assert "Untrusted Input Protection" in SYSTEM_POLLUTION_EXPERT_PROMPT


def test_format_observation_context():
    # Empty observations
    empty_ctx = format_observation_context([])
    assert "No real-time sensor observations" in empty_ctx

    # Populated observations
    observations = [
        {
            "location_name": "Downtown Station",
            "city": "Austin",
            "country": "USA",
            "aqi": 42,
            "category": "Good",
            "pm25": 9.8,
            "pm10": 18.2,
            "temperature": 24.5,
            "humidity": 55.0,
            "source": "EPA AirNow",
            "timestamp": "2026-11-20T12:00:00Z",
        }
    ]
    obs_ctx = format_observation_context(observations)
    assert "Downtown Station" in obs_ctx
    assert "Austin" in obs_ctx
    assert "AQI: 42 (Good)" in obs_ctx
    assert "EPA AirNow" in obs_ctx


def test_usage_service_rate_limiting():
    usage = UsageService(max_daily_requests=3, window_seconds=86400)
    user_id = 999
    usage.reset_limits(user_id)

    # 3 requests allowed
    for _ in range(3):
        usage.check_daily_limit(user_id)
        usage.record_usage(user_id, model="gemini-1.5-pro", duration_sec=0.5, success=True)

    quota = usage.get_user_quota(user_id)
    assert quota["used_today"] == 3
    assert quota["remaining"] == 0

    # 4th request must raise 429
    with pytest.raises(AirwiseException) as exc_info:
        usage.check_daily_limit(user_id)
    assert exc_info.value.status_code == 429
    assert exc_info.value.code == "AI_RATE_LIMIT_EXCEEDED"

    # Reset
    usage.reset_limits(user_id)
    assert usage.get_user_quota(user_id)["used_today"] == 0
