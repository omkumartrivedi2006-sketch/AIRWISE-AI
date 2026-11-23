# AIRWISE AI — CI/CD Pipeline & Quality Automation Guide

**Document:** `docs/ci-cd-guide.md`  
**Date:** November 21, 2026  
**Status:** Implemented (`.github/workflows/ci.yml`)  

---

## 1. CI/CD Architecture Overview

AIRWISE AI utilizes GitHub Actions for continuous integration, automated quality gates, and deployment validation.

The pipeline triggers automatically on:
- Every push to the `main` branch.
- Every pull request targeting `main`.

---

## 2. Pipeline Workflows & Jobs

### 2.1 Backend CI Job (`backend-ci`)
- **Environment**: Ubuntu Latest with PostgreSQL 16 Alpine container service running in parallel.
- **Python Version**: 3.11 with pip caching.
- **Tasks**:
  1. Checks out repository.
  2. Sets up Python virtual environment and installs all dependencies from `backend/requirements.txt`.
  3. Verifies syntax and configuration.
  4. Runs full automated test suite using `pytest tests -v` with transactional database fixtures.

### 2.2 Frontend CI Job (`frontend-ci`)
- **Environment**: Ubuntu Latest.
- **Node Version**: 20 with npm package-lock caching.
- **Tasks**:
  1. Checks out repository.
  2. Installs dependencies reproducibly with `npm ci`.
  3. Validates strict TypeScript compilation via `npx tsc --noEmit`.
  4. Executes optimized Next.js production build via `npm run build` to verify all 30 static and dynamic routes.

---

## 3. GitHub Secrets Configuration

To run the pipeline in a personal or organizational repository, configure the following secrets under **Settings > Secrets and variables > Actions**:

| Secret Name | Description | Environment |
|---|---|---|
| `DATABASE_URL` | Production PostgreSQL connection string | Production |
| `SECRET_KEY` | 32-byte hexadecimal cryptographic key | Production |
| `GEMINI_API_KEY` | Google Gemini API Key | Production |
| `WAQI_API_TOKEN` | World Air Quality Index Token | Production |

> [!NOTE]
> Pull requests run against ephemeral in-memory or containerized SQLite/PostgreSQL fixtures with mock keys. No production secrets are exposed during pull request validation.
