# AIRWISE AI — API Documentation Specification (v1)

## Base URL
```
Development: http://localhost:8000/api/v1
Interactive Docs: http://localhost:8000/docs
OpenAPI JSON: http://localhost:8000/openapi.json
```

All endpoints are versioned under `/api/v1`.

---

## 1. Global Response Standards

### 1.1 Success Response Wrapper
Standard JSON response containing requested data payload.

```json
{
  "status": "success",
  "data": { ... }
}
```

### 1.2 Error Response Format
All errors follow a standardized format with consistent HTTP status codes:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Detailed description of the error",
    "details": [
      {
        "field": "city",
        "issue": "String should have at least 2 characters"
      }
    ],
    "timestamp": "2026-11-20T12:00:00Z"
  }
}
```

Common status codes:
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Invalid request syntax or business validation failure.
- `404 Not Found`: Resource does not exist.
- `422 Unprocessable Entity`: Request body failed schema validation.
- `500 Internal Server Error`: Unhandled server exception.
- `503 Service Unavailable`: Upstream dependency (Database/AI provider) unavailable.

---

## 2. Endpoints Specification

### 2.1 Health & Diagnostics
#### `GET /api/v1/health`
Returns the status of the backend service and subsystems without exposing internal credentials.

**Response: `200 OK`**
```json
{
  "status": "healthy",
  "service": "airwise-ai-backend",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2026-11-20T12:30:00.000Z",
  "components": {
    "database": {
      "status": "connected",
      "latency_ms": 1.45
    },
    "ai_engine": {
      "status": "configured",
      "provider": "google-gemini",
      "model": "gemini-1.5-pro"
    }
  }
}
```

*Note: If database is not yet connected during local initial setup, `"database"` status reports `"pending_configuration"` with overall status `"degraded"`, returning HTTP `200` to allow frontend boot diagnostics.*

---

### 2.2 AI Assistance Foundation
#### `GET /api/v1/ai/status`
Verifies AI engine configuration and availability.

**Response: `200 OK`**
```json
{
  "status": "ready",
  "provider": "google-gemini",
  "model": "gemini-1.5-pro",
  "streaming_supported": true
}
```

#### `POST /api/v1/ai/query` (Prepared Contract for Module 03)
Submits a user query for air quality analysis and actionable guidance.

**Request Body:**
```json
{
  "prompt": "What are the primary health precautions for high PM2.5 levels in Delhi today?",
  "context": {
    "location": "New Delhi",
    "aqi": 342,
    "user_sensitivity": "respiratory"
  }
}
```

**Response: `200 OK`**
```json
{
  "response": "Detailed guidance text...",
  "insights": {
    "severity": "hazardous",
    "precautions": ["Wear N95 masks", "Use HEPA purifiers"]
  },
  "timestamp": "2026-11-20T12:30:00.000Z"
}
```

---

### 2.3 Pollution Data Endpoints (Prepared Contract for Module 02)
#### `GET /api/v1/pollution/current`
Query current AQI and pollutant breakdown for a given location coordinates or city identifier.

**Query Parameters:**
- `city` (string, optional)
- `lat` (float, optional)
- `lon` (float, optional)

**Response: `200 OK`**
```json
{
  "location": "Central Delhi",
  "aqi": 310,
  "category": "Very Unhealthy",
  "dominant_pollutant": "pm2_5",
  "pollutants": {
    "pm2_5": { "value": 260.5, "unit": "µg/m³" },
    "pm10": { "value": 380.2, "unit": "µg/m³" },
    "no2": { "value": 45.1, "unit": "ppb" },
    "o3": { "value": 28.0, "unit": "ppb" },
    "co": { "value": 1.8, "unit": "ppm" },
    "so2": { "value": 12.4, "unit": "ppb" }
  },
  "updated_at": "2026-11-20T12:00:00Z"
}
```
