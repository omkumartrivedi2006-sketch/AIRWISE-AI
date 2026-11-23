# AIRWISE AI — Administrative REST API Reference

All administrative endpoints are mounted at `/api/v1/admin/` and require an HTTP Authorization header containing a valid Bearer JWT belonging to a user with `role: "ADMIN"`.

---

## 1. Dashboard & Executive Overview
- `GET /api/v1/admin/dashboard/overview`
  - Returns platform totals: users, active users, environmental readings, flagged readings, notifications, AI queries today, external sources count.
- `GET /api/v1/admin/dashboard/activity?days=7`
  - Returns chronological day-by-day telemetry counts for users, observations, and AI assistant requests.

---

## 2. User Governance & Access Control
- `GET /api/v1/admin/users?limit=50&offset=0&role=ALL&status=ALL&search=`
  - Lists users with search, role, and active status filters.
- `GET /api/v1/admin/users/{user_id}`
  - Returns detailed profile for a specific user including saved locations count and preferences.
- `PATCH /api/v1/admin/users/{user_id}/status`
  - Body: `{"is_active": false, "reason": "Terms violation"}`
  - Toggles active status. Prevents self-deactivation and last-admin deactivation. Logs to audit trail.
- `PATCH /api/v1/admin/users/{user_id}/role`
  - Body: `{"role": "ADMIN"}`
  - Promotes or demotes user role. Prevents last-admin demotion. Logs to audit trail.

---

## 3. Environmental Data Review & Quality Control
- `GET /api/v1/admin/environmental-data?limit=50&offset=0&location_id=&provider=&is_flagged=&review_status=`
  - Lists raw observation telemetry with review flags and notes.
- `GET /api/v1/admin/environmental-data/{observation_id}`
  - Returns single observation details with complete review history.
- `PATCH /api/v1/admin/environmental-data/{observation_id}/review`
  - Body: `{"review_status": "APPROVED", "review_notes": "Ground calibrated", "is_flagged": false}`
  - Updates review determination and creates an `EnvironmentalDataReview` historical entry. Preserves physical values immutable.

---

## 4. External Data Sources & Health Checks
- `GET /api/v1/admin/data-sources/`
  - Returns health, endpoint, and latency metadata for registered providers (Open-Meteo, WAQI).
- `GET /api/v1/admin/data-sources/{provider_id}/health`
  - Executes live ping test to the specified external provider.

---

## 5. AI Assistant & Gemini Usage
- `GET /api/v1/admin/ai-usage/overview`
  - Returns total queries, estimated tokens consumed, average latency, and daily quota utilization.
- `GET /api/v1/admin/ai-usage/trends?days=7`
  - Returns 7-day query volume and daily token totals.

---

## 6. Notifications & Delivery Audit
- `GET /api/v1/admin/notifications?limit=50&offset=0&status=&type=`
  - Returns delivery audit log of system notifications.
- `GET /api/v1/admin/notifications/metrics`
  - Returns delivery rates: total sent, delivered, failed, and pending.
- `POST /api/v1/admin/notifications/{notification_id}/retry`
  - Retries dispatch of a failed notification. Logs to audit trail.

---

## 7. System Health & Infrastructure Diagnostics
- `GET /api/v1/admin/system/health`
  - Basic platform status and uptime.
- `GET /api/v1/admin/system/database`
  - Query latency, connection check, and table row counts across all models.
- `GET /api/v1/admin/system/services`
  - Comprehensive service matrix (API, Database, Gemini, Open-Meteo, WAQI).

---

## 8. Audit Logs
- `GET /api/v1/admin/audit-logs?limit=50&offset=0&action=&target_type=`
  - Returns persistent audit history with administrator attribution, IP, and details payload.
