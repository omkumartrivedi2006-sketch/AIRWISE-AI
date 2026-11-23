# AIRWISE AI — API Documentation (v1) — Module 03 Completed

## Base URL
```
Development:  http://localhost:8000/api/v1
Interactive:  http://localhost:8000/docs
OpenAPI JSON: http://localhost:8000/openapi.json
```

---

## Global Response Standards

### Success Envelope
All `2xx` responses follow:
```json
{
  "success": true,
  "message": "Human-readable status",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```
`meta` is only present on paginated list endpoints.

### Error Envelope
All `4xx` / `5xx` responses follow:
```json
{
  "success": false,
  "message": "Brief description",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [{ "field": "city", "issue": "min length 2" }]
  }
}
```

### Status Codes
| Code | Meaning |
|------|---------|
| `200` | OK — resource retrieved |
| `201` | Created — resource persisted |
| `400` | Bad Request — business validation failure |
| `404` | Not Found — resource does not exist |
| `422` | Unprocessable Entity — schema validation failure |
| `500` | Internal Server Error |
| `503` | Service Unavailable — DB / AI dependency unreachable |

---

## 1. Health & Diagnostics

### `GET /api/v1/health`
Returns backend service and subsystem health.

**Response `200`**
```json
{
  "success": true,
  "message": "AIRWISE AI Backend is operational",
  "data": {
    "status": "healthy",
    "service": "airwise-ai-backend",
    "version": "1.0.0",
    "environment": "development",
    "timestamp": "2026-11-20T12:30:00Z",
    "components": {
      "database": {
        "status": "connected",
        "dialect": "sqlite",
        "latency_ms": 1.45
      },
      "ai_engine": {
        "status": "unconfigured",
        "provider": "google-gemini",
        "model": "gemini-1.5-pro",
        "is_configured": false
      }
    }
  }
}
```

### `GET /api/v1/health/database`
Dedicated database diagnostics endpoint.

### `GET /api/v1/health/live`
Lightweight process liveness probe for orchestrators (Docker, Kubernetes, Cloud Run). Returns `HTTP 200 {"status": "live"}` if the ASGI event loop is active.

### `GET /api/v1/health/ready`
Dependency readiness probe. Verifies that the PostgreSQL connection pool is operational before routing external traffic. Returns `HTTP 200 {"status": "ready"}` or `HTTP 503 {"status": "not_ready"}`.

---

## 2. Monitoring Locations

### `GET /api/v1/locations?page=1&limit=20`
List all registered monitoring locations (paginated).

### `GET /api/v1/locations/{id}`
Retrieve single location by ID. Returns `404` if not found.

### `POST /api/v1/locations`
Register a new monitoring station.

**Request Body:**
```json
{
  "name": "Central Anand Vihar Station",
  "city": "New Delhi",
  "state": "Delhi",
  "country": "India",
  "latitude": 28.6508,
  "longitude": 77.3152
}
```

**Response `201`:** Returns created `LocationResponse`.

---

## 3. Pollution Telemetry & Live Environmental Data (Module 06 Extended)

### `GET /api/v1/pollution?location_id=1&start_date=2026-11-01&end_date=2026-11-20&page=1&limit=20`
List pollution observations with optional date and location filters.

### `GET /api/v1/pollution/latest?city=London&refresh=false`
Retrieve real-time environmental observations for a specific city, coordinates (`lat` & `lon`), or station (`location_id`). When `city` or coordinates are supplied, queries provider chain (Open-Meteo with WAQI fallback), normalizes multi-pollutants and atmospheric metrics, validates terrestrial boundaries, deduplicates in PostgreSQL, and caches in memory.
When called without location parameters, returns recent station-wide observations list.

### `GET /api/v1/pollution/search?q=London&limit=5`
Geocodes an ambiguous search query into standardized geographic locations with name, city, state, country, and precise decimal coordinates.

### `GET /api/v1/pollution/history?city=London&hours=24`
Retrieves hourly time-series observations for exposure progression and trend charting. First inspects local database; if records are sparse (< 4 points), queries primary external provider and persists hourly readings.

### `GET /api/v1/pollution/sources`
Lists active environmental data providers, primary status, and operational readiness.

### `GET /api/v1/pollution/data-status`
Returns real-time telemetry operational status, cache metrics (TTL, freshness thresholds), and provider configuration summaries.

