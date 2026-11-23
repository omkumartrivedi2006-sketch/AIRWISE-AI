"""
AIRWISE AI — Smart Alert Rules API Endpoints
GET    /api/v1/alerts/rules
POST   /api/v1/alerts/rules
PATCH  /api/v1/alerts/rules/{rule_id}
DELETE /api/v1/alerts/rules/{rule_id}
POST   /api/v1/alerts/evaluate
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import MongoSession as Session
from app.api.deps import require_authenticated_user
from app.core.database import get_db
from app.models.pollution import PollutionObservation
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.personalization import AlertRuleCreate, AlertRuleRead, AlertRuleUpdate, NotificationRead
from app.services.alert_service import alert_service

router = APIRouter()


@router.get(
    "/rules",
    response_model=SuccessResponse[List[AlertRuleRead]],
    status_code=status.HTTP_200_OK,
    summary="List Alert Rules",
    description="Retrieve all environmental alert threshold rules configured by the authenticated user.",
)
async def list_my_alert_rules(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    rules = alert_service.get_user_rules(db, current_user.id)
    return SuccessResponse(
        success=True,
        message="Alert rules retrieved successfully",
        data=rules,
    )


@router.post(
    "/rules",
    response_model=SuccessResponse[AlertRuleRead],
    status_code=status.HTTP_201_CREATED,
    summary="Create Alert Rule",
    description="Configure a new environmental threshold alert rule with customized cooldown intervals.",
)
async def create_alert_rule(
    payload: AlertRuleCreate,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    rule = alert_service.create_rule(db, current_user.id, payload)
    rules = alert_service.get_user_rules(db, current_user.id)
    matched = next((r for r in rules if r.id == rule.id), None)
    return SuccessResponse(
        success=True,
        message="Alert rule created successfully",
        data=matched or AlertRuleRead.model_validate(rule),
    )


@router.patch(
    "/rules/{rule_id}",
    response_model=SuccessResponse[AlertRuleRead],
    status_code=status.HTTP_200_OK,
    summary="Update Alert Rule",
    description="Update threshold values, channels, cooldown, or enabled status for an alert rule.",
)
async def update_alert_rule(
    rule_id: int,
    payload: AlertRuleUpdate,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    updated = alert_service.update_rule(db, current_user.id, rule_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert rule #{rule_id} not found or unauthorized",
        )
    rules = alert_service.get_user_rules(db, current_user.id)
    matched = next((r for r in rules if r.id == updated.id), None)
    return SuccessResponse(
        success=True,
        message="Alert rule updated successfully",
        data=matched or AlertRuleRead.model_validate(updated),
    )


@router.delete(
    "/rules/{rule_id}",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Delete Alert Rule",
    description="Delete an existing alert rule.",
)
async def delete_alert_rule(
    rule_id: int,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    deleted = alert_service.delete_rule(db, current_user.id, rule_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert rule #{rule_id} not found or unauthorized",
        )
    return SuccessResponse(
        success=True,
        message="Alert rule deleted successfully",
        data={"deleted_id": rule_id},
    )


@router.post(
    "/evaluate",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Trigger Observation Evaluation",
    description="Evaluates latest verified observations against all enabled alert rules. Used for scheduled and event-driven evaluation.",
)
async def evaluate_observations(
    location_id: int,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    latest_obs = (
        db.query(PollutionObservation)
        .filter(PollutionObservation.location_id == location_id)
        .order_by(PollutionObservation.observed_at.desc())
        .first()
    )
    if not latest_obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No environmental observations found for location #{location_id}",
        )

    notifications = await alert_service.evaluate_observation(db, latest_obs)
    return SuccessResponse(
        success=True,
        message=f"Evaluation completed; generated {len(notifications)} notification(s)",
        data={"triggered_count": len(notifications), "location_id": location_id},
    )
