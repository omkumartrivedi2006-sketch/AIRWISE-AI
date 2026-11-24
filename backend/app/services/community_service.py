"""
AIRWISE AI — Community Pollution Report Service
Citizen pollution reporting, privacy-safe geospatial synthesis,
admin moderation lifecycle, and Gemini-powered collective intelligence.
"""

import random
import string
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.models.community_report import CommunityReport
from app.models.location import Location
from app.models.user import User
from app.schemas.community import (
    CommunityAIInsightsResponse,
    CommunityOverviewStats,
    CommunityReportCreate,
    CommunityReportStatusUpdate,
)
from app.services.ai.gemini_service import gemini_service


class CommunityService:
    """Core service for managing citizen pollution observations and community insights."""

    def _generate_reference_id(self) -> str:
        """Generates human-readable tracking ID, e.g., REP-2026-X8K9L."""
        year = datetime.now(timezone.utc).year
        suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
        return f"REP-{year}-{suffix}"

    async def create_report(
        self,
        db,
        current_user: User,
        data: CommunityReportCreate,
    ) -> CommunityReport:
        """Validates and persists a citizen-submitted pollution incident."""
        ref_id = self._generate_reference_id()
        incident_dt = data.incident_time or datetime.now(timezone.utc)

        report = CommunityReport(
            reference_id=ref_id,
            user_id=current_user.id,
            user_name=current_user.full_name or "Community Contributor",
            category=data.category.lower(),
            title=data.title.strip(),
            description=data.description.strip(),
            location_name=data.location_name.strip(),
            latitude=float(data.latitude),
            longitude=float(data.longitude),
            incident_time=incident_dt,
            severity=data.severity.lower() if data.severity else "moderate",
            image_url=data.image_url,
            status="SUBMITTED",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        db.add(report)
        db.commit()
        db.refresh(report)
        return report

    async def get_public_reports(
        self,
        db,
        category: Optional[str] = None,
        status_filter: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves community reports with privacy-safe coordinate precision (rounded to 2 decimal places)
        to prevent exposing exact domestic locations.
        """
        query = db.query(CommunityReport)
        if category and category.lower() != "all":
            query = query.filter(CommunityReport.category == category.lower())
        if status_filter and status_filter.lower() != "all":
            query = query.filter(CommunityReport.status == status_filter.upper())

        reports = (
            query.order_by(CommunityReport.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        results = []
        for r in reports:
            # Privacy rule: truncate lat/lng to 2 decimal places (~1.1 km precision)
            safe_lat = round(float(r.latitude or 0.0), 2)
            safe_lng = round(float(r.longitude or 0.0), 2)

            results.append({
                "id": r.id,
                "reference_id": r.reference_id,
                "user_name": r.user_name,
                "category": r.category,
                "title": r.title,
                "description": r.description,
                "location_name": r.location_name,
                "latitude": safe_lat,
                "longitude": safe_lng,
                "incident_time": r.incident_time,
                "severity": r.severity,
                "image_url": r.image_url,
                "status": r.status,
                "moderation_notes": r.moderation_notes,
                "upvotes": r.upvotes or 0,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
            })
        return results

    async def get_user_reports(self, db, user_id: int) -> List[CommunityReport]:
        """Returns reports submitted by the specific user (full precision for user's own items)."""
        return (
            db.query(CommunityReport)
            .filter(CommunityReport.user_id == user_id)
            .order_by(CommunityReport.created_at.desc())
            .all()
        )

    async def get_report_by_id(self, db, report_id: int) -> Optional[CommunityReport]:
        return db.query(CommunityReport).filter(CommunityReport.id == report_id).first()

    async def update_report_status(
        self,
        db,
        report_id: int,
        admin_user: User,
        update_data: CommunityReportStatusUpdate,
    ) -> Optional[CommunityReport]:
        """Admin moderation endpoint to verify, reject, or mark resolved."""
        report = await self.get_report_by_id(db, report_id)
        if not report:
            return None

        report.status = update_data.status.upper()
        if update_data.moderation_notes:
            report.moderation_notes = update_data.moderation_notes.strip()
        report.moderated_by = admin_user.id
        report.moderated_at = datetime.now(timezone.utc)
        report.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(report)
        return report

    async def get_community_overview(self, db) -> CommunityOverviewStats:
        """Calculates global metrics, category breakdown, and lists nearby official stations."""
        all_reports = db.query(CommunityReport).all()
        total = len(all_reports)
        verified = sum(1 for r in all_reports if r.status == "VERIFIED")
        under_review = sum(1 for r in all_reports if r.status in ("SUBMITTED", "UNDER_REVIEW"))
        resolved = sum(1 for r in all_reports if r.status == "RESOLVED")

        categories = [
            "industrial_smoke",
            "open_waste_burning",
            "construction_dust",
            "vehicle_emissions",
            "road_dust",
            "garbage_burning",
            "unusual_odor",
            "other",
        ]
        cat_counts = {c: 0 for c in categories}
        for r in all_reports:
            cat = (r.category or "other").lower()
            if cat in cat_counts:
                cat_counts[cat] += 1
            else:
                cat_counts["other"] = cat_counts.get("other", 0) + 1

        # Retrieve official monitoring stations to contrast with citizen reports
        stations = []
        try:
            locs = db.query(Location).filter(Location.is_active == True).limit(8).all()
            for l in locs:
                stations.append({
                    "id": l.id,
                    "name": l.name,
                    "city": l.city,
                    "latitude": l.latitude,
                    "longitude": l.longitude,
                    "station_code": getattr(l, "station_code", f"STN-{l.id}"),
                    "is_official": True,
                })
        except Exception:
            pass

        return CommunityOverviewStats(
            total_reports=total,
            verified_reports=verified,
            under_review=under_review,
            resolved_reports=resolved,
            category_counts=cat_counts,
            nearby_stations=stations,
        )

    async def get_community_ai_insights(self, db) -> CommunityAIInsightsResponse:
        """Synthesizes community reports into actionable collective intelligence with Gemini."""
        all_reports = db.query(CommunityReport).order_by(CommunityReport.created_at.desc()).limit(100).all()
        total = len(all_reports)

        category_counter = Counter(r.category for r in all_reports)
        top_cats = [c.replace("_", " ").title() for c, _ in category_counter.most_common(4)]
        if not top_cats:
            top_cats = ["Open Waste Burning", "Construction Dust", "Vehicle Emissions"]

        # Hotspot extraction
        location_counter = Counter(r.location_name for r in all_reports if r.location_name)
        hotspots = [loc for loc, _ in location_counter.most_common(5)]
        if not hotspots:
            hotspots = ["Industrial Corridor Ring", "Outer Ring Road Transit Sector", "Urban Construction Zones"]

        if gemini_service.is_available() and total >= 2:
            prompt = (
                f"Analyze {total} citizen-submitted pollution reports for our community. "
                f"Top observed categories: {', '.join(top_cats)}. "
                f"Reported hotspot areas: {', '.join(hotspots)}. "
                "Synthesize a 2-paragraph environmental summary outlining the primary community impact, "
                "and recommend 4 proactive community-led actions for local clean air initiatives."
            )
            try:
                ai_text = await gemini_service.generate_response(
                    prompt=prompt,
                    system_instruction=(
                        "You are AIRWISE AI's Environmental Community Analyst. "
                        "Clearly separate citizen reports from official regulatory monitoring. "
                        "Provide constructive, community-driven clean-air initiatives."
                    ),
                )
                return CommunityAIInsightsResponse(
                    reporting_period="Current Community Cycle (Active Observations)",
                    total_analyzed=total,
                    top_reported_categories=top_cats,
                    identified_hotspots=hotspots,
                    summary=ai_text,
                    community_actions=[
                        "Organize neighborhood watch campaigns targeting illegal evening waste and leaf burning.",
                        "Liaise with local municipal authorities to enforce wet suppression on high-dust construction corridors.",
                        "Encourage residential carpooling and active transit during morning peak emission hours.",
                        "Establish community green buffer zones and tree plantations along busy vehicular thoroughfares.",
                    ],
                )
            except Exception:
                pass

        # Fallback synthesis
        return CommunityAIInsightsResponse(
            reporting_period="Current Community Cycle (Active Observations)",
            total_analyzed=total,
            top_reported_categories=top_cats,
            identified_hotspots=hotspots,
            summary=(
                f"Citizen reports indicate recurring environmental pressure driven predominantly by {top_cats[0]} "
                f"and localized {top_cats[1] if len(top_cats) > 1 else 'particulate sources'}. "
                "Community observations provide vital micro-level visibility that complements standard regional monitoring stations, "
                "pinpointing transient hotspots that official sensors may miss."
            ),
            community_actions=[
                "Promptly report waste burning incidents to local municipal ward officers for rapid extinguishment.",
                "Advocate for dust tarpaulins and continuous water misting at active neighborhood construction sites.",
                "Form local school and society clean air clubs to track local AQI trends and minimize idling near gates.",
                "Share verified AIRWISE AI community alerts on neighborhood forums to coordinate community-level mitigation.",
            ],
        )


community_service = CommunityService()