### `GET /api/v1/pollution/summary?location_id=1&start_date=...&end_date=...`
Aggregated statistics (avg/min/max AQI, PM2.5, PM10, temperature, humidity) for a location.

### `GET /api/v1/pollution/{id}`
Retrieve single observation by ID.

### `POST /api/v1/pollution`
Record a new verified pollution observation.

**Request Body:**
```json
{
  "location_id": 1,
  "aqi": 312,
  "pm25": 262.4,
  "pm10": 384.1,
  "no2": 52.8,
  "o3": 24.1,
  "co": 1.1,
  "so2": 8.4,
  "temperature": 21.0,
  "humidity": 68.0,
  "source": "OpenAQ Live Feed",
  "observed_at": "2026-11-20T07:00:00Z"
}
```

---

## 4. Conversations

### `POST /api/v1/conversations`
Initialize a new dialogue session.

**Request Body:**
```json
{
  "title": "Environmental Intelligence Session",
  "user_id": null
}
```
**Response `201`:** Returns `ConversationResponse` with `id`, `title`, timestamps.

### `GET /api/v1/conversations?user_id=&page=1&limit=20`
List conversation sessions with optional user scoping.

### `GET /api/v1/conversations/{id}`
Retrieve conversation metadata by ID.

### `DELETE /api/v1/conversations/{id}?user_id=`
Delete a conversation session and its message history.

---

## 5. Conversations & AI Assistant Endpoints (Module 05)

### `POST /api/v1/conversations`
Initialize a new conversation session. Automatically associates with the authenticated user.
**Request Body:**
```json
{
  "title": "Air Quality Precautions in Delhi"
}
```

### `GET /api/v1/conversations?page=1&limit=50`
List conversation sessions belonging to the authenticated user.

### `GET /api/v1/conversations/{id}`
Retrieve conversation metadata by ID (enforces user ownership).

### `DELETE /api/v1/conversations/{id}`
Delete a conversation session and all its messages (enforces user ownership).

### `POST /api/v1/conversations/{conversation_id}/messages`
Send an environmental inquiry to the conversation and trigger real-time Google Gemini inference with contextual telemetry grounding.

**Chat Inquiry Request:**
```json
{
  "content": "Explain the difference between PM2.5 and PM10 and what masks to wear.",
  "location_id": 1
}
```

**Chat Response `201`:**
```json
{
  "success": true,
  "message": "AI response generated successfully",
  "data": {
    "id": 12,
    "role": "assistant",
    "user_message": {
      "id": 11,
      "conversation_id": 4,
      "role": "user",
      "content": "Explain the difference between PM2.5 and PM10 and what masks to wear.",
      "created_at": "2026-11-20T17:50:00Z"
    },
    "assistant_message": {
      "id": 12,
      "conversation_id": 4,
      "role": "assistant",
      "content": "Particulate matter PM2.5 and PM10 refer to inhalable airborne particles...",
      "created_at": "2026-11-20T17:50:02Z"
    },
    "conversation_id": 4,
    "status": "completed"
  }
}
```

### `GET /api/v1/conversations/{conversation_id}/messages?page=1&limit=50`
Retrieve all messages in chronological order for a conversation (enforces user ownership).

---

## 6. Feedback

