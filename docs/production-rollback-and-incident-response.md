# AIRWISE AI — Production Rollback & Incident Response Plan

This document establishes the emergency procedures, release rollback mechanisms, credential rotation protocols, and service disaster recovery plans.

---

## 1. Instant Release Rollback Procedures

### Frontend Rollback (Vercel)
Vercel maintains immutable deployments for every build:
1. Navigate to **Vercel Dashboard** $\rightarrow$ Project **AIRWISE AI** $\rightarrow$ **Deployments**.
2. Locate the previous stable production deployment.
3. Click the three dots ($\dots$) and select **"Promote to Production"**.
4. Traffic is instantly routed to the previous build across the global edge network (propagation time: $< 5$ seconds).

### Backend Rollback (Render / Docker)
1. Navigate to **Render Dashboard** $\rightarrow$ Service **airwise-backend** $\rightarrow$ **Deploys**.
2. Identify the last healthy deployment prior to the regression.
3. Click **"Rollback to this deploy"**.
4. The previous Docker container image is redeployed with existing environment variables.

---

## 2. Database Migration Emergency Handling

> [!IMPORTANT]
> Because all database migrations in AIRWISE AI follow the **Expand/Contract** forward-compatibility pattern (new columns and tables are created non-destructively), rolling back backend code to the previous release **does not require rolling back database migrations**.

If a migration must be reverted:
1. **Never run `alembic downgrade base` in production**.
2. Create an emergency fix migration:
   ```bash
   alembic revision -m "revert_unwanted_change"
   ```
3. Test the fix migration in a local/staging environment.
4. Deploy and apply via `alembic upgrade head`.

---

## 3. Emergency Secret Rotation Protocol

If credentials or secrets are suspected to be compromised:

1. **JWT Secret (`SECRET_KEY`)**:
   - Generate a new 64-character hex key: `openssl rand -hex 32`.
   - Update `SECRET_KEY` in backend environment settings.
   - Restart backend service.
   - *Impact*: All existing active user sessions will be invalidated and required to re-authenticate.
2. **Database Credentials (`DATABASE_URL`)**:
   - Reset the database password in the managed PostgreSQL console.
   - Immediately update `DATABASE_URL` in the backend environment.
   - Restart the backend container.
3. **Google Gemini API Key (`GEMINI_API_KEY`)**:
   - Rotate the key in [Google AI Studio](https://aistudio.google.com).
   - Update `GEMINI_API_KEY` in the backend dashboard.
   - The backend continues serving cached or deterministic advice during the transition.
