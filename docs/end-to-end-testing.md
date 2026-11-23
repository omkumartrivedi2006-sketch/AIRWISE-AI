# AIRWISE AI — End-to-End User Journey Testing Specification

**Document:** `docs/end-to-end-testing.md`  
**Date:** November 21, 2026  
**Status:** Implemented & Verified in `backend/tests/integration/test_e2e_user_journeys.py`  

---

## 1. Overview of End-to-End User Journeys

The end-to-end testing suite rigorously exercises the 5 core user personas and operational workflows of AIRWISE AI without mock short-circuiting:

```
[Journey A: New User]         -> Registration -> JWT Authentication -> Preferences -> Bookmark Locations
[Journey B: Environmentalist] -> Multi-Station Telemetry -> Analytics Overview -> Map Pins -> Cross-Comparison
[Journey C: Patient / User]   -> Create Conversation -> Post Symptoms/Inquiry -> AI Grounded Advisory -> History
[Journey D: Vulnerable Group] -> Threshold Alert Rule -> Breaching Telemetry -> In-App Center -> Read Toggle
[Journey E: Administrator]    -> Admin Auth -> Dashboard KPIs -> Data Review & QA -> Immutability -> Audit Trail
```

---

## 2. Journey Specifications & Validation Gates

### Journey A: New User Onboarding & Preferences
- **Endpoint Sequence**:
  1. `POST /api/v1/auth/register` (Account creation with Argon2id hashing)
  2. `POST /api/v1/auth/login` (Credential verification and JWT bearer issuance)
  3. `PUT /api/v1/users/me/preferences` (Updating units, quiet hours, and interest tags)
  4. `POST /api/v1/users/me/locations` (Bookmarking primary monitoring station)
  5. `GET /api/v1/users/me/locations` (Verifying persistence and tenant isolation)
- **Validation**: Confirms preferences and saved locations survive session reloads.

### Journey B: Pollution Intelligence & Analytics
- **Endpoint Sequence**:
  1. Multi-hour sensor ingestion across Leeds and Southampton
  2. `GET /api/v1/pollution/latest?location_id={id}`
  3. `GET /api/v1/analytics/overview?location_id={id}&time_range=24h`
  4. `GET /api/v1/map/observations`
  5. `GET /api/v1/analytics/compare?location_ids={id1},{id2}&metric=pm25`
- **Validation**: Verifies non-null descriptive statistics, moving averages, CartoDB coordinates, and scale safety warnings.

### Journey C: AI Pollution Assistant
- **Endpoint Sequence**:
  1. `POST /api/v1/conversations` (Title initialization)
  2. `POST /api/v1/conversations/{id}/messages` (User query: "What are the recommended precautions when PM2.5 levels reach 65 µg/m³?")
  3. `GET /api/v1/conversations/{id}/messages` (History ordering)
  4. `DELETE /api/v1/conversations/{id}` (Conversation teardown)
- **Validation**: Verifies conversational context preservation and database persistence.

### Journey D: Smart Pollution Alerts & Notification Center
- **Endpoint Sequence**:
  1. `POST /api/v1/alerts/rules` (PM2.5 >= 35.0 µg/m³ threshold trigger)
  2. `POST /api/v1/alerts/evaluate` (Breaching observation evaluation)
  3. `GET /api/v1/notifications` (In-app center retrieval)
  4. `PATCH /api/v1/notifications/{id}/read` (Single-click read confirmation)
  5. `GET /api/v1/notifications/unread-count` (Badge counter updates to 0)
- **Validation**: Verifies cooldown throttling and state transitions.

### Journey E: Administrator Governance & Observability
- **Endpoint Sequence**:
  1. `POST /api/v1/auth/login` (Admin credentials)
  2. `GET /api/v1/admin/dashboard/overview` (Executive metrics)
  3. `GET /api/v1/admin/users?search=...` (Directory search)
  4. `PATCH /api/v1/admin/environmental-data/{id}/review` (Set status to `APPROVED`)
  5. Observation Invariant Verification (Measurements remain immutable)
  6. `GET /api/v1/admin/audit-logs` (Action logged with admin attribution)
  7. RBAC Verification (Standard user receives `HTTP 403 Forbidden`)
- **Validation**: Verifies privilege separation, self-deactivation protection, and physical sensor preservation.