### `POST /api/v1/feedback`
Submit platform experience feedback.

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Detailed feedback text...",
  "conversation_id": null,
  "user_id": null
}
```
`rating` must be an integer 1–5.

### `GET /api/v1/feedback?page=1&limit=20`
List submitted feedback entries.

---

## 7. AI Query  *(Gemini integration ready — Module 04)*

### `POST /api/v1/ai/query`
Submit a natural language query for environmental health analysis.

**Request Body:**
```json
{
  "prompt": "What are the primary health precautions for high PM2.5 levels in Delhi today?",
  "context": {
    "location": "New Delhi",
    "aqi": 342,
    "dominant_pollutant": "pm2_5",
    "user_sensitivity": "respiratory",
    "temperature_c": 21.0
  }
}
```

**Response `200`**
```json
{
  "success": true,
  "message": "AI query processed",
  "data": {
    "response": "Detailed evidence-based guidance text...",
    "provider": "google-gemini",
    "model": "gemini-1.5-pro",
    "insights": {
      "severity": "hazardous",
      "precautions": [
        "Wear certified N95/FFP2 respirators outdoors",
        "Run indoor True HEPA (H13+) air purifiers continuously"
      ],
      "outdoor_activity_recommendation": "Avoid all outdoor exertion until AQI drops below 150"
    },
    "timestamp": "2026-11-20T12:30:00.000Z"
  }
}
```

---

## 8. Authentication & Authorization API (Module 04)

All authentication endpoints reside under `/api/v1/auth`.

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| `POST` | `/api/v1/auth/register` | Register new user account | None |
| `POST` | `/api/v1/auth/login` | Authenticate with email & password | None |
| `POST` | `/api/v1/auth/refresh` | Rotate access & refresh token pair | Cookie or Body |
| `POST` | `/api/v1/auth/logout` | Revoke current session & clear cookies | Authenticated |
| `POST` | `/api/v1/auth/logout-all` | Revoke all active sessions for user | Authenticated |
| `GET` | `/api/v1/auth/me` | Fetch active user credentials & role | Authenticated |
| `POST` | `/api/v1/auth/change-password` | Update account password with verification | Authenticated |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset token via email | None |
| `POST` | `/api/v1/auth/reset-password` | Reset password using emailed token | None |
| `POST` | `/api/v1/auth/verify-email` | Verify account email address | None |
| `POST` | `/api/v1/auth/resend-verification` | Re-send verification link to email | None |

### `POST /api/v1/auth/register`
**Request Body**:
```json
{
  "full_name": "Dr. Sarah Lin",
  "email": "sarah.lin@example.com",
  "password": "SecurePassword123!"
}
```
**Response `201`**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "full_name": "Dr. Sarah Lin",
      "email": "sarah.lin@example.com",
      "role": "USER",
      "is_active": true,
      "is_verified": false,
      "created_at": "2026-11-20T12:00:00Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "eyJhbGciOi...",
      "token_type": "bearer",
      "expires_in": 900
    }
  }
}
```

### `POST /api/v1/auth/login`
**Request Body**:
```json
{
  "email": "sarah.lin@example.com",
  "password": "SecurePassword123!"
}
```
**Response `200`**: Sets `access_token` and `refresh_token` HttpOnly cookies and returns token payload.

---

## 9. User Profile Management API (Module 04)

All user management endpoints reside under `/api/v1/users`.

### `GET /api/v1/users/me`
Retrieves detailed profile information for the authenticated user.
**Headers**: `Authorization: Bearer <access_token>` or HttpOnly cookie.

### `PATCH /api/v1/users/me`
Update profile details (`full_name`, `profile_image`). Attempts to modify protected fields (`role`, `is_verified`, `is_active`, `password_hash`) are rejected or ignored.

---

## 11. Environmental Telemetry & Provider Endpoints (Module 06)

### `GET /api/v1/pollution/latest`
Retrieves the most recent multi-pollutant and meteorological observations for a given city or geographic coordinates (`lat`, `lon`), querying Open-Meteo or WAQI with local DB caching and fallback.

### `GET /api/v1/pollution/history`
Returns up to 168 hours of chronological historical telemetry for a location or city.

### `GET /api/v1/pollution/search`
Resolves user location queries using Open-Meteo geocoding search.

### `GET /api/v1/pollution/sources`
Introspects registered environmental providers and their operational status.

### `GET /api/v1/pollution/data-status`
Provides system-wide environmental data cache and synchronization metrics.

---

## 12. Environmental Analytics & Maps Endpoints (Module 07)

### `GET /api/v1/analytics/overview`
Returns high-level statistical summaries across an observation window, including mean/max AQI, average PM2.5/PM10, latest readings, and AQI category distribution.
- **Parameters**: `location_id`, `city`, `time_range` (`24h`, `7d`, `30d`, `90d`, `1y`, `custom`), `start_date`, `end_date`.

### `GET /api/v1/analytics/aqi-trends`
Returns aggregated AQI time-series points grouped by interval (`hourly`, `daily`, `weekly`, `monthly`) along with rolling moving averages and statistical trend classification (`increasing`, `decreasing`, `stable`).

### `GET /api/v1/analytics/pollutant-trends`
Returns multi-pollutant concentration time-series for a selected metric (`pm25`, `pm10`, `no2`, `so2`, `co`, `o3`), including moving averages, metric unit attribution, and WHO reference threshold comparisons.

