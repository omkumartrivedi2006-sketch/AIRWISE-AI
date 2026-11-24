"""
AIRWISE AI — Community Pollution Report Schemas
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CommunityReportCreate(BaseModel):
    category: str = Field(..., description="industrial_smoke, open_waste_burning, construction_dust, vehicle_emissions, road_dust, garbage_burning, unusual_odor, other")
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=10, max_length=2000)
    location_name: str = Field(..., min_length=2, max_length=150)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    incident_time: Optional[datetime] = Field(default=None)
    severity: str = Field(default="moderate", description="minor, moderate, severe")
    image_url: Optional[str] = Field(default=None, description="Optional image URL or validated base64 data URI")


class CommunityReportResponse(BaseModel):
    id: int
    reference_id: str
    user_name: str
    category: str
    title: str
    description: str
    location_name: str
    latitude: float
    longitude: float
    incident_time: datetime
    severity: str
    image_url: Optional[str] = None
    status: str
    moderation_notes: Optional[str] = None
    upvotes: int = 0
    created_at: datetime
    updated_at: datetime


class CommunityReportStatusUpdate(BaseModel):
    status: str = Field(..., description="SUBMITTED, UNDER_REVIEW, VERIFIED, REJECTED, RESOLVED")
    moderation_notes: Optional[str] = Field(default=None, max_length=1000)


class CommunityOverviewStats(BaseModel):
    total_reports: int
    verified_reports: int
    under_review: int
    resolved_reports: int
    category_counts: Dict[str, int]
    nearby_stations: List[Dict[str, Any]]


class CommunityAIInsightsResponse(BaseModel):
    reporting_period: str
    total_analyzed: int
    top_reported_categories: List[str]
    identified_hotspots: List[str]
    summary: str
    community_actions: List[str]
    disclaimer: str = "Community-submitted observational synthesis. Does not constitute official regulatory CPCB air monitoring compliance."
