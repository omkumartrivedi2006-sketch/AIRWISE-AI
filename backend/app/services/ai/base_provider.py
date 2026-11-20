"""
AIRWISE AI — Base AI Provider Abstract Interface
Allows seamless switching or cascading between AI foundation models (Gemini, Claude, local LLMs)
without modifying upstream domain logic.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class BaseAIProvider(ABC):
    """Abstract contract for all AI inference services in AIRWISE AI."""

    @abstractmethod
    def is_available(self) -> bool:
        """Returns True if the provider is properly configured with valid credentials."""
        pass

    @abstractmethod
    async def generate_response(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        system_instruction: Optional[str] = None,
    ) -> str:
        """Generates AI guidance based on user input and environmental telemetry context."""
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Returns diagnostic health and metadata for this provider."""
        pass
