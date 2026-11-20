# AIRWISE AI — GenAI-Powered Pollution Intelligence Platform

[![Status: Module 02 Completed](https://img.shields.io/badge/Status-Module_02_UI/UX_Ready-28C7F5.svg)](#current-development-status)
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

### Database & Migrations
- **Database Engine**: [PostgreSQL 15+](https://www.postgresql.org/)
- **ORM**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) with connection pooling and scoped sessions
- **Migrations**: [Alembic](https://alembic.sqlalchemy.org/) versioned schema migrations

### AI Integration
- **Foundation Model**: [Google Gemini 1.5 Pro / Flash](https://aistudio.google.com/)
- **Integration Layer**: Server-side dedicated service with `BaseAIProvider` abstraction
- **Security**: Zero API key exposure to browser bundles or client code

---

## 4. Frontend Route Architecture

| Route | Purpose | Status |
| :--- | :--- | :--- |
| `/` | Landing page (All 9 sections: Nav, Hero, AQI Overview, Features, How It Works, AI Preview, Awareness, CTA, Footer) | **Completed** |
| `/dashboard` | Interactive telemetry dashboard preview (station switcher, metrics grid, 24h trend skeleton) | **Completed** |
| `/assistant` | Dedicated AI assistant conversation view with disclaimer and simulated reasoning | **Completed** |
| `/about` | Mission statement, WHO/EPA guidelines, architectural principles | **Completed** |
| `/login` | Authentication placeholder with credentials form and brand shell | **Completed** |
| `/register` | Registration placeholder with vulnerability profile presets (asthma, cardio, child, athlete) | **Completed** |
| `/contact` | Project contact & developer inquiry form | **Completed** |
| `/privacy` | Privacy policy detailing zero data selling and local storage | **Completed** |
| `/terms` | Terms of service and medical/environmental disclaimer | **Completed** |

---

## 5. Installation & Quick Start

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
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Health Check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- API Docs: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)

---

## 6. Current Development Status & Roadmap

| Module | Title | Primary Objective | Status |
| :--- | :--- | :--- | :--- |
| **Module 01** | **Project Foundation, Architecture & Setup** | Monorepo structure, Next.js app shell, FastAPI backend, DB & AI foundations | **Completed** |
| **Module 02** | **Landing Page UI/UX & Frontend Implementation** | 9 landing sections, design tokens, responsive layout, placeholder routes | **Completed** |
| **Module 03** | **Pollution Data Ingestion & Environmental APIs** | Live AQI data pipelines, pollutant telemetry, normalization, caching | Scheduled Next |
| **Module 04** | **Core AI Intelligence & Gemini Assistant Engine** | Gemini API integration, context-grounded prompt templates, health advisory agent | Scheduled |
| **Module 05** | **Interactive Dashboard & Environmental Visualizations** | Geospatial air maps, historical pollutant trends, analytics charts | Scheduled |
| **Module 06** | **User Personalization & Real-Time Alert System** | Exposure profiles, asthma/vulnerability presets, notifications | Scheduled |
| **Module 07** | **Production Hardening, Testing & Cloud Deployment** | Dockerization, CI/CD, rate limiting, security audits | Scheduled |
