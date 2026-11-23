# AIRWISE AI — Known Issues, Limitations & Future Enhancements

**Document:** `docs/known-issues.md`  
**Date:** November 21, 2026  
**Status:** Active  

---

## 1. Known Architectural Limitations & Boundaries

### 1.1 In-Memory Caching in Single-Node Deployments
- **Current Behavior**: `EnvironmentalCacheService` and `RecommendationCache` operate in-memory inside the active Python FastAPI worker process.
- **Limitation**: In a multi-worker or multi-container auto-scaling cluster (e.g. 10 pods behind a load balancer), caches are not shared across pods, resulting in cache warming per pod.
- **Future Enhancement**: Migrate in-memory dictionary stores to a shared Redis cluster via `REDIS_URL` when scaling beyond single-instance workloads.

### 1.2 Rate Limiting Sliding Window Scope
- **Current Behavior**: `SimpleRateLimiterMiddleware` enforces sliding-window rate limits in local process memory.
- **Limitation**: In horizontal autoscaling topologies without sticky sessions, rate limits apply per container instance.
- **Future Enhancement**: Implement Redis-backed token bucket rate limiting for distributed clusters.

### 1.3 External Provider API Key Fallbacks
- **Open-Meteo**: Operates without authentication for open/research use, but rate limits may apply if query volume exceeds 10,000 requests/day.
- **WAQI Ground Stations**: Requires a free personal API token (`WAQI_API_TOKEN`). If missing, the system gracefully falls back to Open-Meteo model telemetry.
- **Google Gemini**: Requires `GEMINI_API_KEY`. If unconfigured, the system gracefully switches to its deterministic clinical heuristics engine without erroring out.

---

## 2. Resolved Issues in Modules 01–11

| Issue | Root Cause | Resolution | Module |
|---|---|---|---|
| Rate limit collisions in rapid test suites | TestClient sharing single IP `testclient` | Bypassed throttling for internal `testclient` | Module 10 |
| Silent database fallback risk in production | Default exception handler initializing SQLite | Added production fail-fast check in `get_engine()` | Module 10 |
| Missing correlation tracing across requests | No unique request ID header attached | Built `RequestTracingMiddleware` with `X-Request-ID` | Module 10 |
| CSV injection risk in spreadsheet exports | Leading `=`, `+`, `-` characters | Escaped control characters with apostrophes | Module 07 |
| Accidental administrator lockout | Self-deactivation or demoting last admin | Built server-side validation guards rejecting self/last demotions | Module 09 |
| Observation measurement corruption during QA | Unrestricted updates on observation rows | Enforced physical reading immutability in review endpoints | Module 09 |