### `GET /api/v1/analytics/statistics`
Computes rigorous non-null descriptive statistics (sample count, mean, median, min, max, sample standard deviation, and half-split percentage trajectory) for any supported environmental metric.

### `GET /api/v1/analytics/compare`
Compares environmental metrics across 2 to 5 monitoring stations or cities. Evaluates scale compatibility (e.g. US EPA vs Indian NAAQS), computes inter-location differences, and flags scientific scale mismatches.
- **Parameters**: `location_ids` (comma-separated integers), `cities` (comma-separated strings), `metric`, `time_range`.

### `GET /api/v1/analytics/data-coverage`
Audits data quality across the observation window: reports total observations, completeness ratio, missing values per parameter, and categorizes overall quality into `good`, `moderate`, or `sparse`.

### `GET /api/v1/analytics/export/csv`
Streams sanitized CSV exports of environmental observations. Sanitizes leading dangerous characters (`=`, `+`, `-`, `@`, `\t`, `\r`) with single apostrophes (`'`) to protect analysts from spreadsheet formula injection attacks.

### `POST /api/v1/analytics/insights`
Generates clinical and behavioral interpretations grounded in computed statistical parameters. Utilizes Google Gemini when operational, with an automatic deterministic rule-based fallback when AI is in standby.
- **Payload**:
```json
{
  "location_id": 1,
  "city": "London",
  "metric": "aqi",
  "time_range": "24h",
  "user_query": "Provide a comprehensive analytical summary."
}
```

### `GET /api/v1/map/observations`
Returns geo-located observation points for all active stations with coordinates, recent AQI readings, category badges, dominant pollutants, and timestamps.

### `GET /api/v1/map/locations`
Lists all registered monitoring locations with geographic coordinates and metadata for map station exploration.

---

## 9. Personalization & User Preferences (Module 08)

### `GET /api/v1/users/me/preferences`
Retrieves the authenticated user's preferences (temperature unit, AQI scale, timezone, quiet hours, notification channels, environmental interests). Automatically provisions default preferences if not yet configured.

### `PUT /api/v1/users/me/preferences`
Updates the authenticated user's preferences.
**Request Body:**
```json
{
  "temperature_unit": "C",
  "aqi_scale": "US_EPA",
  "timezone": "Europe/London",
  "language": "en",
  "quiet_hours_enabled": true,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "07:00",
  "email_notifications_enabled": true,
  "push_notifications_enabled": false,
  "in_app_notifications_enabled": true,
  "environmental_interests": ["air_pollution", "sustainable_living"]
}
```

---

## 10. Saved Locations (Module 08)

### `GET /api/v1/users/me/locations`
Returns a list of saved locations for the authenticated user, ordered with primary location first.

### `POST /api/v1/users/me/locations`
Saves a new location for the authenticated user.
**Request Body:**
```json
{
  "location_id": 1,
  "custom_name": "Home",
  "is_primary": true
}
```

### `DELETE /api/v1/users/me/locations/{saved_location_id}`
Deletes a saved location record. Strictly verifies user ownership.

---

## 11. Smart Alert Rules (Module 08)

### `GET /api/v1/alerts/rules`
Lists all active alert rules configured by the authenticated user.

### `POST /api/v1/alerts/rules`
Creates a new threshold alert rule.
**Request Body:**
```json
{
  "location_id": 1,
  "metric": "pm25",
  "threshold_value": 35.0,
  "comparison_operator": ">=",
  "aqi_scale": "US_EPA",
  "cooldown_minutes": 60,
  "notification_channels": ["in_app", "email"]
}
```

### `PATCH /api/v1/alerts/rules/{rule_id}`
Updates an existing rule (e.g., enable/disable toggle, threshold adjustments).

### `DELETE /api/v1/alerts/rules/{rule_id}`
Deletes an alert rule.

### `POST /api/v1/alerts/evaluate`
Triggers real-time evaluation of a pollution observation against active user rules.

---

## 12. Notifications & Web Push (Module 08)

### `GET /api/v1/notifications`
Retrieves paginated notifications for the user with optional filters: `is_read`, `notification_type`, `page`, and `limit`.

### `GET /api/v1/notifications/unread-count`
Returns the integer count of unread notifications for badge rendering.

### `PATCH /api/v1/notifications/{notification_id}/read`
Marks a specific notification as read.

### `POST /api/v1/notifications/mark-all-read`
Marks all notifications for the authenticated user as read in a single batch operation.

