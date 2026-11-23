# AIRWISE AI — Post-Deployment Verification & Smoke Testing

This guide details the procedure for executing live post-deployment smoke tests against public staging or production URLs.

---

## 1. Automated Smoke Test Script

AIRWISE AI provides a dedicated verification script in [backend/scripts/production_smoke_test.py](file:///c:/Users/OM%20TRIVEDI/Desktop/AIRWISE-AI/backend/scripts/production_smoke_test.py).

### Executing Live Smoke Tests
```bash
python backend/scripts/production_smoke_test.py \
  --backend https://api.airwise.ai \
  --frontend https://airwise.ai
```

Or when using host platform URLs:
```bash
python backend/scripts/production_smoke_test.py \
  --backend https://airwise-backend.onrender.com \
  --frontend https://airwise.vercel.app
```

### Probes Evaluated
1. **Backend Liveness**: Checks HTTP 200 at `/api/v1/health/live`.
2. **Database Readiness**: Checks HTTP 200 and `"database": "connected"` at `/api/v1/health/ready`.
3. **RBAC Endpoint Protection**: Verifies that unauthenticated access to `/api/v1/admin/dashboard/overview` is rejected with `HTTP 401` or `HTTP 403`.
4. **Environmental Data Status**: Verifies that `/api/v1/pollution/sources` returns operational status for upstream providers.
5. **Geocoding Search**: Verifies that `/api/v1/pollution/search?city=London` returns valid station coordinates.
6. **Frontend Public Rendering**: Verifies that the frontend returns HTTP 200 and renders application markup.

---

## 2. Manual Verification Checklist Across Core Modules

| Module / Feature | Test Action | Expected Result | Verified? |
| :--- | :--- | :--- | :--- |
| **Landing Page** | Open `https://airwise.ai` in incognito browser. | Renders 9 sections, responsive design, hero AQI preview. | [ ] |
| **User Registration** | Register test user `smoke_test_citizen@airwise.ai`. | Account created, redirected to dashboard, session active. | [ ] |
| **User Login** | Log in with registered test credentials. | HTTP 200, JWT returned, refresh cookie stored. | [ ] |
| **Live Telemetry** | Search for "Paris" on Dashboard. | Multi-pollutant card updates with latest PM2.5, PM10, AQI. | [ ] |
| **AI Assistant** | Send query: "What are safe outdoor timings today?" | Context-grounded response received with source attribution. | [ ] |
| **Interactive Map** | Navigate to `/map` and zoom into stations. | Color-coded AQI markers appear across European cities. | [ ] |
| **Analytics & Compare** | Navigate to `/compare` and select 2 cities. | Multi-location comparison rendered with scale validation. | [ ] |
| **Alert Rules** | Create an alert rule for AQI > 100. | Rule saved; visible under `/settings/alerts`. | [ ] |
| **Admin Protection** | Attempt to navigate to `/admin` as regular user. | Access denied (`403 Forbidden`). | [ ] |
| **Admin Console** | Log in as provisioned admin account. | Executive KPIs, observation QA, and audit logs visible. | [ ] |
