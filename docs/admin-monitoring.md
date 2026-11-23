# AIRWISE AI — Platform Monitoring, Health Diagnostics & Observability

## Overview
Module 09 introduces deep observability and health tracking into AIRWISE AI. Platform administrators can inspect runtime health across the API server, database layer, external environmental providers, and AI inference services.

---

## 1. System Services Matrix

| Service | Component Type | Status Probe | Fallback Strategy |
|---|---|---|---|
| **FastAPI Backend** | Application Core | Heartbeat endpoint `/api/v1/health` | Multi-worker process restart |
| **PostgreSQL** | Primary Database | `SELECT 1` ping query with latency tracking | Cached environmental snapshots |
| **Google Gemini API** | AI Provider | Health status via `UsageService` quota monitor | Heuristic environmental rules fallback |
| **Open-Meteo API** | Weather & AQI Ingestion | HTTP GET ping to air-quality endpoint | WAQI station fallback / Cache TTL (15m) |
| **WAQI / AQICN** | Ground AQI Ingestion | HTTP GET ping to feed endpoint | Open-Meteo model fallback |

---

## 2. Database Health & Table Counts
The system reports live counts and query latency on `/api/v1/admin/system/database`:
- `users`: Total registered user profiles
- `locations`: Active geographical coordinate clusters
- `pollution_observations`: Raw environmental sensor telemetry
- `conversations`: AI assistant session threads
- `messages`: Assistant & user prompts
- `notifications`: Alerts dispatched across all channels
- `audit_logs`: Tamper-evident admin action entries
- `environmental_reviews`: Data quality determination records

---

## 3. External API Latency Tracking
Provider latency is checked and reported in milliseconds (`ms`):
- `< 200 ms`: Optimal performance
- `200 - 800 ms`: Normal latency
- `> 800 ms`: Degraded performance warning

If a provider fails or times out, the system marks the provider status as `DEGRADED` or `OFFLINE` while maintaining uninterrupted user service through cached observations.
