"""
AIRWISE AI — Versioned API Router Aggregator (/api/v1)
Combines all modular domain endpoints into a centralized router.
"""

from fastapi import APIRouter
from app.api.v1.endpoints.admin import admin_router
from app.api.v1.endpoints import (
    ai,
    alerts,
    analytics,
    auth,
    community,
    conversations,
    feedback,
    health,
    indoor_air,
    locations,
    map as map_endpoint,
    messages,
    notifications,
    pollution,
    preferences,
    recommendations,
    saved_locations,
    users,
)

api_router = APIRouter()

# 1. Health Diagnostics
api_router.include_router(health.router, prefix="", tags=["Health Diagnostics"])

# 2. Authentication & Session Management (Module 04)
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Session"])

# 3. User Profile Management (Module 04 & Module 08)
api_router.include_router(users.router, prefix="/users", tags=["User Management"])
api_router.include_router(preferences.router, prefix="/users/me", tags=["User Preferences"])
api_router.include_router(saved_locations.router, prefix="/users/me", tags=["Saved Locations"])

# 4. Locations
api_router.include_router(locations.router, prefix="/locations", tags=["Monitoring Locations"])

# 5. Pollution Telemetry Observations
api_router.include_router(pollution.router, prefix="/pollution", tags=["Pollution Telemetry"])

# 6. Conversations
api_router.include_router(conversations.router, prefix="/conversations", tags=["Conversations"])

# 7. Conversation Messages
api_router.include_router(messages.router, prefix="/conversations", tags=["Messages"])

# 8. Feedback
api_router.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])

# 9. AI Engine (Foundations from Module 01)
api_router.include_router(ai.router, prefix="/ai", tags=["AI Engine"])

# 10. Advanced Environmental Analytics (Module 07)
api_router.include_router(analytics.router, prefix="/analytics", tags=["Environmental Analytics"])

# 11. Geospatial Map Telemetry (Module 07)
api_router.include_router(map_endpoint.router, prefix="/map", tags=["Geospatial Map"])

# 12. Smart Pollution Alerts (Module 08)
api_router.include_router(alerts.router, prefix="/alerts", tags=["Smart Alerts"])

# 13. Notification Center & Channels (Module 08)
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])

# 14. Personalized Recommendations (Module 08)
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Personalized Recommendations"])

# 16. Indoor Air Quality (Module 10)
api_router.include_router(indoor_air.router, prefix="/indoor", tags=["Indoor Air Quality"])

# 17. Community Insights & Pollution Reporting (Module 11)
api_router.include_router(community.router, prefix="/community", tags=["Community Insights"])

# 15. Platform Administration & Monitoring (Module 09)
api_router.include_router(admin_router, prefix="/admin")
