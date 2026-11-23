"""
AIRWISE AI — Google Gemini AI Integration Provider
Implements BaseAIProvider with modern google-genai SDK, async execution,
multi-turn conversation history, timeout enforcement, and standardized error normalization.
"""

import asyncio
from typing import Any, Dict, List, Optional
from app.core.config import settings
from app.core.exceptions import AIServiceException
from app.core.logging import logger
from app.services.ai.base_provider import BaseAIProvider
from app.services.ai.prompts import SYSTEM_POLLUTION_EXPERT_PROMPT, format_context_prompt


class GeminiProvider(BaseAIProvider):
    """
    Production-grade Google Gemini AI Provider.
    Communicates server-side exclusively. Never exposes API keys or internal stack traces.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.temperature = settings.GEMINI_TEMPERATURE
        self.max_tokens = settings.GEMINI_MAX_OUTPUT_TOKENS
        self.timeout_seconds = getattr(settings, "GEMINI_TIMEOUT_SECONDS", 30)
        self._client = None
        self._mock_response: Optional[str] = None

        if self.is_available():
            self._init_client()

    def _init_client(self):
        """Initializes the modern Google GenAI SDK client."""
        try:
            from google import genai
            self._client = genai.Client(api_key=self.api_key)
            logger.info("Initialized Google GenAI client for model: %s", self.model_name)
        except ImportError:
            try:
                import google.generativeai as legacy_genai
                legacy_genai.configure(api_key=self.api_key)
                self._client = legacy_genai.GenerativeModel(self.model_name)
                logger.info("Initialized legacy Google GenerativeAI client for model: %s", self.model_name)
            except ImportError:
                logger.warning("Google GenAI SDK is not available in backend environment.")
                self._client = None
        except Exception as e:
            logger.error("Failed to initialize Google GenAI client: %s", e)
            self._client = None

    def is_available(self) -> bool:
        """Verifies if provider is properly configured with a real API key or test mock."""
        if self._mock_response is not None:
            return True
        val = (self.api_key or "").strip()
        return bool(val and val != "your_gemini_api_key_here")

    def set_mock_response(self, response_text: Optional[str]) -> None:
        """Testing hook allowing deterministic mocked responses in automated test suites."""
        self._mock_response = response_text

    def get_status(self) -> Dict[str, Any]:
        """Provides provider diagnostic health and metadata."""
        if not self.is_available() and self._mock_response is None:
            return {
                "status": "unconfigured",
                "provider": "google-gemini",
                "model": self.model_name,
                "is_configured": False,
                "details": "GEMINI_API_KEY not configured in environment.",
            }

        return {
            "status": "ready" if (self._client is not None or self._mock_response is not None) else "sdk_pending",
            "provider": "google-gemini",
            "model": self.model_name,
            "is_configured": True,
            "details": "Ready for AI inference requests",
        }

    async def generate_response(
        self,
        prompt: str,
        history: Optional[List[Dict[str, str]]] = None,
        context: Optional[Dict[str, Any]] = None,
        system_instruction: Optional[str] = None,
    ) -> str:
        """
        Executes server-side Gemini completion with contextual grounding and history.
        Enforces configurable timeout and maps exceptions to AIServiceException.
        """
        if self._mock_response is not None:
            return self._mock_response

        if not self.is_available():
            raise AIServiceException(
                message="Gemini AI is not configured. Please supply a valid GEMINI_API_KEY in the environment.",
                code="AI_NOT_CONFIGURED",
            )

        if self._client is None:
            self._init_client()
            if self._client is None:
                raise AIServiceException(
                    message="Google GenAI SDK client could not be initialized.",
                    code="AI_SDK_MISSING",
                )

        system_inst = system_instruction or SYSTEM_POLLUTION_EXPERT_PROMPT
        formatted_prompt = format_context_prompt(prompt=prompt, context=context)

        try:
            # Modern google-genai SDK
            if hasattr(self._client, "aio") and hasattr(self._client.aio, "models"):
                from google.genai import types

                config = types.GenerateContentConfig(
                    system_instruction=system_inst,
                    temperature=self.temperature,
                    max_output_tokens=self.max_tokens,
                )

                # Assemble multi-turn contents if history exists
                contents = []
                if history:
                    for msg in history:
                        role = "user" if msg.get("role") == "user" else "model"
                        contents.append(
                            types.Content(
                                role=role,
                                parts=[types.Part.from_text(text=msg.get("content", ""))],
                            )
                        )
                contents.append(
                    types.Content(
                        role="user",
                        parts=[types.Part.from_text(text=formatted_prompt)],
                    )
                )

                response = await asyncio.wait_for(
                    self._client.aio.models.generate_content(
                        model=self.model_name,
                        contents=contents,
                        config=config,
                    ),
                    timeout=float(self.timeout_seconds),
                )
                if not response or not response.text:
                    raise AIServiceException("Received empty response from Gemini API", code="AI_EMPTY_RESPONSE")
                return response.text

            # Fallback for sync Client or legacy SDK
            elif hasattr(self._client, "models") and hasattr(self._client.models, "generate_content"):
                loop = asyncio.get_running_loop()
                response = await asyncio.wait_for(
                    loop.run_in_executor(
                        None,
                        lambda: self._client.models.generate_content(
                            model=self.model_name,
                            contents=formatted_prompt,
                            config={
                                "system_instruction": system_inst,
                                "temperature": self.temperature,
                                "max_output_tokens": self.max_tokens,
                            },
                        ),
                    ),
                    timeout=float(self.timeout_seconds),
                )
                if not response or not response.text:
                    raise AIServiceException("Received empty response from Gemini API", code="AI_EMPTY_RESPONSE")
                return response.text

            elif hasattr(self._client, "generate_content_async"):
                response = await asyncio.wait_for(
                    self._client.generate_content_async(formatted_prompt),
                    timeout=float(self.timeout_seconds),
                )
                if not response or not response.text:
                    raise AIServiceException("Received empty response from Gemini API", code="AI_EMPTY_RESPONSE")
                return response.text

            else:
                raise AIServiceException("Incompatible Gemini client instance", code="AI_CLIENT_ERROR")

        except asyncio.TimeoutError:
            logger.error("Gemini API call timed out after %s seconds", self.timeout_seconds)
            raise AIServiceException(
                message=f"Gemini AI inference timed out after {self.timeout_seconds} seconds. Please retry shortly.",
                code="AI_TIMEOUT",
            )
        except AIServiceException:
            raise
        except Exception as e:
            logger.error("Gemini API call failed: %s", e)
            raise AIServiceException(
                message=f"AI generation failed: {str(e)}",
                code="AI_GENERATION_FAILED",
                details=str(e),
            )


gemini_provider = GeminiProvider()
