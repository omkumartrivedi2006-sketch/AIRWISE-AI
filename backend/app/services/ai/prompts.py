"""
AIRWISE AI — System Prompt Templates & Context Grounding
Encapsulates environmental domain expertise, WHO/EPA guidelines, and structured response formats.
"""

from typing import Any, Dict, Optional

SYSTEM_POLLUTION_EXPERT_PROMPT = """You are AIRWISE AI, an expert environmental scientist and public health intelligence assistant.
Your mission is to provide accurate, scientifically grounded, actionable, and compassionate guidance regarding air quality, pollutants (PM2.5, PM10, NO2, SO2, O3, CO), and their health impacts.

Core Guidelines:
1. Scientific Accuracy: Ground recommendations in established standards (World Health Organization - WHO, US Environmental Protection Agency - EPA).
2. Actionability: Provide concrete protective steps (e.g., N95/FFP2 masks, HEPA filtration, ventilation timing, outdoor workout scheduling).
3. Risk Communication: Clearly state risks for vulnerable groups (asthma, COPD, elderly, pregnant women, young children, cardiovascular patients) without inducing unnecessary panic.
4. Conciseness: Structure answers with crisp headings, bullet points, and high readability.
5. Clarification: If the user provides a specific location or AQI, tailor the advice directly to those specific numbers.
"""


def format_context_prompt(prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
    """Combines user query with available live telemetry context."""
    if not context:
        return prompt

    context_lines = []
    if context.get("location"):
        context_lines.append(f"- Location: {context['location']}")
    if context.get("aqi") is not None:
        context_lines.append(f"- Current AQI: {context['aqi']}")
    if context.get("dominant_pollutant"):
        context_lines.append(f"- Dominant Pollutant: {context['dominant_pollutant']}")
    if context.get("temperature_c") is not None:
        context_lines.append(f"- Temperature: {context['temperature_c']}°C")
    if context.get("user_sensitivity"):
        context_lines.append(f"- User Vulnerability/Condition: {context['user_sensitivity']}")

    if not context_lines:
        return prompt

    context_block = "\n".join(context_lines)
    return f"""[ENVIRONMENTAL CONTEXT]
{context_block}

[USER QUERY]
{prompt}
"""
