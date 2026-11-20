"""
AIRWISE AI — API v1 Router
Re-exports the aggregated API router for compatibility.
"""

from app.api.v1.api import api_router

__all__ = ["api_router"]
