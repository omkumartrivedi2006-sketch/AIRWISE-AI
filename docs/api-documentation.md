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

## 3. Pollution Telemetry

### `GET /api/v1/pollution?location_id=1&start_date=2026-11-01&end_date=2026-11-20&page=1&limit=20`
List pollution observations with optional date and location filters.

### `GET /api/v1/pollution/latest?limit=20`
Retrieve the most recent observation per station (up to `limit`).

### `GET /api/v1/pollution/summary?location_id=1&start_date=...&end_date=...`
Aggregated statistics (avg/min/max AQI, PM2.5, PM10, temperature, humidity) for a location.

### `GET /api/v1/pollution/{id}`
Retrieve single observation by ID.

### `POST /api/v1/pollution`
Record a new pollution observation.

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

## 5. Messages

### `POST /api/v1/conversations/{conversation_id}/messages`
Persist a message to an active conversation.

**Request Body:**
```json
{
  "role": "user",
  "content": "What are the PM2.5 health risks today?"
}
```
Supported roles: `"user"`, `"assistant"`, `"system"`.

### `GET /api/v1/conversations/{conversation_id}/messages?page=1&limit=50`
Retrieve all messages in chronological order for a conversation.

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

## 10. PostgreSQL Setup (Local Development)

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
