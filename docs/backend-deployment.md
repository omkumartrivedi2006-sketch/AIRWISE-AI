# AIRWISE AI — Backend Deployment Guide (FastAPI + Uvicorn)

This guide provides instructions for deploying the containerized FastAPI backend to **Render**, **Google Cloud Run**, or any Docker-compatible infrastructure.

---

## 1. Deploying to Render via Infrastructure-as-Code

AIRWISE AI includes a turnkey [render.yaml](file:///c:/Users/OM%20TRIVEDI/Desktop/AIRWISE-AI/render.yaml) blueprint.

### Step 1: Link Render to GitHub
1. Sign in to [Render Dashboard](https://dashboard.render.com).
2. Click **"Blueprints"** $\rightarrow$ **"New Blueprint Instance"**.
3. Select your repository: `omkumartrivedi2006-sketch/AIRWISE-AI`.
4. Render will detect `render.yaml` and parse:
   - Managed PostgreSQL database `airwise-postgres` (Postgres 16)
   - Web service `airwise-backend` using `backend/Dockerfile`

### Step 2: Set Secret Environment Variables
In the Render Web Service settings, populate the following sync-disabled secrets:
- `SECRET_KEY`: Automatically generated cryptographically secure string (or generated via `openssl rand -hex 32`).
- `GEMINI_API_KEY`: Your production Google Gemini API key from Google AI Studio.
- `WAQI_API_TOKEN`: Your WAQI API token (optional).
- `ALLOWED_ORIGINS`: JSON array of allowed frontend URLs, e.g. `["https://airwise.ai","https://www.airwise.ai","https://airwise.vercel.app"]`.

### Step 3: Run Database Migrations
On the initial release, trigger the migration runner from the Render Shell or deployment hook:
```bash
alembic upgrade head
```

---

## 2. Manual Container Deployment (Docker / Cloud Run)

To build and run the backend image manually:

```bash
cd backend
docker build -t airwise-backend:latest .

docker run -d \
  --name airwise-api \
  -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e DEBUG=false \
  -e DATABASE_URL="postgresql+psycopg://user:password@host:5432/airwise_db?sslmode=require" \
  -e SECRET_KEY="your-cryptographic-secret-key" \
  -e ALLOWED_ORIGINS='["https://airwise.ai","https://airwise.vercel.app"]' \
  -e GEMINI_API_KEY="AIzaSy..." \
  airwise-backend:latest
```

### Health Check Probes
- **Liveness Probe**: `GET /api/v1/health/live` $\rightarrow$ returns HTTP 200 `{"status": "live"}`.
- **Readiness Probe**: `GET /api/v1/health/ready` $\rightarrow$ verifies database pool and returns HTTP 200 `{"status": "ready", "database": "connected"}`.
