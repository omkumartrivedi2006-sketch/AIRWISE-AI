"""
AIRWISE AI — Google Gemini AI Integration Service
Implements BaseAIProvider with server-side API communication, context grounding, and strict error handling.
"""

from typing import Any, Dict, Optional
from app.core.config import settings
from app.core.exceptions import AIServiceException
from app.core.logging import logger
from app.services.ai.base_provider import BaseAIProvider
from app.services.ai.prompts import SYSTEM_POLLUTION_EXPERT_PROMPT, format_context_prompt


class GeminiService(BaseAIProvider):
    """
    Dedicated Gemini API Service.
    Communicates securely server-side. Never exposes GEMINI_API_KEY to frontend clients.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.temperature = settings.GEMINI_TEMPERATURE
        self.max_tokens = settings.GEMINI_MAX_OUTPUT_TOKENS
        self._client = None

        if self.is_available():
            self._init_client()

    def _init_client(self):
        """Initializes the official Google GenAI client if available and configured."""
        try:
            # Prefer the modern google-genai SDK
            from google import genai
            self._client = genai.Client(api_key=self.api_key)
            logger.info("Initialized Google GenAI client for model: %s", self.model_name)
        except ImportError:
            # Fallback to google.generativeai if legacy package is present
            try:
                import google.generativeai as legacy_genai
                legacy_genai.configure(api_key=self.api_key)
                self._client = legacy_genai.GenerativeModel(self.model_name)
                logger.info("Initialized legacy Google GenerativeAI client for model: %s", self.model_name)
            except ImportError:
                logger.warning(
                    "Neither google-genai nor google-generativeai SDK is installed. "
                    "Gemini calls will require SDK installation in the backend environment."
                )
                self._client = None
        except Exception as e:
            logger.error("Failed to initialize Gemini client: %s", e)
            self._client = None

    def is_available(self) -> bool:
        """Checks if a valid, non-placeholder API key is configured."""
        return settings.is_gemini_configured

    def get_status(self) -> Dict[str, Any]:
        """Provides provider diagnostic information for the health check and status APIs."""
        if not self.is_available():
            return {
                "status": "unconfigured",
                "provider": "google-gemini",
                "model": self.model_name,
                "is_configured": False,
                "details": "GEMINI_API_KEY not set in environment or holds placeholder value.",
            }
        
        return {
            "status": "ready" if self._client is not None else "sdk_pending",
            "provider": "google-gemini",
            "model": self.model_name,
            "is_configured": True,
            "details": "Ready for AI inference requests" if self._client is not None else "Client awaiting SDK initialization",
        }

    async def generate_response(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        system_instruction: Optional[str] = None,
    ) -> str:
        """
        Executes server-side Gemini completion with contextual environmental grounding.
        Raises AIServiceException if provider is unconfigured or upstream error occurs.
        """
        if not self.is_available():
            raise AIServiceException(
                message="Gemini API is not configured. Please supply a valid GEMINI_API_KEY in the backend environment.",
                code="AI_NOT_CONFIGURED",
            )

        if self._client is None:
            # Attempt lazy init
            self._init_client()
            if self._client is None:
                raise AIServiceException(
                    message="Google GenAI client could not be loaded. Please ensure google-genai is installed.",
                    code="AI_SDK_MISSING",
                )

        full_prompt = format_context_prompt(prompt=prompt, context=context)
        system_inst = system_instruction or SYSTEM_POLLUTION_EXPERT_PROMPT

        try:
            # Using google-genai Client interface
            if hasattr(self._client, "models") and hasattr(self._client.models, "generate_content"):
                response = self._client.models.generate_content(
                    model=self.model_name,
                    contents=full_prompt,
                    config={
                        "system_instruction": system_inst,
                        "temperature": self.temperature,
                        "max_output_tokens": self.max_tokens,
                    },
                )
                return response.text
            # Using legacy GenerativeModel interface
            elif hasattr(self._client, "generate_content_async"):
                response = await self._client.generate_content_async(full_prompt)
                return response.text
            elif hasattr(self._client, "generate_content"):
                response = self._client.generate_content(full_prompt)
                return response.text
            else:
                raise AIServiceException("Incompatible Gemini client instance", code="AI_CLIENT_ERROR")
        except Exception as e:
            logger.error("Gemini API call failed: %s", e)
            raise AIServiceException(
                message=f"Gemini API generation failed: {str(e)}",
                code="AI_GENERATION_FAILED",
                details=str(e),
            )


# Singleton instance
gemini_service = GeminiService()
