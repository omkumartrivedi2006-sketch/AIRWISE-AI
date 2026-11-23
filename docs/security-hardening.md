# AIRWISE AI — Security Hardening Specification

**Document:** `docs/security-hardening.md`  
**Date:** November 21, 2026  
**Status:** Implemented & Verified  

---

## 1. Authentication & Session Security

AIRWISE AI implements defense-in-depth security principles across authentication, authorization, session management, and credential protection.

### 1.1 Password Hashing & Key Derivation
- **Algorithm**: Argon2id (`argon2-cffi`), the current state-of-the-art key derivation function winner of the Password Hashing Competition (PHC).
- **Parameters**: Salted uniquely per user, memory-hard parameters preventing GPU and ASIC rainbow table and dictionary cracking attacks.
- **Zero Raw Password Storage**: Passwords never enter logs or database columns unhashed.

### 1.2 Dual-Token JWT Architecture & Refresh Rotation
- **Access Tokens**: Short-lived (15 minutes by default), signed with HMAC-SHA256 (`HS256`). Carries claims `sub` (user ID), `email`, `role`, and expiration timestamp `exp`.
- **Refresh Tokens**: Cryptographically secure 64-character hex strings stored in the database with hashed values, 7-day expiration, and single-use rotation.
- **Reuse Detection**: If a previously revoked or rotated refresh token is presented, the system treats it as token theft and revokes all active family sessions for that account.
- **HttpOnly Cookies**: Refresh tokens are delivered via `HttpOnly`, `SameSite=Lax` cookies, rendering them inaccessible to client-side JavaScript and immune to standard XSS token extraction.

### 1.3 Role-Based Access Control (RBAC) & Route Protection
- Every administrative route under `/api/v1/admin/` enforces `get_current_admin_user`, rejecting non-admin users with `403 Forbidden` and unauthenticated users with `401 Unauthorized`.
- Client-side navigation (`AdminLayout`) verifies `role == "ADMIN"` and redirects non-administrators to `/dashboard`.

### 1.4 Administrative Lockout Invariants
- **Self-Deactivation Guard**: Administrators cannot deactivate their own active accounts.
- **Last-Admin Safeguard**: Real-time validation prohibits demoting or deactivating the sole active administrator in the database.

---

## 2. API & Network Security

### 2.1 HTTP Security Headers
Every API response returned by FastAPI includes OWASP-recommended security headers via `SecurityHeadersMiddleware`:
- `X-Content-Type-Options: nosniff`: Prevents MIME-type confusion attacks.
- `X-Frame-Options: DENY`: Mitigates clickjacking attacks.
- `X-XSS-Protection: 1; mode=block`: Activates browser reflected XSS filters.
- `Referrer-Policy: strict-origin-when-cross-origin`: Restricts referrer data leakage across cross-origin requests.
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`: Disables unnecessary browser hardware features.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`: Forces HTTPS communication in production.

### 2.2 Request Payload Size Limiter
`RequestSizeLimiterMiddleware` inspects incoming `Content-Length` headers, immediately returning `HTTP 413 Payload Too Large` for payloads exceeding `MAX_REQUEST_SIZE_BYTES` (10MB default) to prevent server heap exhaustion and memory denial-of-service.

### 2.3 Rate Limiting & Throttling
`SimpleRateLimiterMiddleware` applies in-memory sliding-window request throttling per IP address:
- **Authentication Endpoints** (`/auth/login`, `/auth/register`, `/auth/forgot-password`): 15 requests per minute with `Retry-After: 60` headers.
- **General Endpoints**: Configurable sliding-window ceiling.

### 2.4 CORS Allowlist
FastAPI `CORSMiddleware` strictly validates incoming origins against `ALLOWED_ORIGINS`, explicitly permitting only designated origins (e.g., `http://localhost:3000` in dev or `https://airwise.ai` in production) and prohibiting wildcard `*` with credentials.

---

## 3. Data Integrity & Immutability Guarantees

### 3.1 Environmental Telemetry Immutability
Under `/api/v1/admin/environmental-data/{id}/review`, administrators can modify verification tags and provide review notes, but the underlying physical telemetry readings (AQI, PM2.5, PM10, NO2, SO2, CO, O3, temperature, humidity) are strictly immutable.

### 3.2 Spreadsheet Formula Injection Sanitization
All CSV exports under `/api/v1/analytics/export/csv` sanitize dangerous control characters (`=`, `+`, `-`, `@`, `\t`, `\r`) with single apostrophe prefixes to prevent Excel Dynamic Data Exchange (DDE) remote code execution.

### 3.3 Credential Redaction in Audit Logs
Administrative audit logs captured by `AuditService` automatically sanitize sensitive keys (`password`, `token`, `secret`, `api_key`) to `"[REDACTED]"` before committing to PostgreSQL.

---

## 4. AI Security & Prompt Injection Mitigation

- **Server-Side API Key Management**: `GEMINI_API_KEY` is maintained exclusively in server environment variables and never exposed to the frontend bundle or client network tabs.
- **Context Grounding & Prompt Guardrails**: System instructions explicitly bound the LLM to environmental topics, instruct it to disclose when data is unavailable, and prohibit executing external tools or fabricating sensor numbers.
- **Input Clamping**: Prompts exceeding `AI_MAX_INPUT_LENGTH` (5000 characters) are rejected with validation errors to avoid token-bloat attacks.
