# AIRWISE AI — Production Deployment Readiness Checklist

**Document:** `docs/production-deployment-checklist.md`  
**Date:** November 21, 2026  
**Status:** Verified  

---

## 1. Application & Frontend Readiness

- [x] **Next.js Production Build**: `npm run build` passes with zero errors, generating 30/30 static pages and client chunks.
- [x] **TypeScript Validation**: `npx tsc --noEmit` exits with status code 0.
- [x] **Error Boundaries & Fallbacks**: `frontend/src/app/error.tsx` catches runtime rendering exceptions with user-friendly recovery buttons.
- [x] **Loading Skeletons**: `frontend/src/app/loading.tsx` eliminates Cumulative Layout Shift (CLS < 0.1).
- [x] **Custom 404 Experience**: `frontend/src/app/not-found.tsx` provides themed recovery navigation.
- [x] **SEO & Indexing Controls**: `frontend/src/app/robots.ts` and `sitemap.ts` allow public marketing pages while blocking private `/admin/*`, `/dashboard`, and `/profile` routes.
- [x] **No Hardcoded API Keys**: Zero secrets or credentials bundled into client JavaScript.
- [x] **Status**: **COMPLETED**

---

## 2. Security Hardening

- [x] **HTTP Security Headers**: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, and `Permissions-Policy` injected on all responses.
- [x] **Strict Transport Security (HSTS)**: Configured in `next.config.ts` and `SecurityHeadersMiddleware`.
- [x] **Request Size Limiting**: `RequestSizeLimiterMiddleware` enforces 10MB maximum request size, preventing memory bloat DoS.
- [x] **Rate Limiting**: `SimpleRateLimiterMiddleware` throttles brute-force attempts on `/auth/login`, `/auth/register`, and `/auth/forgot-password`.
- [x] **Dual-Token Authentication**: 15-minute access tokens, 7-day refresh tokens, automatic rotation, and reuse attack termination.
- [x] **HttpOnly Cookie Attributes**: `SameSite=Lax`, `HttpOnly=True`, `Secure=True` in production.
- [x] **RBAC & Admin Route Protection**: Server-side validation via `get_current_admin_user` with 401/403 responses.
- [x] **Administrative Safety Invariants**: Self-deactivation and last-admin demotion strictly prohibited.
- [x] **Credential Redaction**: `AuditService` redacts passwords, tokens, and keys to `"[REDACTED]"`.
- [x] **Spreadsheet Formula Injection Sanitization**: CSV export strips or escapes leading dangerous control characters (`=`, `+`, `-`, `@`).
- [x] **Status**: **COMPLETED**

---

## 3. Database Performance & Integrity

- [x] **SQLAlchemy Connection Pooling**: Configured with `pool_size=10`, `max_overflow=20`, `pool_timeout=30`, `pool_recycle=1800`, and `pool_pre_ping=True`.
- [x] **Production Fail-Fast**: Application raises an explicit startup error if PostgreSQL is unreachable in production mode.
- [x] **Alembic Schema Migrations**: 5 versioned migrations applied and verified without schema drift.
- [x] **Composite & Foreign Key Indexes**: `ix_pollution_obs_loc_time_prov` and relational indexes verified.
- [x] **Status**: **COMPLETED**

---

## 4. API Reliability & External Services

- [x] **Payload GZip Compression**: `GZipMiddleware(minimum_size=1000)` compresses large historical and analytical JSON responses.
- [x] **Coordinate & City Caching**: `EnvironmentalCacheService` clusters coordinates and caches observation responses (TTL 900s).
- [x] **External Provider Fallback Chain**: Open-Meteo primary with WAQI ground station fallback and local historical fallback.
- [x] **Measurement Immutability Invariant**: Original physical sensor values are preserved during administrative quality reviews.
- [x] **AI Assistant Guardrails**: 30-second timeouts, daily request budget tracking, and deterministic clinical fallback.
- [x] **Status**: **COMPLETED**

---

## 5. Operations, Containerization & CI/CD

- [x] **Orchestrator Probes**:
  - `GET /api/v1/health/live`: Fast process liveness probe.
  - `GET /api/v1/health/ready`: Database dependency readiness probe.
  - `GET /api/v1/health`: Detailed component status diagnostic.
- [x] **Structured Logging & Tracing**: Every transaction logs duration (`X-Process-Time`) and correlation ID (`X-Request-ID`).
- [x] **Docker Containerization**:
  - `backend/Dockerfile`: Multi-stage Python 3.11-slim image with unprivileged `appuser`.
  - `frontend/Dockerfile`: Multi-stage Alpine image with unprivileged `nextjs` user.
  - `docker-compose.yml`: Full-stack local development with PostgreSQL 16.
- [x] **Automated CI Pipeline**: `.github/workflows/ci.yml` validates frontend typecheck/build and backend pytest suite.
- [x] **Status**: **COMPLETED**

---

## 6. Deployment Readiness Verdict

| Subsystem | Readiness Status | Action Required Prior to Go-Live |
|---|:---:|---|
| **Frontend Web App** | **READY** | Set `NEXT_PUBLIC_API_URL` to production backend domain |
| **Backend REST API** | **READY** | Set `SECRET_KEY`, `DATABASE_URL`, and `ALLOWED_ORIGINS` in hosting provider |
| **Database** | **READY** | Execute `alembic upgrade head` on production PostgreSQL |
| **AI Integration** | **READY** | Provide valid `GEMINI_API_KEY` from Google AI Studio |
| **Telemetry Providers**| **READY** | Optional `WAQI_API_TOKEN` for expanded ground station feeds |
