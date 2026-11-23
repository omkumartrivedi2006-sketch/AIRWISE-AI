# AIRWISE AI — Production Monitoring & Observability Guide

This guide establishes the observability stack, metrics collection, log aggregation, and uptime monitoring for AIRWISE AI.

---

## 1. Health Check Probes

FastAPI exposes two native HTTP health probes:

- **Liveness Probe**: `GET /api/v1/health/live`
  - Verifies ASGI application loop responsiveness.
  - Returns HTTP 200: `{"status": "live", "timestamp": "..."}`.
  - Configured in Dockerfile: `HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:8000/api/v1/health/live || exit 1`.
- **Readiness Probe**: `GET /api/v1/health/ready`
  - Executes a fast `SELECT 1` database query against the PostgreSQL pool.
  - Returns HTTP 200: `{"status": "ready", "database": "connected"}`.
  - Returns HTTP 503 if the database is unreachable or pool is exhausted.

---

## 2. Application Logging Standards

- **Log Format**: Standardized timestamps, request IDs, log levels, and contextual information.
- **Correlation IDs**: `RequestTracingMiddleware` injects `X-Request-ID` into every incoming request and downstream response header.
- **Latency Tracking**: Injected into response headers as `X-Process-Time: 12.45ms`.
- **Sensitive Data Redaction**: Passwords, authorization bearer tokens, JWT secrets, and personal email addresses are masked or excluded from logs.

---

## 3. External Uptime Monitoring (Better Uptime / UptimeRobot)

Configure continuous 60-second ping monitors against:
1. `https://airwise.ai` (Frontend landing page - Expect HTTP 200)
2. `https://api.airwise.ai/api/v1/health/live` (API Liveness - Expect HTTP 200)
3. `https://api.airwise.ai/api/v1/health/ready` (Database Readiness - Expect HTTP 200)

Alert thresholds:
- Alert triggered if 2 consecutive probes fail within 120 seconds.
- Escalation path: Email alert $\rightarrow$ Slack webhook $\rightarrow$ SMS on-call alert.
