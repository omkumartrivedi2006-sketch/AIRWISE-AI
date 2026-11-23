# AIRWISE AI — GenAI-Powered Pollution Intelligence Platform

[![Status: Module 12 Completed](https://img.shields.io/badge/Status-Module_12_Production_Launch_Ready-38E0B4.svg)](#current-development-status)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![Frontend: Next.js](https://img.shields.io/badge/Frontend-Next.js_15_App_Router-black.svg)](https://nextjs.org)
[![AI Engine: Google Gemini](https://img.shields.io/badge/AI-Google_GenAI_SDK-8E75C2.svg)](https://aistudio.google.com)
[![Environmental Data: Open-Meteo & WAQI](https://img.shields.io/badge/Telemetry-Open--Meteo_&_WAQI-28C7F5.svg)](https://open-meteo.com)
[![Geospatial: Leaflet + Dark Matter](https://img.shields.io/badge/Geospatial-Leaflet_&_CartoDB_Dark-336791.svg)](https://leafletjs.com)
[![Security: Argon2id + JWT](https://img.shields.io/badge/Security-Argon2id_&_Dual_JWT-28C7F5.svg)](https://cheatsheetseries.owasp.org/)
[![Database: MongoDB](https://img.shields.io/badge/Database-MongoDB_7.0_&_PyMongo-47A248.svg)](https://www.mongodb.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

AIRWISE AI is an enterprise-grade environmental intelligence and assistance platform. Combining real-time multi-pollutant telemetry (PM2.5, PM10, NO2, SO2, CO, O3) from Copernicus CAMS, SILAM models, and government ground stations with Google Gemini GenAI inference, AIRWISE AI provides clinically-grounded protective guidance, personalized vulnerability management, and real-time pollution intelligence.

---

## 1. Problem Statement

Air pollution is one of the leading global causes of premature mortality and chronic respiratory morbidity, responsible for an estimated 7 million annual deaths worldwide according to the World Health Organization (WHO).

Key challenges addressed:
1. **Raw Data Incomprehensibility**: Raw micrograms per cubic meter (`µg/m³`) or index numbers fail to inform users of the immediate physiological risk to their specific health conditions.
2. **Generic, Action-Less Advisories**: Traditional weather and air quality apps offer generic warnings (*"Air is poor today"*) without tailored behavioral guidance.
3. **Vulnerable Population Vulnerability**: Individuals with asthma, cardiovascular disease, pregnant women, children, and outdoor workers require distinct exposure thresholds and timely intervention windows.
4. **Indoor vs. Outdoor Disconnect**: Users lack guidance on when to ventilate apartments, when to seal windows, and how to optimize indoor HEPA air filtration against diurnal pollution cycles.

---

## 2. Solution Overview

AIRWISE AI bridges the gap between environmental sensor networks and personal health protection:
- **Real-Time Precision AQI**: Ingests and normalizes multi-pollutant sensor telemetry mapped to global standards (US EPA, EU CAQI, Indian NAAQS).
- **Context-Grounded GenAI Guidance**: Integrates Google Gemini API on the server side to synthesize environmental data with personal health profiles into prescriptive, actionable directives.
- **Exposure Timing Optimization**: Recommends optimal windows for outdoor commuting, exercise, and indoor ventilation based on diurnal pollutant dispersion trends.
- **Enterprise-Grade Architecture**: Designed from scratch with strict separation of concerns, zero-leakage security boundaries, and modular microservice readiness.

---

## 3. Technology Stack

### Frontend
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router paradigm)
- **Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict type checking)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/) with custom design tokens
- **Design Tokens**:
  - Primary Background: `#080A0D`
  - Secondary Background: `#10151B`
  - Card Background: `#141B23`
  - Primary Accent: `#28C7F5` (Electric Cyan)
  - Secondary Accent: `#38E0B4` (Clean Air Mint)
  - Primary Text: `#F5F7FA`
  - Secondary Text: `#A5B0BC`
  - Border: `rgba(255, 255, 255, 0.09)`
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+ / 3.14 compatible)
- **Validation**: [Pydantic v2](https://docs.pydantic.dev/) & `pydantic-settings`
- **Server**: [Uvicorn](https://www.uvicorn.org/) (ASGI high-concurrency worker)
- **API Architecture**: Modular versioned routers under `/api/v1` namespace
- **Error Handling**: Centralized RFC-compliant JSON exception handlers

### Database & Data Engine
- **Database Engine**: [MongoDB 7.0+](https://www.mongodb.com/) (Local or MongoDB Atlas)
- **Driver**: [PyMongo 4.x](https://pymongo.readthedocs.io/) with connection pooling and atomic sequence counters
- **Architecture**: Document-based schema with auto-increment sequence counters (`counters` collection) for 100% frontend API compatibility

### AI Integration
- **Foundation Model**: [Google Gemini 1.5 Pro / Flash](https://aistudio.google.com/)
- **Integration Layer**: Server-side dedicated service with `BaseAIProvider` abstraction
- **Security**: Zero API key exposure to browser bundles or client code

---

## 4. Frontend Route Architecture

| Route | Purpose | Status |
| :--- | :--- | :--- |
| `/` | Landing page (All 9 sections: Nav, Hero, AQI Overview, Features, How It Works, AI Preview, Awareness, CTA, Footer) | **Completed** |
| `/dashboard` | Interactive telemetry dashboard preview (station switcher, metrics grid, 24h trend) — **Protected** | **Completed** |
| `/assistant` | Dedicated AI assistant conversation view with disclaimer and simulated reasoning — **Protected** | **Completed** |
| `/profile` | User account management, personal details, password change, active sessions — **Protected** | **Completed** |
| `/login` | Secure login interface with remember-me, password visibility toggle, error handling | **Completed** |
| `/register` | Secure registration interface with real-time password complexity checklist | **Completed** |
| `/forgot-password` | Password recovery request interface | **Completed** |
| `/reset-password` | Password reset interface validating recovery token | **Completed** |
| `/verify-email` | Email verification confirmation interface | **Completed** |
| `/about` | Mission statement, WHO/EPA guidelines, architectural principles | **Completed** |
| `/admin` | Administrative Governance Workspace & Executive KPI center — **Protected (ADMIN)** | **Completed** |
| `/admin/users` | User directory, status activation/deactivation, role management — **Protected (ADMIN)** | **Completed** |
| `/admin/environmental-data` | Environmental data quality assurance & telemetry reviews — **Protected (ADMIN)** | **Completed** |
| `/admin/data-sources` | External provider health probes (Open-Meteo & WAQI) — **Protected (ADMIN)** | **Completed** |
| `/admin/ai-usage` | Google Gemini API consumption, quotas, and request trends — **Protected (ADMIN)** | **Completed** |
| `/admin/notifications` | Notification delivery audit log and failed message retries — **Protected (ADMIN)** | **Completed** |
| `/admin/system-health` | System health, MongoDB latency & collection diagnostics — **Protected (ADMIN)** | **Completed** |
| `/admin/audit-logs` | Immutable audit trail & state modification JSON payload inspector — **Protected (ADMIN)** | **Completed** |
| `/admin/settings` | Platform identity, security policies, and ingestion limits — **Protected (ADMIN)** | **Completed** |
| `/contact` | Project contact & developer inquiry form | **Completed** |
| `/privacy` | Privacy policy detailing zero data selling and local storage | **Completed** |
| `/terms` | Terms of service and medical/environmental disclaimer | **Completed** |

---

## 5. Installation & Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+ (or 3.14 as tested)
- MongoDB 7.0+ (Local Community Edition, Docker, or MongoDB Atlas)

### MongoDB via Docker (Recommended for Local Dev)
```bash
docker run --name airwise-mongodb \
  -p 27017:27017 \
  -d mongo:7.0-jammy
```

Or connect to **MongoDB Atlas**:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/?retryWrites=true&w=majority
DB_NAME=airwise_db
```

### Frontend Startup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### Backend Startup
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1        # Windows
pip install -r requirements.txt
python scripts/init_mongodb.py     # Initialize MongoDB indexes & sequence counters
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Health Check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- Interactive API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- OpenAPI JSON: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

### Migrate from PostgreSQL to MongoDB
If you have an existing PostgreSQL database:
```bash
python scripts/migrate_postgres_to_mongodb.py --source-url "postgresql+psycopg://user:pass@localhost:5432/airwise_db"
```

### Run Backend Tests
```bash
cd backend
.\venv\Scripts\Activate.ps1
pytest tests -v
```
Expected: **105 passed** (unit + integration, using in-memory SQLite fixture and deterministic AI mocks)

### Google Gemini AI Assistant Setup (Module 05)
1. **Get an API Key**: Obtain a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2. **Configure Backend Environment**:
   Add the key to `backend/.env` or root `.env`:
   ```env
   GEMINI_API_KEY=AIzaSy...
   GEMINI_MODEL=gemini-1.5-pro
   GEMINI_TEMPERATURE=0.4
   GEMINI_TIMEOUT_SECONDS=30
   AI_ENABLED=true
   AI_MAX_DAILY_REQUESTS=50
   ```
3. **Verify Status**:
   Visit [http://localhost:8000/api/v1/ai/status](http://localhost:8000/api/v1/ai/status).
   When properly configured, `status` will report `"ready"` and `is_configured` will report `true`.
4. **Use Assistant**:
   Open [http://localhost:3000/assistant](http://localhost:3000/assistant). Authenticated users can create new chats, review history, send inquiries, and receive context-grounded pollution advice.

### Troubleshooting AI & Gemini
- **Gemini Standby Status**: If the assistant shows "Gemini Standby", check that `GEMINI_API_KEY` in `backend/.env` is not empty or equal to the placeholder string.
- **HTTP 429 Limit Reached**: The system enforces `AI_MAX_DAILY_REQUESTS=50` requests per 24 hours per user account.
- **HTTP 502 / Upstream Timeout**: If Google's API exceeds `GEMINI_TIMEOUT_SECONDS` (default 30s), a structured error is returned without leaving a corrupted or empty response in the database.

### Alembic Migration Commands
```bash
alembic upgrade head       # Apply all migrations
alembic downgrade base     # Roll back all migrations
alembic history            # View migration history
```

---

## 6. Current Development Status & Roadmap

| Module | Title | Primary Objective | Status |
| :--- | :--- | :--- | :--- |
| **Module 01** | **Project Foundation, Architecture & Setup** | Monorepo structure, Next.js app shell, FastAPI backend, DB & AI foundations | **Completed** |
| **Module 02** | **Landing Page UI/UX & Frontend Implementation** | 9 landing sections, design tokens, responsive layout, placeholder routes | **Completed** |
| **Module 03** | **Backend Engineering, REST API & PostgreSQL Integration** | 6 SQLAlchemy models, Alembic migrations, full REST API (health, locations, pollution, conversations, messages, feedback), Pydantic v2 schemas, frontend API client, 16 passing tests | **Completed** |
| **Module 04** | **Secure Authentication, Authorization & User Management** | Argon2id hashing, dual-token JWT, refresh token rotation, HttpOnly cookies, RBAC, Auth UI | **Completed** |
| **Module 05** | **AI Engine Integration & Intelligent Pollution Assistant** | Gemini API integration, prompt guardrails, context assembly, multi-turn memory, conversational UI | **Completed** |
| **Module 06** | **Live Pollution Data Integration, Environmental APIs & Real-Time AQI Intelligence** | Open-Meteo & WAQI providers, geocoding search, validation, caching, 24h history, live dashboard | **Completed** |
| **Module 07** | **Advanced Environmental Analytics, Pollution Trends, Interactive Maps & Intelligent Insights** | Descriptive statistics engine, AQI/pollutant time-series, scale-safe cross-location comparison, CartoDB Dark Matter geospatial map, Gemini-grounded insights, CSV export with formula injection prevention | **Completed** |
| **Module 08** | **User Personalization, Smart Pollution Alerts, Notifications & Recommendations** | Profile preferences, saved locations management, smart pollution alert evaluation engine with scale safety and cooldown, in-app notification center, multi-channel dispatch abstraction, personalized Gemini recommendation engine with caching | **Completed** |
| **Module 09** | **Admin Dashboard, Environmental Data Management, User Management & Platform Monitoring** | Complete administrative governance suite, RBAC enforcement (`ADMIN` role), self-deactivation & last-admin demotion guards, data quality reviews with immutable physical telemetry preservation, provider health probes, AI usage telemetry, persistent redacted audit logging, admin CLI provisioning, 15 new tests (94 total passing) | **Completed** |
| **Module 10** | **Production Readiness, Performance Optimization, Security Hardening & Deployment Preparation** | OWASP HTTP security headers, payload size limiter, rate limiting, request tracing, GZip compression, production fail-fast DB pool recycling, liveness/readiness probes, error boundaries, loading skeletons, robots.ts/sitemap.ts, multi-stage Dockerfiles, docker-compose.yml, GitHub Actions CI, 6 new tests (100 total passing) | **Completed** |
| **Module 11** | **Final Integration, End-to-End Testing, Bug Fixing, UI/UX Polish & Complete Application Verification** | Comprehensive full-stack audit across all 11 modules, 5 E2E automated user journey test suites covering onboarding, analytics, AI assistant, alerts, and admin governance; 105 backend tests passing; zero Next.js compilation errors across 32 routes; complete operational and user guides | **Completed** |
| **Module 12** | **Final Deployment, Domain Configuration, Production Launch & Post-Deployment Verification** | Turnkey Render blueprint (`render.yaml`), Vercel config (`vercel.json`), production smoke test CLI (`backend/scripts/production_smoke_test.py`), DNS/HTTPS guidelines, backup/restore runbooks, incident response protocols, 12 production deployment guides | **Completed** |