### `DELETE /api/v1/notifications/{notification_id}`
Deletes a notification from the user's notification center.

### `POST /api/v1/notifications/push/subscribe`
Registers a W3C Web Push subscription (endpoint, p256dh key, auth key) for browser push delivery.

### `DELETE /api/v1/notifications/push/subscribe`
Removes a Web Push subscription.

---

## 13. Personalized Recommendations (Module 08)

### `GET /api/v1/recommendations`
Returns personalized environmental recommendations for the user based on their primary/preferred location and health interests. Employs Google Gemini AI with deterministic clinical fallback and 1-hour caching.
**Query Parameters:**
- `location_id` (optional): Query recommendations for a specific location.

### `POST /api/v1/recommendations/refresh`
Bypasses the TTL cache and forces regeneration of fresh personalized recommendations.

---

## 14. Platform Administration & Governance (Module 09)

All administrative endpoints require an `Authorization: Bearer <token>` header belonging to a user with `role: "ADMIN"`.

### `GET /api/v1/admin/dashboard/overview`
Retrieves platform-wide overview statistics: total users, active users, 7-day registration counts, observations, flagged observations, notification statistics, and provider health counts.

### `GET /api/v1/admin/dashboard/activity`
Returns 7-day chronological telemetry activity across users, observations, and AI queries.

### `GET /api/v1/admin/users`
Lists platform users with pagination, text search (`query`), and filtering by `role` (`ADMIN`, `USER`) or `is_active` (`true`, `false`).

### `GET /api/v1/admin/users/{user_id}`
Retrieves detailed profile information for a specific user, including preferences and saved location counts.

### `PATCH /api/v1/admin/users/{user_id}/status`
Activates or deactivates a user account.
- **Safeguards**: Administrators cannot deactivate themselves. Cannot deactivate the only active administrator.
- **Request Body**:
```json
{
  "is_active": false,
  "reason": "Terms violation / Suspicious activity"
}
```

### `PATCH /api/v1/admin/users/{user_id}/role`
Updates a user's privilege tier (`USER` or `ADMIN`).
- **Safeguards**: Cannot demote the only active administrator.
- **Request Body**:
```json
{
  "role": "ADMIN"
}
```

### `GET /api/v1/admin/environmental-data`
Queries raw pollution observations for quality assurance review with filtering by location, provider, and review status.

### `PATCH /api/v1/admin/environmental-data/{observation_id}/review`
Submits a quality determination review for an environmental observation while preserving original physical measurements.
- **Request Body**:
```json
{
  "review_status": "APPROVED",
  "review_notes": "Calibrated with local station sensor baseline",
  "is_flagged": false
}
```

### `GET /api/v1/admin/data-sources`
Returns operational health, endpoint URLs, and latency metrics for external environmental providers (Open-Meteo, WAQI).

### `GET /api/v1/admin/data-sources/{provider_id}/health`
Executes an immediate live test ping to the specified external provider.

### `GET /api/v1/admin/ai-usage/overview`
Returns Gemini API usage statistics: total requests, estimated token usage, average latency, and 24-hour quota consumption.

### `GET /api/v1/admin/ai-usage/trends`
Returns 7-day daily request volume and token consumption history.

### `GET /api/v1/admin/notifications`
Retrieves system notification delivery audit records with filtering by status and channel.

### `POST /api/v1/admin/notifications/{notification_id}/retry`
Triggers immediate retry dispatch for a failed notification.

### `GET /api/v1/admin/system/health`
Returns system status, environment name, version, and server uptime.

### `GET /api/v1/admin/system/database`
Returns PostgreSQL query latency, connectivity status, and table row counts across all platform models.

### `GET /api/v1/admin/system/services`
Returns health matrix across all platform dependencies (FastAPI, PostgreSQL, Gemini API, Open-Meteo, WAQI).

### `GET /api/v1/admin/audit-logs`
Returns chronological, tamper-evident administrative audit logs with filtering by action and target type.

---

Start a local PostgreSQL instance via Docker:
```bash
docker run --name airwise-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=airwise_ai \
  -p 5432:5432 \
  -d postgres:16-alpine
```

Apply migrations:
```bash
cd backend
alembic upgrade head
```

Rollback:
```bash
alembic downgrade base
```

Set `DATABASE_URL` in `.env`:
```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/airwise_ai
```
