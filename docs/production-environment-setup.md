# AIRWISE AI — Production Environment Variables Configuration

This document provides the definitive reference of all environment variables used across the frontend and backend services.

---

## 1. Frontend Environment Variables (`frontend/.env.production`)

Only variables prefixed with `NEXT_PUBLIC_` are accessible in the browser bundle. Never place backend secrets or private keys in frontend variables.

| Variable | Required? | Default | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | **Yes** | `http://localhost:8000/api/v1` | Fully qualified base URL for backend REST API. In production: `https://api.airwise.ai/api/v1` or `https://airwise-backend.onrender.com/api/v1`. |
| `NEXT_PUBLIC_SITE_URL` | Optional | `https://airwise.ai` | Canonical domain used for generating sitemap and robots.txt. |

---

## 2. Backend Environment Variables (`backend/.env`)

These variables are consumed server-side by FastAPI and Pydantic Settings.

### Core Application & Security
| Variable | Required? | Default | Description |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | **Yes** | `production` | Set to `production` to activate production safeguards, strict fail-fast DB checks, and secure cookies. |
| `DEBUG` | **Yes** | `false` | Disable interactive tracebacks and verbose debugging. |
| `LOG_LEVEL` | Optional | `INFO` | Logging level (`INFO`, `WARNING`, `ERROR`). |
| `SECRET_KEY` | **Yes** | *(None)* | 64-character cryptographic hex string for signing JWT tokens. Generate via `openssl rand -hex 32`. |
| `JWT_ALGORITHM` | Optional | `HS256` | JWT signing algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Optional | `15` | Access token lifespan in minutes. |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Optional | `7` | Refresh token lifespan in days. |
| `COOKIE_SECURE` | **Yes** | `true` | Enforces `Secure` flag on HttpOnly cookies under HTTPS. |
| `COOKIE_SAMESITE` | **Yes** | `none` or `lax` | Use `none` if frontend and backend have different domains; use `lax` if sharing apex domain. |
| `COOKIE_DOMAIN` | Optional | `None` | Set to `.airwise.ai` if sharing cookies across subdomains. |
| `ALLOWED_ORIGINS` | **Yes** | *(None)* | JSON list of allowed origins, e.g. `["https://airwise.ai","https://www.airwise.ai"]`. |

### Database
| Variable | Required? | Default | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | *(None)* | PostgreSQL connection URI, e.g. `postgresql+psycopg://user:pass@host:5432/airwise_db?sslmode=require`. |

### AI Integration (Google Gemini)
| Variable | Required? | Default | Description |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Optional | `""` | Google AI Studio API key. If absent, fallback deterministic guidance is provided. |
| `GEMINI_MODEL` | Optional | `gemini-1.5-pro` | Gemini model identifier (`gemini-1.5-pro` or `gemini-1.5-flash`). |
| `AI_MAX_DAILY_REQUESTS` | Optional | `50` | Maximum daily requests per user to protect token budget. |

### Environmental Data Telemetry
| Variable | Required? | Default | Description |
| :--- | :--- | :--- | :--- |
| `WAQI_API_TOKEN` | Optional | `""` | WAQI token for physical ground stations. (Open-Meteo requires no token). |
| `AIR_QUALITY_CACHE_TTL_SECONDS` | Optional | `900` | In-memory cache TTL for telemetry (15 minutes). |

### Rate Limiting & Protection
| Variable | Required? | Default | Description |
| :--- | :--- | :--- | :--- |
| `RATE_LIMIT_ENABLED` | Optional | `true` | Sliding-window API rate limiter. |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | Optional | `60` | General endpoint rate limit. |
| `AUTH_RATE_LIMIT_REQUESTS_PER_MINUTE` | Optional | `15` | Authentication endpoint rate limit. |
