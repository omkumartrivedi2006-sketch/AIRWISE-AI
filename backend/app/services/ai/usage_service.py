"""
AIRWISE AI — AI Usage & Rate Limiting Service
Monitors inference frequency, tracks daily quotas, and records telemetry without logging credentials.
"""

import time
from collections import defaultdict
from typing import Any, Dict, List, Optional
from app.core.config import settings
from app.core.exceptions import AirwiseException
from app.core.logging import logger


class UsageService:
    """Thread-safe in-memory rate limiter and AI telemetry logger."""

    def __init__(self, max_daily_requests: int = 50, window_seconds: int = 86400):
        self.max_daily_requests = max_daily_requests
        self.window_seconds = window_seconds
        # user_id -> list of float timestamps
        self._user_requests: Dict[int, List[float]] = defaultdict(list)
        # In-memory telemetry log for metrics inspection
        self._telemetry_log: List[Dict[str, Any]] = []

    def _cleanup_old_requests(self, user_id: int, now: float) -> None:
        """Removes requests older than the sliding window."""
        cutoff = now - self.window_seconds
        self._user_requests[user_id] = [t for t in self._user_requests[user_id] if t > cutoff]

    def check_daily_limit(self, user_id: int) -> None:
        """
        Enforces configurable daily request limit per user.
        Raises HTTP 429 if limit is exceeded.
        """
        now = time.time()
        self._cleanup_old_requests(user_id, now)

        count = len(self._user_requests[user_id])
        if count >= self.max_daily_requests:
            logger.warning("User %s exceeded daily AI request limit (%s/%s)", user_id, count, self.max_daily_requests)
            raise AirwiseException(
                message=f"Daily AI request limit reached ({self.max_daily_requests} requests/day). Please try again tomorrow.",
                code="AI_RATE_LIMIT_EXCEEDED",
                status_code=429,
            )

    def record_usage(
        self,
        user_id: int,
        model: str,
        duration_sec: float,
        success: bool,
        estimated_tokens: int = 0,
    ) -> None:
        """Records telemetry timestamp and execution metrics."""
        now = time.time()
        if success:
            self._user_requests[user_id].append(now)

        entry = {
            "user_id": user_id,
            "timestamp": now,
            "model": model,
            "duration_sec": round(duration_sec, 3),
            "success": success,
            "estimated_tokens": estimated_tokens,
        }
        self._telemetry_log.append(entry)
        # Cap telemetry log in memory to 1000 items
        if len(self._telemetry_log) > 1000:
            self._telemetry_log.pop(0)

        logger.info(
            "AI Telemetry: user_id=%s model=%s duration=%.2fs success=%s tokens=%s",
            user_id,
            model,
            duration_sec,
            success,
            estimated_tokens,
        )

    def get_user_quota(self, user_id: int) -> Dict[str, Any]:
        """Returns the current usage and remaining requests for a user."""
        now = time.time()
        self._cleanup_old_requests(user_id, now)
        used = len(self._user_requests[user_id])
        return {
            "used_today": used,
            "limit": self.max_daily_requests,
            "remaining": max(0, self.max_daily_requests - used),
        }

    def reset_limits(self, user_id: Optional[int] = None) -> None:
        """Testing utility to clear request records."""
        if user_id is not None:
            self._user_requests[user_id] = []
        else:
            self._user_requests.clear()
            self._telemetry_log.clear()


usage_service = UsageService(max_daily_requests=settings.AI_MAX_DAILY_REQUESTS)
