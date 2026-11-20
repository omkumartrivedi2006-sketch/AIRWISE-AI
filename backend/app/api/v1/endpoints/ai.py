"""
AIRWISE AI — AI Status and Prepared Query Endpoint
GET /api/v1/ai/status
POST /api/v1/ai/query
"""

from fastapi import APIRouter, status
from app.core.config import settings
from app.core.exceptions import AIServiceException
from app.schemas.ai import AIProviderStatusResponse, AIQueryRequest, AIQueryResponse
from app.services.ai.gemini_service import gemini_service

router = APIRouter()


@router.get(
    "/status",
    response_model=AIProviderStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="AI Provider Status",
    description="Check the server-side configuration status of the Google Gemini AI engine.",
)
async def get_ai_status() -> AIProviderStatusResponse:
    status_data = gemini_service.get_status()
    return AIProviderStatusResponse(
        status=status_data["status"],
        provider=status_data["provider"],
        model=status_data["model"],
        is_configured=status_data["is_configured"],
        details=status_data.get("details"),
    )


@router.post(
    "/query",
    response_model=AIQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Process AI Pollution Query",
    description="Submits an environmental inquiry to the Gemini service (prepared foundation).",
)
async def process_ai_query(request: AIQueryRequest) -> AIQueryResponse:
    if not gemini_service.is_available():
        raise AIServiceException(
            message="Gemini AI is not yet configured with a valid API key in the backend environment. "
                    "Configure GEMINI_API_KEY in .env to enable real-time inference.",
            code="AI_NOT_CONFIGURED",
        )

    context_dict = request.context.model_dump() if request.context else None
    response_text = await gemini_service.generate_response(
        prompt=request.prompt,
        context=context_dict,
    )

    return AIQueryResponse(
        response=response_text,
        provider="google-gemini",
        model=settings.GEMINI_MODEL,
    )
