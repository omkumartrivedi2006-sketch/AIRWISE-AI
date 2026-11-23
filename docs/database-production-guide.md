# AIRWISE AI — PostgreSQL Database Production Guide

**Document:** `docs/database-production-guide.md`  
**Date:** November 21, 2026  
**Status:** Active  

---

## 1. Production PostgreSQL Configuration

AIRWISE AI uses PostgreSQL 15+ as its primary relational store with SQLAlchemy 2.0 and psycopg 3.

### 1.1 Connection Pool Architecture
In `backend/app/core/config.py` and `backend/app/core/database.py`:
- `DATABASE_URL`: `postgresql+psycopg://<user>:<password>@<host>:<port>/<db_name>`
- `DB_POOL_SIZE`: `10`
- `DB_MAX_OVERFLOW`: `20`
- `DB_POOL_TIMEOUT`: `30`
- `DB_POOL_RECYCLE`: `1800` (refreshes connections every 30 minutes)
- `pool_pre_ping`: `True` (emits `SELECT 1` on checkout to avoid stale socket exceptions)

### 1.2 Fail-Fast Production Policy
In production mode (`ENVIRONMENT=production`), the application strictly requires a valid, reachable PostgreSQL database connection. If connection initialization fails, the server fails fast with a `RuntimeError` rather than silently falling back to a local SQLite database.

---

## 2. Alembic Migrations

All schema changes are tracked through versioned Alembic migrations under `backend/alembic/versions/`:

| Revision ID | Migration File | Description |
|---|---|---|
| `001` | `001_initial_schema.py` | Initial tables: users, locations, pollution_observations, conversations, messages, feedback |
| `002` | `002_auth_models.py` | Authentication tables: refresh_tokens, password_reset_tokens, email_verification_tokens |
| `003` | `003_live_environmental_data.py` | Added composite index `ix_pollution_obs_loc_time_prov`, pollutants, and provider attribution |
| `004` | `004_personalization_alerts_notifications.py` | Personalization tables: user_preferences, saved_locations, alert_rules, notifications, push_subscriptions |
| `005` | `005_admin_audit_and_reviews.py` | Administrative tables: audit_logs, environmental_reviews, observation review flags |

### Migration Execution
```bash
# Apply pending migrations
alembic upgrade head

# Check current revision
alembic current

# Rollback single revision (if needed during deployment rollback)
alembic downgrade -1
```

---

## 3. Recommended PostgreSQL Tuning Parameters

For production deployments on cloud-managed PostgreSQL (e.g. AWS RDS, Supabase, Neon, Cloud SQL):

```ini
# Memory Configuration (Assuming 2GB RAM container)
shared_buffers = 512MB
work_mem = 16MB
maintenance_work_mem = 64MB
effective_cache_size = 1536MB

# Connection Management
max_connections = 100

# Write-Ahead Log (WAL) & Reliability
wal_buffers = 16MB
checkpoint_completion_target = 0.9
```
