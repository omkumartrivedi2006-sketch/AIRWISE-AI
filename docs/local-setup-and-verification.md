# AIRWISE AI — Local Setup, Verification & Quickstart Guide

This guide details the procedure for deploying, configuring, and verifying AIRWISE AI locally using native environments or Docker Compose.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or higher
- **Python**: v3.11 or higher
- **PostgreSQL**: v14.0 or higher (or Docker)
- **Git**

---

## 2. Repository Setup

```bash
git clone https://github.com/organization/airwise-ai.git
cd AIRWISE-AI
```

---

## 3. Option A: Native Local Setup

### Step 1: Backend Configuration
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:
```env
PROJECT_NAME="AIRWISE AI"
API_V1_STR="/api/v1"
ENVIRONMENT="development"
DEBUG=true

# Database (PostgreSQL)
POSTGRES_SERVER="localhost"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="your_postgres_password"
POSTGRES_DB="airwise_db"
POSTGRES_PORT=5432

# Security & JWT
JWT_SECRET_KEY="replace-with-a-secure-random-64-character-hex-key"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Gemini AI Integration (Optional for local testing; deterministic fallback available)
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-1.5-flash"

# CORS
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

Run database migrations:
```bash
alembic upgrade head
```

Start backend development server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 2: Frontend Configuration
In a separate terminal:
```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Start frontend development server:
```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000).

---

## 4. Option B: Docker Compose Setup

Run the entire stack (PostgreSQL, FastAPI Backend, Next.js Frontend) in unified containers:

```bash
docker-compose up --build -d
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Liveness Probe**: [http://localhost:8000/api/v1/health/live](http://localhost:8000/api/v1/health/live)
- **Health Readiness Probe**: [http://localhost:8000/api/v1/health/ready](http://localhost:8000/api/v1/health/ready)

---

## 5. Verification & Testing

### Running the Full Test Suite
To verify all 105 automated unit, integration, and E2E tests:

```bash
cd backend
venv\Scripts\activate
pytest tests -v
```

Expected output:
```text
====================== 105 passed in 53.51s ======================
```

### Verifying Frontend Production Build
```bash
cd frontend
npm run build
```

Expected output:
```text
✓ Generating static pages
✓ Finalizing page optimization
✓ Build completed successfully (Exit Code 0)
```
