"""
AIRWISE AI — Indoor Air Quality API Endpoints
POST /api/v1/indoor/assessments
GET  /api/v1/indoor/assessments
GET  /api/v1/indoor/assessments/latest
POST /api/v1/indoor/ai-consult
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.api.deps import require_authenticated_user
from app.core.database import MongoSession as Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.indoor_air import (
    IndoorAIAdviceRequest,
    IndoorAIAdviceResponse,
    IndoorAssessmentCreate,
    IndoorAssessmentResponse,
)
from app.services.indoor_air_service import indoor_air_service

router = APIRouter()


@router.post(
    "/assessments",
    response_model=SuccessResponse[IndoorAssessmentResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Submit Indoor Air Assessment",
    description="Analyzes room questionnaire responses and persists the indoor environmental evaluation.",
)
async def submit_assessment(
    data: IndoorAssessmentCreate,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    assessment = await indoor_air_service.create_assessment(db, current_user, data)
    return SuccessResponse(
        success=True,
        message="Indoor assessment evaluated and recorded successfully",
        data=assessment,
    )


@router.get(
    "/assessments",
    response_model=SuccessResponse[List[IndoorAssessmentResponse]],
    status_code=status.HTTP_200_OK,
    summary="List User Indoor Assessments",
    description="Retrieves historical indoor room evaluations for the authenticated user.",
)
async def list_assessments(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    assessments = await indoor_air_service.get_user_assessments(db, current_user.id, limit=limit)
    return SuccessResponse(
        success=True,
        message="Indoor assessments retrieved successfully",
        data=assessments,
    )


@router.get(
    "/assessments/latest",
    response_model=SuccessResponse[Optional[IndoorAssessmentResponse]],
    status_code=status.HTTP_200_OK,
    summary="Get Latest Indoor Assessment",
    description="Returns the most recent room assessment for quick dashboard display.",
)
async def get_latest_assessment(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    latest = await indoor_air_service.get_latest_assessment(db, current_user.id)
    return SuccessResponse(
        success=True,
        message="Latest assessment retrieved successfully",
        data=latest,
    )


@router.post(
    "/ai-consult",
    response_model=SuccessResponse[IndoorAIAdviceResponse],
    status_code=status.HTTP_200_OK,
    summary="Gemini AI Indoor Air Consultation",
    description="Grounds user inquiries in their latest indoor assessment context to generate practical air quality advice.",
)
async def consult_indoor_ai(
    request: IndoorAIAdviceRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    advice = await indoor_air_service.get_ai_advice(db, current_user, request)
    return SuccessResponse(
        success=True,
        message="Indoor AI guidance generated successfully",
        data=advice,
    )
