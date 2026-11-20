"""
AIRWISE AI — Versioned API Router Aggregator (/api/v1)
Combines all modular domain endpoints into a centralized router.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    ai,
    conversations,
    feedback,
    health,
    locations,
    messages,
    pollution,
)

api_router = APIRouter()

# 1. Health Diagnostics
api_router.include_router(health.router, prefix="", tags=["Health Diagnostics"])

# 2. Locations
api_router.include_router(locations.router, prefix="/locations", tags=["Monitoring Locations"])

# 3. Pollution Telemetry Observations
api_router.include_router(pollution.router, prefix="/pollution", tags=["Pollution Telemetry"])

# 4. Conversations
api_router.include_router(conversations.router, prefix="/conversations", tags=["Conversations"])

# 5. Conversation Messages
api_router.include_router(messages.router, prefix="/conversations", tags=["Messages"])

# 6. Feedback
api_router.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])

# 7. AI Engine (Foundations from Module 01)
api_router.include_router(ai.router, prefix="/ai", tags=["AI Engine"])
