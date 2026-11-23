# AIRWISE AI — Admin Dashboard & Governance Workspace

## Overview
The AIRWISE AI Administrative Workspace provides platform administrators with real-time operational visibility, telemetry, user governance, environmental data quality assurance, external API provider metrics, AI engine budget tracking, and persistent audit logs.

Access is restricted exclusively to authenticated users possessing the `ADMIN` role.

---

## 1. Administrative Architecture & Design System

The Admin Workspace adheres to AIRWISE AI's deep-space dark aesthetic:
- **Background Root**: `#080A0D`
- **Surface Elevation 1 (Cards, Sidebars)**: `#10151B`
- **Surface Elevation 2 (Inputs, Sub-panels)**: `#141B23`
- **Accent Primary (Cyan)**: `#28C7F5`
- **Accent Secondary (Teal)**: `#38E0B4`
- **Security / Warning (Amber)**: `#F59E0B`
- **Borders & Dividers**: `rgba(255, 255, 255, 0.09)`

### Route Protection & RBAC
- **Client Guard**: `src/app/admin/layout.tsx` checks user authentication status and `user.role === 'ADMIN'`. Non-admin users are automatically redirected to `/dashboard` with access denied warnings.
- **Backend Guard**: All administrative endpoints under `/api/v1/admin/` enforce the `get_current_admin_user` dependency from `app.api.deps`.

---

## 2. Admin Workspace Modules

### 2.1 Overview & Executive KPI Center (`/admin`)
- Total Registered Users (with Active / Inactive breakdown)
- Total Environmental Ingestion Count & Flagged Records
- External Data Source Health Status
- AI Engine Requests & Budget Tracking
- Live System Latency & Database Status
- 7-Day Activity Trends (registrations, environmental telemetry readings, AI queries)

### 2.2 User Directory & Access Management (`/admin/users`)
- Search users by email or full name.
- Filter by Role (`ADMIN`, `USER`) and Status (`Active`, `Inactive`).
- **Status Toggle**: Deactivate abusive accounts or reactivate suspended accounts.
- **Role Assignment**: Promote standard users to `ADMIN` or demote administrative personnel.
- **Critical Safety Guardrails**:
  - Administrators cannot deactivate their own account.
  - Demoting or deactivating the last active administrator in the database is strictly rejected with a `400 Bad Request`.

### 2.3 Environmental Data Review & Quality Assurance (`/admin/environmental-data`)
- Review historical and real-time environmental observations.
- Filter by Location, Data Provider (`Open-Meteo`, `WAQI`), and Flagged Status.
- **Quality Determination Action**:
  - Set status to `APPROVED`, `REJECTED`, or `FLAGGED`.
  - Enter administrative review notes.
- **Strict Invariant**: Original physical sensor measurements (AQI, PM2.5, PM10, NO2, O3, CO, SO2, temperature, humidity) are strictly immutable and never altered or overwritten during quality reviews.

### 2.4 External Data Providers (`/admin/data-sources`)
- Status, latency, error rates, and operational endpoints for:
  - **Open-Meteo Air Quality API**
  - **WAQI (World Air Quality Index) Station Feed**
- Live test ping functionality for immediate connection diagnostics.

### 2.5 AI Engine & Gemini Monitoring (`/admin/ai-usage`)
- Request volume, token consumption, and response latency.
- Daily quota progress bar against the 1,500 requests/day safety limit.
- 7-day volume visualization.

### 2.6 Notification Delivery Center (`/admin/notifications`)
- Delivery metrics: Total sent, delivered, failed, and pending.
- Detailed notification dispatch audit table.
- Failed notification retry action with audit attribution.

### 2.7 System Diagnostics & Infrastructure Health (`/admin/system-health`)
- Application version, environment, and uptime.
- PostgreSQL database response latency and table row counts.
- Services status matrix (FastAPI, PostgreSQL, Gemini, Open-Meteo, WAQI).

### 2.8 Tamper-Evident Audit Logs (`/admin/audit-logs`)
- Chronological trail of administrative actions.
- Filter by action type, target model, and administrator email.
- Client IP address and User Agent tracking.
- Interactive modal for deep JSON inspection of modified state payloads.

### 2.9 Platform Settings (`/admin/settings`)
- System identity, security invariant documentation, and environmental pipeline limits.
- Redacted credentials policy guarantee.
