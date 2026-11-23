# AIRWISE AI — Monitoring, Observability & Logging Architecture

**Document:** `docs/monitoring-and-logging.md`  
**Date:** November 21, 2026  
**Status:** Implemented & Verified  

---

## 1. Structured Logging Architecture

AIRWISE AI standardizes log output across all application modules using Python's standard `logging` library configured in `app/core/logging.py`.

### 1.1 Log Entry Structure
```
2026-11-21 12:00:00 | INFO     | airwise:main.py:35 - Booting AIRWISE AI Backend [v1.0.0] in production mode
2026-11-21 12:00:02 | INFO     | airwise:middleware.py:58 - GET /api/v1/pollution/latest -> 200 in 14.20ms [request_id=c7e3f890-7d31-4a1e-8e81-c67d3298a442]
```

### 1.2 Correlation & Request Tracing (`RequestTracingMiddleware`)
- Every HTTP transaction is assigned or accepts an `X-Request-ID` header.
- The execution duration in milliseconds is measured using `time.perf_counter()` and attached as `X-Process-Time`.
- All requests (excluding routine health checks) log `METHOD`, `PATH`, `STATUS_CODE`, `DURATION`, and `REQUEST_ID` for ingestion by centralized log aggregators (e.g., Datadog, Grafana Loki, CloudWatch, GCP Cloud Logging).

---

## 2. Health & Orchestrator Probes

AIRWISE AI exposes three specialized health endpoints under `/api/v1/health`:

| Endpoint | Probe Type | Target Consumer | Behavior & Status Codes |
|---|---|---|---|
| `GET /api/v1/health/live` | **Liveness Probe** | Kubernetes, Docker, Cloud Run | Returns `HTTP 200 {"status": "live"}` if ASGI server event loop is responsive. Restarts container if failing. |
| `GET /api/v1/health/ready` | **Readiness Probe** | Kubernetes Service, Ingress | Validates database connectivity. Returns `HTTP 200 {"status": "ready"}` or `HTTP 503 {"status": "not_ready"}` if DB is unreachable. |
| `GET /api/v1/health` | **Detailed Diagnostic** | Admin / Status Dashboard | Returns component matrix (PostgreSQL status, Gemini AI configuration, version, environment). |

---

## 3. External Monitoring & APM Integration Guide

AIRWISE AI is instrumented for zero-code or low-code integration with popular APM platforms:

### 3.1 Sentry (Error Tracking)
```python
# To enable Sentry in production, set SENTRY_DSN in .env:
import sentry_sdk
sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    traces_sample_rate=0.1,
    environment=settings.ENVIRONMENT,
)
```

### 3.2 Prometheus / OpenTelemetry Metrics
- Process metrics (CPU, resident memory, file descriptors).
- Request duration histograms (`airwise_http_request_duration_seconds`).
- Active database pool connection gauges (`airwise_db_pool_checkedout_connections`).
