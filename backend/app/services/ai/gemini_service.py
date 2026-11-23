"""
AIRWISE AI — Google Gemini AI Integration Service (Facade)
Provides backward compatibility with Module 01 interfaces while delegating
to the robust GeminiProvider and AIService architecture.
"""

from typing import Any, Dict, List, Optional
from app.services.ai.gemini_provider import gemini_provider


class GeminiService:
    """Delegates to gemini_provider for unified AI execution."""

    def __init__(self, provider=gemini_provider):
        self.provider = provider

    def is_available(self) -> bool:
        return self.provider.is_available()

    def get_status(self) -> Dict[str, Any]:
        return self.provider.get_status()

    async def generate_response(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        system_instruction: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        return await self.provider.generate_response(
            prompt=prompt,
            history=history,
            context=context,
            system_instruction=system_instruction,
        )


gemini_service = GeminiService()
