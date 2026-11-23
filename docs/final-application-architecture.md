# AIRWISE AI — Final Application Architecture Specification

**Document:** `docs/final-application-architecture.md`  
**Date:** November 21, 2026  
**Status:** Unified Production Architecture  

---

## 1. System Topology & Tiering

AIRWISE AI is designed as a modular monolith with decoupled client and server tiers:

```mermaid
graph TD
    subgraph Client ["Frontend Tier (Next.js 15 App Router)"]
        Landing["Landing Page (9 Sections)"]
        Dashboard["Telemetry Dashboard (/dashboard)"]
        Analytics["Environmental Analytics (/analytics)"]
        Map["Geospatial Pollution Map (/map)"]
        Compare["Location Comparison (/compare)"]
        Assistant["AI Assistant (/assistant)"]
        Profile["Profile & Personalization (/profile)"]
        AlertSettings["Alert Rules (/settings/alerts)"]
        Notifications["Notification Center (/notifications)"]
        AdminPortal["Admin Workspace (/admin/*)"]
    end

    subgraph SecurityGateway ["Security, Middleware & Ingress"]
        CORS["Strict CORS Allowlist"]
        SecHeaders["OWASP Security Headers (HSTS, CSP, X-Frame)"]
        SizeLimit["10MB Payload Limiter"]
        RateLimit["Sliding-Window Rate Limiter"]
        Tracing["Correlation ID (X-Request-ID) & Process Timing"]
        GZip["GZip Response Compression (>1KB)"]
    end

    subgraph BackendCore ["Backend Application Tier (FastAPI Modular Monolith)"]
        Router["Versioned Router (/api/v1)"]
        AuthModule["Authentication & RBAC (Argon2id + Dual JWT)"]
        PollutionModule["Pollution & Geocoding Ingestion Service"]
        AnalyticsModule["Descriptive Statistics & Trends Engine"]
        PersonalizationModule["Preferences, Alerts & Dispatch Engine"]
        AdminModule["Governance, Data QA & Redacted Audit Trail"]
        AIModule["Google Gemini Integration & Context Builder"]
    end

    subgraph CachingPersistence ["Caching & Persistence Tier"]
        Postgres[("PostgreSQL 16 Database\n(SQLAlchemy 2.0 Pool Recycle 1800, 5 Alembic Migrations)")]
        EnvCache["Environmental TTL Cache (900s)"]
        RecCache["Recommendation TTL Cache (3600s)"]
    end

    subgraph ExternalFeeds ["External Environmental & AI Feeds"]
        OpenMeteo["Open-Meteo Air Quality API (CAMS / SILAM)"]
        WAQI["World Air Quality Index (Ground Stations)"]
        GeminiAPI["Google Gemini 1.5 Pro / Flash"]
    end

    Client --> SecurityGateway
    SecurityGateway --> Router
    Router --> AuthModule
    Router --> PollutionModule
    Router --> AnalyticsModule
    Router --> PersonalizationModule
    Router --> AdminModule
    Router --> AIModule

    AuthModule --> Postgres
    PollutionModule --> Postgres
    PollutionModule --> EnvCache
    PollutionModule --> OpenMeteo
    PollutionModule --> WAQI
    AnalyticsModule --> Postgres
    PersonalizationModule --> Postgres
    AdminModule --> Postgres
    AIModule --> Postgres
    AIModule --> RecCache
    AIModule --> GeminiAPI
```

---

## 2. Core Architectural Guarantees & Invariants

1. **Measurement Immutability**: Administrative quality reviews can change verification status (`verified`, `flagged`, `rejected`), but original physical sensor measurements (AQI, PM2.5, PM10, gases, weather) are immutable.
2. **Administrative Lockout Protection**: Self-deactivation and demotion of the last active administrator in the database are strictly rejected.
3. **Scale Incompatibility Safety**: Cross-location comparisons explicitly flag when differing national AQI scales are compared, preventing deceptive direct differences.
4. **Formula Injection Sanitization**: Tabular CSV exports escape dangerous control characters with apostrophes.
5. **Zero Credential Exposure**: Client browser bundles contain no API keys; audit logs redact passwords and secrets to `"[REDACTED]"`.
