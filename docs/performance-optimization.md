# AIRWISE AI — Performance Optimization Guide

**Document:** `docs/performance-optimization.md`  
**Date:** November 21, 2026  
**Status:** Implemented & Verified  

---

## 1. Frontend Performance & Core Web Vitals

### 1.1 Next.js 15 App Router Code Splitting
- **Granular Route Splitting**: Every page under `frontend/src/app` is bundled into separate client chunks, ensuring that heavy administrative pages (`/admin/*`) or geospatial pages (`/map`) are never loaded on the public landing page.
- **Shared First Load JS**: Optimized to ~103 kB across all public and protected routes, well within the sub-200 kB budget for 90+ Lighthouse performance scores.
- **Static Pre-rendering**: 30 of 30 pages are pre-rendered statically during build (`npm run build`), eliminating server rendering overhead on initial document requests.

### 1.2 Layout Shift Prevention & Skeletons
- Top-level `frontend/src/app/loading.tsx` displays instant glassmorphic skeleton feedback during navigation, preventing Cumulative Layout Shift (CLS < 0.1).
- Error boundaries (`frontend/src/app/error.tsx`) catch client-side exceptions locally without crashing adjacent layout elements.

### 1.3 Asset Compression & HTTP Streaming
- `next.config.ts` enforces `compress: true` for automatic GZip/Brotli compression of static JS, CSS, and HTML assets.

---

## 2. Backend API Performance

### 2.1 Response Payload GZip Compression
- Integrated `GZipMiddleware(minimum_size=1000)` in `app/main.py`.
- Compresses large JSON payloads exceeding 1KB (such as 168-hour historical telemetry arrays, multi-station map observations, and analytical comparisons) by up to 75–85%, significantly reducing time-to-first-byte (TTFB) and network transit duration.

### 2.2 Asynchronous Concurrency
- Network I/O operations (Open-Meteo REST calls, WAQI feeds, Google Gemini GenAI queries) execute asynchronously using `httpx.AsyncClient` with non-blocking event loop yielding.

### 2.3 Request Tracing & Latency Measurement
- `RequestTracingMiddleware` measures millisecond execution duration on every request, attaching `X-Process-Time` to response headers for continuous observability.

---

## 3. Database Query & Connection Pooling

### 3.1 SQLAlchemy Connection Pooling
In `backend/app/core/database.py`:
- `pool_size=10`: Baseline active connections kept warm in memory.
- `max_overflow=20`: Burst capacity for traffic spikes.
- `pool_timeout=30`: Maximum wait time before returning connection pool exhaustion errors.
- `pool_recycle=1800`: Periodically refreshes sockets every 30 minutes to eliminate stale connection disconnects caused by cloud firewalls or AWS RDS idle timeouts.
- `pool_pre_ping=True`: Verifies socket liveness before handing connections to route dependencies.

### 3.2 Index Optimization
- Composite index `ix_pollution_obs_loc_time_prov` on `(location_id, observed_at, provider)` ensures $O(\log N)$ retrieval for 24-hour and 7-day historical timeseries queries.
- Unique index on `users(email)` for fast credential lookups during authentication.
- Foreign key indexing on `notifications(user_id, created_at)` for instant unread count badge queries.

---

## 4. Caching Architecture

| Cache Target | Storage | Key Scheme | TTL | Freshness Guarantee |
|---|---|---|---|---|
| **Air Quality Telemetry** | In-Memory / `EnvironmentalCacheService` | Geohash (~1.1km) + Provider | 900s (15 min) | Stamped with observation timestamp |
| **Weather Telemetry** | In-Memory / `EnvironmentalCacheService` | Coordinates + City | 1800s (30 min) | Distinguishes cached vs live |
| **Gemini AI Recommendations** | In-Memory / `RecommendationCache` | `user_id` + `location_id` | 3600s (1 hr) | Invalidation on profile update |
| **Static Web Assets** | Browser / CDN | Content Hash | 1 Year (`max-age=31536000`) | Immutable asset hashes |
