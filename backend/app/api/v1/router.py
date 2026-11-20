"""
AIRWISE AI — API v1 Router Aggregator
Combines all modular domain routers under the /api/v1 path prefix.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import health, ai

api_router = APIRouter()

# Register modular routers
api_router.include_router(health.router, prefix="", tags=["System Diagnostics"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Intelligence Engine"])
