# AIRWISE AI — GenAI-Powered Pollution Intelligence Platform

[![Status: Module 01 Completed](https://img.shields.io/badge/Status-Module_01_Architecture_Ready-0066FF.svg)](#current-development-status)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![Frontend: Next.js](https://img.shields.io/badge/Frontend-Next.js_15_App_Router-black.svg)](https://nextjs.org)
[![AI: Google Gemini](https://img.shields.io/badge/AI-Google_Gemini_API-8E75C2.svg)](https://aistudio.google.com)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_&_SQLAlchemy_2.0-336791.svg)](https://www.postgresql.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

AIRWISE AI is an enterprise-grade environmental intelligence and assistance platform. Combining real-time multi-pollutant telemetry (PM2.5, PM10, NO2, SO2, CO, O3) with Google Gemini GenAI inference, AIRWISE AI provides clinically-grounded protective guidance, personalized vulnerability management, and predictive pollution intelligence.

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
- **Design System**: Midnight dark palette (`#070B12`, `#0B111E`), electric blue (`#0066FF`), cyan accents (`#00F2FE`), tasteful glassmorphism, and zero-hero-image compliance.
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+ / 3.14 compatible)
- **Validation**: [Pydantic v2](https://docs.pydantic.dev/) & `pydantic-settings`
- **Server**: [Uvicorn](https://www.uvicorn.org/) (ASGI high-concurrency worker)
- **API Architecture**: Modular versioned routers under `/api/v1` namespace
- **Error Handling**: Centralized RFC-compliant JSON exception handlers

### Database & Migrations
- **Database Engine**: [PostgreSQL 15+](https://www.postgresql.org/)
- **ORM**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) with connection pooling and scoped sessions
- **Migrations**: [Alembic](https://alembic.sqlalchemy.org/) versioned schema migrations

### AI Integration
- **Foundation Model**: [Google Gemini 1.5 Pro / Flash](https://aistudio.google.com/)
- **Integration Layer**: Server-side dedicated service with `BaseAIProvider` abstraction
- **Security**: Zero API key exposure to browser bundles or client code

---

## 4. System Architecture

```
User Interface (Browser)
      ↓
Next.js 15 Frontend (App Router, React 19, TypeScript)
      ↓ (HTTP / REST / JSON)
API Gateway / Ingress Layer
      ↓
FastAPI Backend (/api/v1)
      ├── Centralized Exception Handler
      ├── Pydantic v2 Request Validation
      └── Structured JSON Logger
      ↓
Service Layer (Domain Logic)
      ├── AI Service (Google Gemini Provider Abstraction & Prompts)
      ├── Pollution Data Service (Telemetry Ingestion & AQI Normalization)
      ├── User Service (Profiles & Vulnerability Presets)
      └── Analytics Service (Exposure & Trend Modeling)
      ↓
SQLAlchemy 2.0 ORM Engine & Alembic Migrations
      ↓
PostgreSQL Database
```

---

## 5. Monorepo Project Structure

```
AIRWISE-AI/
├── frontend/                     # Next.js 15 App Router Frontend
│   ├── src/
│   │   ├── app/                  # App Router pages, layout, and global CSS
│   │   │   ├── globals.css       # Design tokens & glassmorphic utilities
│   │   │   ├── layout.tsx        # Root HTML layout with Header/Footer
│   │   │   └── page.tsx          # Landing page (zero-hero-image rule)
│   │   ├── components/
│   │   │   ├── ui/               # Reusable UI primitives (Button, Card, Badge, Header, Footer)
│   │   │   └── preview/          # Real-data components (LiveTelemetry, AIIntelligence, Architecture)
│   │   ├── lib/                  # Utility helpers (cn, formatting)
│   │   ├── services/             # API client services
│   │   ├── styles/               # Reusable design tokens
│   │   └── types/                # TypeScript shared interfaces
│   ├── package.json              # Frontend npm dependencies
│   ├── tsconfig.json             # TypeScript configuration
│   ├── tailwind.config.ts        # Tailwind theme tokens
│   └── .env.example              # Frontend environment template
│
├── backend/                      # FastAPI Python Backend
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/    # Modular route handlers (health, ai)
│   │   │       └── router.py     # Aggregated v1 API router
│   │   ├── core/
│   │   │   ├── config.py         # Pydantic BaseSettings management
│   │   │   ├── exceptions.py     # Centralized exception handling
│   │   │   └── logging.py        # Structured application logging
│   │   ├── db/
│   │   │   └── session.py        # SQLAlchemy engine, session generator & resilience
│   │   ├── models/               # SQLAlchemy ORM models
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── services/             # Domain business logic (ai, pollution, user, analytics)
│   │   │   └── ai/               # Gemini AI service, prompt templates & provider abstraction
│   │   └── main.py               # Application factory & ASGI entry point
│   ├── alembic/                  # Alembic database migration scripts
│   ├── tests/                    # Pytest test suite (health, routing, errors)
│   ├── alembic.ini               # Alembic configuration
│   ├── requirements.txt          # Python backend dependencies
│   └── .env.example              # Backend environment template
│
├── docs/                         # Architecture & Technical Documentation
│   ├── architecture.md           # System architecture specification
│   ├── api-documentation.md      # API v1 endpoints & schema reference
│   └── development-roadmap.md    # Multi-module implementation lifecycle
│
├── .env.example                  # Root environment template
├── .gitignore                    # Comprehensive repository gitignore
└── README.md                     # Project documentation
```

---

## 6. Installation & Quick Start

### Prerequisites
- **Node.js**: v18.18+ or v20+ / v25+
- **Python**: 3.11+ (Python 3.11, 3.12, 3.13, 3.14)
- **PostgreSQL**: Optional for Module 01 (backend automatically uses resilient fallback if local PostgreSQL is not yet running)

---

### Step 1: Clone and Setup Workspace

```bash
git clone <repository_url>
cd AIRWISE-AI
```

### Step 2: Environment Configuration

Copy the sample environment files:

```bash
# Backend environment setup
cp backend/.env.example backend/.env

# Frontend environment setup
cp frontend/.env.example frontend/.env.local
```

Configure your secrets in `backend/.env`:
- `GEMINI_API_KEY`: Obtain from [Google AI Studio](https://aistudio.google.com/).
- `DATABASE_URL`: Connection string for PostgreSQL (e.g., `postgresql+psycopg://postgres:postgres@localhost:5432/airwise_db`).

---

### Step 3: Backend Setup & Launch

1. Create and activate a Python virtual environment:
   ```bash
   cd backend
   python -m venv venv

   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1

   # On macOS/Linux:
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Launch the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. Verify backend health:
   - Health endpoint: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
   - Interactive Swagger docs: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)

---

### Step 4: Frontend Setup & Launch

1. Open a new terminal and navigate to `frontend`:
   ```bash
   cd frontend
   npm install
   ```

2. Launch the Next.js development server:
   ```bash
   npm run dev
   ```

3. Open the application:
   - Navigate to [http://localhost:3000](http://localhost:3000)

---

## 7. Database Configuration Guide

### Local PostgreSQL Setup
If you have PostgreSQL installed locally:
1. Create the database:
   ```sql
   CREATE DATABASE airwise_db;
   ```
2. Update `backend/.env`:
   ```env
   DATABASE_URL=postgresql+psycopg://postgres:yourpassword@localhost:5432/airwise_db
   ```
3. Run migrations via Alembic:
   ```bash
   cd backend
   alembic upgrade head
   ```

### Dockerized PostgreSQL Setup (Alternative)
You can run a local PostgreSQL container with one command:
```bash
docker run --name airwise-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=airwise_db -p 5432:5432 -d postgres:16-alpine
```

### Cloud Database Option (Supabase / Neon / Cloud SQL)
Set `DATABASE_URL` in `backend/.env` with your pooled connection URI:
```env
DATABASE_URL=postgresql+psycopg://[user]:[password]@[host]:5432/[db]?sslmode=require
```

*Note: In Module 01, if no PostgreSQL server is available, the backend automatically initializes in resilient fallback mode and reports `"development_mock_fallback"` on `/api/v1/health` without crashing.*

---

## 8. Verification & Automated Testing

### Running Backend Unit & Health Tests
```bash
cd backend
pytest tests/ -v
```

Tests verify:
- Root endpoint response (`200 OK`).
- `/api/v1/health` payload structure and subsystem reporting.
- `/api/v1/ai/status` provider configuration detection.
- RFC-compliant 404 and validation error handling.

---

## 9. Current Development Status & Roadmap

| Module | Objective | Status |
| :--- | :--- | :--- |
| **Module 01** | **Project Foundation, System Architecture & Initial Setup** | **Completed** |
| **Module 02** | **Pollution Data Ingestion & Environmental APIs (OpenAQ)** | Scheduled Next |
| **Module 03** | **Core AI Intelligence Service & Gemini Assistant Engine** | Scheduled |
| **Module 04** | **Interactive Dashboard, Geospatial Maps & Visualizations** | Scheduled |
| **Module 05** | **User Personalization, Health Profiles & Alert Triggers** | Scheduled |
| **Module 06** | **Production Hardening, CI/CD & Cloud Deployment** | Scheduled |

---

## 10. Security Compliance

- **Zero Client Secrets**: `GEMINI_API_KEY` and database credentials are strictly retained on the backend server.
- **CORS Whitelisting**: Strict origin controls restrict API access to approved domains.
- **Git Protection**: Sensitive environment files (`.env`, `.env.local`) and virtual environments are explicitly excluded in `.gitignore`.
