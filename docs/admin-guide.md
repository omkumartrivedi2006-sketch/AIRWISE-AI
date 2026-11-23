# AIRWISE AI — Administrator Governance & Operations Manual

This manual provides platform administrators, data stewards, and DevOps engineers with operational instructions for governing the AIRWISE AI platform.

---

## 1. Access Control & Role-Based Access Control (RBAC)

- Platform access is strictly partitioned into two roles:
  - `USER`: Citizen and researcher accounts with access to public and personalized endpoints.
  - `ADMIN`: Platform operators with access to administrative APIs (`/api/v1/admin/*`) and governance consoles (`/admin/*`).
- Any attempt by non-admin users to invoke administrative endpoints results in immediate `403 Forbidden` response and an entry in security audit logs.

---

## 2. Executive Dashboard Overview (`/admin/dashboard`)

The executive dashboard provides platform-wide telemetry:
- **User Metrics**: Total registered accounts, active sessions (24h), and newly onboarded profiles.
- **Environmental Telemetry**: Total ingested observations, active monitoring stations, and unverified data queue count.
- **AI Infrastructure Usage**: Total Gemini queries, token consumption, average response latency, and model availability.
- **System Health**: Database pool utilization, memory usage, background worker status, and API error rates.

---

## 3. Data Quality & Environmental Observation QA (`/admin/environmental-data`)

To maintain scientific integrity across environmental observations:
1. Navigate to **Data Curation**.
2. Review ingested observations flagged by automated heuristic outlier detection.
3. Select an observation to inspect raw sensor data, station metadata, and historical baseline.
4. **Preservation Invariant**: Administrators can mark records as `verified`, `flagged`, or `rejected`, and attach an audit reason. However, **raw physical measurements (AQI, PM2.5, PM10, NO₂, etc.) remain strictly immutable**.
5. All curation actions record an audit trail capturing admin ID, timestamp, prior state, new state, and reason.

---

## 4. External Data Source Management (`/admin/data-sources`)

- **Open-Meteo Integration**: Displays health status, last sync timestamp, atmospheric model version (Copernicus CAMS), and endpoint latency.
- **WAQI Integration**: Displays ground sensor API token validity, station coverage count, and synchronization cadence.
- Administrators can trigger an immediate manual data sync or ping health checks for each upstream provider.

---

## 5. User Management & Account Moderation (`/admin/users`)

- Search users by email or name.
- View role assignments, account verification status, and registration date.
- Promote or demote user roles (`USER` $\leftrightarrow$ `ADMIN`).
- Deactivate or reactivate user accounts. Self-deactivation prevention safeguards ensure active administrators cannot lock themselves out.

---

## 6. Audit Logs & Forensic Trail (`/admin/audit-logs`)

Every security-sensitive operation generates an immutable audit record:
- User authentication events (logins, failed attempts, token refresh, password resets)
- User role modifications
- Observation quality approvals and rejections
- System configuration adjustments
- Background sync job triggers

Audit logs can be filtered by admin ID, action type, target resource, and date range.
