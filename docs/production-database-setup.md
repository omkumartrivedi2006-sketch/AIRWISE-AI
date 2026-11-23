# AIRWISE AI — Production PostgreSQL Database Setup

This guide details the initialization, migration, pooling, security, and maintenance procedures for the production PostgreSQL database.

---

## 1. Database Provisioning & Security Invariants

- **Engine Version**: PostgreSQL 16.x (or 15.x minimum).
- **Transport Encryption**: SSL/TLS mode strictly enforced (`sslmode=require`).
- **Network Boundaries**: Database must only accept inbound traffic from backend compute IPs or private internal cloud networks (VPC). No public exposure.
- **Connection String Protocol**: Use SQLAlchemy 2.0 compatible psycopg driver:
  ```text
  postgresql+psycopg://<username>:<password>@<host>:<port>/<database_name>?sslmode=require
  ```

---

## 2. Alembic Migration Procedure

Before launching the backend in production, execute all pending migrations in order:

```bash
cd backend
# Windows:
venv\Scripts\activate
# Linux / Container:
source venv/bin/activate

# Execute all revisions up to head:
alembic upgrade head
```

### Revision History Verification
```bash
alembic history --verbose
```
Expected revisions:
- `001_initial_schema.py` — Users, locations, pollution observations, conversations, messages, feedback.
- `002_add_auth_fields.py` — Refresh token sessions, password resets, verification tokens.
- `003_live_environmental_data.py` — Multi-pollutant columns (SO2, CO, O3, NO2, AQI scale, raw payloads).
- `004_personalization_alerts_notifications.py` — User preferences, alert rules, notifications, saved locations, recommendations.
- `005_admin_audit_and_reviews.py` — Audit logs, observation QA determinations, delivery logs.

> [!CAUTION]
> Never execute `alembic downgrade base` in production. If a schema change needs reversal, author a new forward-compatible migration revision (`alembic revision -m "fix_..."`).

---

## 3. Connection Pooling Architecture

To prevent database connection exhaustion under burst loads, SQLAlchemy connection parameters are pre-tuned in `backend/app/core/config.py`:

```python
DB_POOL_SIZE = 10        # Persistent active database connections
DB_MAX_OVERFLOW = 20     # Additional connections opened during high concurrency
DB_POOL_TIMEOUT = 30     # Seconds to wait before timing out on pool exhaustion
DB_POOL_RECYCLE = 1800   # Refresh connections after 30 minutes to avoid stale sockets
```
